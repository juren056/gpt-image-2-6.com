import { useEffect, useRef, useState } from 'react';

import { getAuthClient, useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import {
  buildAuthSwitchQuery,
  googleLinkRecoveryDestination,
  safeInternalAuthDestination,
  toAbsoluteAuthCallbackURL,
} from '@/lib/auth-navigation';
import { classifyOneTapFailure, type OneTapFailure } from '@/lib/one-tap-error';
import { m } from '@/paraglide/messages.js';
import { localizeHref } from '@/paraglide/runtime.js';
import { usePublicConfig } from '@/hooks/use-public-config';

// Mounts the Google One Tap prompt for signed-out visitors when the
// admin has enabled it. Self-contained: pulls config from
// /api/config/public, gates on session, and triggers at most once
// per page load.
export function GoogleOneTap() {
  const { data: session, isPending, refetch } = useSession();
  const { data: configs } = usePublicConfig();
  const triggered = useRef(false);
  const [failure, setFailure] = useState<OneTapFailure | null>(null);
  const [destination, setDestination] = useState('/settings/generate');

  useEffect(() => {
    if (triggered.current) return;
    if (!configs) return;
    if (isPending) return;
    if (session?.user) return;
    if (
      configs.google_one_tap_enabled !== 'true' ||
      !configs.google_client_id
    ) {
      return;
    }

    triggered.current = true;
    const target =
      safeInternalAuthDestination(
        `${window.location.pathname}${window.location.search}${window.location.hash}`
      ) || '/settings/generate';
    setDestination(target);
    const client = getAuthClient(configs);
    client
      .oneTap({
        callbackURL: toAbsoluteAuthCallbackURL(
          localizeHref(target),
          window.location.origin
        ),
        fetchOptions: {
          onSuccess: async () => {
            await refetch({ query: { disableCookieCache: true } });
          },
          onError: ({ error }) => setFailure(classifyOneTapFailure(error)),
        },
        onPromptNotification: () => {
          // Silently ignore dismissals / FedCM hiccups — the user can still
          // sign in via the normal /sign-in page.
        },
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setFailure('network');
      });
  }, [configs, session, isPending, refetch]);

  if (!failure || session?.user) return null;
  const text =
    failure === 'not-linked'
      ? m['common.sign.oauth_account_not_linked']()
      : failure === 'token'
        ? m['common.sign.one_tap_token']()
        : failure === 'signup-disabled'
          ? m['common.sign.one_tap_signup_disabled']()
          : failure === 'network'
            ? m['common.sign.one_tap_network']()
            : m['common.sign.one_tap_failed']();
  const callback =
    failure === 'not-linked'
      ? googleLinkRecoveryDestination(destination)
      : destination;
  return (
    <aside
      role="alert"
      aria-label={m['common.sign.one_tap_title']()}
      className="bg-card text-card-foreground border-border fixed right-4 bottom-4 z-50 w-[calc(100%_-_2rem)] max-w-md rounded-2xl border p-5 shadow-xl"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">
          {m['common.sign.one_tap_title']()}
        </h2>
        <button
          type="button"
          className="hover:bg-muted flex size-10 items-center justify-center rounded-lg"
          aria-label={m['common.sign.one_tap_dismiss']()}
          onClick={() => setFailure(null)}
        >
          ×
        </button>
      </div>
      <p className="text-muted-foreground mt-2 text-sm leading-6">{text}</p>
      <Link
        className="bg-primary text-primary-foreground mt-4 block rounded-lg px-4 py-3 text-center text-sm font-medium"
        href={`/sign-in${buildAuthSwitchQuery(callback)}`}
      >
        {failure === 'not-linked'
          ? m['common.sign.oauth_recover_google']()
          : m['common.sign.sign_in_title']()}
      </Link>
    </aside>
  );
}
