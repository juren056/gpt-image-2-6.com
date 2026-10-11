import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Check, Copy, Gift, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { apiGet } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import { localizeHref } from '@/paraglide/runtime.js';
import {
  AccountCard,
  AccountQueryState,
} from '@/components/banana-account-cards';

type Overview = {
  code: string;
  rewardCredits: number;
  successfulReferrals: number;
  pendingReferrals: number;
  earnedCredits: number;
  items: Array<{
    id: string;
    status: string;
    rewardCredits: number;
    createdAt: string;
  }>;
};

export const Route = createFileRoute('/settings/referrals')({
  component: ReferralsPage,
});

function ReferralsPage() {
  const { data: session } = useSession();
  const userId = session?.user.id;
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const query = useQuery({
    queryKey: ['referrals', userId],
    enabled: !!userId,
    queryFn: () => apiGet<Overview>('/api/referrals'),
    retry: 2,
  });
  const link = query.data
    ? typeof window === 'undefined'
      ? ''
      : new URL(
          localizeHref(`/r/${query.data.code}`),
          window.location.origin
        ).toString()
    : '';
  async function copyLink() {
    if (!link || copying) return;
    setCopying(true);
    try {
      let copiedSuccessfully = false;
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(link);
          copiedSuccessfully = true;
        } catch {
          // Fall back to copying the selected input value below.
        }
      }
      if (!copiedSuccessfully && linkInputRef.current) {
        linkInputRef.current.focus();
        linkInputRef.current.select();
        linkInputRef.current.setSelectionRange(0, link.length);
        copiedSuccessfully = document.execCommand('copy');
      }
      if (!copiedSuccessfully) throw new Error('Clipboard unavailable');
      setCopied(true);
      toast.success(m['settings.referrals.copied']());
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error(m['settings.referrals.copy_failed']());
    } finally {
      setCopying(false);
    }
  }
  return (
    <div className="banana-account-pages">
      <h1 className="sr-only">{m['settings.referrals.title']()}</h1>
      <AccountCard>
        <h2 className="banana-account-referral-title">
          {m['settings.referrals.title']()}
        </h2>
        <p className="banana-account-card-description">
          {query.data
            ? m['settings.referrals.purchase_description']({
                credits: query.data.rewardCredits,
              })
            : m['banana.account.referral_description']()}
        </p>
        <div className="banana-account-referral-link">
          <input
            ref={linkInputRef}
            id="referral-link"
            aria-label={m['settings.referrals.your_link']()}
            readOnly
            value={link}
            aria-busy={query.isPending}
            placeholder={
              query.isPending ? m['settings.referrals.loading_link']() : ''
            }
            onFocus={(event) => event.currentTarget.select()}
          />
          <button
            type="button"
            onClick={copyLink}
            disabled={!link || copying || query.isPending}
            className="banana-account-primary"
          >
            {copying ? (
              <Loader2 size={16} className="animate-spin" />
            ) : copied ? (
              <Check size={16} />
            ) : (
              <Copy size={16} />
            )}
            {copied
              ? m['settings.referrals.copied']()
              : m['settings.referrals.copy']()}
          </button>
        </div>
        <p className="banana-account-referral-rules">
          {m['settings.referrals.purchase_rules']()}
        </p>
        <AccountQueryState
          loading={query.isPending}
          error={query.isError}
          loadingLabel={m['settings.profile.loading']()}
          errorLabel={m['settings.referrals.load_failed']()}
          retryLabel={m['common.error.retry']()}
          onRetry={() => {
            void query.refetch();
          }}
        />
      </AccountCard>
      <div className="banana-account-metrics">
        {[
          {
            label: m['settings.referrals.pending'](),
            value: query.data?.pendingReferrals,
            icon: <Users size={18} />,
          },
          {
            label: m['settings.referrals.successful'](),
            value: query.data?.successfulReferrals,
            icon: <Users size={18} />,
          },
          {
            label: m['settings.referrals.earned'](),
            value: query.data?.earnedCredits,
            icon: <Gift size={18} />,
          },
        ].map((metric) => (
          <AccountCard key={metric.label}>
            {metric.icon}
            <p className="banana-account-metric">
              {query.isError
                ? '—'
                : query.isPending
                  ? '…'
                  : metric.value?.toLocaleString()}
            </p>
            <p className="banana-account-card-description">{metric.label}</p>
          </AccountCard>
        ))}
      </div>
      <AccountCard>
        <div className="banana-account-card-heading">
          <h2>{m['settings.referrals.activity']()}</h2>
        </div>
        {!query.isError && query.data ? (
          query.data.items.length ? (
            query.data.items.map((item) => (
              <div key={item.id} className="banana-account-activity-row">
                <span className="banana-account-activity-icon">
                  <Users size={18} />
                </span>
                <div className="banana-account-activity-description">
                  <strong>
                    {item.status === 'rewarded'
                      ? m['settings.referrals.status_rewarded']()
                      : item.status === 'pending'
                        ? m['settings.referrals.status_pending']()
                        : m['settings.referrals.status_ineligible']()}
                  </strong>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                {item.status === 'rewarded' ? (
                  <strong className="banana-account-delta is-positive">
                    +{item.rewardCredits.toLocaleString()}
                  </strong>
                ) : (
                  <span className="banana-account-card-description">
                    {item.rewardCredits.toLocaleString()} ·{' '}
                    {m['settings.credits.title']()}
                  </span>
                )}
              </div>
            ))
          ) : (
            <p className="banana-account-empty">
              {m['banana.account.referral_empty']()}
            </p>
          )
        ) : (
          <AccountQueryState
            loading={query.isPending}
            error={query.isError}
            loadingLabel={m['settings.profile.loading']()}
            errorLabel={m['settings.referrals.load_failed']()}
            retryLabel={m['common.error.retry']()}
            onRetry={() => {
              void query.refetch();
            }}
          />
        )}
      </AccountCard>
    </div>
  );
}
