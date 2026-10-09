import {
  ArrowRight,
  CalendarClock,
  PackageOpen,
  Palette,
  ScanLine,
  Sparkles,
  WandSparkles,
  ZoomIn,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import {
  PUBLIC_MODEL_PAGES,
  PUBLIC_TOOL_PAGES,
} from '@/config/public-creative';
import {
  CreativeToolTile,
  ModelBrandTile,
} from '@/components/creative-visuals';

const quickTasks = [
  {
    name: 'Generate images',
    text: 'Start from a prompt and a precise model.',
    href: '/ai-image-generator',
    icon: Sparkles,
  },
  {
    name: 'Edit photos',
    text: 'Describe a change with visual references.',
    href: '/ai-image-editor',
    icon: WandSparkles,
  },
  {
    name: 'Product photos',
    text: 'Build clean product and campaign sets.',
    href: '/ai-product-photo-generator',
    icon: PackageOpen,
  },
  {
    name: 'Remove background',
    text: 'Create a transparent PNG cutout.',
    href: '/image-background-remover',
    icon: ScanLine,
  },
  {
    name: 'Upscale',
    text: 'Increase detail and output dimensions.',
    href: '/ai-image-upscaler',
    icon: ZoomIn,
  },
  {
    name: 'Create designs',
    text: 'Add text, layers, templates, and exports.',
    href: '/online-image-editor',
    icon: Palette,
  },
] as const;

const FEATURED_MODEL_IDS = new Set([
  'qwen-image-3-edit',
  'qwen-image-2.1',
  'gpt-image-2.5-flare',
  'nano-banana-2',
  'seedream-5-pro',
  'flux-2-pro',
]);

const FEATURED_TOOL_IDS = new Set([
  'T01',
  'T02',
  'T03',
  'T04',
  'T07',
  'T10',
  'T12',
  'T13',
  'T14',
  'T24',
]);

const featuredModels = PUBLIC_MODEL_PAGES.filter((item) =>
  FEATURED_MODEL_IDS.has(item.id)
);
const featuredTools = PUBLIC_TOOL_PAGES.filter((item) =>
  FEATURED_TOOL_IDS.has(item.id)
);

const scenes = [
  {
    title: 'One product photo, a complete campaign set',
    text: 'Remove the background, add a believable shadow or scene, create an ad layout, then resize it for each channel.',
    image: '/imgs/tools/ai-product-photo-showcase.webp',
    action: 'Create product photos',
    href: '/product-image-set-generator',
  },
  {
    title: 'Generate a poster, then edit its text separately',
    text: 'Create the visual direction first. Keep price, date, and headline as editable layers before exporting multiple sizes.',
    image: '/imgs/tools/ai-poster-showcase.webp',
    action: 'Make a poster',
    href: '/ai-poster-generator',
  },
  {
    title: 'Turn a sketch into editable vector artwork',
    text: 'Use a sketch as the structural reference, convert the chosen graphic into real paths, then recolor and export SVG.',
    image: '/imgs/generated/feature-styles-1783598714340.png',
    action: 'Convert to SVG',
    href: '/image-to-svg',
  },
] as const;

export function HomepageDiscovery() {
  return (
    <>
      <section className="border-border border-y px-4 py-10">
        <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {quickTasks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="border-border bg-card hover:border-primary/40 group rounded-2xl border p-4 transition-colors"
              >
                <Icon className="text-primary size-5" />
                <h2 className="mt-3 text-sm font-semibold">{item.name}</h2>
                <p className="text-muted-foreground mt-1 text-xs leading-5">
                  {item.text}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
                Image models
              </p>
              <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-5xl">
                A dedicated generator for every model
              </h2>
              <p className="text-muted-foreground mt-4 max-w-2xl leading-7">
                Open the model you searched for. Its page keeps that exact
                endpoint, capabilities, reference limit, and credit price.
              </p>
            </div>
            <Link
              href="/models"
              className="border-border inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold"
            >
              Compare all models <ArrowRight className="size-4" />
            </Link>
          </div>
          <Link
            href="/qwen-image-3-1"
            className="border-border bg-card mt-8 grid gap-4 rounded-3xl border p-5 transition-colors hover:border-amber-400/70 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
              <CalendarClock className="size-6" />
            </span>
            <span>
              <span className="flex flex-wrap items-center gap-2">
                <strong className="text-lg">Qwen Image 3.1</strong>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-amber-900 uppercase dark:bg-amber-950/50 dark:text-amber-200">
                  Announced
                </span>
              </span>
              <span className="text-muted-foreground mt-1 block text-sm leading-6">
                Track the confirmed 2026 release window, official API status,
                model ID, pricing, and launch-day verification.
              </span>
            </span>
            <span className="text-primary inline-flex items-center gap-2 text-sm font-semibold">
              View release status <ArrowRight className="size-4" />
            </span>
          </Link>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredModels.map((item) => (
              <article
                key={item.id}
                data-home-model-card={item.id}
                className="border-border bg-card group overflow-hidden rounded-3xl border"
              >
                <Link
                  href={item.path}
                  className="relative block overflow-hidden"
                >
                  <img
                    src={item.image}
                    alt={`${item.useCase} illustration`}
                    width={640}
                    height={400}
                    loading="lazy"
                    className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                  />
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/65 px-3 py-1 text-[10px] font-semibold text-white">
                    {item.availability
                      ? item.availability === 'preview'
                        ? 'API preview'
                        : 'Coming soon'
                      : `Generate${item.id === 'qwen-image-3-edit' ? '' : ' / Edit'}`}
                  </span>
                  <ModelBrandTile
                    modelId={item.id}
                    className="absolute top-3 left-3 bg-white/95 shadow-sm backdrop-blur"
                  />
                </Link>
                <div className="p-5">
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {item.useCase}
                  </p>
                  <Link
                    href={item.path}
                    className="text-primary mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold"
                  >
                    {item.availability
                      ? `Preview ${item.name}`
                      : `Try ${item.name}`}{' '}
                    <ArrowRight className="size-4" />
                  </Link>
                  {item.id === 'qwen-image-2.1' ? (
                    <Link
                      href="/qwen-image-2-1-transparent-png"
                      className="mt-1 flex min-h-10 items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300"
                    >
                      Native transparent PNG <ArrowRight className="size-4" />
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/25 border-border border-y px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
                Image tools
              </p>
              <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-5xl">
                Start with the result you need
              </h2>
              <p className="text-muted-foreground mt-4 max-w-2xl leading-7">
                Every tool opens its own upload, editor, batch, brand, template,
                or workflow interface. Advanced Studio remains available when
                you want to connect tasks.
              </p>
            </div>
            <Link
              href="/tools"
              className="border-border bg-background inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold"
            >
              View all tools <ArrowRight className="size-4" />
            </Link>
          </div>
          {(
            ['Product', 'Enhance', 'Design', 'Workflow', 'Create'] as const
          ).map((category) => (
            <div key={category} className="mt-10">
              <h3 className="text-lg font-semibold">{category}</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {featuredTools
                  .filter((tool) => tool.category === category)
                  .map((tool) => (
                    <Link
                      key={tool.id}
                      href={tool.path}
                      data-tool-card={tool.id}
                      className="border-border bg-background group relative block aspect-[16/10] min-h-48 overflow-hidden rounded-2xl border shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-white/40 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
                    >
                      <img
                        src={tool.cardImage}
                        alt={`${tool.name} effect preview`}
                        width={960}
                        height={600}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-slate-950/95 via-slate-950/28 to-black/5" />
                      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                        <CreativeToolTile
                          toolId={tool.id}
                          className="border-white/70 bg-white/94 shadow-sm backdrop-blur"
                        />
                        <span className="flex size-9 items-center justify-center rounded-full border border-white/35 bg-black/25 text-white shadow-sm backdrop-blur-sm">
                          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                        <h4 className="text-base font-semibold tracking-tight">
                          {tool.name}
                        </h4>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-white/78">
                          {tool.summary}
                        </p>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-primary text-xs font-semibold tracking-[.18em] uppercase">
            Complete workflows
          </p>
          <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-5xl">
            From source image to finished delivery
          </h2>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {scenes.map((scene) => (
              <article
                key={scene.href}
                className="border-border bg-card overflow-hidden rounded-3xl border"
              >
                <img
                  src={scene.image}
                  alt={`${scene.title} example`}
                  width={800}
                  height={500}
                  loading="lazy"
                  className="aspect-[16/10] w-full object-cover"
                />
                <div className="p-6">
                  <h3 className="font-serif text-2xl">{scene.title}</h3>
                  <p className="text-muted-foreground mt-3 text-sm leading-6">
                    {scene.text}
                  </p>
                  <Link
                    href={scene.href}
                    className="text-primary mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold"
                  >
                    {scene.action} <ArrowRight className="size-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
