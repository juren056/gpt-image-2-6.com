import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, LoaderCircle, PenLine, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import {
  HOMEPAGE_EXAMPLES,
  homepageExampleSelection,
  homepageImage,
} from '@/config/homepage-examples';
import { PROMPT_LIBRARY_MANIFEST } from '@/config/prompt-library-manifest';
import { trackFunnelEvent } from '@/lib/analytics-events';
import { apiGet } from '@/lib/api-client';
import { prepareBananaGenerator } from '@/lib/banana-generator-navigation';
import {
  wrapShowcaseIndex,
  type CommunityShowcaseItem,
  type HomepageShowcaseCatalog,
} from '@/lib/homepage-showcase';
import { promptHandoff, type PromptCatalog } from '@/lib/prompt-library';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

import '@/styles/creation-nudge.css';

const NUDGE_DELAY_MS = 5_000;
const NUDGE_HOLD_MS = 1_600;
const NUDGE_MOVE_MS = 650;
const NUDGE_EXAMPLE_IDS = ['product', 'character', 'text', 'social'] as const;

type OriginalNudgeItem = {
  id: string;
  title: string;
  image: string;
  width: number;
  height: number;
  kind: 'original';
  example: (typeof HOMEPAGE_EXAMPLES)[number];
};

type NudgeItem = OriginalNudgeItem | CommunityShowcaseItem;

export function CreationNudge() {
  const [open, setOpen] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [moveDirection, setMoveDirection] = useState<-1 | 0 | 1>(0);
  const [preparingId, setPreparingId] = useState<string | null>(null);
  const shownRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const examples = NUDGE_EXAMPLE_IDS.map((id) =>
    HOMEPAGE_EXAMPLES.find((example) => example.id === id)
  ).filter(
    (example): example is (typeof HOMEPAGE_EXAMPLES)[number] => !!example
  );
  const labels: Record<(typeof NUDGE_EXAMPLE_IDS)[number], string> = {
    product: m['growth.creation_nudge.product'](),
    character: m['growth.creation_nudge.character'](),
    text: m['growth.creation_nudge.poster'](),
    social: m['growth.creation_nudge.social'](),
  };
  const originalItems: OriginalNudgeItem[] = examples.map((example) => ({
    id: `original-${example.id}`,
    title: labels[example.id as (typeof NUDGE_EXAMPLE_IDS)[number]],
    image: homepageImage(example.imageId),
    width: 480,
    height: 270,
    kind: 'original',
    example,
  }));

  const showcaseQuery = useQuery({
    queryKey: ['homepage-showcase', PROMPT_LIBRARY_MANIFEST.revision],
    queryFn: () =>
      apiGet<HomepageShowcaseCatalog>(
        `/data/homepage-showcase-v1.json?v=${PROMPT_LIBRARY_MANIFEST.revision}`
      ),
    enabled: open,
    staleTime: Infinity,
    retry: 1,
  });
  const promptCatalogQuery = useQuery({
    queryKey: ['community-prompt-library', PROMPT_LIBRARY_MANIFEST.revision],
    queryFn: () =>
      apiGet<PromptCatalog>(
        `/data/prompt-library-v1.json?v=${PROMPT_LIBRARY_MANIFEST.revision}`
      ),
    enabled: false,
    staleTime: Infinity,
    retry: 1,
  });
  const items: NudgeItem[] = [
    ...originalItems,
    ...(showcaseQuery.data?.items || []),
  ];
  const safeIndex = items.length
    ? wrapShowcaseIndex(activeIndex, items.length)
    : 0;
  const activeItem = items[safeIndex];
  const canAutoPlay =
    open &&
    pageVisible &&
    !reducedMotion &&
    !hoveredId &&
    !preparingId &&
    moveDirection === 0 &&
    items.length > 4;

  useEffect(() => {
    let delayElapsed = false;
    const maybeShow = () => {
      if (
        !delayElapsed ||
        document.visibilityState !== 'visible' ||
        shownRef.current
      ) {
        return;
      }
      shownRef.current = true;
      setOpen(true);
      trackFunnelEvent('creation_nudge_shown', { source: 'homepage_5s' });
    };
    const timer = window.setTimeout(() => {
      delayElapsed = true;
      maybeShow();
    }, NUDGE_DELAY_MS);
    document.addEventListener('visibilitychange', maybeShow);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', maybeShow);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(media.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    media.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      media.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!canAutoPlay) return;
    const timer = window.setTimeout(() => setMoveDirection(1), NUDGE_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [canAutoPlay, safeIndex]);

  useEffect(() => {
    if (moveDirection === 0 || items.length === 0) return;
    const timer = window.setTimeout(
      () => {
        setActiveIndex((index) =>
          wrapShowcaseIndex(index + moveDirection, items.length)
        );
        setMoveDirection(0);
      },
      reducedMotion ? 0 : NUDGE_MOVE_MS
    );
    return () => window.clearTimeout(timer);
  }, [items.length, moveDirection, reducedMotion]);

  function startWithOriginal(item: OriginalNudgeItem) {
    setOpen(false);
    prepareBananaGenerator(homepageExampleSelection(item.example));
    trackFunnelEvent('creation_example_selected', {
      source: 'homepage_5s',
      example: item.example.id,
    });
  }

  async function startWithItem(item: NudgeItem) {
    if (preparingId) return;
    if (item.kind === 'original') {
      startWithOriginal(item);
      return;
    }

    setPreparingId(item.id);
    const result = await promptCatalogQuery.refetch();
    const prompt = result.data?.items.find((entry) => entry.id === item.id);
    setPreparingId(null);
    if (!prompt) {
      toast.error(m['prompt_library.error']());
      return;
    }
    const handoff = promptHandoff(prompt);
    setOpen(false);
    prepareBananaGenerator({
      model: handoff.model,
      mode: handoff.operation,
      prompt: handoff.prompt,
      aspectRatio: handoff.aspectRatio,
      resolution: handoff.resolution,
      outputCount: handoff.outputCount,
      imageUrls: handoff.imageUrls,
    });
    trackFunnelEvent('creation_example_selected', {
      source: 'homepage_5s',
      example: item.id,
    });
  }

  function startBlank() {
    setOpen(false);
    prepareBananaGenerator({ focus: 'prompt' });
    trackFunnelEvent('generator_focused', { source: 'homepage_5s' });
  }

  const slots = [-1, 0, 1, 2, 3, 4];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        ref={dialogRef}
        initialFocus={dialogRef}
        className="creation-nudge max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] overflow-y-auto border-zinc-700 bg-zinc-950 p-0 text-white shadow-2xl sm:max-w-4xl sm:rounded-[1.75rem]"
      >
        <div className="bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.2),transparent_42%)] px-5 pt-7 pb-5 sm:px-8 sm:pt-7 sm:pb-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-300/40 bg-yellow-300/10 px-3 py-1 text-xs font-semibold tracking-wide text-yellow-300 uppercase">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {m['growth.creation_nudge.eyebrow']()}
          </div>
          <DialogTitle className="max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-[2rem]">
            {m['growth.creation_nudge.title']()}
          </DialogTitle>
          <DialogDescription className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
            {m['growth.creation_nudge.description']()}
          </DialogDescription>

          <div
            className="creation-nudge__viewport"
            onPointerLeave={() => setHoveredId(null)}
          >
            <div className="creation-nudge__track">
              {items.length > 0 &&
                slots.map((slot) => {
                  const item =
                    items[wrapShowcaseIndex(safeIndex + slot, items.length)];
                  const cardKey = `${item.id}:${slot}`;
                  const isActive = hoveredId
                    ? hoveredId === item.id
                    : slot === (moveDirection || 0);
                  return (
                    <button
                      key={cardKey}
                      type="button"
                      className={[
                        'creation-nudge__card',
                        isActive ? 'is-active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={
                        {
                          '--nudge-x': `calc(${(slot - moveDirection) * 100}% + ${(slot - moveDirection) * 12}px)`,
                        } as CSSProperties
                      }
                      onPointerEnter={() => setHoveredId(item.id)}
                      onFocus={() => setHoveredId(item.id)}
                      onBlur={() => setHoveredId(null)}
                      onClick={() => startWithItem(item)}
                      disabled={!!preparingId}
                    >
                      <span className="creation-nudge__image">
                        <img
                          src={item.image}
                          alt=""
                          width={item.width}
                          height={item.height}
                          loading={slot >= 0 && slot <= 3 ? 'eager' : 'lazy'}
                          decoding="async"
                        />
                      </span>
                      <span className="creation-nudge__label">
                        <strong>{item.title}</strong>
                        {preparingId === item.id ? (
                          <LoaderCircle
                            className="size-4 shrink-0 animate-spin text-yellow-300"
                            aria-hidden="true"
                          />
                        ) : (
                          <ArrowRight
                            className="size-4 shrink-0 text-yellow-300"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          <Button
            type="button"
            onClick={() => activeItem && startWithItem(activeItem)}
            disabled={!activeItem || !!preparingId}
            className="mt-5 h-12 w-full rounded-full bg-yellow-300 text-base font-semibold text-black hover:bg-yellow-200"
          >
            {preparingId ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Sparkles className="size-4" aria-hidden="true" />
            )}
            {m['prompt_library.use']()}
          </Button>
          <button
            type="button"
            onClick={startBlank}
            className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-medium text-zinc-300 underline decoration-zinc-600 underline-offset-4 hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
          >
            <PenLine className="size-4" aria-hidden="true" />
            {m['growth.creation_nudge.own_prompt']()}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
