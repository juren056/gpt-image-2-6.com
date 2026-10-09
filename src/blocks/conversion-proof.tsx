import { Coins, CreditCard, Eye, Gauge, type LucideIcon } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { m } from '@/paraglide/messages.js';

const ITEMS: Array<{
  icon: LucideIcon;
  key: 'credits' | 'card' | 'cost' | 'private';
}> = [
  { icon: Coins, key: 'credits' },
  { icon: CreditCard, key: 'card' },
  { icon: Gauge, key: 'cost' },
  { icon: Eye, key: 'private' },
];

export function ConversionProof() {
  return (
    <section className="border-border border-y bg-indigo-950 px-4 py-5 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 grid-cols-2 gap-4 lg:grid-cols-4">
          {ITEMS.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="flex items-center gap-2.5 text-xs text-indigo-100/80 sm:text-sm"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-amber-300">
                <Icon className="size-4" />
              </span>
              {m[`growth.proof.${key}`]()}
            </div>
          ))}
        </div>
        <Link
          href="/sign-up?callbackUrl=%2F%23generator"
          className="shrink-0 rounded-full bg-amber-300 px-5 py-2.5 text-center text-sm font-semibold text-indigo-950 transition hover:bg-amber-200"
        >
          {m['growth.proof.cta']()}
        </Link>
      </div>
    </section>
  );
}
