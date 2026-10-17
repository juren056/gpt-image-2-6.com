import { useEffect, useRef, useState } from 'react';
import { ArrowRight, PenLine, Sparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import {
  HOMEPAGE_EXAMPLES,
  homepageExampleSelection,
  homepageImage,
} from '@/config/homepage-examples';
import { pricingCatalog } from '@/config/pricing';
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
type PlanPreview = {
  name: string;
  price: string;
  credits: string;
  badge?: string;
};

function catalogPrice(productId: string) {
  const priceInCents = pricingCatalog[productId]?.priceInCents;
  return `$${((priceInCents ?? 0) / 100).toFixed(2)}`;
}

export function CreationNudge() {
  const [open, setOpen] = useState(false);
  const [planView, setPlanView] = useState<'one-time' | 'monthly'>('one-time');
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
  const oneTimePlans: PlanPreview[] = [
    {
      name: m['landing.pricing.pack_boost'](),
      price: catalogPrice('credits_boost'),
      credits: m['landing.pricing.pack_boost_credits'](),
    },
    {
      name: m['landing.pricing.pack_flex'](),
      price: catalogPrice('credits_flex'),
      credits: m['landing.pricing.pack_flex_credits'](),
      badge: m['landing.pricing.popular'](),
    },
    {
      name: m['landing.pricing.pack_power'](),
      price: catalogPrice('credits_power'),
      credits: m['landing.pricing.pack_power_credits'](),
      badge: m['landing.pricing.best_value'](),
    },
  ];
  const monthlyPlans: PlanPreview[] = [
    {
      name: m['landing.pricing.starter'](),
      price: catalogPrice('starter_monthly'),
      credits: m['landing.pricing.feature_starter_credits'](),
    },
    {
      name: m['landing.pricing.creator'](),
      price: catalogPrice('creator_monthly'),
      credits: m['landing.pricing.feature_creator_credits'](),
      badge: m['landing.pricing.popular'](),
    },
    {
      name: m['landing.pricing.pro'](),
      price: catalogPrice('pro_monthly'),
      credits: m['landing.pricing.feature_pro_credits'](),
      badge: m['landing.pricing.best_value'](),
    },
  ];
  const visiblePlans = planView === 'one-time' ? oneTimePlans : monthlyPlans;

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
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] overflow-y-auto border-zinc-700 bg-zinc-950 p-0 text-white shadow-2xl sm:max-w-5xl sm:rounded-[1.75rem]">
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

          <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(19rem,0.65fr)]">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {examples.map((example) => (
                  <button
                    key={example.id}
                    type="button"
                    onClick={() => startWithExample(example)}
                    className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] text-left transition-colors hover:border-yellow-300/70 hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
                  >
                    <span className="block aspect-[16/9] overflow-hidden bg-zinc-900">
                      <img
                        src={homepageImage(example.imageId)}
                        alt=""
                        width="480"
                        height="270"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
                      />
                    </span>
                    <span className="flex min-h-12 items-center justify-between gap-2 px-3 py-2 text-sm font-semibold">
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
                className="mt-5 h-12 w-full rounded-full bg-yellow-300 text-base font-semibold text-black hover:bg-yellow-200"
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

            <aside className="order-1 rounded-2xl border border-white/10 bg-black/35 p-3 lg:order-2">
              <div
                role="tablist"
                aria-label={m['landing.pricing.title']()}
                className="grid grid-cols-2 rounded-xl border border-white/10 bg-white/[0.04] p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={planView === 'one-time'}
                  onClick={() => setPlanView('one-time')}
                  className={`min-h-10 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300 ${
                    planView === 'one-time'
                      ? 'bg-yellow-300 text-black'
                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {m['landing.pricing.credit_packs']()}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={planView === 'monthly'}
                  onClick={() => setPlanView('monthly')}
                  className={`min-h-10 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300 ${
                    planView === 'monthly'
                      ? 'bg-yellow-300 text-black'
                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {m['landing.pricing.card_monthly']()}
                </button>
              </div>

              <div className="mt-2 grid gap-1.5 sm:grid-cols-3 lg:grid-cols-1">
                {visiblePlans.map((plan, index) => (
                  <article
                    key={`${planView}-${plan.name}`}
                    className={`rounded-xl border px-3 py-2 ${
                      planView === 'one-time' && index === 0
                        ? 'border-yellow-300/80 bg-yellow-300/10'
                        : 'border-white/10 bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {plan.name}
                        </p>
                        <p className="mt-1 text-xl leading-none font-semibold text-yellow-300">
                          {plan.price}
                          {planView === 'monthly' && (
                            <span className="ml-1 text-xs font-medium text-zinc-400">
                              / {m['landing.pricing.monthly']()}
                            </span>
                          )}
                        </p>
                      </div>
                      {plan.badge && (
                        <span className="rounded-full bg-yellow-300 px-2 py-1 text-[10px] leading-none font-bold tracking-wide text-black uppercase">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-zinc-300">{plan.credits}</p>
                  </article>
                ))}
              </div>

              <p className="mt-2 text-xs leading-5 text-zinc-400">
                {planView === 'one-time'
                  ? `${m['landing.pricing.pack_one_time']()} · ${m['landing.pricing.pack_validity']()}`
                  : m['landing.pricing.auto_renew_note']()}
              </p>
              <Link
                href="/pricing"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-yellow-300 underline decoration-yellow-300/40 underline-offset-4 hover:text-yellow-200 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
              >
                {m['landing.pricing.view_all']()}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </aside>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
