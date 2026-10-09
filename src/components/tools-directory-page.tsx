import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Search, Sparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import type { CreativeToolId } from '@/config/creative-tools';
import type {
  ToolCategory,
  ToolInput,
  ToolOutput,
  ToolPricing,
} from '@/lib/tools';
import { cn } from '@/lib/utils';
import { CreativeToolTile } from '@/components/creative-visuals';

export type ToolsDirectoryItem = {
  href: string;
  image: string;
  title: string;
  description: string;
  features: string[];
  action: string;
  alt: string;
  category: ToolCategory;
  input: ToolInput[];
  output: ToolOutput;
  pricing: ToolPricing;
  keywords: string[];
  popular?: boolean;
  isNew?: boolean;
  isPreview?: boolean;
  directoryRank: number;
  creativeToolId?: CreativeToolId;
};

type CategoryFilter = 'all' | ToolCategory;
type StatusFilter = 'all' | 'popular' | 'new';

type DirectoryCopy = {
  searchPlaceholder: string;
  categoryAll: string;
  categoryImage: string;
  categoryVideo: string;
  categoryEdit: string;
  filterAll: string;
  filterPopular: string;
  filterNew: string;
  pricingFixed: string;
  pricingRange: string;
  pricingPreview: string;
  inputPrompt: string;
  inputImage: string;
  inputVideo: string;
  outputImage: string;
  outputVideo: string;
  noResultsTitle: string;
  noResultsDescription: string;
};

function pricingLabel(pricing: ToolPricing, copy: DirectoryCopy) {
  if (pricing.type === 'preview') return copy.pricingPreview;
  if (pricing.type === 'fixed') {
    return copy.pricingFixed.replace('{credits}', String(pricing.credits));
  }
  return copy.pricingRange
    .replace('{min}', String(pricing.minCredits))
    .replace('{max}', String(pricing.maxCredits));
}

export function ToolsDirectoryPage({
  eyebrow,
  title,
  description,
  principleTitle,
  principleDescription,
  items,
  copy,
}: {
  eyebrow: string;
  title: string;
  description: string;
  principleTitle: string;
  principleDescription: string;
  items: ToolsDirectoryItem[];
  copy: DirectoryCopy;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const categoryLabels: Record<CategoryFilter, string> = {
    all: copy.categoryAll,
    image: copy.categoryImage,
    video: copy.categoryVideo,
    edit: copy.categoryEdit,
  };
  const inputLabels: Record<ToolInput, string> = {
    prompt: copy.inputPrompt,
    image: copy.inputImage,
    video: copy.inputVideo,
  };
  const outputLabels: Record<ToolOutput, string> = {
    image: copy.outputImage,
    video: copy.outputVideo,
  };

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return items
      .filter((item) => category === 'all' || item.category === category)
      .filter(
        (item) =>
          status === 'all' ||
          (status === 'popular' && item.popular) ||
          (status === 'new' && item.isNew)
      )
      .filter((item) => {
        if (!normalizedQuery) return true;
        return [item.title, item.description, ...item.keywords]
          .join(' ')
          .toLocaleLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => a.directoryRank - b.directoryRank);
  }, [category, items, query, status]);

  return (
    <main className="flex-1 px-4 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-5 font-serif text-4xl leading-[1.04] tracking-tight text-balance sm:text-6xl">
            {title}
          </h1>
          <p className="text-muted-foreground mt-6 max-w-3xl text-lg leading-8">
            {description}
          </p>
        </div>

        <section
          aria-label={title}
          className="border-border bg-card/80 mt-10 rounded-[1.75rem] border p-3 shadow-sm sm:p-5"
        >
          <label className="relative block">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="border-border bg-background focus:border-primary/45 focus:ring-primary/12 h-12 w-full rounded-2xl border pr-4 pl-11 text-sm shadow-sm outline-none focus:ring-2"
            />
          </label>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex max-w-full gap-1 overflow-x-auto rounded-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(Object.keys(categoryLabels) as CategoryFilter[]).map(
                (value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    className={cn(
                      'min-h-9 shrink-0 rounded-full px-4 text-xs font-semibold transition-colors',
                      category === value
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {categoryLabels[value]}
                  </button>
                )
              )}
            </div>

            <div className="border-border bg-background flex w-fit gap-1 rounded-full border p-1">
              {(
                [
                  ['all', copy.filterAll],
                  ['popular', copy.filterPopular],
                  ['new', copy.filterNew],
                ] as Array<[StatusFilter, string]>
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className={cn(
                    'min-h-8 rounded-full px-3 text-[11px] font-semibold transition-colors',
                    status === value
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {visibleItems.length ? (
          <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item) => (
              <article
                key={item.href}
                className="group border-border bg-card overflow-hidden rounded-[1.75rem] border shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <Link
                  href={item.href}
                  className="bg-muted relative block aspect-[16/10] overflow-hidden"
                >
                  <img
                    src={item.image}
                    alt={item.alt}
                    width={1200}
                    height={750}
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {item.popular ? (
                      <span className="rounded-full bg-white/92 px-2.5 py-1 text-[9px] font-bold text-slate-900 uppercase shadow-sm backdrop-blur">
                        {copy.filterPopular}
                      </span>
                    ) : null}
                    {item.isNew ? (
                      <span className="rounded-full bg-amber-300 px-2.5 py-1 text-[9px] font-bold text-amber-950 uppercase shadow-sm">
                        {copy.filterNew}
                      </span>
                    ) : null}
                  </div>
                  <span className="absolute right-3 bottom-3 rounded-full bg-black/65 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur">
                    {pricingLabel(item.pricing, copy)}
                  </span>
                  {item.creativeToolId ? (
                    <CreativeToolTile
                      toolId={item.creativeToolId}
                      className="absolute bottom-3 left-3 bg-white/95 shadow-sm backdrop-blur dark:bg-slate-950/90"
                    />
                  ) : null}
                </Link>

                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold tracking-wide uppercase">
                    <span className="text-primary">
                      {categoryLabels[item.category]}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {item.input
                        .map((input) => inputLabels[input])
                        .join(' + ')}
                      {' → '}
                      {outputLabels[item.output]}
                    </span>
                  </div>
                  <h2 className="mt-3 font-serif text-2xl tracking-tight">
                    {item.title}
                  </h2>
                  <p className="text-muted-foreground mt-3 line-clamp-3 text-sm leading-6">
                    {item.description}
                  </p>

                  {item.features.length ? (
                    <ul className="mt-5 grid gap-2">
                      {item.features.slice(0, 3).map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-xs leading-5"
                        >
                          <CheckCircle2 className="text-primary mt-0.5 size-3.5 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <Link
                    href={item.href}
                    className="text-primary mt-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
                  >
                    {item.action}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="border-border bg-muted/25 mt-8 flex min-h-72 flex-col items-center justify-center rounded-[1.75rem] border border-dashed px-6 text-center">
            <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl">
              <Sparkles className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">
              {copy.noResultsTitle}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {copy.noResultsDescription}
            </p>
          </section>
        )}

        <section className="border-border bg-muted/30 mt-12 rounded-[2rem] border p-6 sm:p-8">
          <h2 className="font-serif text-3xl tracking-tight">
            {principleTitle}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-4xl leading-7">
            {principleDescription}
          </p>
        </section>
      </div>
    </main>
  );
}
