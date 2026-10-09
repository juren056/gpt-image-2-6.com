import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Coins,
  Gift,
  History,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import type { CreativeToolId } from '@/config/creative-tools';
import { apiGet, apiPost } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { usePublicConfig } from '@/hooks/use-public-config';
import {
  CreativeToolTile,
  ModelBrandTile,
} from '@/components/creative-visuals';
import { LocaleSelector } from '@/components/locale-selector';
import { SiteUserMenu } from '@/components/site-user-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface NavLink {
  type: 'link';
  href: string;
  label: string;
  /** Open in a new tab. Off-site (http) hrefs always open in a new tab. */
  external?: boolean;
  badge?: string;
}

export interface ToolLink {
  href: string;
  label: string;
  description: string;
  icon?: LucideIcon;
  modelId?: string;
  toolId?: CreativeToolId;
  external?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  type: 'group';
  label: string;
  links: ToolLink[];
}

export type NavItem = NavLink | NavGroup;

type CreditBalance = { balance: number };
type CheckInState = {
  claimedToday: boolean;
  streak: number;
  cycleDay: number;
  nextReward: number;
  cycleTotal: number;
  cycleRewards: number[];
  history: Array<{ date: string; reward: number }>;
};

function DailyCheckInMenu({ signedIn }: { signedIn: boolean }) {
  const queryClient = useQueryClient();
  const stateQuery = useQuery({
    queryKey: ['daily-check-in'],
    queryFn: () => apiGet<CheckInState>('/api/check-in'),
    enabled: signedIn,
    staleTime: 30_000,
  });
  const claimMutation = useMutation({
    mutationFn: () =>
      apiPost<CheckInState & { claimed: boolean; reward: number }>(
        '/api/check-in'
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(['daily-check-in'], data);
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      if (data.claimed) {
        toast.success(m['growth.rewards.claimed']({ credits: data.reward }));
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const state = stateQuery.data;
  const claimed = Boolean(state?.claimedToday);
  const showReminder = signedIn ? stateQuery.isSuccess && !claimed : true;
  const iconClassName =
    'group relative flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-amber-300 to-orange-400 text-amber-950 shadow-sm transition outline-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-amber-400';
  const icon = (
    <>
      <CalendarCheck className="size-5 transition-transform group-hover:scale-110" />
      {showReminder ? (
        <span className="ring-background absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2" />
      ) : null}
    </>
  );

  if (!signedIn) {
    return (
      <Link
        href="/sign-in?callbackUrl=%2F%23generator"
        aria-label={m['common.nav.daily_checkin']()}
        title={m['common.nav.daily_checkin']()}
        className={iconClassName}
      >
        {icon}
      </Link>
    );
  }

  const cycleRewards = state?.cycleRewards ?? [3, 4, 4, 5, 5, 6, 6];
  const history = state?.history ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={m['common.nav.daily_checkin']()}
        title={m['common.nav.daily_checkin']()}
        className={iconClassName}
      >
        {icon}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="max-h-[min(42rem,calc(100dvh-5rem))] w-[min(25rem,calc(100vw-2rem))] overflow-y-auto rounded-3xl p-0 shadow-2xl"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="dark:via-background relative overflow-hidden bg-linear-to-br from-amber-50 via-white to-violet-50 p-5 font-normal dark:from-amber-950/50 dark:to-violet-950/50">
            <div className="absolute -top-12 -right-12 size-28 rounded-full bg-amber-300/25 blur-2xl" />
            <span className="relative flex size-10 items-center justify-center rounded-2xl bg-amber-300 text-amber-950 shadow-sm">
              <CalendarCheck className="size-5" />
            </span>
            <div className="text-foreground relative mt-4 text-base font-bold">
              {m['growth.rewards.checkin_title']()}
            </div>
            <p className="text-muted-foreground relative mt-1.5 text-xs leading-5">
              {m['growth.rewards.checkin_description']({
                credits: state?.cycleTotal ?? 33,
              })}
            </p>
            <div className="relative mt-4 flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2.5 text-xs ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
              <span className="text-muted-foreground">
                {m['growth.rewards.streak']({ days: state?.streak ?? 0 })}
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-300">
                {m['growth.rewards.cycle_total']({
                  credits: state?.cycleTotal ?? 33,
                })}
              </span>
            </div>

            <div className="relative mt-5">
              <p className="text-foreground text-xs font-bold">
                {m['growth.rewards.cycle_progress']()}
              </p>
              <div className="mt-2 grid grid-cols-7 gap-1.5">
                {cycleRewards.map((reward, index) => {
                  const completed = index < (state?.cycleDay ?? 0);
                  return (
                    <div key={`${index}-${reward}`} className="text-center">
                      <div
                        className={cn(
                          'flex h-10 items-center justify-center rounded-xl text-xs font-bold ring-1 transition',
                          completed
                            ? 'bg-emerald-500 text-white ring-emerald-500'
                            : 'bg-white/80 text-slate-500 ring-black/5 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10'
                        )}
                      >
                        {completed ? (
                          <Check className="size-3.5" />
                        ) : (
                          `+${reward}`
                        )}
                      </div>
                      <span className="text-muted-foreground mt-1 block text-[9px]">
                        {m['growth.rewards.day']({ day: index + 1 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="border-border/70 border-t px-5 pt-4 pb-2 font-normal">
            <div className="flex items-center gap-2 text-xs font-bold">
              <History className="size-3.5 text-violet-500" />
              {m['growth.rewards.history_title']()}
            </div>
            {stateQuery.isLoading ? (
              <div className="bg-muted mt-3 h-16 animate-pulse rounded-2xl" />
            ) : history.length > 0 ? (
              <div className="mt-2 space-y-1">
                {history.slice(0, 5).map((entry) => (
                  <div
                    key={entry.date}
                    className="hover:bg-muted/70 flex items-center justify-between rounded-xl px-2 py-2 text-xs"
                  >
                    <span className="text-muted-foreground">
                      {new Date(`${entry.date}T00:00:00Z`).toLocaleDateString(
                        undefined,
                        { month: 'short', day: 'numeric', timeZone: 'UTC' }
                      )}
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      +{entry.reward} {m['growth.rewards.credit_unit']()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-5 text-center text-xs">
                {m['growth.rewards.history_empty']()}
              </p>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuItem
          disabled={claimed || claimMutation.isPending || stateQuery.isLoading}
          onClick={() => claimMutation.mutate()}
          className="bg-foreground text-background focus:bg-foreground/90 focus:text-background m-2 min-h-11 cursor-pointer justify-center rounded-2xl font-semibold"
        >
          {claimed ? <Check className="size-4" /> : <Gift className="size-4" />}
          {claimed
            ? m['growth.rewards.claimed_today']()
            : m['growth.rewards.claim']({ credits: state?.nextReward ?? 3 })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Off-site URLs render as plain <a>; internal paths use the locale-aware Link. */
const isExternalHref = (href: string) => /^https?:\/\//.test(href);

function NavAnchor({
  href,
  external,
  className,
  onClick,
  children,
}: {
  href: string;
  external?: boolean;
  className: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      className={className}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

function ToolMenuLink({
  link,
  onClick,
}: {
  link: ToolLink;
  onClick?: () => void;
}) {
  const Icon = link.icon;

  return (
    <NavAnchor
      href={link.href}
      external={link.external}
      onClick={onClick}
      className="hover:bg-accent focus-visible:bg-accent focus-visible:ring-ring flex rounded-xl p-3 transition-colors outline-none focus-visible:ring-2"
    >
      {link.modelId ? (
        <ModelBrandTile modelId={link.modelId} className="mr-3" />
      ) : link.toolId ? (
        <CreativeToolTile toolId={link.toolId} className="mr-3" />
      ) : Icon ? (
        <span className="bg-primary/10 text-primary mr-3 flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="text-foreground truncate text-sm font-medium">
            {link.label}
          </span>
          {link.isNew ? (
            <span className="relative inline-flex shrink-0 items-center gap-1 overflow-hidden rounded-full bg-linear-to-r from-rose-600 to-orange-500 px-2 py-0.5 text-[9px] font-extrabold tracking-wide text-white uppercase shadow-sm shadow-rose-500/25">
              <span className="relative flex size-1.5" aria-hidden="true">
                <span className="absolute inline-flex size-full rounded-full bg-white opacity-75 motion-safe:animate-ping" />
                <span className="relative inline-flex size-1.5 rounded-full bg-white" />
              </span>
              NEW
            </span>
          ) : null}
        </span>
        <span className="text-muted-foreground mt-0.5 block truncate text-xs leading-5">
          {link.description}
        </span>
      </span>
    </NavAnchor>
  );
}

function ScrollableNavMenu({
  children,
  twoColumns,
}: {
  children: ReactNode;
  twoColumns: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);

  const updateScrollState = () => {
    const element = scrollRef.current;
    if (!element) return;
    const scrollable = element.scrollHeight > element.clientHeight + 2;
    setCanScroll(scrollable);
    setAtTop(element.scrollTop <= 2);
    setAtBottom(
      !scrollable ||
        element.scrollTop + element.clientHeight >= element.scrollHeight - 2
    );
  };

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const frame = requestAnimationFrame(updateScrollState);
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(element);
    window.addEventListener('resize', updateScrollState);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  const move = (direction: 1 | -1) => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollBy({
      top: direction * Math.max(180, element.clientHeight * 0.62),
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className={cn(
          'menu-scrollbar border-border/80 bg-popover max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border p-2 shadow-2xl',
          twoColumns && 'grid grid-cols-2 gap-1'
        )}
      >
        {children}
      </div>

      {canScroll && !atTop ? (
        <div className="from-popover pointer-events-none absolute inset-x-1 top-1 flex h-12 items-start justify-center rounded-t-xl bg-linear-to-b to-transparent pt-1.5">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Scroll up"
            className="border-border/70 bg-background/90 text-muted-foreground hover:text-foreground pointer-events-auto flex size-7 items-center justify-center rounded-full border shadow-sm backdrop-blur transition"
          >
            <ChevronUp className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {canScroll && !atBottom ? (
        <div className="from-popover pointer-events-none absolute inset-x-1 bottom-1 flex h-16 items-end justify-center rounded-b-xl bg-linear-to-t to-transparent pb-2">
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Scroll for more"
            className="border-border/70 bg-background/92 text-muted-foreground hover:text-foreground pointer-events-auto flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold shadow-sm backdrop-blur transition hover:-translate-y-0.5"
          >
            More
            <ChevronDown
              className="size-3.5 motion-safe:animate-bounce"
              aria-hidden="true"
            />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function SiteHeader({ navItems }: { navItems?: NavItem[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const user = mounted ? session?.user : null;
  const { data: publicConfig } = usePublicConfig();
  const creditsQuery = useQuery({
    queryKey: ['user-credits'],
    queryFn: () => apiGet<CreditBalance>('/api/credits'),
    enabled: mounted && Boolean(user),
    staleTime: 30_000,
  });
  const creditBalance = creditsQuery.data?.balance;
  const signupStarterCredits =
    publicConfig?.initial_credits_enabled === 'true'
      ? Math.max(
          0,
          Number.parseInt(publicConfig.initial_credits_amount || '0', 10) || 0
        )
      : 0;
  const displayedCredits = user ? (creditBalance ?? 0) : signupStarterCredits;

  useEffect(() => setMounted(true), []);

  return (
    <header className="bg-background/88 supports-backdrop-filter:bg-background/72 sticky top-0 z-50 w-full border-b border-transparent backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[90rem] items-center justify-between px-4 sm:h-16 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex min-h-10 shrink-0 items-center gap-2.5">
          <img
            src={envConfigs.app_logo}
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-xl shadow-sm"
          />
          <span className="text-sm font-semibold tracking-tight sm:text-base">
            {envConfigs.app_name}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-0.5 xl:flex"
          aria-label="Primary navigation"
        >
          {navItems?.map((item) =>
            item.type === 'group' ? (
              <div key={item.label} className="group relative">
                <button
                  type="button"
                  className="text-muted-foreground hover:bg-accent hover:text-foreground group-focus-within:bg-accent group-focus-within:text-foreground flex h-10 items-center gap-1 rounded-lg px-2.5 text-sm transition-colors 2xl:px-3"
                  aria-haspopup="true"
                >
                  {item.label}
                  <ChevronDown
                    className="size-3.5 transition-transform group-focus-within:rotate-180 group-hover:rotate-180"
                    aria-hidden="true"
                  />
                </button>
                <div
                  className={cn(
                    'invisible absolute top-full left-1/2 z-50 -translate-x-1/2 pt-3 opacity-0 transition-[visibility,opacity] duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100',
                    item.links.length === 1
                      ? 'w-[22rem]'
                      : item.links.length > 12
                        ? 'w-[52rem]'
                        : 'w-[30rem]'
                  )}
                >
                  <ScrollableNavMenu twoColumns={item.links.length > 12}>
                    {item.links.map((link) => (
                      <ToolMenuLink key={link.href} link={link} />
                    ))}
                  </ScrollableNavMenu>
                </div>
              </div>
            ) : (
              <NavAnchor
                key={item.href}
                href={item.href}
                external={item.external}
                className="text-muted-foreground hover:bg-accent hover:text-foreground flex h-10 items-center rounded-lg px-2.5 text-sm transition-colors 2xl:px-3"
              >
                {item.label}
                {item.badge ? (
                  <span className="ml-1.5 rounded-full bg-amber-300 px-1.5 py-0.5 text-[9px] font-bold text-amber-950 uppercase">
                    {item.badge}
                  </span>
                ) : null}
              </NavAnchor>
            )
          )}
        </nav>

        {/* Desktop actions */}
        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          <DailyCheckInMenu signedIn={Boolean(user)} />
          {user ? (
            <Link
              href="/settings/referrals"
              aria-label={m['common.nav.invite_friends']()}
              title={m['common.nav.invite_friends']()}
              className="group relative flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-fuchsia-500 to-amber-400 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Gift className="size-5 transition-transform group-hover:scale-105 group-hover:rotate-6" />
              <span className="ring-background absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2" />
            </Link>
          ) : null}
          <LocaleSelector />
          <ThemeToggle />
          {user || signupStarterCredits > 0 ? (
            <Link
              href={
                user
                  ? '/settings/credits'
                  : '/sign-up?callbackUrl=%2F%23generator'
              }
              aria-label={
                user
                  ? m['common.nav.credit_balance']({
                      credits: displayedCredits,
                    })
                  : m['common.nav.guest_credit_offer']({
                      credits: signupStarterCredits,
                    })
              }
              title={
                user
                  ? m['common.nav.credit_balance']({
                      credits: displayedCredits,
                    })
                  : m['common.nav.guest_credit_offer']({
                      credits: signupStarterCredits,
                    })
              }
              className={cn(
                'border-border flex h-10 min-w-16 items-center justify-center gap-1.5 rounded-full border px-3 text-sm font-semibold tabular-nums transition-colors',
                user
                  ? 'bg-muted/55 hover:bg-muted'
                  : 'border-amber-300/55 bg-amber-300/12 text-amber-700 hover:bg-amber-300/20 dark:text-amber-300'
              )}
            >
              <Coins className="size-4 text-amber-500" />
              <span className="whitespace-nowrap">
                {user
                  ? creditsQuery.isLoading
                    ? '—'
                    : displayedCredits.toLocaleString()
                  : m['common.nav.guest_credit_offer']({
                      credits: signupStarterCredits,
                    })}
              </span>
            </Link>
          ) : null}
          {user ? (
            <SiteUserMenu
              name={user.name || 'User'}
              email={user.email}
              image={user.image}
            />
          ) : (
            <Link
              href="/sign-in?callbackUrl=%2F%23generator"
              className={cn(buttonVariants(), 'gap-1.5')}
            >
              {m['common.nav.get_started']()}
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-2 xl:hidden">
          <DailyCheckInMenu signedIn={Boolean(user)} />
          <button
            className="border-border/70 bg-background/70 hover:bg-accent flex size-10 items-center justify-center rounded-full border shadow-sm transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={
              mobileOpen
                ? m['common.nav.close_menu']()
                : m['common.nav.open_menu']()
            }
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-border bg-background/96 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-xl xl:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {navItems?.map((item) =>
              item.type === 'group' ? (
                <details key={item.label} className="group/disclosure">
                  <summary className="text-muted-foreground hover:bg-accent hover:text-foreground flex min-h-11 cursor-pointer list-none items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors [&::-webkit-details-marker]:hidden">
                    {item.label}
                    <ChevronDown
                      className="size-4 transition-transform group-open/disclosure:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="mt-1 space-y-1 pl-2">
                    {item.links.map((link) => (
                      <ToolMenuLink
                        key={link.href}
                        link={link}
                        onClick={() => setMobileOpen(false)}
                      />
                    ))}
                  </div>
                </details>
              ) : (
                <NavAnchor
                  key={item.href}
                  href={item.href}
                  external={item.external}
                  className="text-muted-foreground hover:bg-accent hover:text-foreground flex min-h-11 items-center rounded-xl px-3 py-2 text-sm transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                  {item.badge ? (
                    <span className="ml-2 rounded-full bg-amber-300 px-1.5 py-0.5 text-[9px] font-bold text-amber-950 uppercase">
                      {item.badge}
                    </span>
                  ) : null}
                </NavAnchor>
              )
            )}
          </nav>
          {user ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/settings/referrals"
                onClick={() => setMobileOpen(false)}
                className="border-border bg-card hover:bg-accent flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors"
              >
                <span className="flex size-7 items-center justify-center rounded-lg bg-linear-to-br from-fuchsia-500 to-amber-400 text-white">
                  <Gift className="size-4" />
                </span>
                {m['common.nav.invite_friends']()}
              </Link>
              <Link
                href="/settings/credits"
                onClick={() => setMobileOpen(false)}
                className="border-border bg-card hover:bg-accent flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold tabular-nums transition-colors"
              >
                <Coins className="size-4 text-amber-500" />
                {creditsQuery.isLoading
                  ? '—'
                  : (creditBalance ?? 0).toLocaleString()}
              </Link>
            </div>
          ) : null}
          <div className="border-border mt-3 flex items-center gap-2 border-t pt-3">
            <LocaleSelector />
            <ThemeToggle />
            <div className="flex-1" />
            {user ? (
              <SiteUserMenu
                name={user.name || 'User'}
                email={user.email}
                image={user.image}
              />
            ) : (
              <>
                {signupStarterCredits > 0 ? (
                  <Link
                    href="/sign-up?callbackUrl=%2F%23generator"
                    aria-label={m['common.nav.guest_credit_offer']({
                      credits: signupStarterCredits,
                    })}
                    className="border-border flex h-10 items-center gap-1.5 rounded-full border border-amber-300/55 bg-amber-300/12 px-3 text-sm font-semibold text-amber-700 tabular-nums dark:text-amber-300"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Coins className="size-4 text-amber-500" />
                    <span className="whitespace-nowrap">
                      {m['common.nav.guest_credit_offer']({
                        credits: signupStarterCredits,
                      })}
                    </span>
                  </Link>
                ) : null}
                <Link
                  href="/sign-in?callbackUrl=%2F%23generator"
                  className={cn(buttonVariants(), 'gap-1.5')}
                  onClick={() => setMobileOpen(false)}
                >
                  {m['common.nav.get_started']()}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
