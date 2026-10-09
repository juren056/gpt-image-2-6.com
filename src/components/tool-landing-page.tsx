import {
  ArrowRight,
  CheckCircle2,
  Info,
  Lightbulb,
  Sparkles,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import type { ScenarioToolKind } from '@/lib/tools';
import { cn } from '@/lib/utils';
import {
  ScenarioGeneratorWorkspace,
  type ScenarioGeneratorCopy,
} from '@/components/scenario-generator-workspace';
import { buttonVariants } from '@/components/ui/button';

export type ToolFaq = {
  question: string;
  answer: string;
};

export type ToolLandingPageProps = {
  kind: ScenarioToolKind;
  path: string;
  image: string;
  eyebrow: string;
  title: string;
  description: string;
  trustNote: string;
  breadcrumbHome: string;
  breadcrumbTools: string;
  showcaseAlt: string;
  showcaseCaption: string;
  showcaseDisclosure: string;
  generatorTitle: string;
  generatorDescription: string;
  generatorCopy: ScenarioGeneratorCopy;
  outcomesTitle: string;
  outcomesDescription: string;
  outcomes: Array<{ title: string; description: string }>;
  workflowTitle: string;
  workflowDescription: string;
  steps: Array<{ title: string; description: string }>;
  promptsTitle: string;
  promptsDescription: string;
  prompts: Array<{ title: string; prompt: string }>;
  guidanceTitle: string;
  guidanceDescription: string;
  tips: string[];
  limitationTitle: string;
  limitation: string;
  faqTitle: string;
  faqs: ToolFaq[];
  relatedTitle: string;
  relatedLinks: Array<{ href: string; label: string }>;
  ctaTitle: string;
  ctaDescription: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

export function ToolLandingPage({
  kind,
  path,
  image,
  eyebrow,
  title,
  description,
  trustNote,
  breadcrumbHome,
  breadcrumbTools,
  showcaseAlt,
  showcaseCaption,
  showcaseDisclosure,
  generatorTitle,
  generatorDescription,
  generatorCopy,
  outcomesTitle,
  outcomesDescription,
  outcomes,
  workflowTitle,
  workflowDescription,
  steps,
  promptsTitle,
  promptsDescription,
  prompts,
  guidanceTitle,
  guidanceDescription,
  tips,
  limitationTitle,
  limitation,
  faqTitle,
  faqs,
  relatedTitle,
  relatedLinks,
  ctaTitle,
  ctaDescription,
  ctaPrimary,
  ctaSecondary,
}: ToolLandingPageProps) {
  return (
    <main className="flex-1">
      <section className="border-border overflow-hidden border-b px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <nav
            aria-label="Breadcrumb"
            className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs"
          >
            <Link href="/" className="hover:text-foreground">
              {breadcrumbHome}
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/tools" className="hover:text-foreground">
              {breadcrumbTools}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">{eyebrow}</span>
          </nav>

          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1fr_.9fr]">
            <div>
              <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
                {eyebrow}
              </p>
              <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-[1.03] tracking-tight text-balance sm:text-6xl">
                {title}
              </h1>
              <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-8">
                {description}
              </p>
              <div className="border-border bg-muted/35 mt-7 flex max-w-2xl items-start gap-3 rounded-2xl border p-4">
                <Info className="text-primary mt-0.5 size-4 shrink-0" />
                <p className="text-muted-foreground text-sm leading-6">
                  {trustNote}
                </p>
              </div>
              <a
                href="#generator"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'mt-8 rounded-full px-7'
                )}
              >
                {ctaPrimary}
                <ArrowRight className="size-4" />
              </a>
            </div>

            <figure className="border-border bg-card overflow-hidden rounded-[2rem] border shadow-lg">
              <div className="bg-muted aspect-[4/3] overflow-hidden">
                <img
                  src={image}
                  alt={showcaseAlt}
                  width={1200}
                  height={800}
                  fetchPriority="high"
                  decoding="async"
                  className="size-full object-cover"
                />
              </div>
              <figcaption className="p-5">
                <p className="text-sm font-medium">{showcaseCaption}</p>
                <p className="text-muted-foreground mt-1 text-xs leading-5">
                  {showcaseDisclosure}
                </p>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section id="generator" className="scroll-mt-24 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-9 max-w-3xl text-center">
            <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
              {eyebrow}
            </p>
            <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
              {generatorTitle}
            </h2>
            <p className="text-muted-foreground mt-4 leading-7">
              {generatorDescription}
            </p>
          </div>
          <ScenarioGeneratorWorkspace kind={kind} copy={generatorCopy} />
        </div>
      </section>

      <section className="border-border bg-muted/25 border-y px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
              {outcomesTitle}
            </h2>
            <p className="text-muted-foreground mt-4 leading-7">
              {outcomesDescription}
            </p>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {outcomes.map((outcome) => (
              <article
                key={outcome.title}
                className="border-border bg-background rounded-2xl border p-6"
              >
                <CheckCircle2 className="text-primary size-5" />
                <h3 className="mt-5 text-lg font-semibold">{outcome.title}</h3>
                <p className="text-muted-foreground mt-3 text-sm leading-6">
                  {outcome.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
                {workflowTitle}
              </h2>
              <p className="text-muted-foreground mt-4 leading-7">
                {workflowDescription}
              </p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2">
              {steps.map((step, index) => (
                <li
                  key={step.title}
                  className="border-border bg-card rounded-2xl border p-5"
                >
                  <span className="text-primary text-xs font-semibold tracking-[0.16em]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-3 font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-border border-y px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
              {promptsTitle}
            </h2>
            <p className="text-muted-foreground mt-4 leading-7">
              {promptsDescription}
            </p>
          </div>
          <div className="mt-9 grid gap-4 lg:grid-cols-3">
            {prompts.map((example) => (
              <article
                key={example.title}
                className="border-border bg-card rounded-2xl border p-6"
              >
                <Sparkles className="text-primary size-4" />
                <h3 className="mt-4 font-semibold">{example.title}</h3>
                <p className="text-muted-foreground mt-3 text-sm leading-6">
                  {example.prompt}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_.8fr]">
          <div>
            <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
              {guidanceTitle}
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl leading-7">
              {guidanceDescription}
            </p>
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {tips.map((tip) => (
                <li
                  key={tip}
                  className="border-border bg-card flex gap-3 rounded-2xl border p-4 text-sm leading-6"
                >
                  <Lightbulb className="text-primary mt-0.5 size-4 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          <aside className="border-primary/20 bg-primary/5 self-start rounded-[1.75rem] border p-6 sm:p-8">
            <h2 className="font-serif text-2xl tracking-tight">
              {limitationTitle}
            </h2>
            <p className="text-muted-foreground mt-4 text-sm leading-7">
              {limitation}
            </p>
          </aside>
        </div>
      </section>

      <section className="border-border border-t px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            {faqTitle}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="border-border bg-card rounded-2xl border p-5"
              >
                <summary className="flex min-h-10 cursor-pointer list-none items-center font-semibold">
                  {faq.question}
                </summary>
                <p className="text-muted-foreground mt-3 text-sm leading-6">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>

          <h2 className="mt-14 font-serif text-3xl tracking-tight">
            {relatedTitle}
          </h2>
          <nav className="mt-6 flex flex-wrap gap-3" aria-label={relatedTitle}>
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-border hover:border-primary/40 hover:text-primary rounded-full border px-4 py-2 text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section className="px-4 pb-24 sm:pb-32">
        <div className="bg-foreground text-background mx-auto max-w-5xl rounded-[2rem] px-6 py-10 sm:px-10 sm:py-12">
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            {ctaTitle}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 opacity-75 sm:text-base">
            {ctaDescription}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#generator"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'bg-background text-foreground hover:bg-background/90 rounded-full'
              )}
            >
              {ctaPrimary}
              <ArrowRight className="size-4" />
            </a>
            <Link
              href="/tools"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'border-background/30 text-background hover:bg-background/10 hover:text-background rounded-full bg-transparent'
              )}
            >
              {ctaSecondary}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
