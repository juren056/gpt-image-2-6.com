import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';

/** Map better-auth / better-fetch errors to localized user-facing text. */
export function formatAuthError(err: unknown, fallback: string): string {
  if (!err) return fallback;
  if (typeof err === 'string') return getLocale() === 'en' ? err : fallback;
  if (typeof err !== 'object') return fallback;

  const e = err as {
    code?: string;
    message?: string;
    body?: { message?: string; code?: string };
    error?: { message?: string; statusText?: string; code?: string };
    cause?: unknown;
    status?: number;
    statusCode?: number;
  };

  const cause =
    e.cause && typeof e.cause === 'object'
      ? (e.cause as { code?: string; message?: string })
      : undefined;

  const code = (
    e.code ||
    e.body?.code ||
    e.error?.code ||
    cause?.code ||
    ''
  ).toUpperCase();
  const message =
    e.body?.message ||
    e.error?.message ||
    e.message ||
    cause?.message ||
    e.error?.statusText ||
    '';
  const normalized = `${code} ${message}`.toLowerCase();

  if (
    code === 'USER_ALREADY_EXISTS' ||
    code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL'
  ) {
    return m['common.sign.error_user_exists']();
  }

  if (
    /user.*already.*exist|email.*already.*exist|already.*registered/.test(
      normalized
    )
  ) {
    return m['common.sign.error_user_exists']();
  }

  if (
    /invalid.*credential|invalid.*password|incorrect.*password|user.*not.*found/.test(
      normalized
    )
  ) {
    return m['common.sign.error_invalid_credentials']();
  }

  const status = e.status ?? e.statusCode;

  if (/too.*many|rate.*limit/.test(normalized) || status === 429) {
    return m['common.sign.error_rate_limited']();
  }

  if (status === 403) {
    return m['common.sign.error_request_blocked']();
  }

  if (getLocale() === 'en' && message && message !== 'HTTPError') {
    return message;
  }

  return fallback;
}
