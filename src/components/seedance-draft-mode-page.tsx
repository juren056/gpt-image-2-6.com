import type { ReactNode } from 'react';
import {
  CircleDollarSign,
  Clock3,
  Film,
  Images,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';
import { SeedanceDraftCalculator } from '@/components/seedance-draft-calculator';
import type { SeedanceDraftModeCopy } from '@/components/seedance-draft-types';
import { SeedanceDraftWorkspace } from '@/components/seedance-draft-workspace';
import { buttonVariants } from '@/components/ui/button';

export function SeedanceDraftModePage({
  copy,
}: {
  copy: SeedanceDraftModeCopy;
}) {
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden border-b px-4 py-12 sm:py-20">
        <div className="bg-primary/10 absolute top-0 left-1/2 -z-10 size-[32rem] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="mx-auto max-w-6xl">
          <nav className="text-muted-foreground flex gap-2 text-xs">
            <Link href="/">{copy.breadcrumbHome}</Link>
            <span>/</span>
            <Link href="/seedance-2-5">{copy.breadcrumbSeedance}</Link>
            <span>/</span>
            <span className="text-foreground">Draft Mode</span>
          </nav>
          <div className="mx-auto mt-10 max-w-4xl text-center">
            <p className="text-primary text-xs font-bold tracking-[.2em] uppercase">
              {copy.eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              {copy.title}
            </h1>
            <p className="text-muted-foreground mx-auto mt-6 max-w-3xl leading-7 sm:text-lg">
              {copy.description}
            </p>
            <div className="mx-auto mt-7 flex max-w-3xl gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-left text-sm leading-6 text-amber-950 dark:border-amber-400/20 dark:bg-amber-950/30 dark:text-amber-100">
              <Clock3 className="mt-1 size-4 shrink-0" />
              <p>
                <strong>{copy.status}</strong> {copy.statusBody}
              </p>
            </div>
          </div>
        </div>
      </section>

      <SeedanceDraftWorkspace copy={copy} />
      <SeedanceDraftCalculator copy={copy} />

      <section className="px-4 py-14 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <header className="max-w-3xl">
            <h2 className="text-3xl font-semibold">{copy.howTitle}</h2>
            <p className="text-muted-foreground mt-3 leading-7">
              {copy.howDescription}
            </p>
          </header>
          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {copy.steps.map((step, index) => (
              <article key={step.title} className="rounded-3xl border p-5">
                <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl font-bold">
                  {index + 1}
                </span>
                <h3 className="mt-5 font-semibold">{step.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {step.body}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-10 grid gap-6 rounded-[2rem] border p-6 sm:p-8 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <ShieldCheck className="size-5" />
              </span>
              <h2 className="mt-5 text-2xl font-semibold">{copy.trustTitle}</h2>
              <p className="text-muted-foreground mt-3 leading-7">
                {copy.trustBody}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {copy.trustItems.map((item) => (
                <div
                  key={item}
                  className="bg-muted/30 flex gap-3 rounded-2xl p-4 text-sm leading-6"
                >
                  <LockKeyhole className="text-primary mt-0.5 size-4 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/20 border-t px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-semibold">
            {copy.faqTitle}
          </h2>
          <div className="mt-8 space-y-3">
            {copy.faqs.map((faq) => (
              <details
                key={faq.question}
                className="bg-card rounded-2xl border p-5"
              >
                <summary className="cursor-pointer font-semibold">
                  {faq.question}
                </summary>
                <p className="text-muted-foreground mt-3 text-sm leading-7">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
          <div className="mt-12 text-center">
            <h2 className="text-xl font-semibold">{copy.relatedTitle}</h2>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Related
                href="/seedance-2-5"
                label={copy.relatedGenerator}
                icon={<Film className="size-4" />}
              />
              <Related
                href="/pricing"
                label={copy.relatedPricing}
                icon={<CircleDollarSign className="size-4" />}
                outline
              />
              <Related
                href="/tools"
                label={copy.relatedTools}
                icon={<Images className="size-4" />}
                outline
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Related({
  href,
  label,
  icon,
  outline = false,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  outline?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: outline ? 'outline' : 'default' }),
        'rounded-xl'
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
