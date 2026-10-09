import type { ReactNode } from 'react';
import { ArrowRight, LayoutGrid, Menu, Sparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import type { ToolCatalogItem, ToolCategory } from '@/lib/tools';
import { cn } from '@/lib/utils';
import { ToolIcon } from '@/components/tool-icon';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

type MarketplaceTool = ToolCatalogItem & {
  title: string;
  description: string;
};

type MarketplaceCopy = {
  title: string;
  description: string;
  browseTools: string;
  currentTool: string;
  image: string;
  video: string;
  edit: string;
  popular: string;
  new: string;
  preview: string;
  credits: string;
  creditRange: string;
  pricingPreview: string;
  allTools: string;
};

const CATEGORY_ORDER: ToolCategory[] = ['image', 'video', 'edit'];

function pricingLabel(tool: MarketplaceTool, copy: MarketplaceCopy) {
  if (tool.pricing.type === 'preview') return copy.pricingPreview;
  if (tool.pricing.type === 'fixed') {
    return copy.credits.replace('{credits}', String(tool.pricing.credits));
  }
  return copy.creditRange
    .replace('{min}', String(tool.pricing.minCredits))
    .replace('{max}', String(tool.pricing.maxCredits));
}

function ToolNavigation({
  tools,
  activeKind,
  copy,
}: {
  tools: MarketplaceTool[];
  activeKind: ToolCatalogItem['kind'];
  copy: MarketplaceCopy;
}) {
  const categoryLabels: Record<ToolCategory, string> = {
    image: copy.image,
    video: copy.video,
    edit: copy.edit,
  };

  return (
    <nav aria-label={copy.browseTools} className="space-y-5">
      {CATEGORY_ORDER.map((category) => {
        const categoryTools = tools
          .filter((tool) => tool.category === category)
          .sort((a, b) => a.homepageRank - b.homepageRank);
        if (!categoryTools.length) return null;

        return (
          <div key={category}>
            <p className="text-muted-foreground px-2 text-[10px] font-bold tracking-[0.16em] uppercase">
              {categoryLabels[category]}
            </p>
            <div className="mt-2 space-y-1">
              {categoryTools.map((tool) => {
                const active = tool.kind === activeKind;
                return (
                  <Link
                    key={tool.kind}
                    href={tool.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group flex min-h-12 items-center gap-3 rounded-xl border px-2.5 py-2 transition-colors',
                      active
                        ? 'border-primary/25 bg-primary/9 text-foreground shadow-sm'
                        : 'text-muted-foreground hover:border-border hover:bg-background/80 hover:text-foreground border-transparent'
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/9 text-primary group-hover:bg-primary/14'
                      )}
                    >
                      <ToolIcon name={tool.icon} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-semibold">
                          {tool.title}
                        </span>
                        {tool.isNew ? (
                          <span className="rounded-full bg-amber-300/20 px-1.5 py-0.5 text-[8px] font-bold text-amber-700 uppercase dark:text-amber-300">
                            {copy.new}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] opacity-70">
                        {pricingLabel(tool, copy)}
                      </span>
                    </span>
                    {active ? (
                      <span className="bg-primary size-1.5 shrink-0 rounded-full" />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      <Link
        href="/tools"
        className="border-border bg-background hover:border-primary/35 hover:text-primary flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-colors"
      >
        <LayoutGrid className="size-4" />
        {copy.allTools}
        <ArrowRight className="size-3.5" />
      </Link>
    </nav>
  );
}

export function ToolMarketplaceShell({
  tools,
  activeKind,
  copy,
  children,
  compact = false,
}: {
  tools: MarketplaceTool[];
  activeKind: ToolCatalogItem['kind'];
  copy: MarketplaceCopy;
  children: ReactNode;
  compact?: boolean;
}) {
  const currentTool = tools.find((tool) => tool.kind === activeKind);

  return (
    <section
      aria-labelledby="marketplace-title"
      className="border-border/70 bg-card/76 relative overflow-hidden rounded-[1.5rem] border shadow-2xl backdrop-blur sm:rounded-[2rem]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_30%),radial-gradient(circle_at_92%_100%,color-mix(in_oklab,var(--primary)_9%,transparent),transparent_28%)]" />

      {!compact ? (
        <div className="border-border/70 bg-background/55 relative flex flex-col gap-4 border-b px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-primary flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] uppercase">
              <Sparkles className="size-3.5" />
              {copy.currentTool}
            </p>
            <h2
              id="marketplace-title"
              className="mt-1.5 font-serif text-2xl tracking-tight sm:text-3xl"
            >
              {copy.title}
            </h2>
            <p className="text-muted-foreground mt-1.5 max-w-xl text-xs leading-5 sm:text-sm">
              {copy.description}
            </p>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <Sheet>
              <SheetTrigger className="border-border bg-background hover:bg-accent flex min-h-11 flex-1 items-center justify-between gap-3 rounded-xl border px-3 text-sm font-semibold shadow-sm">
                <span className="flex min-w-0 items-center gap-2.5">
                  <Menu className="size-4 shrink-0" />
                  <span className="truncate">
                    {currentTool?.title ?? copy.browseTools}
                  </span>
                </span>
                <span className="text-muted-foreground text-xs font-normal">
                  {copy.browseTools}
                </span>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(22rem,88vw)] p-0">
                <SheetHeader className="border-border border-b px-5 py-5">
                  <SheetTitle>{copy.browseTools}</SheetTitle>
                  <SheetDescription>{copy.description}</SheetDescription>
                </SheetHeader>
                <div className="overflow-y-auto px-3 py-4">
                  <ToolNavigation
                    tools={tools}
                    activeKind={activeKind}
                    copy={copy}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          'relative grid min-w-0',
          !compact && 'lg:grid-cols-[17rem_minmax(0,1fr)]'
        )}
      >
        {!compact ? (
          <aside className="border-border/70 bg-muted/20 hidden border-r p-3 lg:block">
            <ToolNavigation tools={tools} activeKind={activeKind} copy={copy} />
          </aside>
        ) : null}
        <div className={cn('min-w-0', !compact && 'p-2 sm:p-4 lg:p-5')}>
          {children}
        </div>
      </div>
    </section>
  );
}
