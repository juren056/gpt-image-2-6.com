import {
  ArrowRight,
  CalendarCheck,
  Coins,
  LayoutGrid,
  Users,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';

type ContinuationAction = {
  href: string;
  label: string;
  icon: 'credits' | 'checkin' | 'invite' | 'tools';
  primary?: boolean;
};

const icons = {
  credits: Coins,
  checkin: CalendarCheck,
  invite: Users,
  tools: LayoutGrid,
};

export function CreditContinuationPanel({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions: ContinuationAction[];
}) {
  return (
    <section
      id="credit-continuation-panel"
      className="credit-continuation-attention border-primary/20 relative overflow-hidden rounded-2xl border bg-[linear-gradient(135deg,oklch(0.975_0.025_292),oklch(0.985_0.015_80)_52%,oklch(0.975_0.025_185))] p-4 shadow-sm sm:p-5 dark:bg-[linear-gradient(135deg,oklch(0.2_0.045_292),oklch(0.18_0.03_270)_52%,oklch(0.2_0.04_185))]"
    >
      <div className="pointer-events-none absolute -top-16 -right-12 size-40 rounded-full bg-fuchsia-400/15 blur-3xl" />
      <div
        aria-hidden="true"
        className="credit-continuation-sheen pointer-events-none absolute -inset-y-10 left-0 w-24 bg-linear-to-r from-transparent via-white/45 to-transparent blur-sm dark:via-white/12"
      />
      <div className="relative">
        <div className="flex items-start gap-3">
          <span className="credit-continuation-icon bg-primary text-primary-foreground shadow-primary/15 relative grid size-10 shrink-0 place-items-center rounded-2xl shadow-md">
            <Coins className="size-4.5" />
            <span
              aria-hidden="true"
              className="credit-continuation-signal ring-background absolute -top-1 -right-1 size-2.5 rounded-full bg-emerald-400 ring-2"
            />
          </span>
          <div>
            <h3 className="font-serif text-xl leading-tight">{title}</h3>
            <p className="text-muted-foreground mt-1 text-xs leading-5 sm:text-sm">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {actions.map((action) => {
            const Icon = icons[action.icon];
            return (
              <Link
                key={action.href}
                href={action.href}
                className={
                  action.primary
                    ? 'bg-primary text-primary-foreground group flex min-h-12 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold shadow-sm transition-transform hover:-translate-y-0.5'
                    : 'border-border bg-background/70 hover:border-primary/35 hover:bg-background group flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all hover:-translate-y-0.5'
                }
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1">{action.label}</span>
                <ArrowRight
                  className="size-3.5 shrink-0 opacity-55 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
