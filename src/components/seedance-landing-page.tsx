import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  CircleDot,
  Copy,
  Film,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import { getSeedance25GenerationCost } from '@/config/media-tools';
import { consumeStagedVideoPrompt } from '@/lib/prompt-navigation';
import { cn } from '@/lib/utils';
import { SiteSelect } from '@/components/site-select';
import {
  VideoGeneratorWorkspace,
  type VideoWorkspaceCopy,
} from '@/components/special-tool-workspaces';
import { Button, buttonVariants } from '@/components/ui/button';
import { DotPattern } from '@/components/ui/dot-pattern';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export type SeedanceLandingCopy = {
  breadcrumbHome: string;
  breadcrumbTools: string;
  eyebrow: string;
  title: string;
  description: string;
  freeBadge: string;
  primaryAction: string;
  paidAction: string;
  statusLabel: string;
  statusTitle: string;
  statusBody: string;
  statusUpdated: string;
  generatorTitle: string;
  generatorDescription: string;
  promptTitle: string;
  promptDescription: string;
  sceneLabel: string;
  scenePlaceholder: string;
  cameraLabel: string;
  rhythmLabel: string;
  durationLabel: string;
  copyPrompt: string;
  copied: string;
  cameras: Array<{ label: string; prompt: string }>;
  rhythms: Array<{ label: string; prompt: string }>;
  demoTitle: string;
  demoCaption: string;
  factsTitle: string;
  factsDescription: string;
  facts: Array<{ title: string; description: string }>;
  faqTitle: string;
  faqs: Array<{ question: string; answer: string }>;
  relatedTitle: string;
  relatedVideo: string;
  relatedDraftMode: string;
  relatedPricing: string;
  relatedTools: string;
};

function SeedanceHeroWorkspace({ copy }: { copy: SeedanceLandingCopy }) {
  const [scene, setScene] = useState('');
  const [camera, setCamera] = useState(copy.cameras[0]?.prompt ?? '');
  const [rhythm, setRhythm] = useState(copy.rhythms[0]?.prompt ?? '');
  const [duration, setDuration] = useState(15);

  useEffect(() => {
    const incomingPrompt = consumeStagedVideoPrompt();
    if (incomingPrompt) setScene(incomingPrompt);
  }, []);

  const prompt = useMemo(
    () =>
      [
        scene.trim(),
        `Camera: ${camera}.`,
        `Pacing: ${rhythm}.`,
        `Target duration: ${duration} seconds.`,
        'Keep subject identity, wardrobe, lighting direction and spatial continuity consistent across the whole scene.',
        'Generate synchronized ambience and sound effects that support the action. Do not add captions, logos or watermarks.',
      ]
        .filter(Boolean)
        .join(' '),
    [camera, duration, rhythm, scene]
  );

  async function copyPrompt() {
    if (!scene.trim()) return;
    await navigator.clipboard.writeText(prompt);
    toast.success(copy.copied);
  }

  return (
    <div className="border-border bg-card/95 shadow-primary/10 overflow-hidden rounded-[1.5rem] border shadow-xl backdrop-blur sm:rounded-[2rem] sm:shadow-2xl">
      <div className="border-border flex flex-col gap-3 border-b px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-4">
        <div className="flex items-center gap-3">
          <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl">
            <WandSparkles className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">{copy.promptTitle}</p>
            <p className="text-muted-foreground text-xs">{copy.freeBadge}</p>
          </div>
        </div>
        <div className="border-border bg-muted/60 flex h-8 w-fit items-center gap-2 rounded-full border px-3 text-xs">
          <span className="relative flex size-2 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-70" />
            <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
          </span>
          <span className="font-medium">{copy.statusTitle}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.08fr_.92fr]">
        <div className="space-y-5 p-4 sm:p-7">
          <div>
            <Label htmlFor="seedance-scene">{copy.sceneLabel}</Label>
            <p className="text-muted-foreground mt-1 text-xs">
              {copy.promptDescription}
            </p>
            <Textarea
              id="seedance-scene"
              value={scene}
              onChange={(event) => setScene(event.target.value)}
              placeholder={copy.scenePlaceholder}
              maxLength={900}
              className="bg-background/80 mt-3 min-h-32 resize-none rounded-2xl p-4 text-sm leading-relaxed"
            />
            <p className="text-muted-foreground mt-1.5 text-right text-[11px] tabular-nums">
              {scene.length}/900
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="seedance-camera">{copy.cameraLabel}</Label>
              <SiteSelect
                id="seedance-camera"
                value={camera}
                onChange={(event) => setCamera(event.target.value)}
                className="border-input bg-background mt-2 h-11 w-full rounded-xl border px-3 text-sm"
              >
                {copy.cameras.map((option) => (
                  <option key={option.label} value={option.prompt}>
                    {option.label}
                  </option>
                ))}
              </SiteSelect>
            </div>
            <div>
              <Label htmlFor="seedance-rhythm">{copy.rhythmLabel}</Label>
              <SiteSelect
                id="seedance-rhythm"
                value={rhythm}
                onChange={(event) => setRhythm(event.target.value)}
                className="border-input bg-background mt-2 h-11 w-full rounded-xl border px-3 text-sm"
              >
                {copy.rhythms.map((option) => (
                  <option key={option.label} value={option.prompt}>
                    {option.label}
                  </option>
                ))}
              </SiteSelect>
            </div>
          </div>

          <fieldset>
            <legend className="text-sm font-medium">
              {copy.durationLabel}
            </legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[10, 15, 30].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDuration(value)}
                  className={cn(
                    'h-10 rounded-xl border text-xs font-semibold transition-colors',
                    duration === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  {value}s
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              onClick={copyPrompt}
              disabled={!scene.trim()}
              className="h-12 rounded-xl"
            >
              <Copy className="size-4" />
              {copy.copyPrompt}
            </Button>
            <Link
              href="/seedance-2-5#tool"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'h-12 rounded-xl'
              )}
            >
              <Film className="size-4" />
              {copy.paidAction}
            </Link>
          </div>
        </div>

        <figure className="border-border flex min-h-[430px] flex-col border-t bg-[#0b0b10] p-4 text-white sm:p-6 lg:border-t-0 lg:border-l">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{copy.demoTitle}</p>
              <p className="mt-1 text-xs text-white/50">{copy.demoCaption}</p>
            </div>
            <Sparkles className="size-4 text-violet-300" />
          </div>
          <video
            src="/videos/seedance-motion-preview.mp4"
            poster="/imgs/tools/seedance-motion-preview.webp"
            controls
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="my-auto max-h-[520px] w-full rounded-2xl bg-black object-cover shadow-2xl"
          />
        </figure>
      </div>
    </div>
  );
}

export function SeedanceLandingPage({
  copy,
  workspace,
}: {
  copy: SeedanceLandingCopy;
  workspace: VideoWorkspaceCopy;
}) {
  return (
    <main className="flex-1">
      <section className="relative isolate overflow-hidden px-3 pt-10 pb-16 sm:px-4 sm:pt-20 sm:pb-24">
        <DotPattern
          className={cn(
            'mask-[radial-gradient(ellipse_at_top,white,transparent_72%)]',
            'text-primary/16'
          )}
        />
        <div className="bg-primary/8 absolute top-8 left-1/2 -z-10 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl sm:h-[32rem] sm:w-[32rem]" />

        <div className="relative mx-auto max-w-6xl">
          <nav
            aria-label="Breadcrumb"
            className="text-muted-foreground mb-9 flex flex-wrap items-center gap-2 text-xs"
          >
            <Link href="/" className="hover:text-foreground">
              {copy.breadcrumbHome}
            </Link>
            <span>/</span>
            <Link href="/tools" className="hover:text-foreground">
              {copy.breadcrumbTools}
            </Link>
            <span>/</span>
            <span className="text-foreground">{copy.title}</span>
          </nav>

          <div className="mx-auto mb-10 max-w-4xl text-center sm:mb-14">
            <span className="border-border bg-background/80 mx-auto inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
              <Sparkles className="text-primary size-3.5" />
              {copy.eyebrow}
            </span>
            <h1 className="text-foreground mt-6 font-serif text-[2.65rem] leading-[1.02] font-normal tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl">
              {copy.title}
            </h1>
            <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-base leading-relaxed text-balance sm:text-lg">
              {copy.description}
            </p>
            <p className="text-muted-foreground mx-auto mt-4 flex max-w-2xl items-center justify-center gap-2 text-xs leading-relaxed">
              <CircleDot className="size-4 shrink-0 text-amber-500" />
              {copy.statusBody} {copy.statusUpdated}
            </p>
          </div>

          <SeedanceHeroWorkspace copy={copy} />
        </div>
      </section>

      <section
        id="tool"
        className="border-border bg-muted/20 scroll-mt-24 border-y px-4 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <h2 className="font-serif text-3xl tracking-tight sm:text-5xl">
              {copy.generatorTitle}
            </h2>
            <p className="text-muted-foreground mt-4 leading-7">
              {copy.generatorDescription}
            </p>
          </div>
          <VideoGeneratorWorkspace
            copy={workspace}
            path="/seedance-2-5"
            endpoint="/api/media-tools/seedance-2-5"
            durationOptions={[5, 10, 15, 30]}
            aspectOptions={['21:9', '16:9', '4:3', '1:1', '3:4', '9:16']}
            costForDuration={(duration) =>
              getSeedance25GenerationCost({ duration })
            }
            workspaceLabel={copy.generatorTitle}
            promptMaxLength={4200}
          />
        </div>
      </section>

      <section className="border-border bg-muted/25 border-y px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
              {copy.factsTitle}
            </h2>
            <p className="text-muted-foreground mt-4 leading-7">
              {copy.factsDescription}
            </p>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {copy.facts.map((fact) => (
              <article
                key={fact.title}
                className="border-border bg-background rounded-2xl border p-6"
              >
                <Check className="text-primary size-5" />
                <h3 className="mt-5 text-lg font-semibold">{fact.title}</h3>
                <p className="text-muted-foreground mt-3 text-sm leading-7">
                  {fact.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            {copy.faqTitle}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {copy.faqs.map((faq) => (
              <details
                key={faq.question}
                className="border-border bg-card rounded-2xl border p-5"
              >
                <summary className="flex min-h-10 cursor-pointer list-none items-center font-semibold">
                  {faq.question}
                </summary>
                <p className="text-muted-foreground mt-3 text-sm leading-7">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>

          <h2 className="mt-14 font-serif text-3xl tracking-tight">
            {copy.relatedTitle}
          </h2>
          <nav
            className="mt-5 flex flex-wrap gap-3"
            aria-label={copy.relatedTitle}
          >
            <Link
              href="/seedance-2-5-draft-mode"
              className="border-border hover:border-primary/40 hover:text-primary rounded-full border px-4 py-2 text-sm font-semibold"
            >
              {copy.relatedDraftMode}
            </Link>
            <Link
              href="/ai-video-generator"
              className="border-border hover:border-primary/40 hover:text-primary rounded-full border px-4 py-2 text-sm font-semibold"
            >
              {copy.relatedVideo}
            </Link>
            <Link
              href="/pricing"
              className="border-border hover:border-primary/40 hover:text-primary rounded-full border px-4 py-2 text-sm font-semibold"
            >
              {copy.relatedPricing}
            </Link>
            <Link
              href="/tools"
              className="border-border hover:border-primary/40 hover:text-primary rounded-full border px-4 py-2 text-sm font-semibold"
            >
              {copy.relatedTools}
            </Link>
          </nav>
        </div>
      </section>
    </main>
  );
}
