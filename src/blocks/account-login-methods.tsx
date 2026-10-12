import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Loader2 } from 'lucide-react';

import { authClient, useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { apiGet } from '@/lib/api-client';
import {
  classifyOAuthLinkError,
  toAbsoluteAuthCallbackURL,
} from '@/lib/auth-navigation';
import { m } from '@/paraglide/messages.js';
import { localizeHref } from '@/paraglide/runtime.js';
import { usePublicConfig } from '@/hooks/use-public-config';
import {
  AccountCard,
  AccountQueryState,
} from '@/components/banana-account-cards';
import { GoogleIcon } from '@/components/google-icon';

export function AccountLoginMethods({
  connectRequested,
  errorCode,
  returnTo,
}: {
  connectRequested: boolean;
  errorCode?: string;
  returnTo: string;
}) {
  const { data: session } = useSession();
  const config = usePublicConfig();
  const methods = useQuery({
    queryKey: ['account-login-methods', session?.user.id],
    enabled: !!session?.user,
    queryFn: () => apiGet<{ providers: string[] }>('/api/user/login-methods'),
    staleTime: 0,
  });
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const connected = methods.data?.providers.includes('google') === true;
  const failure = errorCode ? classifyOAuthLinkError(errorCode) : undefined;
  const errorText =
    failure === 'different-email'
      ? m['settings.profile.google_email_mismatch']()
      : failure === 'conflict'
        ? m['settings.profile.google_link_conflict']()
        : failure || failed
          ? m['settings.profile.google_link_failed']()
          : '';

  async function connect() {
    if (
      !session?.user ||
      pending ||
      connected ||
      config.data?.google_auth_enabled !== 'true'
    )
      return;
    setPending(true);
    setFailed(false);
    try {
      const callback = `/settings/profile?${new URLSearchParams({ connect: 'google', returnTo })}`;
      const result = await authClient.linkSocial({
        provider: 'google',
        callbackURL: toAbsoluteAuthCallbackURL(
          localizeHref(callback),
          window.location.origin
        ),
        errorCallbackURL: toAbsoluteAuthCallbackURL(
          localizeHref(`${callback}&authError=oauth`),
          window.location.origin
        ),
      });
      if (result.error) {
        setFailed(true);
        setPending(false);
      } else if (!result.data?.url) {
        await methods.refetch();
        setPending(false);
      }
    } catch {
      setFailed(true);
      setPending(false);
    }
  }

  return (
    <AccountCard>
      <div className="banana-account-card-heading">
        <h2>{m['settings.profile.login_methods']()}</h2>
      </div>
      <p className="banana-account-card-description">
        {m['settings.profile.google_link_description']()}
      </p>
      <AccountQueryState
        loading={methods.isPending || config.isPending}
        error={methods.isError || config.isError}
        loadingLabel={m['settings.profile.loading']()}
        errorLabel={m['banana.account.load_failed']()}
        retryLabel={m['common.error.retry']()}
        onRetry={() => {
          void methods.refetch();
          void config.refetch();
        }}
      />
      {errorText && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive mt-4 rounded-lg p-3 text-sm"
        >
          {errorText}
        </p>
      )}
      {methods.data && (
        <div className="border-border bg-muted/30 mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <GoogleIcon />
            <div>
              <p className="font-medium">Google</p>
              <p className="text-muted-foreground text-sm">
                {session?.user.email}
              </p>
            </div>
          </div>
          {connected ? (
            <span className="flex items-center gap-2 text-sm font-medium">
              <Check size={16} />
              {m['settings.profile.google_connected']()}
            </span>
          ) : (
            config.data?.google_auth_enabled === 'true' && (
              <button
                type="button"
                className="banana-account-primary"
                disabled={pending || methods.isFetching}
                onClick={() => void connect()}
              >
                {pending && <Loader2 size={16} className="animate-spin" />}
                {pending
                  ? m['settings.profile.google_pending']()
                  : m['settings.profile.google_connect']()}
              </button>
            )
          )}
        </div>
      )}
      {connectRequested && connected && (
        <Link className="banana-account-primary mt-4" href={returnTo}>
          {m['settings.profile.google_link_success']()}
        </Link>
      )}
    </AccountCard>
  );
}
