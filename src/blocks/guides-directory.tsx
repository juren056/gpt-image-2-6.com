import { ArrowRight, BookOpenText, Code2, Scale, Sparkles } from 'lucide-react';

import { tDynamic } from '@/core/i18n/dynamic';
import { Link } from '@/core/i18n/navigation';
import {
  GUIDE_CATALOG,
  type GuideCatalogItem,
  type GuideCategory,
} from '@/lib/guides';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { buttonVariants } from '@/components/ui/button';
import { QWEN_LANDING_PAGES } from '@/content/qwen-landing-pages';

const CATEGORY_ICONS = {
  creator: Sparkles,
  technical: Code2,
  research: Scale,
} satisfies Record<GuideCategory, typeof Sparkles>;

function GuideCard({
  guide,
  featured = false,
}: {
  guide: GuideCatalogItem;
  featured?: boolean;
}) {
  return (
    <article
      className={cn(
        'border-border bg-card group overflow-hidden rounded-[1.75rem] border transition-shadow hover:shadow-lg',
        featured && 'md:grid md:grid-cols-[1.15fr_1fr]'
      )}
    >
      <Link
        href={guide.path}
        aria-label={m[`seo.${guide.kind}.title`]()}
        className="bg-muted block aspect-video overflow-hidden"
      >
        <img
          src={guide.image}
          alt={m[`seo.${guide.kind}.visual_alt`]()}
          width={1440}
          height={810}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </Link>
      <div className={cn('p-6 sm:p-7', featured && 'md:self-center md:p-9')}>
        <p className="text-primary text-xs font-semibold tracking-[0.16em] uppercase">
          {m['guides.card_label']()}
        </p>
        <h3
          className={cn(
            'mt-3 font-serif text-2xl leading-tight tracking-tight',
            featured && 'sm:text-3xl'
          )}
        >
          <Link href={guide.path} className="hover:text-primary">
            {m[`seo.${guide.kind}.title`]()}
          </Link>
        </h3>
        <p className="text-muted-foreground mt-4 text-sm leading-6">
          {m[`seo.${guide.kind}.description`]()}
        </p>
        <Link
          href={guide.path}
          className="text-primary mt-5 inline-flex items-center gap-2 text-sm font-semibold"
        >
          {m['guides.read_guide']()}
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>
    </article>
  );
}

function CategorySection({
  category,
  featured = false,
}: {
  category: GuideCategory;
  featured?: boolean;
}) {
  const Icon = CATEGORY_ICONS[category];
  const guides = GUIDE_CATALOG.filter((guide) => guide.category === category);

  return (
    <section className="py-14 sm:py-18">
      <div className="mb-8 flex max-w-3xl items-start gap-4">
        <span className="border-border bg-card text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl border">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            {m[`guides.${category}.title`]()}
          </h2>
          <p className="text-muted-foreground mt-3 leading-7">
            {m[`guides.${category}.description`]()}
          </p>
        </div>
      </div>
      <div
        className={cn(
          featured ? 'grid gap-6' : 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
        )}
      >
        {guides.map((guide) => (
          <GuideCard key={guide.kind} guide={guide} featured={featured} />
        ))}
      </div>
    </section>
  );
}

export function GuidesDirectory() {
  const locale = getLocale();
  const workflowPages = QWEN_LANDING_PAGES.filter(
    (page) => page.slug !== 'qwen-image-3-standard-vs-pro'
  );

  return (
    <main className="flex-1">
      <section className="border-border border-b px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl text-center">
          <div className="border-border bg-card text-primary mx-auto flex size-12 items-center justify-center rounded-2xl border">
            <BookOpenText className="size-5" aria-hidden="true" />
          </div>
          <p className="text-primary mt-6 text-xs font-semibold tracking-[0.2em] uppercase">
            {m['guides.eyebrow']()}
          </p>
          <h1 className="mx-auto mt-5 max-w-4xl font-serif text-4xl leading-[1.05] tracking-tight text-balance sm:text-6xl">
            {m['guides.title']()}
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed">
            {m['guides.description']()}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <CategorySection category="creator" />
        <CategorySection category="technical" />
        <CategorySection category="research" featured />
        {locale === 'en' ? (
          <section
            className="py-14 sm:py-18"
            aria-labelledby="workflow-guides-title"
          >
            <div className="mb-8 max-w-3xl">
              <p className="text-primary text-xs font-semibold tracking-[0.16em] uppercase">
                Focused workflows
              </p>
              <h2
                id="workflow-guides-title"
                className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl"
              >
                Qwen Image 3 task guides
              </h2>
              <p className="text-muted-foreground mt-3 leading-7">
                Choose the workflow that matches the result you need. Each page
                focuses on one task, one search intent, and one practical route
                into the generator.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workflowPages.map((page) => (
                <article
                  key={page.slug}
                  className="border-border bg-card rounded-2xl border p-6"
                >
                  <h3 className="font-serif text-xl tracking-tight">
                    <Link href={'/' + page.slug} className="hover:text-primary">
                      {page.title}
                    </Link>
                  </h3>
                  <p className="text-muted-foreground mt-3 line-clamp-3 text-sm leading-6">
                    {page.description}
                  </p>
                  <Link
                    href={'/' + page.slug}
                    className="text-primary mt-5 inline-flex items-center gap-2 text-sm font-semibold"
                  >
                    Open workflow
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <section className="border-border border-y px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
            {m['guides.path.eyebrow']()}
          </p>
          <h2 className="mt-3 max-w-2xl font-serif text-3xl tracking-tight sm:text-4xl">
            {m['guides.path.title']()}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((step) => (
              <article
                key={step}
                className="border-border bg-card rounded-2xl border p-6"
              >
                <span className="text-primary text-sm font-semibold tabular-nums">
                  0{step}
                </span>
                <h3 className="mt-4 font-serif text-xl tracking-tight">
                  {tDynamic(`guides.path.step_${step}_title`)}
                </h3>
                <p className="text-muted-foreground mt-3 text-sm leading-6">
                  {tDynamic(`guides.path.step_${step}_body`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:py-24">
        <div className="bg-foreground text-background mx-auto max-w-5xl rounded-[2rem] px-6 py-10 sm:px-10 sm:py-12">
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            {m['guides.cta.title']()}
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed opacity-70">
            {m['guides.cta.description']()}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/#generator"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'bg-background text-foreground hover:bg-background/90 rounded-full'
              )}
            >
              {m['guides.cta.generator']()}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/pricing"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'border-background/30 text-background hover:bg-background/10 hover:text-background rounded-full bg-transparent'
              )}
            >
              {m['guides.cta.pricing']()}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
