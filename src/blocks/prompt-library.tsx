import { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  Clapperboard,
  Copy,
  ImageIcon,
  Search,
  Sparkles,
  WandSparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { tDynamic } from '@/core/i18n/dynamic';
import { Link } from '@/core/i18n/navigation';
import { trackFunnelEvent } from '@/lib/analytics-events';
import { publicRecipeHref } from '@/lib/generator-entry';
import { stageVideoPrompt } from '@/lib/prompt-navigation';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { HOMEPAGE_PROMPTS } from '@/content/homepage-prompts';
import {
  PROMPT_CATEGORIES,
  STUDIO_PROMPTS,
  type PromptCategory,
} from '@/content/studio-prompts';

const INITIAL_VISIBLE = 12;
const LOAD_MORE_COUNT = 12;
type MediaType = 'all' | 'image' | 'video';
type CatalogItem = {
  id: string;
  mediaType: Exclude<MediaType, 'all'>;
  category: string;
  image: string;
  title: string;
  prompt: string;
  ratio?: string;
  resolution?: string;
};
const VIDEO_MODELS = [
  { name: 'Wan 3.0', href: '/wan-3-0', anchor: 'generator' },
  { name: 'Seedance 2.5', href: '/seedance-2-5', anchor: 'tool' },
  { name: 'Seedance 2.0', href: '/ai-video-generator', anchor: 'tool' },
  { name: 'MiniMax H3', href: '/minimax-h3', anchor: 'generator' },
] as const;
const VIDEO_CATEGORIES = [
  'cinematic',
  'nature',
  'people',
  'product',
  'food',
  'travel',
  'scifi',
  'fantasy',
];

function copyWithFallback(value: string) {
  if (navigator.clipboard?.writeText)
    return navigator.clipboard.writeText(value);
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
  return Promise.resolve();
}
function labelFromSlug(value: string) {
  return value
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
function categoryLabel(value: string, mediaType?: CatalogItem['mediaType']) {
  return mediaType === 'video' || VIDEO_CATEGORIES.includes(value)
    ? tDynamic(`homepage_prompt_library.category.${value}`)
    : labelFromSlug(value);
}
function interleave(images: CatalogItem[], videos: CatalogItem[]) {
  const mixed: CatalogItem[] = [];
  let imageIndex = 0;
  videos.forEach((video, index) => {
    mixed.push(video);
    if (index % 6 === 1 && imageIndex < images.length) {
      mixed.push(images[imageIndex++]);
    }
  });
  return [...mixed, ...images.slice(imageIndex)];
}

export function PromptLibrary({
  showIntro = true,
  category: forcedCategory,
  compact = false,
}: {
  showIntro?: boolean;
  category?: PromptCategory;
  compact?: boolean;
}) {
  const [mediaType, setMediaType] = useState<MediaType>(
    forcedCategory ? 'image' : 'all'
  );
  const [category, setCategory] = useState<string>(forcedCategory ?? 'all');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(
    compact ? 8 : INITIAL_VISIBLE
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [modelPrompt, setModelPrompt] = useState<CatalogItem | null>(null);

  const catalog = useMemo(() => {
    const images: CatalogItem[] = STUDIO_PROMPTS.map((item) => ({
      ...item,
      id: item.slug,
      mediaType: 'image',
    }));
    const videos: CatalogItem[] = HOMEPAGE_PROMPTS.map((item) => ({
      ...item,
      mediaType: 'video',
      title: tDynamic(`homepage_prompt_library.items.${item.id}.title`),
      prompt: tDynamic(`homepage_prompt_library.items.${item.id}.prompt`),
    }));
    return interleave(images, videos);
  }, []);

  const effectiveCatalog = useMemo(() => {
    if (!compact) return catalog;
    const images = catalog
      .filter((item) => item.mediaType === 'image')
      .slice(0, 4);
    const videos = catalog
      .filter((item) => item.mediaType === 'video')
      .slice(0, 4);
    const featured: CatalogItem[] = [];
    for (let index = 0; index < 4; index += 1) {
      if (images[index]) featured.push(images[index]);
      if (videos[index]) featured.push(videos[index]);
    }
    return featured;
  }, [catalog, compact]);

  const activeMedia = forcedCategory ? 'image' : mediaType;
  const categoryOptions = useMemo(() => {
    if (forcedCategory) return [forcedCategory];
    const source = effectiveCatalog.filter(
      (item) => activeMedia === 'all' || item.mediaType === activeMedia
    );
    return [...PROMPT_CATEGORIES, ...VIDEO_CATEGORIES].filter(
      (value, index, values) =>
        values.indexOf(value) === index &&
        source.some((item) => item.category === value)
    );
  }, [activeMedia, effectiveCatalog, forcedCategory]);
  const items = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return effectiveCatalog.filter((item) => {
      if (activeMedia !== 'all' && item.mediaType !== activeMedia) return false;
      if (category !== 'all' && item.category !== category) return false;
      return (
        !query ||
        `${item.title} ${item.prompt} ${categoryLabel(
          item.category,
          item.mediaType
        )}`
          .toLocaleLowerCase()
          .includes(query)
      );
    });
  }, [activeMedia, category, effectiveCatalog, search]);

  async function copyPrompt(item: CatalogItem) {
    try {
      await copyWithFallback(item.prompt);
      setCopiedId(item.id);
      trackFunnelEvent('prompt_used', {
        category: item.category,
        media_type: item.mediaType,
        action: 'copy',
      });
      toast.success(m['homepage_prompt_library.copied']());
      window.setTimeout(
        () => setCopiedId((current) => (current === item.id ? null : current)),
        1800
      );
    } catch {
      toast.error(m['homepage_prompt_library.copy_failed']());
    }
  }
  function chooseMedia(value: MediaType) {
    setMediaType(value);
    setCategory('all');
    setVisibleCount(INITIAL_VISIBLE);
  }
  const visibleItems = items.slice(0, visibleCount);

  return (
    <section
      id="prompts"
      className={cn(
        'w-full min-w-0 scroll-mt-20 overflow-hidden px-3 text-slate-950 sm:px-4 dark:text-white',
        showIntro ? 'bg-[#fbfaf7] py-14 sm:py-20 dark:bg-slate-950' : 'py-10'
      )}
    >
      <div className="mx-auto w-full max-w-7xl min-w-0">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-[radial-gradient(circle_at_10%_0%,rgba(139,92,246,.13),transparent_28%),radial-gradient(circle_at_90%_10%,rgba(45,212,191,.1),transparent_26%),rgba(255,255,255,.86)] px-4 py-9 shadow-[0_24px_80px_rgba(51,38,25,.08)] sm:px-8 sm:py-12 lg:px-10 dark:border-white/10 dark:bg-[#0e0d19]">
          {showIntro ? (
            <div className="relative mx-auto max-w-3xl text-center">
              <span className="border-primary/25 bg-primary/8 text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold">
                <Sparkles className="size-3.5" />
                {m['homepage_prompt_library.eyebrow']()}
              </span>
              <h2 className="mt-5 font-serif text-3xl font-medium tracking-tight sm:text-5xl">
                {m['homepage_prompt_library.title']()}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base dark:text-white/55">
                {m['homepage_prompt_library.description']()}
              </p>
            </div>
          ) : null}

          {!forcedCategory && !compact ? (
            <div
              className={cn(
                'relative flex w-full min-w-0 justify-center',
                showIntro && 'mt-7'
              )}
            >
              <div
                className="border-border bg-background/80 grid w-full min-w-0 grid-cols-3 rounded-2xl border p-1 shadow-sm sm:inline-flex sm:w-auto sm:grid-cols-none sm:rounded-full"
                aria-label="Prompt media type"
              >
                {(['all', 'image', 'video'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => chooseMedia(value)}
                    className={cn(
                      'min-h-10 min-w-0 rounded-xl px-2 text-sm font-semibold sm:rounded-full sm:px-5',
                      activeMedia === value
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground'
                    )}
                  >
                    {value === 'all'
                      ? m['prompts.all_tab']()
                      : value === 'image'
                        ? m['prompts.image_tab']()
                        : m['prompts.video_tab']()}
                    <span className="ml-1.5 text-[10px] opacity-65">
                      {value === 'all'
                        ? effectiveCatalog.length
                        : catalog.filter((item) => item.mediaType === value)
                            .length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div
            className={cn(
              'relative mt-8 grid gap-4',
              !compact && 'lg:grid-cols-[15rem_1fr]'
            )}
          >
            {!compact ? (
              <nav
                className="flex w-full max-w-full min-w-0 gap-2 overflow-x-auto pb-2 [scrollbar-width:thin] lg:max-h-[38rem] lg:flex-col lg:overflow-y-auto lg:pr-2"
                aria-label="Prompt categories"
              >
                {!forcedCategory && !compact ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('all');
                      setVisibleCount(INITIAL_VISIBLE);
                    }}
                    className={cn(
                      'flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl border px-3.5 text-left text-sm',
                      category === 'all'
                        ? 'border-primary/25 bg-primary/8 shadow-[inset_3px_0_0_var(--primary)]'
                        : 'border-transparent text-slate-500'
                    )}
                  >
                    <Sparkles className="size-4" />
                    {m['prompts.all_tab']()}
                    <span className="ml-auto text-[10px] opacity-55">
                      {
                        catalog.filter(
                          (item) =>
                            activeMedia === 'all' ||
                            item.mediaType === activeMedia
                        ).length
                      }
                    </span>
                  </button>
                ) : null}
                {categoryOptions.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setCategory(value);
                      setVisibleCount(INITIAL_VISIBLE);
                    }}
                    className={cn(
                      'flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl border px-3.5 text-left text-sm',
                      category === value
                        ? 'border-primary/25 bg-primary/8 shadow-[inset_3px_0_0_var(--primary)]'
                        : 'border-transparent text-slate-500'
                    )}
                  >
                    {activeMedia === 'video' ? (
                      <Clapperboard className="size-4" />
                    ) : (
                      <WandSparkles className="size-4" />
                    )}
                    {categoryLabel(value)}
                    <span className="ml-auto text-[10px] opacity-55">
                      {
                        catalog.filter(
                          (item) =>
                            item.category === value &&
                            (activeMedia === 'all' ||
                              item.mediaType === activeMedia)
                        ).length
                      }
                    </span>
                  </button>
                ))}
              </nav>
            ) : null}

            <div className="min-w-0">
              <label className={cn('relative block', compact && 'hidden')}>
                <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setVisibleCount(INITIAL_VISIBLE);
                  }}
                  placeholder={m[
                    'homepage_prompt_library.search_placeholder'
                  ]()}
                  className="focus:border-primary/50 h-12 w-full rounded-2xl border border-slate-200 bg-white/80 pr-4 pl-11 text-sm text-slate-950 shadow-sm outline-none dark:border-white/10 dark:bg-black/25 dark:text-white"
                />
              </label>
              <div
                className={cn(
                  'mt-4 flex justify-between gap-4 text-xs text-slate-500',
                  compact && 'hidden'
                )}
              >
                <span>
                  {m['homepage_prompt_library.results']({
                    count: items.length,
                  })}
                </span>
                <span className="hidden sm:inline">
                  {m['homepage_prompt_library.copy_hint']()}
                </span>
              </div>

              {visibleItems.length ? (
                <div
                  className={cn(
                    'mt-4 grid gap-4 sm:grid-cols-2',
                    compact ? 'lg:grid-cols-4' : 'xl:grid-cols-3'
                  )}
                >
                  {visibleItems.map((item) => (
                    <article
                      key={`${item.mediaType}-${item.id}`}
                      data-home-prompt-card={compact ? item.id : undefined}
                      className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:-translate-y-1 hover:border-violet-200 dark:border-white/10 dark:bg-white/[.045]"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img
                          src={item.image}
                          alt={`${item.title} ${item.mediaType} prompt example`}
                          width={640}
                          height={400}
                          loading="lazy"
                          className="size-full object-cover transition duration-500 group-hover:scale-[1.04]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-black/10" />
                        <div className="absolute top-3 right-3 left-3 flex justify-between gap-2">
                          <span className="rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-semibold text-white">
                            {categoryLabel(item.category, item.mediaType)}
                          </span>
                          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-900">
                            {item.mediaType === 'image'
                              ? m['prompts.image_badge']()
                              : m['prompts.video_badge']()}
                          </span>
                        </div>
                        <h3 className="absolute right-4 bottom-3 left-4 text-base font-semibold text-white">
                          {item.title}
                        </h3>
                      </div>
                      <div className="p-4">
                        <div className="mb-2 text-[10px] font-medium text-slate-400">
                          {item.mediaType === 'image'
                            ? `Nano Banana 2.1 · ${item.ratio} · ${item.resolution}`
                            : m['prompts.video_models_hint']()}
                        </div>
                        <p className="line-clamp-4 min-h-20 text-xs leading-5 text-slate-600 dark:text-white/52">
                          {item.prompt}
                        </p>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => copyPrompt(item)}
                            className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold dark:border-white/10 dark:bg-white/7"
                          >
                            {copiedId === item.id ? (
                              <Check className="size-4 text-emerald-500" />
                            ) : (
                              <Copy className="size-4" />
                            )}
                            {copiedId === item.id
                              ? m['homepage_prompt_library.copied_button']()
                              : m['homepage_prompt_library.copy_button']()}
                          </button>
                          {item.mediaType === 'image' ? (
                            <Link
                              href={publicRecipeHref(item.id)}
                              onClick={() => {
                                trackFunnelEvent('prompt_used', {
                                  category: item.category,

                                  media_type: 'image',

                                  action: 'open',
                                });
                              }}
                              className="bg-primary text-primary-foreground flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold"
                            >
                              <ImageIcon className="size-4" />
                              {m['homepage_prompt_library.use_button']()}
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setModelPrompt(item)}
                              className="bg-primary text-primary-foreground flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold"
                            >
                              <Clapperboard className="size-4" />
                              {m['homepage_prompt_library.use_button']()}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed">
                  <Search className="size-8 text-slate-300" />
                  <p className="mt-3 text-sm font-medium">
                    {m['homepage_prompt_library.empty_title']()}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {m['homepage_prompt_library.empty_description']()}
                  </p>
                </div>
              )}
              {compact ? (
                <Link
                  href="/prompts"
                  className="border-border bg-background hover:border-primary/40 hover:text-primary mx-auto mt-8 flex min-h-11 w-fit items-center gap-2 rounded-full border px-5 text-sm font-semibold"
                >
                  {m['homepage_prompt_library.load_more']()}
                  <WandSparkles className="size-4" />
                </Link>
              ) : visibleCount < items.length ? (
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((count) => count + LOAD_MORE_COUNT)
                  }
                  className="mx-auto mt-8 flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold"
                >
                  {m['homepage_prompt_library.load_more']()}
                  <ChevronDown className="size-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {modelPrompt ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="prompt-model-title"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setModelPrompt(null);
          }}
        >
          <div className="bg-background w-full max-w-lg rounded-3xl border p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-primary text-xs font-semibold uppercase">
                  {m['prompts.video_badge']()}
                </p>
                <h2
                  id="prompt-model-title"
                  className="mt-2 text-2xl font-semibold"
                >
                  {m['prompts.model_picker_title']()}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {m['prompts.model_picker_description']()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModelPrompt(null)}
                className="flex size-10 shrink-0 items-center justify-center rounded-full border"
                aria-label={m['prompts.close']()}
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {VIDEO_MODELS.map((model) => (
                <Link
                  key={model.name}
                  href={model.href + '#' + model.anchor}
                  onClick={() => {
                    stageVideoPrompt(modelPrompt.prompt);

                    trackFunnelEvent('prompt_used', {
                      category: modelPrompt.category,

                      media_type: 'video',

                      model: model.name,

                      action: 'open',
                    });
                  }}
                  className="hover:border-primary/40 hover:bg-primary/5 flex min-h-16 items-center gap-3 rounded-2xl border px-4 font-semibold"
                >
                  <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
                    <Clapperboard className="size-4" />
                  </span>
                  {model.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
