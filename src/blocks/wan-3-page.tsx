import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Film,
  ShieldCheck,
} from 'lucide-react';

import { tDynamic } from '@/core/i18n/dynamic';
import { getWan3GenerationCost } from '@/config/media-tools';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import {
  VideoGeneratorWorkspace,
  type VideoWorkspaceCopy,
} from '@/components/special-tool-workspaces';
import { buttonVariants } from '@/components/ui/button';

const PREVIEW_SOURCE =
  'https://www.reddit.com/r/comfyui/comments/1vfmcty/wan_30_just_announced_and_coming_soon_native_30/';
const WAN_RELEASE_SOURCE =
  'https://fal.ai/models/alibaba/wan-3.0/text-to-video';
const WAN_API_SOURCE =
  'https://fal.ai/models/alibaba/wan-3.0/text-to-video/api';

export function getWan3Faqs(locale?: string) {
  const options = locale ? { locale } : undefined;
  return Array.from({ length: 6 }, (_, index) => ({
    question: tDynamic(`wan3.faq_${index + 1}_question`, undefined, options),
    answer: tDynamic(`wan3.faq_${index + 1}_answer`, undefined, options),
  }));
}

function getWan3WorkspaceCopy(): VideoWorkspaceCopy {
  return {
    signIn: m['tools.special.sign_in'](),
    credits: m['tools.special.credits']({ credits: '{credits}' }),
    creditsLoading: m['tools.special.credits_loading'](),
    buyCredits: m['tools.special.buy_credits'](),
    generating: m['tools.special.generating'](),
    ready: m['tools.special.ready'](),
    failed: m['tools.special.failed'](),
    sceneLabel: m['tools.video.field_scene'](),
    scenePlaceholder: m['tools.video.field_scene_placeholder'](),
    cameraLabel: m['tools.video.field_camera'](),
    cameras: Array.from({ length: 4 }, (_, index) => ({
      label: tDynamic(`tools.video.camera_${index + 1}_label`),
      prompt: tDynamic(`tools.video.camera_${index + 1}_prompt`),
    })),
    rhythmLabel: m['tools.video.field_rhythm'](),
    rhythms: Array.from({ length: 3 }, (_, index) => ({
      label: tDynamic(`tools.video.rhythm_${index + 1}_label`),
      prompt: tDynamic(`tools.video.rhythm_${index + 1}_prompt`),
    })),
    formatLabel: m['tools.video.field_format'](),
    durationLabel: m['tools.video.field_duration'](),
    generate: m['wan3.generator_action'](),
    emptyTitle: m['wan3.generator_empty_title'](),
    emptyBody: m['wan3.generator_empty_body'](),
    cost: m['wan3.generator_cost']({
      credits: '{credits}',
      duration: '{duration}',
    }),
    subscribe: m['tools.video.subscribe'](),
  };
}

export function Wan3Page() {
  const facts = Array.from({ length: 3 }, (_, index) => ({
    title: tDynamic(`wan3.fact_${index + 1}_title`),
    description: tDynamic(`wan3.fact_${index + 1}_description`),
  }));
  const officialCapabilities = Array.from({ length: 4 }, (_, index) => ({
    title: tDynamic(`wan3.available_${index + 1}_title`),
    description: tDynamic(`wan3.available_${index + 1}_description`),
  }));
  const faqs = getWan3Faqs();

  return (
    <main className="flex-1">
      <section className="border-border border-b px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_.78fr]">
            <div>
              <p className="text-primary mb-4 text-xs font-semibold tracking-[0.2em] uppercase">
                {m['wan3.eyebrow']()}
              </p>
              <h1 className="max-w-4xl font-serif text-4xl leading-tight tracking-tight sm:text-6xl">
                {m['wan3.title']()}
              </h1>
              <p className="text-muted-foreground mt-6 max-w-3xl text-lg leading-relaxed">
                {m['wan3.description']()}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#preview"
                  className={cn(buttonVariants(), 'rounded-full')}
                >
                  <Film className="size-4" />
                  {m['wan3.watch_preview']()}
                </a>
                <a
                  href={WAN_RELEASE_SOURCE}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'rounded-full'
                  )}
                >
                  {m['wan3.view_official']()}
                  <ExternalLink className="size-4" />
                </a>
              </div>
            </div>

            <aside className="border-border bg-muted/35 rounded-[2rem] border p-7 sm:p-9">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-2xl">
                  <CalendarClock className="size-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    {m['wan3.status_label']()}
                  </p>
                  <p className="mt-1 font-semibold">
                    {m['wan3.status_date']()}
                  </p>
                </div>
              </div>
              <div className="mt-7 space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-relaxed">
                    {m['wan3.status_confirmed']()}
                  </p>
                </div>
                <div className="flex gap-3">
                  <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />
                  <p className="text-sm leading-relaxed">
                    {m['wan3.status_pending']()}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="preview" className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-primary mb-3 text-xs font-semibold tracking-[0.2em] uppercase">
              {m['wan3.preview_eyebrow']()}
            </p>
            <h2 className="font-serif text-3xl tracking-tight sm:text-5xl">
              {m['wan3.preview_title']()}
            </h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              {m['wan3.preview_description']()}
            </p>
          </div>
          <div className="overflow-hidden rounded-[2rem] bg-black shadow-2xl shadow-black/15">
            <video
              src="/videos/wan-3-preview.mp4"
              poster="/imgs/showcase/wan-3-preview.webp"
              autoPlay
              muted
              loop
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full object-contain"
            >
              {m['landing.showcase.video_fallback']()}
            </video>
          </div>
          <div className="mt-5 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground max-w-3xl leading-relaxed">
              {m['wan3.preview_disclosure']()}
            </p>
            <a
              href={PREVIEW_SOURCE}
              target="_blank"
              rel="noreferrer"
              className="text-primary inline-flex shrink-0 items-center gap-2 font-medium hover:underline"
            >
              {m['wan3.preview_source']()}
              <ExternalLink className="size-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="border-border bg-muted/25 border-y px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="font-serif text-3xl tracking-tight sm:text-5xl">
              {m['wan3.facts_title']()}
            </h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              {m['wan3.facts_description']()}
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {facts.map((fact, index) => (
              <article
                key={fact.title}
                className="border-border bg-background rounded-3xl border p-7"
              >
                <p className="text-primary text-xs font-semibold tracking-widest">
                  0{index + 1}
                </p>
                <h3 className="mt-4 text-xl font-semibold">{fact.title}</h3>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {fact.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-primary mb-3 text-xs font-semibold tracking-[0.2em] uppercase">
                {m['wan3.available_eyebrow']()}
              </p>
              <h2 className="font-serif text-3xl tracking-tight sm:text-5xl">
                {m['wan3.available_title']()}
              </h2>
            </div>
            <div>
              <p className="text-muted-foreground leading-relaxed">
                {m['wan3.available_description']()}
              </p>
              <a
                href={WAN_API_SOURCE}
                target="_blank"
                rel="noreferrer"
                className="text-primary mt-4 inline-flex items-center gap-2 text-sm font-semibold hover:underline"
              >
                {m['wan3.available_source']()}
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {officialCapabilities.map((capability, index) => (
              <article
                key={capability.title}
                className="border-border bg-muted/20 rounded-3xl border p-7"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl text-xs font-bold">
                    0{index + 1}
                  </span>
                  <h3 className="text-lg font-semibold">{capability.title}</h3>
                </div>
                <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                  {capability.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="generator" className="scroll-mt-24 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-primary mb-3 text-xs font-semibold tracking-[0.2em] uppercase">
                {m['wan3.tracker_eyebrow']()}
              </p>
              <h2 className="font-serif text-3xl tracking-tight sm:text-5xl">
                {m['wan3.generator_title']()}
              </h2>
            </div>
            <p className="text-muted-foreground text-lg leading-8">
              {m['wan3.generator_description']()}
            </p>
          </div>
          <div className="mt-10">
            <VideoGeneratorWorkspace
              copy={getWan3WorkspaceCopy()}
              path="/wan-3-0"
              endpoint="/api/media-tools/wan-3"
              durationOptions={[5, 10, 15]}
              aspectOptions={['16:9', '9:16', '1:1', '4:3', '3:4']}
              costForDuration={(duration) =>
                getWan3GenerationCost({ duration })
              }
              workspaceLabel={m['wan3.generator_workspace_label']()}
              promptMaxLength={4200}
            />
          </div>
        </div>
      </section>

      <section className="border-border bg-neutral-950 px-4 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-6 text-emerald-400" />
            <h2 className="font-serif text-3xl sm:text-4xl">
              {m['wan3.sources_title']()}
            </h2>
          </div>
          <p className="mt-4 max-w-3xl leading-relaxed text-white/65">
            {m['wan3.sources_description']()}
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              [WAN_RELEASE_SOURCE, m['wan3.source_release']()],
              [WAN_API_SOURCE, m['wan3.source_wan27']()],
              [PREVIEW_SOURCE, m['wan3.source_preview']()],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-white/5 p-5 text-sm font-medium transition hover:bg-white/10"
              >
                {label}
                <ExternalLink className="size-4 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-serif text-3xl tracking-tight sm:text-5xl">
            {m['wan3.faq_title']()}
          </h2>
          <div className="mt-10 space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="border-border group open:bg-muted/25 rounded-2xl border p-5"
              >
                <summary className="flex min-h-10 cursor-pointer list-none items-center pr-8 font-semibold">
                  {faq.question}
                </summary>
                <p className="text-muted-foreground mt-4 leading-relaxed">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
