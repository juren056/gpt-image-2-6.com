import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Coins, Gift, Users } from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { apiGet } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import {
  AccountBalanceCard,
  AccountCard,
  AccountQueryState,
  type AccountCreditBalance,
} from '@/components/banana-account-cards';

import { SettingsForm } from './-settings-form';

type ProfileInfo = { name?: string; email?: string; image?: string };
type ReferralInfo = {
  successfulReferrals: number;
  pendingReferrals: number;
  earnedCredits: number;
};
type PlanInfo = {
  planName?: string | null;
  productName?: string | null;
  status: string;
};
function SettingsPage() {
  const { data: session } = useSession();
  const userId = session?.user.id;
  const userQuery = useQuery({
    queryKey: ['account-profile', userId],
    enabled: !!userId,
    queryFn: () => apiGet<ProfileInfo>('/api/user/info'),
  });
  const balanceQuery = useQuery({
    queryKey: ['user-credits', userId, 'balance'],
    enabled: !!userId,
    queryFn: () => apiGet<AccountCreditBalance>('/api/credits'),
  });
  const referralQuery = useQuery({
    queryKey: ['referrals', userId],
    enabled: !!userId,
    queryFn: () => apiGet<ReferralInfo>('/api/referrals'),
  });
  const planQuery = useQuery({
    queryKey: ['billing', userId, 'current'],
    enabled: !!userId,
    queryFn: () => apiGet<PlanInfo | null>('/api/user/subscriptions/current'),
  });
  const planLabel = planQuery.isError
    ? '—'
    : planQuery.isPending
      ? '…'
      : planQuery.data?.planName ||
        planQuery.data?.productName ||
        m['banana.account.free_plan']();
  const user = userQuery.data;
  return (
    <div className="banana-account-pages">
      <h1 className="sr-only">{m['settings.profile.title']()}</h1>
      <AccountCard>
        <AccountQueryState
          loading={userQuery.isPending}
          error={userQuery.isError}
          loadingLabel={m['settings.profile.loading']()}
          errorLabel={m['banana.account.load_failed']()}
          retryLabel={m['common.error.retry']()}
          onRetry={() => {
            void userQuery.refetch();
          }}
        />
        {user && (
          <div className="banana-account-profile-identity">
            {user.image ? (
              <img
                className="banana-account-profile-avatar"
                src={user.image}
                alt=""
              />
            ) : (
              <span
                className="banana-account-profile-avatar"
                aria-hidden="true"
              >
                {(user.name || user.email || '?').slice(0, 1).toUpperCase()}
              </span>
            )}
            <div>
              <h2 className="banana-account-profile-name">
                {user.name || user.email}
              </h2>
              <p className="banana-account-profile-email">{user.email}</p>
              <span className="banana-account-plan-badge">{planLabel}</span>
            </div>
          </div>
        )}
      </AccountCard>
      <div className="banana-account-metrics">
        <AccountCard>
          <Coins size={18} />
          <p className="banana-account-metric">
            {balanceQuery.isError
              ? '—'
              : balanceQuery.isPending
                ? '…'
                : balanceQuery.data?.balance.toLocaleString()}
          </p>
          <p className="banana-account-card-description">
            {m['settings.credits.title']()}
          </p>
        </AccountCard>
        <AccountCard>
          <Users size={18} />
          <p className="banana-account-metric">
            {referralQuery.isError
              ? '—'
              : referralQuery.isPending
                ? '…'
                : (
                    (referralQuery.data?.successfulReferrals || 0) +
                    (referralQuery.data?.pendingReferrals || 0)
                  ).toLocaleString()}
          </p>
          <p className="banana-account-card-description">
            {m['banana.account.invites']()}
          </p>
        </AccountCard>
        <AccountCard>
          <Gift size={18} />
          <p className="banana-account-metric">
            {referralQuery.isError
              ? '—'
              : referralQuery.isPending
                ? '…'
                : referralQuery.data?.earnedCredits.toLocaleString()}
          </p>
          <p className="banana-account-card-description">
            {m['settings.referrals.earned']()}
          </p>
        </AccountCard>
      </div>
      {balanceQuery.data ? (
        <AccountBalanceCard
          balance={balanceQuery.data}
          title={m['banana.account.current_balance']()}
          purchaseLabel={m['settings.credits.purchase']()}
          labels={{
            purchased: m['banana.account.purchased'](),
            promotional: m['banana.account.free_tier'](),
            subscription: m['banana.account.subscription'](),
          }}
          expiryLabel={m['settings.credits.next_expiry']()}
          noExpiryLabel={m['settings.credits.no_expiry']()}
        />
      ) : (
        <AccountQueryState
          loading={false}
          error={balanceQuery.isError}
          loadingLabel={m['settings.profile.loading']()}
          errorLabel={m['banana.account.load_failed']()}
          retryLabel={m['common.error.retry']()}
          onRetry={() => {
            void balanceQuery.refetch();
          }}
        />
      )}
      <AccountCard>
        <div className="banana-account-card-heading">
          <h2>{m['banana.account.current_plan']()}</h2>
          <Link href="/settings/billing" className="banana-account-secondary">
            {m['settings.billing.title']()}
          </Link>
        </div>
        <p className="banana-account-subscription-name">{planLabel}</p>
        <AccountQueryState
          loading={false}
          error={planQuery.isError}
          loadingLabel={m['settings.profile.loading']()}
          errorLabel={m['banana.account.load_failed']()}
          retryLabel={m['common.error.retry']()}
          onRetry={() => {
            void planQuery.refetch();
          }}
        />
      </AccountCard>
      <AccountCard>
        <div className="banana-account-card-heading">
          <h2>{m['settings.referrals.title']()}</h2>
          <Link href="/settings/referrals" className="banana-account-primary">
            {m['settings.referrals.your_link']()}
          </Link>
        </div>
        <p className="banana-account-card-description">
          {m['banana.account.referral_description']()}
        </p>
        <AccountQueryState
          loading={false}
          error={referralQuery.isError}
          loadingLabel={m['settings.profile.loading']()}
          errorLabel={m['banana.account.load_failed']()}
          retryLabel={m['common.error.retry']()}
          onRetry={() => {
            void referralQuery.refetch();
          }}
        />
      </AccountCard>
      {user && (
        <AccountCard>
          <div className="banana-account-card-heading">
            <h2>{m['banana.account.edit_profile']()}</h2>
          </div>
          <SettingsForm
            name={user.name || ''}
            email={user.email || ''}
            image={user.image || ''}
          />
        </AccountCard>
      )}
    </div>
  );
}
export const Route = createFileRoute('/settings/profile')({
  component: SettingsPage,
});
