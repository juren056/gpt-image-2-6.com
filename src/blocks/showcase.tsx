import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import { stageGeneratorPrompt } from '@/lib/prompt-navigation';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { Button, buttonVariants } from '@/components/ui/button';

const ITEMS = [
  {
    kind: 'video',
    video: '/videos/wan-3-preview.mp4',
    poster: '/imgs/showcase/wan-3-preview.webp',
    labelKey: 'landing.showcase.wan3.label',
    titleKey: 'landing.showcase.wan3.title',
    promptKey: 'landing.showcase.wan3.prompt',
    href: '/wan-3-0#generator',
    external: false,
    linkLabelKey: 'landing.showcase.wan3.tracker',
  },
  {
    kind: 'video',
    video: '/videos/seedance-2-official-wuxia.mp4',
    poster: '/imgs/showcase/seedance-2-official-wuxia.webp',
    labelKey: 'landing.showcase.seedance.label',
    titleKey: 'landing.showcase.seedance.title',
    promptKey: 'landing.showcase.seedance.prompt',
    href: 'https://seed.bytedance.com/en/blog/seedance-2-0-official-launch',
    external: true,
    linkLabelKey: 'landing.showcase.seedance.source',
  },
  {
    kind: 'image',
    image: '/imgs/showcase/ceramic-artist.webp',
    labelKey: 'landing.showcase.image.label',
    titleKey: 'landing.showcase.ceramic.title',
    promptKey: 'landing.showcase.ceramic.prompt',
  },
  {
    kind: 'image',
    image: '/imgs/showcase/cobalt-perfume.webp',
    labelKey: 'landing.showcase.image.label',
    titleKey: 'landing.showcase.product.title',
    promptKey: 'landing.showcase.product.prompt',
  },
  {
    kind: 'image',
    image: '/imgs/showcase/midnight-train.webp',
    labelKey: 'landing.showcase.image.label',
    titleKey: 'landing.showcase.train.title',
    promptKey: 'landing.showcase.train.prompt',
  },
  {
    kind: 'image',
    image: '/imgs/showcase/cliff-library.webp',
    labelKey: 'landing.showcase.image.label',
    titleKey: 'landing.showcase.library.title',
    promptKey: 'landing.showcase.library.prompt',
  },
  {
    kind: 'image',
    image: '/imgs/tools/ai-product-photo-showcase.webp',
    labelKey: 'landing.showcase.product_tool.label',
    titleKey: 'landing.showcase.product_tool.title',
    promptKey: 'landing.showcase.product_tool.prompt',
    href: '/ai-product-photo-generator',
    external: false,
    linkLabelKey: 'landing.showcase.open_tool',
  },
  {
    kind: 'image',
    image: '/imgs/tools/ai-poster-showcase.webp',
    fit: 'contain',
    labelKey: 'landing.showcase.poster_tool.label',
    titleKey: 'landing.showcase.poster_tool.title',
    promptKey: 'landing.showcase.poster_tool.prompt',
    href: '/ai-poster-generator',
    external: false,
    linkLabelKey: 'landing.showcase.open_tool',
  },
  {
    kind: 'image',
    image: '/imgs/tools/ai-youtube-thumbnail-showcase.webp',
    labelKey: 'landing.showcase.thumbnail_tool.label',
    titleKey: 'landing.showcase.thumbnail_tool.title',
    promptKey: 'landing.showcase.thumbnail_tool.prompt',
    href: '/ai-youtube-thumbnail-generator',
    external: false,
    linkLabelKey: 'landing.showcase.open_tool',
  },
  {
    kind: 'image',
    image: '/imgs/showcase/background-removal-workflow-v2.webp',
    labelKey: 'landing.showcase.background_tool.label',
    titleKey: 'landing.showcase.background_tool.title',
    promptKey: 'landing.showcase.background_tool.prompt',
    href: '/image-background-remover',
    external: false,
    linkLabelKey: 'landing.showcase.open_tool',
  },
] as const;

export function Showcase() {
  const [active, setActive] = useState(0);
  const current = ITEMS[active];
  const prompt = m[current.promptKey]();

  useEffect(() => {
    if (current.kind === 'video') return;

    const timer = window.setTimeout(
      () => setActive((value) => (value + 1) % ITEMS.length),
      5200
    );
    return () => window.clearTimeout(timer);
  }, [active, current.kind]);

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    toast.success(m['landing.showcase.copied']());
  }

  function step(direction: number) {
    setActive((value) => (value + direction + ITEMS.length) % ITEMS.length);
  }

  return (
    <section
      id="gallery"
      className="border-border border-y px-4 py-16 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-9 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-primary mb-3 text-xs font-semibold tracking-[0.2em] uppercase">
              {m['landing.showcase.eyebrow']()}
            </p>
            <h2 className="font-serif text-3xl tracking-tight sm:text-5xl">
              {m['landing.showcase.title']()}
            </h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              {m['landing.showcase.description']()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-full"
              onClick={() => step(-1)}
              aria-label={m['landing.showcase.previous']()}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-full"
              onClick={() => step(1)}
              aria-label={m['landing.showcase.next']()}
            >
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid overflow-hidden rounded-[2rem] bg-neutral-950 text-white lg:grid-cols-[1.35fr_.65fr]">
          <div className="relative min-h-[300px] overflow-hidden sm:min-h-[540px]">
            {ITEMS.map((item, index) =>
              item.kind === 'video' ? (
                index === active && (
                  <video
                    key={item.video}
                    src={item.video}
                    poster={item.poster}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 size-full bg-black object-contain"
                  >
                    {m['landing.showcase.video_fallback']()}
                  </video>
                )
              ) : (
                <img
                  key={item.image}
                  src={item.image}
                  alt={m[item.titleKey]()}
                  width={1200}
                  height={900}
                  loading={index === 2 ? 'eager' : 'lazy'}
                  className={`absolute inset-0 size-full transition-all duration-700 ${
                    'fit' in item && item.fit === 'contain'
                      ? 'bg-neutral-900 object-contain'
                      : 'object-cover'
                  } ${
                    index === active
                      ? 'scale-100 opacity-100'
                      : 'scale-[1.03] opacity-0'
                  }`}
                />
              )
            )}
            {current.kind === 'image' && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/70 to-transparent" />
            )}
            <div
              className={cn(
                'absolute left-6 flex gap-0',
                current.kind === 'video' ? 'top-6' : 'bottom-6'
              )}
            >
              {ITEMS.map((item, index) => (
                <button
                  key={item.titleKey}
                  type="button"
                  onClick={() => setActive(index)}
                  className="-mx-1 flex size-10 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                  aria-label={`${m['landing.showcase.go_to']()} ${index + 1}`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-1.5 rounded-full transition-all ${
                      index === active ? 'w-8 bg-white' : 'w-2 bg-white/45'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between p-7 sm:p-10">
            <div>
              <div className="mb-8 flex size-11 items-center justify-center rounded-2xl bg-white/10">
                <Sparkles className="size-5" />
              </div>
              <p className="text-sm text-white/55">
                {String(active + 1).padStart(2, '0')} /{' '}
                {String(ITEMS.length).padStart(2, '0')}
              </p>
              <p className="mt-4 inline-flex rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-medium text-white/70">
                {m[current.labelKey]()}
              </p>
              <h3 className="mt-3 font-serif text-3xl leading-tight">
                {m[current.titleKey]()}
              </h3>
              <div className="mt-8 border-t border-white/15 pt-6">
                <p className="mb-3 text-xs font-semibold tracking-widest text-white/50 uppercase">
                  {current.kind === 'video' || 'href' in current
                    ? m['landing.showcase.preview_label']()
                    : m['landing.showcase.prompt_label']()}
                </p>
                <p className="text-sm leading-relaxed text-white/78">
                  {prompt}
                </p>
              </div>
            </div>
            {'href' in current ? (
              current.external ? (
                <a
                  href={current.href}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'mt-10 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white'
                  )}
                >
                  <ExternalLink className="size-4" />
                  {m[current.linkLabelKey]()}
                </a>
              ) : (
                <Link
                  href={current.href}
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'mt-10 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white'
                  )}
                >
                  <ExternalLink className="size-4" />
                  {m[current.linkLabelKey]()}
                </Link>
              )
            ) : (
              <div className="mt-10 flex flex-col gap-2">
                <Link
                  href="/#generator"
                  onClick={() => stageGeneratorPrompt(prompt)}
                  className={cn(
                    buttonVariants(),
                    'rounded-full bg-white text-black hover:bg-white/90'
                  )}
                >
                  <Sparkles className="size-4" />
                  {m['landing.showcase.try_prompt']()}
                </Link>
                <Button
                  variant="outline"
                  className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  onClick={copyPrompt}
                >
                  <Copy className="size-4" />
                  {m['landing.showcase.copy_prompt']()}
                </Button>
              </div>
            )}
          </div>
        </div>
        <p className="text-muted-foreground mt-4 text-center text-xs">
          {m['landing.showcase.note']()}
        </p>
      </div>
    </section>
  );
}
