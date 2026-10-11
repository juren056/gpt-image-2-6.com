import type { ReactNode } from 'react';
import {
  CalendarCheck,
  Check,
  Coins,
  RotateCcw,
  ShieldCheck,
  Users,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';

export function AuthMarketingShell({
  children,
  starterCredits,
}: {
  children: ReactNode;
  starterCredits: number;
}) {
  const hasCredits = starterCredits > 0;
  const benefits = [
    { icon: Coins, label: m['common.sign.reward_benefit_create']() },
    { icon: RotateCcw, label: m['common.sign.reward_benefit_private']() },
    { icon: ShieldCheck, label: m['common.sign.reward_benefit_no_card']() },
  ];
  const rewardMechanisms = [
    {
      icon: CalendarCheck,
      title: m['common.sign.checkin_title'](),
      description: m['common.sign.checkin_description'](),
      accent: 'bg-amber-300 text-amber-950',
    },
    {
      icon: Users,
      title: m['common.sign.invite_title'](),
      description: m['common.sign.invite_purchase_description'](),
      accent: 'bg-fuchsia-400 text-fuchsia-950',
    },
  ];

  return (
    <main className="nano-auth relative min-h-svh overflow-hidden bg-[#f6f3ea] px-4 py-8 text-slate-950 sm:px-6 lg:py-12 dark:bg-slate-950 dark:text-slate-50">
      <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(79,70,229,.15)_1px,transparent_0)] [background-size:28px_28px] opacity-60" />
      <div className="relative mx-auto grid min-h-[calc(100svh-6rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-black/8 bg-white shadow-2xl shadow-indigo-950/10 lg:grid-cols-[1.05fr_.95fr] dark:border-white/10 dark:bg-slate-900">
        <aside className="relative hidden overflow-hidden bg-indigo-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -top-24 -right-24 size-72 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 size-80 rounded-full bg-amber-300/16 blur-3xl" />
          <div className="relative">
            <Link
              href="/"
              className="inline-flex items-center gap-3 font-semibold"
            >
              <img
                src={envConfigs.app_logo}
                alt=""
                width={36}
                height={36}
                className="size-9 rounded-xl bg-white/10"
              />
              {envConfigs.app_name}
            </Link>
            <div className="mt-14 max-w-lg xl:mt-16">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold text-amber-200">
                <Coins className="size-3.5" />
                {hasCredits
                  ? m['common.sign.reward_badge']({ credits: starterCredits })
                  : m['common.sign.workspace_badge']()}
              </span>
              <h1 className="mt-6 font-serif text-5xl leading-[1.03] tracking-[-0.035em] text-balance">
                {hasCredits
                  ? m['common.sign.reward_headline']({
                      credits: starterCredits,
                    })
                  : m['common.sign.workspace_headline']()}
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-indigo-100/75">
                {m['common.sign.reward_description']()}
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {rewardMechanisms.map(
                  ({ icon: Icon, title, description, accent }) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-white/10 bg-white/7 p-4 backdrop-blur-sm"
                    >
                      <span
                        className={`flex size-8 items-center justify-center rounded-xl ${accent}`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <p className="mt-3 text-sm font-bold text-white">
                        {title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-indigo-100/65">
                        {description}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
          <ul className="relative space-y-3">
            {benefits.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 text-sm text-indigo-50/85"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-white/10">
                  <Icon className="size-3.5" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex items-center justify-center p-5 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-7 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-indigo-950 lg:hidden dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-50">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Check className="size-4" />
                {hasCredits
                  ? m['common.sign.reward_mobile']({ credits: starterCredits })
                  : m['common.sign.workspace_badge']()}
              </p>
              <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-200/70">
                {m['common.sign.reward_benefit_no_card']()}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {rewardMechanisms.map(({ icon: Icon, title }) => (
                  <div
                    key={title}
                    className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold dark:bg-white/5"
                  >
                    <Icon className="size-3.5 shrink-0 text-amber-600 dark:text-amber-300" />
                    {title}
                  </div>
                ))}
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
