import { useEffect, useRef, useState } from 'react';
import { ArrowRight, PenLine, Sparkles } from 'lucide-react';

import {
  HOMEPAGE_EXAMPLES,
  homepageExampleSelection,
  homepageImage,
} from '@/config/homepage-examples';
import { trackFunnelEvent } from '@/lib/analytics-events';
import { prepareBananaGenerator } from '@/lib/banana-generator-navigation';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

const NUDGE_DELAY_MS = 5_000;
const NUDGE_EXAMPLE_IDS = ['product', 'character', 'text', 'social'] as const;

export function CreationNudge() {
  const [open, setOpen] = useState(false);
  const shownRef = useRef(false);
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

  function startWithExample(example: (typeof HOMEPAGE_EXAMPLES)[number]) {
    setOpen(false);
    prepareBananaGenerator(homepageExampleSelection(example));
    trackFunnelEvent('creation_example_selected', {
      source: 'homepage_5s',
      example: example.id,
    });
  }

  function startBlank() {
    setOpen(false);
    prepareBananaGenerator({ focus: 'prompt' });
    trackFunnelEvent('generator_focused', { source: 'homepage_5s' });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] overflow-y-auto border-zinc-700 bg-zinc-950 p-0 text-white shadow-2xl sm:max-w-3xl sm:rounded-[1.75rem]">
        <div className="bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.2),transparent_42%)] px-5 pt-9 pb-6 sm:px-8 sm:pt-10 sm:pb-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-300/40 bg-yellow-300/10 px-3 py-1 text-xs font-semibold tracking-wide text-yellow-300 uppercase">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {m['growth.creation_nudge.eyebrow']()}
          </div>
          <DialogTitle className="max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            {m['growth.creation_nudge.title']()}
          </DialogTitle>
          <DialogDescription className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
            {m['growth.creation_nudge.description']()}
          </DialogDescription>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {examples.map((example) => (
              <button
                key={example.id}
                type="button"
                onClick={() => startWithExample(example)}
                className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] text-left transition-colors hover:border-yellow-300/70 hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
              >
                <span className="block aspect-[4/3] overflow-hidden bg-zinc-900">
                  <img
                    src={homepageImage(example.imageId)}
                    alt=""
                    width="480"
                    height="360"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
                  />
                </span>
                <span className="flex min-h-14 items-center justify-between gap-2 px-3 py-2 text-sm font-semibold">
                  {labels[example.id as (typeof NUDGE_EXAMPLE_IDS)[number]]}
                  <ArrowRight
                    className="size-4 shrink-0 text-yellow-300"
                    aria-hidden="true"
                  />
                </span>
              </button>
            ))}
          </div>

          <Button
            type="button"
            onClick={() => startWithExample(examples[0])}
            className="mt-6 h-12 w-full rounded-full bg-yellow-300 text-base font-semibold text-black hover:bg-yellow-200"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            {m['growth.creation_nudge.start']()}
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
