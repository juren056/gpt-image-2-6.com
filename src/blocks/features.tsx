import {
  Coins,
  Download,
  LockKeyhole,
  Ratio,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

import { tDynamic } from '@/core/i18n/dynamic';
import { m } from '@/paraglide/messages.js';

export function Features() {
  const features: { key: string; icon: LucideIcon }[] = [
    { key: 'generate', icon: Sparkles },
    { key: 'styles', icon: SlidersHorizontal },
    { key: 'quality', icon: Ratio },
    { key: 'speed', icon: LockKeyhole },
    { key: 'credits', icon: Coins },
    { key: 'export', icon: Download },
  ];

  return (
    <section
      id="features"
      className="border-border/70 relative overflow-hidden border-y px-4 py-16 sm:py-32"
    >
      <div className="bg-primary/6 pointer-events-none absolute top-0 left-1/2 h-72 w-[44rem] -translate-x-1/2 rounded-full blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-2xl text-left sm:mb-16 sm:text-center">
          <p className="text-primary mb-4 text-xs font-semibold tracking-[0.22em] uppercase">
            {m['landing.features.eyebrow']()}
          </p>
          <h2 className="font-serif text-3xl leading-tight font-normal tracking-tight text-balance sm:text-5xl">
            {m['landing.features.title']()}
          </h2>
          <p className="text-muted-foreground mx-auto mt-5 max-w-xl leading-relaxed">
            {m['landing.features.description']()}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ key, icon: Icon }, index) => (
            <article
              key={key}
              className="group border-border/80 bg-background/75 hover:border-primary/25 relative min-h-0 overflow-hidden rounded-2xl border p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 sm:min-h-56 sm:p-7"
            >
              <div className="mb-5 flex items-start justify-between sm:mb-9">
                <div className="bg-primary/9 text-primary ring-primary/10 flex size-11 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-105">
                  <Icon className="size-5" strokeWidth={1.7} />
                </div>
                <span className="text-muted-foreground/50 font-mono text-xs tracking-widest">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="text-lg font-semibold tracking-tight">
                {tDynamic(`landing.features.${key}.title`)}
              </h3>
              <p className="text-muted-foreground mt-2.5 text-sm leading-6">
                {tDynamic(`landing.features.${key}.description`)}
              </p>
              <div className="from-primary/0 via-primary/35 to-primary/0 absolute inset-x-6 bottom-0 h-px bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
