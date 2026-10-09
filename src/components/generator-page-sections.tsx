import type { ReactNode } from 'react';
import {
  ArrowRight,
  Check,
  Download,
  Info,
  Lightbulb,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type GeneratorStep = {
  title: string;
  description: string;
};

export type GeneratorRelatedLink = {
  href: string;
  title: string;
  description: string;
  image?: string;
};

export type GeneratorFaq = {
  question: string;
  answer: string;
};

export function GeneratorPageHero(props: {
  breadcrumbs: Array<{ href?: string; label: string }>;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  icon: ReactNode;
  primaryLabel: string;
  note: string;
  badges: string[];
  exampleLabel?: string;
}) {
  return (
    <section className="border-border relative overflow-hidden border-b">
      <div className="bg-primary/5 absolute inset-x-0 top-0 h-80 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-16 lg:py-20">
        <nav
          aria-label="Breadcrumb"
          className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs"
        >
          {props.breadcrumbs.map((item, index) => (
            <span key={`${item.label}-${index}`} className="contents">
              {index ? <span aria-hidden="true">/</span> : null}
              {item.href ? (
                <Link href={item.href} className="hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground">{item.label}</span>
              )}
            </span>
          ))}
        </nav>

        <div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,.9fr)]">
          <div>
            <div className="flex items-center gap-3">
              {props.icon}
              <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
                {props.eyebrow}
              </p>
            </div>
            <h1 className="mt-5 max-w-4xl font-serif text-4xl leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              {props.title}
            </h1>
            <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-8">
              {props.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {props.badges.map((badge) => (
                <span
                  key={badge}
                  className="border-border bg-background/80 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur"
                >
                  {badge}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#generator"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'shadow-primary/15 rounded-full px-7 shadow-lg'
                )}
              >
                {props.primaryLabel}
                <ArrowRight className="size-4" />
              </a>
              <p className="text-muted-foreground max-w-sm text-xs leading-5">
                {props.note}
              </p>
            </div>
          </div>

          <figure className="border-border bg-card group relative overflow-hidden rounded-[2rem] border p-2 shadow-2xl">
            <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-[1.55rem]">
              <img
                src={props.image}
                alt={props.imageAlt}
                width={1200}
                height={900}
                fetchPriority="high"
                decoding="async"
                className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-white/5" />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white sm:p-7">
                <div>
                  <p className="text-xs font-semibold tracking-[.16em] text-white/60 uppercase">
                    {props.exampleLabel ?? 'Workflow example'}
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-6 font-medium">
                    {props.imageAlt}
                  </p>
                </div>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-black/25 backdrop-blur">
                  <Sparkles className="size-4" />
                </span>
              </figcaption>
            </div>
          </figure>
        </div>

        <div className="border-border bg-card/85 mt-10 grid overflow-hidden rounded-2xl border shadow-sm backdrop-blur sm:grid-cols-3">
          {[
            {
              icon: SlidersHorizontal,
              title: 'Controls that match the task',
              body: 'Only the inputs that affect this workflow are shown.',
            },
            {
              icon: ShieldCheck,
              title: 'Clear before you run',
              body: 'Model, availability, limits, and paid cost stay visible.',
            },
            {
              icon: Download,
              title: 'A usable result',
              body: 'Preview the output, then download or continue editing.',
            },
          ].map(({ icon: Icon, title, body }, index) => (
            <div
              key={title}
              className={cn(
                'flex gap-3 p-4 sm:p-5',
                index ? 'border-border border-t sm:border-t-0 sm:border-l' : ''
              )}
            >
              <Icon className="text-primary mt-0.5 size-4 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-muted-foreground mt-1 text-xs leading-5">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function GeneratorGuideSections(props: {
  title: string;
  description: string;
  outcomes: GeneratorStep[];
  steps: GeneratorStep[];
  tips: string[];
  limitation: string;
  faqs: GeneratorFaq[];
  related: GeneratorRelatedLink[];
}) {
  return (
    <>
      <section className="border-border bg-muted/25 border-y px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
              Designed around the result
            </p>
            <h2 className="mt-4 font-serif text-3xl tracking-tight sm:text-5xl">
              {props.title}
            </h2>
            <p className="text-muted-foreground mt-4 text-lg leading-8">
              {props.description}
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {props.outcomes.map((outcome, index) => (
              <article
                key={outcome.title}
                className="border-border bg-background rounded-[1.6rem] border p-6 shadow-sm"
              >
                <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl text-xs font-bold">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{outcome.title}</h3>
                <p className="text-muted-foreground mt-3 text-sm leading-7">
                  {outcome.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.72fr_1.28fr]">
          <div>
            <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
              A predictable workflow
            </p>
            <h2 className="mt-4 font-serif text-3xl tracking-tight sm:text-5xl">
              From input to finished file
            </h2>
            <p className="text-muted-foreground mt-4 leading-7">
              Each stage answers a practical question before the next action is
              available, so you can spot a wrong input before spending time or
              credits.
            </p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {props.steps.map((step, index) => (
              <li
                key={step.title}
                className="border-border bg-card rounded-2xl border p-5"
              >
                <span className="text-primary text-xs font-semibold tracking-[.15em]">
                  STEP {index + 1}
                </span>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-border border-y px-4 py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_.72fr]">
          <div>
            <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
              Get a cleaner first result
            </h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {props.tips.map((tip) => (
                <div
                  key={tip}
                  className="border-border bg-card flex gap-3 rounded-2xl border p-4 text-sm leading-6"
                >
                  <Lightbulb className="text-primary mt-0.5 size-4 shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
          <aside className="border-primary/20 bg-primary/5 self-start rounded-[1.75rem] border p-6 sm:p-8">
            <Info className="text-primary size-5" />
            <h2 className="mt-5 font-serif text-2xl tracking-tight">
              Know the boundary
            </h2>
            <p className="text-muted-foreground mt-4 text-sm leading-7">
              {props.limitation}
            </p>
          </aside>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[.65fr_1.35fr]">
            <div>
              <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
                Practical answers
              </p>
              <h2 className="mt-4 font-serif text-3xl tracking-tight sm:text-4xl">
                Questions before you start
              </h2>
            </div>
            <div className="grid gap-3">
              {props.faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="border-border bg-card group rounded-2xl border px-5 py-4"
                >
                  <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {faq.question}
                    <span className="bg-muted group-open:bg-primary group-open:text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full transition-colors">
                      +
                    </span>
                  </summary>
                  <p className="text-muted-foreground pt-3 pb-2 text-sm leading-7">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>

          <div className="mt-16 flex items-end justify-between gap-5">
            <div>
              <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
                Keep creating
              </p>
              <h2 className="mt-3 font-serif text-3xl tracking-tight">
                Useful next steps
              </h2>
            </div>
            <Link
              href="/tools"
              className="text-primary hidden text-sm font-semibold sm:inline-flex"
            >
              View all tools <ArrowRight className="ml-2 size-4" />
            </Link>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {props.related.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-border bg-card group overflow-hidden rounded-2xl border transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {item.image ? (
                  <div className="bg-muted aspect-[16/8] overflow-hidden">
                    <img
                      src={item.image}
                      alt=""
                      width={640}
                      height={320}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                ) : null}
                <div className="p-5">
                  <h3 className="flex items-center justify-between gap-3 font-semibold">
                    {item.title}
                    <ArrowRight className="text-primary size-4" />
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {item.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:pb-32">
        <div className="bg-foreground text-background mx-auto flex max-w-6xl flex-col gap-6 rounded-[2rem] px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div>
            <p className="text-xs font-semibold tracking-[.18em] uppercase opacity-55">
              Ready when you are
            </p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight">
              Start with one careful input. Refine from the result.
            </h2>
          </div>
          <a
            href="#generator"
            className="bg-background text-foreground inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold"
          >
            Open generator
            <ArrowRight className="size-4" />
          </a>
        </div>
      </section>
    </>
  );
}

export function GuideBullet({ children }: { children: ReactNode }) {
  return (
    <span className="flex gap-2 text-sm leading-6">
      <Check className="text-primary mt-1 size-3.5 shrink-0" />
      {children}
    </span>
  );
}
