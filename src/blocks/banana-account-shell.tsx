import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Boxes,
  History,
  Images,
  KeyRound,
  LayoutGrid,
  LifeBuoy,
  Plus,
  Shapes,
  Sparkles,
} from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { usePathname, useRouter } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { apiGet } from '@/lib/api-client';
import { isSigningOut } from '@/lib/auth-transition';
import { m } from '@/paraglide/messages.js';
import {
  AccountDailyReward,
  AccountUpgrade,
  AccountUserMenu,
} from '@/blocks/banana-account-menu';
import { BananaAccountShell } from '@/components/banana-account-shell';

/** Mirrors the engine's authenticated membership gate without touching the admin shell. */
export function AccountShell({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const redirecting = useRef(false);
  const membership = useQuery({
    queryKey: ['user-info', session?.user?.id],
    queryFn: () => apiGet<{ needsInvite?: boolean }>('/api/user/info'),
    enabled: !!session?.user,
    staleTime: 60_000,
  });
  const credits = useQuery({
    queryKey: ['user-credits', session?.user?.id, 'balance'],
    queryFn: () => apiGet<{ balance: number }>('/api/credits'),
    enabled: !!session?.user,
  });
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  useEffect(() => {
    if (isPending || redirecting.current) return;
    if (!session?.user) {
      if (isSigningOut()) return;
      redirecting.current = true;
      router.push(
        `/sign-in?callbackUrl=${encodeURIComponent(`${pathname}${window.location.search}`)}`
      );
      return;
    }
    if (membership.isPending) return;
    if (membership.data?.needsInvite) {
      redirecting.current = true;
      router.push('/redeem-invite');
    }
  }, [
    isPending,
    session,
    membership.isPending,
    membership.data?.needsInvite,
    pathname,
    router,
  ]);
  if (
    isPending ||
    !session?.user ||
    membership.isPending ||
    membership.data?.needsInvite
  )
    return (
      <div className="banana-account banana-account-loading" role="status">
        <span className="banana-account-spinner" />
        {m['account.shell.loading']()}
      </div>
    );
  if (membership.isError)
    return (
      <div className="banana-account banana-account-loading">
        <p role="alert">{m['banana.account.load_failed']()}</p>
        <button
          type="button"
          className="banana-account-primary"
          onClick={() => membership.refetch()}
        >
          {m['common.error.retry']()}
        </button>
      </div>
    );
  const name = session.user.name || session.user.email;
  const nav = [
    { href: '/settings/generate', label: m['account.shell.new'](), icon: Plus },
    { href: '/settings', label: m['account.shell.studio'](), icon: Shapes },
    {
      href: '/settings/prompts',
      label: m['account.shell.prompts'](),
      icon: BookOpen,
    },
    {
      href: '/settings/skills',
      label: m['account.shell.skills'](),
      icon: Sparkles,
    },
    {
      href: '/settings/tools',
      label: m['account.shell.tools'](),
      icon: LayoutGrid,
      badge: m['account.shell.new_badge'](),
    },
    {
      href: '/settings/assets',
      label: m['account.shell.assets'](),
      icon: Images,
    },
    {
      href: '/settings/tickets',
      label: m['settings.nav.tickets'](),
      icon: LifeBuoy,
    },
    {
      href: '/settings/apikeys',
      label: m['settings.nav.apikeys'](),
      icon: KeyRound,
    },
    {
      href: '/settings/studio',
      label: m['account.shell.editor'](),
      icon: Boxes,
    },
  ];
  const accountRoutes = [
    '/settings/profile',
    '/settings/credits',
    '/settings/billing',
    '/settings/referrals',
    '/settings/payments',
  ];
  const title = accountRoutes.includes(pathname)
    ? m['account.menu.account']()
    : nav.find((item) => item.href === pathname)?.label ||
      m['account.shell.history']();
  const tabs = accountRoutes.includes(pathname)
    ? [
        { href: '/settings/profile', label: m['settings.nav.profile']() },
        { href: '/settings/credits', label: m['settings.nav.credits']() },
        { href: '/settings/billing', label: m['settings.nav.billing']() },
        { href: '/settings/referrals', label: m['account.shell.referral']() },
      ]
    : [];
  return (
    <>
      <BananaAccountShell
        brand={envConfigs.app_name}
        logo={envConfigs.app_logo || '/logo.png'}
        nav={nav}
        pathname={pathname}
        accountLabel={m['account.menu.account']()}
        title={title}
        tabs={tabs}
        creditsLabel={m['settings.nav.credits']()}
        creditUnit={m['account.shell.credit_unit']()}
        getCredits={m['account.shell.get_credits']()}
        recent={m['account.shell.recent']()}
        history={{
          href: '/settings/history',
          label: m['account.shell.history'](),
          icon: History,
        }}
        toggle={m['account.shell.toggle']()}
        searchLabel={m['account.shell.search']()}
        account={
          <AccountUserMenu
            name={name}
            email={session.user.email}
            image={session.user.image}
            sidebar
          />
        }
        balance={credits.data?.balance ?? null}
        onUpgrade={() => setUpgradeOpen(true)}
        onSearch={() => router.push('/settings/history')}
        rewardLabel={m['account.reward.title']()}
        onReward={() => setRewardOpen(true)}
      >
        {children}
      </BananaAccountShell>
      <AccountUpgrade
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        name={name}
      />
      <AccountDailyReward open={rewardOpen} onOpenChange={setRewardOpen} />
    </>
  );
}
