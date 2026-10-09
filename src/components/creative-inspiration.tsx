import { useState } from 'react';
import { ArrowUpRight, WandSparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { APPLY_GENERATOR_PROMPT_EVENT } from '@/lib/homepage-events';
import type { CreativeHomeTool } from '@/components/creative-home-shell';
import { ToolIcon } from '@/components/tool-icon';

export function CreativeInspiration({
  title,
  description,
  usePrompt,
  allTools,
  toolsTitle,
  cards,
  tools,
  filters,
}: {
  title: string;
  description: string;
  usePrompt: string;
  allTools: string;
  toolsTitle: string;
  cards: { image: string; title: string; prompt: string; category: string }[];
  tools: CreativeHomeTool[];
  filters: { value: string; label: string }[];
}) {
  const [category, setCategory] = useState('all');
  const visible =
    category === 'all'
      ? cards
      : cards.filter((card) => card.category === category);
  function apply(prompt: string) {
    window.dispatchEvent(
      new CustomEvent(APPLY_GENERATOR_PROMPT_EVENT, { detail: { prompt } })
    );
    document.getElementById('generator')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'start',
    });
  }
  return (
    <>
      <section
        id="gallery"
        className="scroll-mt-20 py-10"
        aria-labelledby="inspiration-title"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="inspiration-title"
              className="text-2xl font-semibold tracking-tight"
            >
              {title}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">{description}</p>
          </div>
          <div className="flex flex-wrap gap-1" role="group" aria-label={title}>
            {filters.map((filter) => (
              <button
                key={filter.value}
                aria-pressed={category === filter.value}
                onClick={() => setCategory(filter.value)}
                className={`min-h-10 rounded-full px-4 text-xs font-medium transition-colors ${category === filter.value ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visible.map((card) => (
            <button
              key={card.title}
              onClick={() => apply(card.prompt)}
              className="group bg-muted focus-visible:outline-primary relative overflow-hidden rounded-2xl text-left focus-visible:outline-2 focus-visible:outline-offset-4"
              aria-label={`${usePrompt}: ${card.title}`}
            >
              <img
                src={card.image}
                alt={card.title}
                loading="lazy"
                width={480}
                height={360}
                className="aspect-[4/3] w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pt-14 pb-4 text-white">
                <span className="block text-sm font-semibold">
                  {card.title}
                </span>
                <span className="mt-1.5 flex items-center gap-1 text-xs text-white/80">
                  <WandSparkles className="size-3" />
                  {usePrompt}
                  <ArrowUpRight className="ml-auto size-4" />
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>
      <section
        className="border-border border-t py-8"
        aria-labelledby="creative-tools-title"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="creative-tools-title" className="text-xl font-semibold">
            {toolsTitle}
          </h2>
          <Link
            href="/tools"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
          >
            {allTools}
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tools
            .filter((tool) => !tool.isPreview)
            .slice(1, 7)
            .map((tool) => (
              <Link
                href={tool.href}
                key={tool.kind}
                className="border-border bg-card hover:border-primary/50 group flex items-start gap-3 rounded-2xl border p-4 transition-colors"
              >
                <span className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <ToolIcon name={tool.icon} className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">
                    {tool.title}
                  </span>
                  <span className="text-muted-foreground mt-1 block text-xs leading-5">
                    {tool.description}
                  </span>
                </span>
                <ArrowUpRight className="text-muted-foreground ml-auto size-4 shrink-0" />
              </Link>
            ))}
        </div>
      </section>
    </>
  );
}
