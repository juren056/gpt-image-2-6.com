export type AuthSearch = {
  callbackUrl?: string;
  redirect?: string;
  authError?: string;
  error?: string;
};

export function validateAuthSearch(
  search: Record<string, unknown>
): AuthSearch {
  return {
    callbackUrl:
      typeof search.callbackUrl === 'string' ? search.callbackUrl : undefined,
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
    authError:
      typeof search.authError === 'string' ? search.authError : undefined,
    error: typeof search.error === 'string' ? search.error : undefined,
  };
}

export function safeInternalAuthDestination(value?: string): string | null {
  if (
    !value?.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return null;
  }

  // Localized and unlocalized auth routes are both rejected to prevent loops.
  if (/^\/(?:zh\/)?(?:sign-in|sign-up|verify-email)(?:\/|\?|$)/.test(value)) {
    return null;
  }

  return value;
}

export function resolvePostAuthDestination(
  search: AuthSearch,
  fallback = '/settings/generate'
): string {
  return (
    safeInternalAuthDestination(search.redirect) ||
    safeInternalAuthDestination(search.callbackUrl) ||
    fallback
  );
}

/**
 * Better Auth 1.6 accepts relative callback paths, but its trusted-origin
 * matcher rejects relative URLs containing a fragment (for example
 * `/#generator`). OAuth callbacks with a fragment must therefore be sent as
 * same-origin absolute URLs. The destination is validated first so this
 * conversion can never turn an external URL into an allowed redirect.
 */
export function toAbsoluteAuthCallbackURL(
  destination: string,
  origin: string,
  fallback = '/settings/generate'
): string {
  const safeFallback =
    safeInternalAuthDestination(fallback) || '/settings/generate';
  const safeDestination =
    safeInternalAuthDestination(destination) || safeFallback;
  const parsedOrigin = new URL(origin);

  if (parsedOrigin.protocol !== 'http:' && parsedOrigin.protocol !== 'https:') {
    throw new Error('Auth callback origin must use HTTP or HTTPS');
  }

  return new URL(safeDestination, parsedOrigin.origin).href;
}

export function buildAuthSwitchQuery(destination: string): string {
  const query = new URLSearchParams({ callbackUrl: destination });
  return `?${query.toString()}`;
}

export function googleLinkRecoveryDestination(destination?: string): string {
  const query = new URLSearchParams({
    connect: 'google',
    returnTo: safeInternalAuthDestination(destination) || '/settings/generate',
  });
  return `/settings/profile?${query.toString()}`;
}

export function classifyOAuthLinkError(error?: string) {
  if (error === 'account_not_linked') return 'not-linked';
  if (
    error === "email_doesn't_match" ||
    error === 'LINKING_DIFFERENT_EMAILS_NOT_ALLOWED'
  )
    return 'different-email';
  if (error === 'account_already_linked_to_different_user') return 'conflict';
  return 'generic';
}
