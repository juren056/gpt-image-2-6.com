import { ArrowRight, Download, PenLine, Sparkles } from 'lucide-react';

import { tDynamic } from '@/core/i18n/dynamic';
import { m } from '@/paraglide/messages.js';

const STEPS = [
  { key: 'prompt', icon: PenLine },
  { key: 'generate', icon: Sparkles },
  { key: 'download', icon: Download },
] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-border border-t px-4 py-16 sm:py-32"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-left sm:mb-16 sm:text-center">
          <p className="text-primary mb-3 text-xs font-semibold tracking-[0.22em] uppercase sm:hidden">
            01 — 03
          </p>
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-5xl">
            {m['landing.how_it_works.title']()}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg text-sm leading-relaxed sm:mx-auto sm:mt-5 sm:text-base">
            {m['landing.how_it_works.description']()}
          </p>
        </div>
        <div className="before:from-primary/50 before:via-primary/20 relative grid gap-3 before:absolute before:top-8 before:bottom-8 before:left-6 before:w-px before:bg-linear-to-b before:to-transparent sm:gap-8 sm:before:hidden md:grid-cols-3">
          {STEPS.map(({ key, icon: Icon }, index) => (
            <article
              key={key}
              className="border-border/70 bg-card/70 relative grid grid-cols-[3rem_1fr] gap-4 rounded-2xl border p-4 text-left shadow-sm backdrop-blur-sm sm:block sm:border-0 sm:bg-transparent sm:p-0 sm:text-center sm:shadow-none"
            >
              <div className="bg-primary/10 text-primary ring-background relative z-10 flex size-12 items-center justify-center rounded-2xl ring-4 sm:mx-auto sm:mb-5 sm:size-14 sm:ring-0">
                <Icon className="size-6" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 pt-0.5 sm:pt-0">
                <span className="text-primary mb-1.5 block text-[11px] font-semibold tracking-widest uppercase sm:mb-2 sm:text-xs">
                  {m['landing.how_it_works.step_label']({ step: index + 1 })}
                </span>
                <h3 className="mb-1.5 text-base font-semibold sm:mb-2 sm:text-lg sm:font-medium">
                  {tDynamic(`landing.how_it_works.${key}.title`)}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {tDynamic(`landing.how_it_works.${key}.description`)}
                </p>
              </div>
              {index < STEPS.length - 1 && (
                <ArrowRight className="text-muted-foreground/40 absolute top-7 -right-4 hidden size-5 md:block" />
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
