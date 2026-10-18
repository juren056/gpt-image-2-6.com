import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { captcha, emailOTP, oneTap } from 'better-auth/plugins';

import { isAccountAccessAllowed } from '@/core/auth/account-access';
import { db } from '@/core/db';
import type { EmailProvider } from '@/core/email';
import { CloudflareEmailProvider } from '@/core/email/cloudflare';
import { ResendProvider } from '@/core/email/resend';
import { VerifyEmailOTP } from '@/core/email/templates/verify-email-otp';
import { AUTH_SECRET_PLACEHOLDER, envConfigs } from '@/config';
import * as schema from '@/config/db/schema';
import { getAllConfigs } from '@/modules/config/service';
import { grantForNewUser } from '@/modules/credits/service';
import { redeemInviteCode } from '@/modules/invite-codes/service';
import { grantRoleForNewUser } from '@/modules/rbac/service';
import { applySiteAuthPolicy, SITE_ACCOUNT_LINKING } from '@/lib/auth-policy';
import { getUuid } from '@/lib/hash';

import {
  createAuthAbuseProtectionPlugin,
  hashAuthSource,
  isDisposableEmail,
} from './abuse-protection';

function assertProductionAuthSecret() {
  // Only enforce at runtime in production.
  if (process.env.NODE_ENV !== 'production') return;
  const secret = envConfigs.auth_secret;
  if (!secret || secret === AUTH_SECRET_PLACEHOLDER) {
    throw new Error(
      'AUTH_SECRET is missing or still set to the development placeholder. ' +
        'Generate one with `openssl rand -base64 32` and set it before serving traffic.'
    );
  }
}

function getDatabaseProvider(provider: string): 'sqlite' | 'pg' | 'mysql' {
  switch (provider) {
    case 'sqlite':
    case 'turso':
    case 'd1':
      return 'sqlite';
    case 'postgresql':
    case 'postgres':
      return 'pg';
    case 'mysql':
      return 'mysql';
    default:
      throw new Error(`Unsupported database provider for auth: ${provider}`);
  }
}

// workerd forbids reusing TCP sockets across requests ("Cannot perform I/O on
// behalf of a different request"). drizzleAdapter(db()) bakes the postgres/
// mysql client in at construction, so a cached auth instance makes an OAuth
// callback query `verification` with the initiating request's client —
// better-auth swallows the error as please_restart_the_process. Rebuild per
// request on Workers; db() already hands out a fresh client there.
const isCloudflareWorker =
  (typeof navigator !== 'undefined' &&
    navigator.userAgent === 'Cloudflare-Workers') ||
  (typeof globalThis !== 'undefined' && 'Cloudflare' in globalThis);

const TCP_PROVIDERS = ['postgresql', 'postgres', 'mysql'];

const canCacheAuthInstance = !(
  isCloudflareWorker && TCP_PROVIDERS.includes(envConfigs.database_provider)
);

let authInstance: any;
let socialConfigsSignature = '';
let emailEnabledLoaded = true;
let emailVerificationEnabledLoaded = false;
let emailOtpSignInEnabledLoaded = false;
let authSecuritySignature = '';

function getSocialProviders(configs: Record<string, string>) {
  const providers: Record<string, any> = {};

  if (
    configs.google_auth_enabled === 'true' &&
    configs.google_client_id &&
    configs.google_client_secret
  ) {
    providers.google = {
      clientId: configs.google_client_id,
      clientSecret: configs.google_client_secret,
    };
  }

  if (
    configs.github_auth_enabled === 'true' &&
    configs.github_client_id &&
    configs.github_client_secret
  ) {
    providers.github = {
      clientId: configs.github_client_id,
      clientSecret: configs.github_client_secret,
    };
  }

  return providers;
}

function getSocialSignature(configs: Record<string, string>) {
  return [
    configs.google_auth_enabled || '',
    configs.google_client_id || '',
    configs.google_client_secret || '',
    configs.github_auth_enabled || '',
    configs.github_client_id || '',
    configs.github_client_secret || '',
    // Including the one-tap flag here so toggling it without changing
    // credentials still rebuilds authInstance (which owns the plugin list).
    configs.google_one_tap_enabled || '',
  ].join('|');
}

function getAuthSecuritySignature(configs: Record<string, string>) {
  return [
    configs.invite_code_required || '',
    configs.turnstile_enabled || '',
    configs.turnstile_site_key || '',
    configs.turnstile_secret_key || '',
    configs.blocked_email_domains || '',
    configs.auth_signup_interval_seconds || '',
    configs.auth_otp_interval_seconds || '',
  ].join('|');
}

/**
 * Build the configured email provider from admin settings.
 * Returns null if the chosen provider is not fully configured.
 */
function getEmailProvider(
  configs: Record<string, string>
): { provider: EmailProvider; from: string } | null {
  const selected = configs.email_provider || 'resend';

  if (selected === 'cloudflare') {
    const apiToken = configs.cloudflare_email_api_token;
    const accountId = configs.cloudflare_email_account_id;
    const from = configs.cloudflare_email_sender_email;
    if (!apiToken || !accountId || !from) return null;
    return {
      provider: new CloudflareEmailProvider({
        apiToken,
        accountId,
        defaultFrom: from,
      }),
      from,
    };
  }

  // Default: resend
  const apiKey = configs.resend_api_key;
  const from = configs.resend_sender_email;
  if (!apiKey || !from) return null;
  return { provider: new ResendProvider({ apiKey, defaultFrom: from }), from };
}

/** Check whether email sending is available for the selected provider */
function isEmailConfigured(configs: Record<string, string>): boolean {
  return getEmailProvider(configs) !== null;
}

function getAuthPlugins(configs: Record<string, string> | undefined) {
  if (!configs) return [];
  const plugins: any[] = [createAuthAbuseProtectionPlugin(configs)];

  if (
    configs.turnstile_enabled === 'true' &&
    configs.turnstile_site_key &&
    configs.turnstile_secret_key
  ) {
    let allowedHostnames: string[] | undefined;
    try {
      allowedHostnames = [
        new URL(configs.app_url || envConfigs.app_url).hostname,
      ];
    } catch {
      allowedHostnames = undefined;
    }
    plugins.push(
      captcha({
        provider: 'cloudflare-turnstile',
        secretKey: configs.turnstile_secret_key,
        endpoints: ['/sign-up/email'],
        allowedHostnames,
      })
    );
  }
  if (
    configs.google_auth_enabled === 'true' &&
    configs.google_client_id &&
    configs.google_client_secret &&
    configs.google_one_tap_enabled === 'true'
  ) {
    plugins.push(oneTap());
  }
  const verificationEnabled =
    configs.email_verification_enabled === 'true' && isEmailConfigured(configs);
  const emailOtpSignInEnabled =
    configs.email_auth_enabled !== 'false' &&
    configs.email_otp_sign_in_enabled !== 'false' &&
    isEmailConfigured(configs);
  if (verificationEnabled || emailOtpSignInEnabled) {
    plugins.push(
      emailOTP({
        otpLength: 6,
        expiresIn: 10 * 60,
        allowedAttempts: 5,
        storeOTP: 'hashed',
        resendStrategy: 'rotate',
        sendVerificationOnSignUp: false,
        overrideDefaultEmailVerification: true,
        // Invite-only sites must keep new-user creation behind the invite-code
        // flow. Existing users can still use an email OTP to sign in.
        disableSignUp: configs.invite_code_required === 'true',
        rateLimit: { window: 60, max: 3 },
        sendVerificationOTP: async ({ email, otp, type }) => {
          if (type !== 'email-verification' && type !== 'sign-in') {
            throw new Error('Unsupported verification code type');
          }

          const all = await getAllConfigs();
          const emailCtx = getEmailProvider(all);
          if (!emailCtx) {
            throw new Error('Email provider is not configured');
          }

          const appName = all.app_name || envConfigs.app_name;
          const rawLogo = all.app_logo || '';
          const logo = /\.svg(\?|#|$)/i.test(rawLogo) ? '' : rawLogo;
          const baseUrl = all.app_url || envConfigs.app_url || '';
          const logoUrl = logo.startsWith('http')
            ? logo
            : logo
              ? `${baseUrl}${logo.startsWith('/') ? '' : '/'}${logo}`
              : undefined;
          const result = await emailCtx.provider.sendEmail({
            to: email,
            subject:
              type === 'sign-in'
                ? `${otp} is your ${appName} sign-in code`
                : `${otp} is your ${appName} verification code`,
            react: VerifyEmailOTP({
              appName,
              logoUrl,
              otp,
              purpose: type,
            }),
          });

          if (!result.success) {
            throw new Error(
              result.error || 'Email provider rejected the message'
            );
          }
        },
      })
    );
  }
  return plugins;
}

async function initializeNewUser(user: {
  id: string;
  email?: string | null;
  emailVerified?: boolean;
}) {
  const configs = applySiteAuthPolicy(await getAllConfigs());

  // Better Auth must create a pending user row before it can issue a signed
  // verification token. Do not grant credits or roles until that address has
  // actually been verified.
  const verificationRequired =
    configs.email_verification_enabled === 'true' && isEmailConfigured(configs);
  if (verificationRequired && user.emailVerified !== true) return;

  const results = await Promise.allSettled([
    grantForNewUser({
      userId: user.id,
      userEmail: user.email || undefined,
      configs,
    }),
    grantRoleForNewUser({ userId: user.id, configs }),
  ]);

  const labels = ['initial credits', 'initial role'];
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(
        `[auth] Failed to grant ${labels[index]} for new user:`,
        result.reason
      );
    }
  });
}

async function initializeNewlyVerifiedUser(user: {
  id: string;
  email?: string | null;
  emailVerified?: boolean;
}) {
  // Email-OTP sign-in verifies an existing pending account through a user
  // update, rather than the emailVerification callback. Run the same
  // idempotent welcome initialization for that path.
  if (user.emailVerified !== true) return;
  await initializeNewUser(user);
}

async function prepareNewUser(
  user: Record<string, unknown>,
  context: any,
  configs: Record<string, string>
) {
  const email = String(user.email || '').toLowerCase();
  if (email && isDisposableEmail(email, configs)) return false;

  // Invite-only mode must be enforced for direct API and social sign-ups, not
  // only by the browser form. Existing social users do not create a new row.
  if (
    configs.invite_code_required === 'true' &&
    context?.path !== '/sign-up/email'
  ) {
    return false;
  }

  return {
    data: {
      ...user,
      ip: hashAuthSource(context?.request, envConfigs.auth_secret),
    },
  };
}

async function finishNewUser(
  user: { id: string; email?: string | null; emailVerified?: boolean },
  context: any,
  configs: Record<string, string>
) {
  if (configs.invite_code_required === 'true') {
    const code = context?.request?.headers?.get('x-invite-code')?.trim() || '';
    const result = await redeemInviteCode({ userId: user.id, code });
    if (!result.ok) {
      throw new Error(result.error || 'Invite code could not be redeemed');
    }
  }
  await initializeNewUser(user);
}

export function getAuth(configs?: Record<string, string>) {
  if (configs) configs = applySiteAuthPolicy(configs);
  assertProductionAuthSecret();
  // Rebuild if any social provider credential changed
  if (configs) {
    const nextSignature = getSocialSignature(configs);
    if (nextSignature !== socialConfigsSignature) {
      authInstance = null;
      socialConfigsSignature = nextSignature;
    }
  }

  if (configs) {
    const nextSecuritySignature = getAuthSecuritySignature(configs);
    if (nextSecuritySignature !== authSecuritySignature) {
      authInstance = null;
      authSecuritySignature = nextSecuritySignature;
    }
  }

  // Rebuild if passwordless email sign-in is enabled or disabled.
  if (configs) {
    const nextEmailOtpSignInEnabled =
      configs.email_auth_enabled !== 'false' &&
      configs.email_otp_sign_in_enabled !== 'false' &&
      isEmailConfigured(configs);
    if (nextEmailOtpSignInEnabled !== emailOtpSignInEnabledLoaded) {
      authInstance = null;
      emailOtpSignInEnabledLoaded = nextEmailOtpSignInEnabled;
    }
  }

  // Rebuild if the email-auth flag changed
  if (configs) {
    const nextEmailEnabled = configs.email_auth_enabled !== 'false';
    if (nextEmailEnabled !== emailEnabledLoaded) {
      authInstance = null;
      emailEnabledLoaded = nextEmailEnabled;
    }
  }

  // Rebuild if the email-verification flag changed
  if (configs) {
    const nextVerificationEnabled =
      configs.email_verification_enabled === 'true' &&
      isEmailConfigured(configs);
    if (nextVerificationEnabled !== emailVerificationEnabledLoaded) {
      authInstance = null;
      emailVerificationEnabledLoaded = nextVerificationEnabled;
    }
  }

  if (authInstance) return authInstance;

  const socialProviders = configs ? getSocialProviders(configs) : {};
  const emailAndPasswordEnabled = configs
    ? configs.email_auth_enabled !== 'false'
    : true;
  const emailVerificationEnabled = configs
    ? configs.email_verification_enabled === 'true' &&
      isEmailConfigured(configs)
    : false;
  const appName = configs?.app_name || envConfigs.app_name;
  const appUrl = configs?.app_url || envConfigs.app_url;
  const authUrl = configs?.auth_url || envConfigs.auth_url || appUrl;

  const instance = betterAuth({
    appName,
    baseURL: authUrl,
    secret: envConfigs.auth_secret,
    trustedOrigins: (request) => {
      const origins: string[] = [];
      if (appUrl) origins.push(appUrl);
      // Dev: allow both localhost and 127.0.0.1 — browsers treat them as different origins.
      if (process.env.NODE_ENV !== 'production') {
        origins.push('http://localhost:3000', 'http://127.0.0.1:3000');
      }
      try {
        const origin = request?.headers?.get?.('origin');
        if (origin) {
          const hostname = new URL(origin).hostname;
          if (hostname === 'localhost' || hostname === '127.0.0.1')
            origins.push(origin);
        }
      } catch {}
      return origins;
    },
    database: drizzleAdapter(db(), {
      provider: getDatabaseProvider(envConfigs.database_provider),
      schema,
    }),
    databaseHooks: {
      user: {
        create: {
          before: (user, context) =>
            prepareNewUser(user, context, configs || {}),
          after: (user, context) => finishNewUser(user, context, configs || {}),
        },
        update: {
          after: initializeNewlyVerifiedUser,
        },
      },
      session: {
        create: {
          before: async (session) => isAccountAccessAllowed(session.userId),
        },
      },
    },
    socialProviders,
    plugins: getAuthPlugins(configs),
    rateLimit: {
      enabled: true,
      window: 60,
      max: 60,
      customRules: {
        '/sign-up/email': { window: 60, max: 3 },
        '/email-otp/send-verification-otp': { window: 60, max: 3 },
      },
    },
    account: {
      accountLinking: SITE_ACCOUNT_LINKING,
    },
    user: {
      additionalFields: {
        utmSource: {
          type: 'string',
          input: false,
          required: false,
          defaultValue: '',
        },
        ip: { type: 'string', input: false, required: false, defaultValue: '' },
        locale: {
          type: 'string',
          input: false,
          required: false,
          defaultValue: '',
        },
      },
    },
    advanced: {
      database: { generateId: () => getUuid() },
    },
    emailAndPassword: {
      enabled: emailAndPasswordEnabled,
      requireEmailVerification: emailVerificationEnabled,
      autoSignIn: !emailVerificationEnabled,
      sendResetPassword: async ({ user, url }) => {
        const all = await getAllConfigs();
        const emailCtx = getEmailProvider(all);
        if (!emailCtx) {
          console.error(
            '[auth] sendResetPassword: No email provider configured'
          );
          return;
        }
        const appName = all.app_name || envConfigs.app_name;
        const greeting = user.name ? `Hi ${user.name},` : 'Hi,';
        const result = await emailCtx.provider.sendEmail({
          to: user.email,
          subject: `Reset your ${appName} password`,
          text: `${greeting}\n\nYou recently requested to reset your password for ${appName}. Use the link below to choose a new one:\n\n${url}\n\nThis link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.`,
          html: `<p>${greeting}</p>
<p>You recently requested to reset your password for <strong>${appName}</strong>. Click the link below to choose a new one:</p>
<p><a href="${url}">Reset your password</a></p>
<p>This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>`,
        });
        if (!result.success) {
          console.error('[auth] sendResetPassword failed:', result.error);
        }
      },
    },
    ...(emailVerificationEnabled
      ? {
          emailVerification: {
            sendOnSignUp: false,
            sendOnSignIn: false,
            autoSignInAfterVerification: false,
            afterEmailVerification: async (user: {
              id: string;
              email: string;
              emailVerified: boolean;
            }) => {
              await initializeNewUser(user);
            },
          },
        }
      : {}),
    logger: { disabled: true },
  } satisfies BetterAuthOptions);

  if (canCacheAuthInstance) authInstance = instance;
  return instance;
}
