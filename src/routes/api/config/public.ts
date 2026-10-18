import { createFileRoute } from '@tanstack/react-router';

import { filterPublicConfigs, getAllConfigs } from '@/modules/config/service';
import { isStripeCheckoutReady } from '@/lib/payment-readiness';
import { ANONYMOUS_IMAGE_GENERATION_ENABLED } from '@/lib/product-policy';
import { respData } from '@/lib/resp';

const publicCache = {
  headers: {
    'Cache-Control': 'public, max-age=15, s-maxage=60, must-revalidate',
    'CDN-Cache-Control': 'public, max-age=60, must-revalidate',
    'Vercel-CDN-Cache-Control': 'public, max-age=60, must-revalidate',
  },
};

const publicKeys = [
  'app_name',
  'app_description',
  'app_logo',
  'email_auth_enabled',
  'email_otp_sign_in_enabled',
  'google_auth_enabled',
  'google_one_tap_enabled',
  'google_client_id',
  'github_auth_enabled',
  'invite_code_required',
  'turnstile_enabled',
  'turnstile_site_key',
  'anonymous_trial_enabled',
  'initial_credits_enabled',
  'initial_credits_amount',
  'initial_credits_valid_days',
  'creative_studio_enabled',
  'select_payment_enabled',
  'default_payment_provider',
  'stripe_enabled',
  'creem_enabled',
  'paypal_enabled',
  'alipay_enabled',
  'wechat_enabled',
  'google_analytics_id',
  'plausible_domain',
  'plausible_src',
  'crisp_enabled',
  'crisp_website_id',
  'tawk_enabled',
  'tawk_property_id',
  'tawk_widget_id',
];

function isEmailSendingConfigured(configs: Record<string, string>): boolean {
  const provider = configs.email_provider || 'resend';
  if (provider === 'cloudflare') {
    return (
      !!configs.cloudflare_email_api_token &&
      !!configs.cloudflare_email_account_id &&
      !!configs.cloudflare_email_sender_email
    );
  }
  return !!configs.resend_api_key && !!configs.resend_sender_email;
}

async function GET({ request }: { request: Request }) {
  const configs = await getAllConfigs();
  const result = filterPublicConfigs(configs, publicKeys);
  result.stripe_ready = isStripeCheckoutReady(configs) ? 'true' : 'false';
  const emailConfigured = isEmailSendingConfigured(configs);
  result.password_reset_enabled =
    configs.email_auth_enabled !== 'false' && emailConfigured
      ? 'true'
      : 'false';
  result.email_otp_sign_in_enabled =
    configs.email_auth_enabled !== 'false' &&
    configs.email_otp_sign_in_enabled !== 'false' &&
    emailConfigured
      ? 'true'
      : 'false';
  result.email_verification_enabled =
    configs.email_verification_enabled === 'true' && emailConfigured
      ? 'true'
      : 'false';
  result.turnstile_enabled =
    configs.turnstile_enabled === 'true' &&
    !!configs.turnstile_site_key &&
    !!configs.turnstile_secret_key
      ? 'true'
      : 'false';
  result.anonymous_trial_enabled =
    ANONYMOUS_IMAGE_GENERATION_ENABLED &&
    configs.anonymous_trial_enabled !== 'false'
      ? 'true'
      : 'false';
  result.google_auth_enabled =
    configs.google_auth_enabled === 'true' &&
    !!configs.google_client_id &&
    !!configs.google_client_secret
      ? 'true'
      : 'false';
  result.github_auth_enabled =
    configs.github_auth_enabled === 'true' &&
    !!configs.github_client_id &&
    !!configs.github_client_secret
      ? 'true'
      : 'false';
  result.google_one_tap_enabled =
    result.google_auth_enabled === 'true' &&
    configs.google_one_tap_enabled === 'true'
      ? 'true'
      : 'false';
  result.github_auth_enabled = 'false';
  result.email_otp_sign_in_enabled = 'false';
  result.email_verification_enabled = 'false';
  result.password_reset_enabled = 'false';
  return respData(result, publicCache);
}

export const Route = createFileRoute('/api/config/public')({
  server: {
    handlers: { GET },
  },
});
