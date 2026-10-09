import { createHmac } from 'node:crypto';
import * as Sentry from '@sentry/tanstackstart-react';

import { validateInviteCode } from '@/modules/invite-codes/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';

const BUILT_IN_DISPOSABLE_DOMAINS = new Set([
  'anogz.com',
  'dbwot.com',
  'disefl.com',
  'freetimer.online',
  'imxwe.com',
  'iysqv.com',
  'jgkcr.com',
  'mfxis.com',
  'obeamb.com',
  'oeralb.com',
  'oqqaj.com',
  'psovv.com',
  'sisood.com',
  'suarj.com',
  'vbgvd.com',
  'vracv.com',
  'witusp.com',
  'wzjpj.com',
  'xghff.com',
  'ygwpr.com',
  'zorrag.com',
]);

function configuredDomains(configs: Record<string, string>) {
  return String(configs.blocked_email_domains || '')
    .split(/[\s,;]+/)
    .map((value) => value.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean);
}

export function getEmailDomain(email: string) {
  const at = email.lastIndexOf('@');
  return at >= 0
    ? email
        .slice(at + 1)
        .trim()
        .toLowerCase()
    : '';
}

export function isDisposableEmail(
  email: string,
  configs: Record<string, string>
) {
  const domain = getEmailDomain(email);
  if (!domain) return false;
  return (
    BUILT_IN_DISPOSABLE_DOMAINS.has(domain) ||
    configuredDomains(configs).includes(domain)
  );
}

export function getClientIp(request?: Request | null) {
  if (!request) return '';
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    ''
  );
}

export function hashAuthSource(
  request: Request | null | undefined,
  secret: string
) {
  const ip = getClientIp(request);
  const userAgent = request?.headers.get('user-agent') || '';
  if (!ip && !userAgent) return '';
  return createHmac('sha256', secret || 'auth-abuse-fingerprint')
    .update(`${ip}|${userAgent}`)
    .digest('hex');
}

function authError(status: number, code: string, message: string) {
  return Response.json({ code, message }, { status });
}

async function bodyEmail(request: Request) {
  try {
    const body = (await request.clone().json()) as Record<string, unknown>;
    return String(body.email || '')
      .trim()
      .toLowerCase();
  } catch {
    return '';
  }
}

function reportBlocked(
  event: string,
  request: Request,
  details: Record<string, string> = {}
) {
  const eventDetails = {
    event,
    path: new URL(request.url).pathname,
    source: hashAuthSource(request, 'auth-abuse-log-v1').slice(0, 16),
    ...details,
  };
  console.warn('[auth-abuse]', eventDetails);
  Sentry.captureMessage('Blocked authentication abuse attempt', {
    level: 'warning',
    extra: eventDetails,
  });
}

async function enforceAuthIntervals(
  request: Request,
  email: string,
  intervalMs: number,
  keyPrefix: string
) {
  const ipLimited = await enforceMinIntervalRateLimit(request, {
    intervalMs,
    keyPrefix: `${keyPrefix}-ip`,
    keyBy: 'ip',
  });
  if (ipLimited) return ipLimited;

  if (email) {
    return enforceMinIntervalRateLimit(request, {
      intervalMs,
      keyPrefix: `${keyPrefix}-email`,
      keyBy: 'extra',
      extraKey: createHmac('sha256', 'auth-email-rate-v1')
        .update(email)
        .digest('hex'),
    });
  }
  return null;
}

export function createAuthAbuseProtectionPlugin(
  configs: Record<string, string>
) {
  const signupIntervalMs =
    Math.max(10, Number(configs.auth_signup_interval_seconds) || 30) * 1000;
  const otpIntervalMs =
    Math.max(30, Number(configs.auth_otp_interval_seconds) || 60) * 1000;

  return {
    id: 'auth-abuse-protection',
    onRequest: async (request: Request) => {
      const pathname = new URL(request.url).pathname.replace(
        /^\/api\/auth/,
        ''
      );
      const isSignup = pathname === '/sign-up/email';
      const isOtp = pathname === '/email-otp/send-verification-otp';
      if (!isSignup && !isOtp) return;

      const email = await bodyEmail(request);
      if (email && isDisposableEmail(email, configs)) {
        reportBlocked('disposable_email', request, {
          domain: getEmailDomain(email),
        });
        return {
          response: authError(
            400,
            'DISPOSABLE_EMAIL_NOT_ALLOWED',
            'Temporary or disposable email addresses are not allowed.'
          ),
        };
      }

      const limited = await enforceAuthIntervals(
        request,
        email,
        isSignup ? signupIntervalMs : otpIntervalMs,
        isSignup ? 'auth-signup' : 'auth-otp'
      );
      if (limited) {
        reportBlocked(
          isSignup ? 'signup_rate_limit' : 'otp_rate_limit',
          request
        );
        return { response: limited };
      }

      if (isSignup && configs.invite_code_required === 'true') {
        const inviteCode = request.headers.get('x-invite-code')?.trim() || '';
        const result = inviteCode
          ? await validateInviteCode(inviteCode)
          : { valid: false, error: 'Invite code is required' };
        if (!result.valid) {
          reportBlocked('invalid_invite', request);
          return {
            response: authError(
              403,
              'INVALID_INVITE_CODE',
              result.error || 'Invalid invite code'
            ),
          };
        }
      }
    },
  };
}

export function getBuiltInDisposableDomains() {
  return [...BUILT_IN_DISPOSABLE_DOMAINS];
}
