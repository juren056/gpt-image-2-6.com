import { useState } from 'react';
import { ArrowRight, LayoutGrid, Sparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import type { ToolCatalogItem, ToolCategory } from '@/lib/tools';
import { cn } from '@/lib/utils';
import { ToolIcon } from '@/components/tool-icon';

type LaunchpadTool = ToolCatalogItem & {
  title: string;
  description: string;
};

type Category = 'all' | ToolCategory;

export function ToolLaunchpad({
  tools,
  copy,
}: {
  tools: LaunchpadTool[];
  copy: {
    eyebrow: string;
    title: string;
    description: string;
    all: string;
    image: string;
    video: string;
    edit: string;
    featured: string;
    new: string;
    preview: string;
    open: string;
    viewAll: string;
  };
}) {
  const [category, setCategory] = useState<Category>('all');
  const categories: Array<{ value: Category; label: string }> = [
    { value: 'all', label: copy.all },
    { value: 'image', label: copy.image },
    { value: 'video', label: copy.video },
    { value: 'edit', label: copy.edit },
  ];
  const visibleTools =
    category === 'all'
      ? tools
      : tools.filter((tool) => tool.category === category);

  return (
    <section
      aria-labelledby="tool-launchpad-title"
      className="border-border/70 bg-card/78 relative mb-6 overflow-hidden rounded-[1.5rem] border p-3 shadow-lg backdrop-blur sm:mb-8 sm:rounded-[2rem] sm:p-5"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_36%),radial-gradient(circle_at_88%_100%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_34%)]" />
      <div className="border-primary/10 text-primary pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.035]" />

      <div className="relative flex flex-col gap-4 px-1 pt-1 sm:px-2 sm:pt-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-primary flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] uppercase">
            <Sparkles className="size-3.5" />
            {copy.eyebrow}
          </p>
          <h2
            id="tool-launchpad-title"
            className="mt-2 font-serif text-2xl tracking-tight text-balance sm:text-3xl"
          >
            {copy.title}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-6">
            {copy.description}
          </p>
        </div>

        <div
          className="border-border bg-background/75 flex max-w-full gap-1 overflow-x-auto rounded-full border p-1 shadow-sm"
          role="tablist"
          aria-label={copy.title}
        >
          {categories.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={category === item.value}
              onClick={() => setCategory(item.value)}
              className={cn(
                'min-h-9 shrink-0 rounded-full px-3 text-xs font-semibold transition-colors sm:px-4',
                category === item.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-5">
        {visibleTools.map((tool) => {
          const featured = Boolean(tool.featured && category === 'all');
          return (
            <Link
              key={tool.kind}
              href={tool.href}
              aria-label={`${copy.open}: ${tool.title}`}
              className={cn(
                'group border-border/70 bg-background/86 hover:border-primary/35 hover:shadow-primary/10 focus-visible:ring-primary relative flex min-h-36 flex-col overflow-hidden rounded-2xl border p-3.5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:outline-none sm:min-h-40 sm:p-4',
                featured &&
                  'from-primary/14 via-background to-background col-span-2 min-h-48 bg-linear-to-br sm:min-h-52 lg:row-span-2 lg:min-h-0'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    'bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3',
                    featured && 'bg-primary text-primary-foreground size-11'
                  )}
                >
                  <ToolIcon
                    name={tool.icon}
                    className={featured ? 'size-5' : 'size-4'}
                  />
                </span>
                <span className="flex flex-wrap justify-end gap-1">
                  {featured ? (
                    <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-[9px] font-bold uppercase">
                      {copy.featured}
                    </span>
                  ) : null}
                  {tool.isNew ? (
                    <span className="rounded-full bg-amber-300/25 px-2 py-1 text-[9px] font-bold text-amber-700 uppercase dark:text-amber-300">
                      {copy.new}
                    </span>
                  ) : null}
                  {tool.isPreview ? (
                    <span className="rounded-full bg-sky-400/12 px-2 py-1 text-[9px] font-bold text-sky-700 uppercase dark:text-sky-300">
                      {copy.preview}
                    </span>
                  ) : null}
                </span>
              </div>

              <div className="mt-auto pt-5">
                <h3
                  className={cn(
                    'text-sm leading-tight font-semibold text-balance sm:text-base',
                    featured && 'font-serif text-2xl tracking-tight sm:text-3xl'
                  )}
                >
                  {tool.title}
                </h3>
                <p
                  className={cn(
                    'text-muted-foreground mt-2 line-clamp-2 text-xs leading-5',
                    featured && 'max-w-sm text-sm leading-6 sm:line-clamp-3'
                  )}
                >
                  {tool.description}
                </p>
                <span className="text-primary mt-3 inline-flex items-center gap-1 text-xs font-semibold">
                  {copy.open}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="relative mt-3 flex justify-end">
        <Link
          href="/tools"
          className="text-muted-foreground hover:text-primary inline-flex min-h-10 items-center gap-2 px-2 text-xs font-semibold transition-colors"
        >
          <LayoutGrid className="size-4" />
          {copy.viewAll}
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}
