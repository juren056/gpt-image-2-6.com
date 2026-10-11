import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

import { signOut, useSession } from '@/core/auth/client';
import { localeNames } from '@/config/locale';
import { pricingCatalog } from '@/config/pricing';
import { trackFunnelEvent } from '@/lib/analytics-events';
import { apiGet, apiPost } from '@/lib/api-client';
import { beginSignOut, cancelSignOut } from '@/lib/auth-transition';
import { m } from '@/paraglide/messages.js';
import {
  getLocale,
  locales,
  localizeHref,
  setLocale,
} from '@/paraglide/runtime.js';
import { usePublicConfig } from '@/hooks/use-public-config';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import {
  BananaAccountMenu,
  type AccountMenuCopy,
} from '@/components/banana-account-menu';
import { BananaUpgrade } from '@/components/banana-upgrade';
import {
  DailyRewardCard,
  type DailyRewardState,
} from '@/components/daily-reward-card';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function AccountUpgrade({
  open,
  onOpenChange,
  name,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
}) {
  const config = usePublicConfig();
  const ready =
    config.data?.stripe_enabled === 'true' &&
    config.data?.stripe_ready === 'true';
  const plans = ['starter_monthly', 'creator_monthly', 'pro_monthly'].map(
    (id, index) => {
      const plan = pricingCatalog[id];
      return {
        id,
        name: [
          m['landing.pricing.starter'](),
          m['landing.pricing.creator'](),
          m['landing.pricing.pro'](),
        ][index],
        price: new Intl.NumberFormat(getLocale(), {
          style: 'currency',
          currency: plan.currency,
        }).format(plan.priceInCents / 100),
        credits: plan.credits,
        featured: index === 1,
      };
    }
  );
  return (
    <BananaUpgrade
      open={open}
      onOpenChange={onOpenChange}
      title={m['account.upgrade.title']({ name })}
      description={m['account.upgrade.description']()}
      plans={plans}
      popular={m['landing.pricing.popular']()}
      creditsLabel={m['account.upgrade.credits_month']()}
      monthly={m['account.upgrade.month']()}
      billingNote={m['landing.pricing.auto_renew_note']()}
      features={[
        m['account.upgrade.feature_fal'](),
        m['account.upgrade.feature_private'](),
        m['account.upgrade.feature_refund'](),
        m['account.upgrade.feature_control'](),
      ]}
      choose={m['account.upgrade.choose']()}
      unavailable={m['landing.pricing.checkout_unavailable']()}
      ready={ready}
      pending={false}
      regular={m['account.upgrade.regular']()}
      skip={m['account.upgrade.skip']()}
      onCheckout={(id) => {
        trackFunnelEvent('checkout_started', {
          product: id,
          provider: 'stripe',
          source: 'account',
        });
        window.location.assign(
          localizeHref(
            '/checkout?product=' +
              encodeURIComponent(id) +
              '&redirect=%2Fsettings%2Fgenerate'
          )
        );
      }}
    />
  );
}
export function AccountDailyReward({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const reward = useQuery({
    queryKey: ['daily-check-in', session?.user?.id],
    queryFn: () => apiGet<DailyRewardState>('/api/check-in'),
    enabled: open && !!session?.user,
  });
  const claim = useMutation({
    mutationFn: () => {
      if (!session?.user)
        return Promise.reject(new Error(m['common.sign.sign_in_title']()));
      return apiPost<DailyRewardState>('/api/check-in');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['daily-check-in', session?.user?.id], data);
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      queryClient.invalidateQueries({ queryKey: ['account-balance'] });
      toast.success(m['account.reward.claimed']());
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="banana-account banana-reward-dialog daily-reward-dialog">
        <DailyRewardCard
          state={reward.data}
          loading={reward.isPending}
          error={reward.isError}
          pending={claim.isPending}
          onClaim={() => claim.mutate()}
          onRetry={() => reward.refetch()}
          historyDates={(reward.data?.history ?? []).slice(0, 5).map((entry) =>
            new Intl.DateTimeFormat(getLocale(), {
              month: 'short',
              day: 'numeric',
              timeZone: 'UTC',
            }).format(new Date(`${entry.date}T00:00:00Z`))
          )}
          copy={{
            title: m['growth.rewards.checkin_title'](),
            description: m['growth.rewards.checkin_description']({
              credits: reward.data?.cycleTotal ?? 33,
            }),
            streak: m['growth.rewards.streak']({
              days: reward.data?.streak ?? 0,
            }),
            cycleTotal: m['growth.rewards.cycle_total']({
              credits: reward.data?.cycleTotal ?? 33,
            }),
            progress: m['growth.rewards.cycle_progress'](),
            days: Array.from({ length: 7 }, (_, index) =>
              m['growth.rewards.day']({ day: index + 1 })
            ),
            history: m['growth.rewards.history_title'](),
            historyEmpty: m['growth.rewards.history_empty'](),
            creditUnit: m['growth.rewards.credit_unit'](),
            claim: m['account.reward.claim']({
              credits: reward.data?.nextReward ?? 3,
            }),
            claimed: m['account.reward.claimed'](),
            completed: m['admin.users.credits_granted'](),
            loading: m['account.shell.loading'](),
            error: m['account.reward.error'](),
            retry: m['common.error.retry'](),
            rules: m['account.reward.description'](),
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
export function AccountUserMenu({
  name,
  email,
  image,
  sidebar = false,
}: {
  name: string;
  email: string;
  image?: string | null;
  sidebar?: boolean;
}) {
  const { data: session } = useSession();
  const permissions = useUserPermissions(!!session?.user);
  const credits = useQuery({
    queryKey: ['user-credits', session?.user?.id, 'balance'],
    queryFn: () => apiGet<{ balance: number }>('/api/credits'),
    enabled: !!session?.user,
  });
  const subscription = useQuery({
    queryKey: ['user-subscription-current', session?.user?.id],
    queryFn: () =>
      apiGet<{ planName?: string; productName?: string } | null>(
        '/api/user/subscriptions/current'
      ),
    enabled: !!session?.user,
  });
  const { resolvedTheme, setTheme } = useTheme();
  const locale = getLocale();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  const copy: AccountMenuCopy = {
    account: m['account.menu.account'](),
    credits: m['settings.credits.title'](),
    upgrade: m['account.menu.upgrade'](),
    billing: m['account.menu.billing'](),
    assets: m['account.shell.assets'](),
    referral: m['account.menu.referral'](),
    profile: m['settings.nav.profile'](),
    theme: m['account.menu.theme'](),
    dark: m['account.menu.dark'](),
    light: m['account.menu.light'](),
    language: m['account.menu.language'](),
    help: m['account.menu.help'](),
    logout: m['common.sign.sign_out_title'](),
    admin: m['common.systems.admin'](),
    checkIn: m['account.reward.title'](),
  };
  async function handleSignOut() {
    beginSignOut();
    try {
      await signOut();
      window.location.replace(localizeHref('/'));
    } catch {
      cancelSignOut();
      toast.error(m['account.menu.logout_error']());
    }
  }
  return (
    <>
      <BananaAccountMenu
        name={name}
        email={email}
        image={image}
        sidebar={sidebar}
        balance={credits.data?.balance ?? null}
        plan={
          subscription.data?.planName ||
          subscription.data?.productName ||
          m['settings.overview.plan_free']()
        }
        copy={copy}
        isAdmin={permissions.data?.isAdmin === true}
        dark={resolvedTheme !== 'light'}
        language={locale}
        languages={locales.map((code) => ({
          code,
          label: localeNames[code] || code,
        }))}
        onThemeChange={() =>
          setTheme(resolvedTheme === 'light' ? 'dark' : 'light')
        }
        onLanguageChange={(code) => setLocale(code as typeof locale)}
        onUpgrade={() => setUpgradeOpen(true)}
        onCheckIn={() => setRewardOpen(true)}
        onSignOut={handleSignOut}
      />
      <AccountUpgrade
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        name={name}
      />
      <AccountDailyReward open={rewardOpen} onOpenChange={setRewardOpen} />
    </>
  );
}
