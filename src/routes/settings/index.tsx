import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowRight,
  ArrowUpRight,
  Coins,
  Gift,
  ImageIcon,
  KeyRound,
  Layers3,
  Palette,
  Sparkles,
  WandSparkles,
  Youtube,
  type LucideIcon,
} from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { apiGet } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { buttonVariants } from '@/components/ui/button';

type Subscription = {
  status: string;
  planName?: string | null;
  productName?: string | null;
};

type MonthlyImageUsage = {
  count: number;
  periodStart: string;
  periodEnd: string;
};

type LaunchAction = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
};

function DashboardPage() {
  const { data: session } = useSession();

  const { data: creditsData } = useQuery({
    queryKey: ['user-credits'],
    queryFn: () => apiGet<{ balance: number }>('/api/credits'),
  });
  const { data: apiKeysData } = useQuery({
    queryKey: ['user-apikeys'],
    queryFn: () => apiGet<unknown[]>('/api/apikeys'),
  });
  const { data: subscriptionData } = useQuery({
    queryKey: ['user-subscription-current'],
    queryFn: () =>
      apiGet<Subscription | null>('/api/user/subscriptions/current'),
  });
  const { data: usageData } = useQuery({
    queryKey: ['user-image-usage', 'month'],
    queryFn: () => apiGet<MonthlyImageUsage>('/api/images/usage'),
  });

  const credits = creditsData?.balance ?? null;
  const apiKeys = apiKeysData?.length ?? null;
  const subscription = subscriptionData ?? null;
  const monthlyImageUsage = usageData?.count ?? null;
  const displayName =
    session?.user?.name || session?.user?.email?.split('@')[0] || '';
  const planLabel =
    subscription?.planName ||
    subscription?.productName ||
    m['settings.overview.plan_free']();

  const actions: LaunchAction[] = [
    {
      href: '/settings/generate',
      title: m['settings.overview.action_generator'](),
      description: m['settings.overview.action_generator_desc'](),
      icon: WandSparkles,
      accent: 'from-violet-500 to-indigo-600',
    },
    {
      href: '/ai-product-photo-generator',
      title: m['settings.overview.action_product'](),
      description: m['settings.overview.action_product_desc'](),
      icon: Layers3,
      accent: 'from-emerald-400 to-cyan-600',
    },
    {
      href: '/ai-poster-generator',
      title: m['settings.overview.action_poster'](),
      description: m['settings.overview.action_poster_desc'](),
      icon: Palette,
      accent: 'from-fuchsia-500 to-rose-500',
    },
    {
      href: '/ai-youtube-thumbnail-generator',
      title: m['settings.overview.action_thumbnail'](),
      description: m['settings.overview.action_thumbnail_desc'](),
      icon: Youtube,
      accent: 'from-amber-400 to-orange-600',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-7 p-4 sm:p-6 lg:p-9">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[.22em] text-violet-600 uppercase dark:text-violet-300">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            {m['settings.overview.studio_eyebrow']()}
          </p>
          <h1 className="mt-2 font-serif text-3xl tracking-[-.03em] text-indigo-950 sm:text-4xl dark:text-white">
            {m['settings.welcome']({ name: displayName })}
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-indigo-950/8 bg-white/65 px-3 py-2 text-xs font-medium text-indigo-950/55 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-indigo-100/55">
          <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" />
          {m['settings.overview.status_ready']()}
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[1.45fr_.55fr]">
        <article className="group relative min-h-[390px] overflow-hidden rounded-[2rem] bg-[#0d0d20] p-6 text-white shadow-2xl shadow-indigo-950/20 sm:p-9">
          <div className="absolute -top-32 -right-20 size-[28rem] rounded-full bg-violet-600/35 blur-3xl transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute -bottom-40 left-1/4 size-96 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent_85%)] [background-size:42px_42px] opacity-25" />

          <div className="relative flex h-full flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-semibold text-violet-100 backdrop-blur">
                <Sparkles className="size-3.5 text-amber-300" />
                {m['settings.overview.current_plan']({ plan: planLabel })}
              </span>
              <h2 className="mt-8 max-w-3xl font-serif text-4xl leading-[1.03] tracking-[-.045em] text-balance sm:text-6xl">
                {m['settings.overview.studio_title']()}
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-6 text-indigo-100/60 sm:text-base">
                {m['settings.overview.studio_description']()}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/#generator"
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'h-12 rounded-full bg-white px-6 text-indigo-950 shadow-xl hover:bg-violet-50'
                  )}
                >
                  <Sparkles className="size-4" />
                  {m['settings.overview.create_now']()}
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/7 px-6 text-sm font-semibold text-white transition hover:bg-white/12"
                >
                  {m['settings.overview.explore_plans']()}
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
              <Metric
                label={m['settings.overview.balance_label']()}
                value={credits === null ? '—' : credits.toLocaleString()}
                icon={Coins}
              />
              <Metric
                label={m['settings.overview.output_label']()}
                value={
                  monthlyImageUsage === null
                    ? '—'
                    : monthlyImageUsage.toLocaleString()
                }
                icon={ImageIcon}
              />
              <Metric
                className="hidden sm:block"
                label={m['settings.overview.keys_label']()}
                value={apiKeys === null ? '—' : apiKeys.toLocaleString()}
                icon={KeyRound}
              />
            </div>
          </div>
        </article>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <Link
            href="/settings/referrals"
            className="group relative min-h-48 overflow-hidden rounded-[2rem] bg-linear-to-br from-fuchsia-500 via-rose-500 to-orange-400 p-6 text-white shadow-xl shadow-fuchsia-950/15"
          >
            <div className="absolute -right-10 -bottom-12 size-44 rounded-full border-[28px] border-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" />
            <Gift className="size-7" />
            <h3 className="mt-8 text-2xl font-semibold tracking-tight">
              {m['settings.overview.invite_title']()}
            </h3>
            <p className="mt-2 max-w-xs text-sm leading-5 text-white/75">
              {m['settings.overview.invite_purchase_description']()}
            </p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold">
              {m['settings.overview.invite_cta']()}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <Link
            href="/settings/apikeys"
            className="group relative min-h-48 overflow-hidden rounded-[2rem] border border-indigo-950/8 bg-white/75 p-6 text-indigo-950 shadow-lg shadow-indigo-950/5 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-white/6 dark:text-white"
          >
            <span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-950 text-white dark:bg-white dark:text-indigo-950">
              <KeyRound className="size-5" />
            </span>
            <h3 className="mt-6 text-xl font-semibold">
              {m['settings.overview.api_title']()}
            </h3>
            <p className="mt-2 text-sm leading-5 text-indigo-950/50 dark:text-indigo-100/50">
              {m['settings.overview.api_description']({ count: apiKeys ?? 0 })}
            </p>
            <ArrowUpRight className="absolute right-6 bottom-6 size-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-indigo-950 dark:text-white">
              {m['settings.overview.toolbox_title']()}
            </h2>
            <p className="mt-1 text-sm text-indigo-950/45 dark:text-indigo-100/45">
              {m['settings.overview.toolbox_description']()}
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map(
            ({ href, title, description, icon: Icon, accent }, index) => (
              <Link
                key={href}
                href={href}
                className="group relative min-h-44 overflow-hidden rounded-[1.5rem] border border-indigo-950/7 bg-white/65 p-5 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-indigo-950/8 dark:border-white/8 dark:bg-white/5 dark:hover:bg-white/8"
              >
                <span
                  className={cn(
                    'flex size-11 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-lg',
                    accent
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="absolute top-5 right-5 font-mono text-[10px] text-indigo-950/25 dark:text-white/20">
                  0{index + 1}
                </span>
                <h3 className="mt-6 font-semibold text-indigo-950 dark:text-white">
                  {title}
                </h3>
                <p className="mt-1.5 text-xs leading-5 text-indigo-950/45 dark:text-indigo-100/45">
                  {description}
                </p>
                <ArrowUpRight className="absolute right-5 bottom-5 size-4 text-indigo-950/30 transition group-hover:text-violet-600 dark:text-white/30" />
              </Link>
            )
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[.13em] text-indigo-100/35 uppercase">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export const Route = createFileRoute('/settings/')({
  component: DashboardPage,
});
