import type { ReactNode } from 'react';
import { ArrowRight, CheckCircle2, ExternalLink, Info } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type SeoGuideSection = {
  heading: string;
  body: string;
  bullets?: string[];
};

export type SeoGuideFaq = {
  question: string;
  answer: string;
};

export type SeoGuideLink = {
  href: string;
  label: string;
};

export type SeoGuideVisual = {
  src: string;
  alt: string;
  eyebrow: string;
  title: string;
  caption: string;
  disclosure: string;
};

export type SeoGuidePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  status: string;
  statusLabel: string;
  sources?: SeoGuideLink[];
  visual?: SeoGuideVisual;
  sections: SeoGuideSection[];
  faqTitle: string;
  faqs: SeoGuideFaq[];
  relatedTitle: string;
  relatedLinks: SeoGuideLink[];
  allGuidesLabel: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaButton: string;
  ctaSecondaryButton: string;
  afterHero?: ReactNode;
};

export function SeoGuidePage({
  eyebrow,
  title,
  description,
  status,
  statusLabel,
  sources = [],
  visual,
  sections,
  faqTitle,
  faqs,
  relatedTitle,
  relatedLinks,
  allGuidesLabel,
  ctaTitle,
  ctaDescription,
  ctaButton,
  ctaSecondaryButton,
  afterHero,
}: SeoGuidePageProps) {
  return (
    <main className="flex-1">
      <section className="border-border border-b px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-[1.05] tracking-tight text-balance sm:text-6xl">
            {title}
          </h1>
          <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-relaxed">
            {description}
          </p>
          <div className="border-border bg-muted/40 mt-8 flex max-w-2xl gap-3 rounded-2xl border p-4">
            <Info className="text-primary mt-0.5 size-5 shrink-0" />
            <div>
              <p className="text-sm font-medium">{statusLabel}</p>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                {status}
              </p>
              {sources.length ? (
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                  {sources.map((source) => (
                    <a
                      key={source.href}
                      href={source.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-primary inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
                    >
                      {source.label}
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {afterHero}

      {visual ? (
        <section className="px-4 pt-12 sm:pt-16">
          <figure className="border-border bg-card mx-auto max-w-5xl overflow-hidden rounded-[2rem] border shadow-sm">
            <div className="bg-muted aspect-video overflow-hidden">
              <img
                src={visual.src}
                alt={visual.alt}
                width={1440}
                height={810}
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
              />
            </div>
            <figcaption className="grid gap-5 p-6 sm:p-8 md:grid-cols-[1fr_1.4fr] md:items-start">
              <div>
                <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
                  {visual.eyebrow}
                </p>
                <h2 className="mt-3 font-serif text-2xl tracking-tight sm:text-3xl">
                  {visual.title}
                </h2>
              </div>
              <div>
                <p className="text-muted-foreground text-sm leading-6 sm:text-base sm:leading-7">
                  {visual.caption}
                </p>
                <p className="border-primary/20 bg-primary/5 text-muted-foreground mt-4 rounded-xl border px-4 py-3 text-xs leading-5">
                  {visual.disclosure}
                </p>
              </div>
            </figcaption>
          </figure>
        </section>
      ) : null}

      <section className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl space-y-16">
          {sections.map((section, index) => (
            <article
              key={section.heading}
              className="grid gap-6 md:grid-cols-[48px_1fr]"
            >
              <span className="border-border bg-card flex size-12 items-center justify-center rounded-2xl border text-sm font-semibold tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h2 className="font-serif text-3xl tracking-tight">
                  {section.heading}
                </h2>
                <p className="text-muted-foreground mt-4 leading-7">
                  {section.body}
                </p>
                {section.bullets?.length ? (
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="border-border bg-card flex gap-3 rounded-2xl border p-4 text-sm leading-relaxed"
                      >
                        <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-border border-t px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            {faqTitle}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="border-border bg-card group rounded-2xl border p-5"
              >
                <summary className="flex min-h-10 cursor-pointer list-none items-center pr-4 font-semibold">
                  {faq.question}
                </summary>
                <p className="text-muted-foreground mt-3 text-sm leading-6">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
          <h2 className="mt-16 font-serif text-3xl tracking-tight">
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
          <Link
            href="/guides"
            className="text-primary mt-7 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
          >
            {allGuidesLabel}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="px-4 pb-24 sm:pb-32">
        <div className="bg-foreground text-background mx-auto max-w-4xl rounded-[2rem] px-6 py-10 sm:px-10 sm:py-12">
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            {ctaTitle}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed opacity-70 sm:text-base">
            {ctaDescription}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/#generator"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'bg-background text-foreground hover:bg-background/90 rounded-full'
              )}
            >
              {ctaButton}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/pricing"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'border-background/30 text-background hover:bg-background/10 hover:text-background rounded-full bg-transparent'
              )}
            >
              {ctaSecondaryButton}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
