import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { CalendarDays, CreditCard, Images, Sparkles } from 'lucide-react';

import { Link, useRouter } from '@/core/i18n/navigation';
import { pricingCatalog } from '@/config/pricing';
import {
  imageRequestEstimates,
  PRIMARY_IMAGE_MODEL,
} from '@/config/product-facts';
import { trackFunnelEvent } from '@/lib/analytics-events';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

const OFFER_DELAY_MS = 5_000;
const OFFER_GROUPS = ['credit-packs', 'monthly'] as const;
const OFFER_PRODUCTS = {
  'credit-packs': ['credits_boost', 'credits_flex', 'credits_power'],
  monthly: ['starter_monthly', 'creator_monthly', 'pro_monthly'],
} as const;

type OfferGroup = (typeof OFFER_GROUPS)[number];
type OfferProductId =
  (typeof OFFER_PRODUCTS)[keyof typeof OFFER_PRODUCTS][number];

export function CreditPackOffer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<OfferGroup>('credit-packs');
  const [selectedByGroup, setSelectedByGroup] = useState<
    Record<OfferGroup, OfferProductId>
  >({
    'credit-packs': 'credits_boost',
    monthly: 'starter_monthly',
  });
  const shownRef = useRef(false);
  const groupRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const productRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedProductId = selectedByGroup[activeGroup];
  const product = pricingCatalog[selectedProductId];
  const estimate = imageRequestEstimates(product.credits)[0];
  const productIds = OFFER_PRODUCTS[activeGroup];
  const isSubscription = activeGroup === 'monthly';

  const productCopy: Record<
    OfferProductId,
    { name: string; description: string; badge?: string }
  > = {
    credits_boost: {
      name: m['landing.pricing.pack_boost'](),
      description: m['landing.pricing.pack_boost_desc'](),
    },
    credits_flex: {
      name: m['landing.pricing.pack_flex'](),
      description: m['landing.pricing.pack_flex_desc'](),
      badge: m['landing.pricing.popular'](),
    },
    credits_power: {
      name: m['landing.pricing.pack_power'](),
      description: m['landing.pricing.pack_power_desc'](),
      badge: m['landing.pricing.best_value'](),
    },
    starter_monthly: {
      name: m['landing.pricing.starter'](),
      description: m['landing.pricing.starter_desc'](),
    },
    creator_monthly: {
      name: m['landing.pricing.creator'](),
      description: m['landing.pricing.creator_desc'](),
      badge: m['landing.pricing.popular'](),
    },
    pro_monthly: {
      name: m['landing.pricing.pro'](),
      description: m['landing.pricing.pro_desc'](),
      badge: m['landing.pricing.best_value'](),
    },
  };
  const selectedCopy = productCopy[selectedProductId];

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
      trackFunnelEvent('pricing_view', {
        source: 'homepage_plan_offer',
        group: 'credit-packs',
        product: 'credits_boost',
      });
    };
    const timer = window.setTimeout(() => {
      delayElapsed = true;
      maybeShow();
    }, OFFER_DELAY_MS);
    document.addEventListener('visibilitychange', maybeShow);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', maybeShow);
    };
  }, []);

  function selectGroup(group: OfferGroup) {
    setActiveGroup(group);
    trackFunnelEvent('offer_group_selected', {
      source: 'homepage_plan_offer',
      group,
      product: selectedByGroup[group],
    });
  }

  function selectProduct(productId: OfferProductId) {
    setSelectedByGroup((current) => ({
      ...current,
      [activeGroup]: productId,
    }));
    trackFunnelEvent('offer_product_selected', {
      source: 'homepage_plan_offer',
      group: activeGroup,
      product: productId,
    });
  }

  function handleGroupKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + direction + OFFER_GROUPS.length) % 2;
    selectGroup(OFFER_GROUPS[nextIndex]);
    groupRefs.current[nextIndex]?.focus();
  }

  function handleProductKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    if (
      !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
    )
      return;
    event.preventDefault();
    const direction = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
    const nextIndex =
      (index + direction + productIds.length) % productIds.length;
    selectProduct(productIds[nextIndex]);
    productRefs.current[nextIndex]?.focus();
  }

  function handleCheckout() {
    trackFunnelEvent(
      isSubscription ? 'subscription_clicked' : 'credit_pack_clicked',
      {
        source: 'homepage_plan_offer',
        group: activeGroup,
        product: selectedProductId,
      }
    );
    setOpen(false);
    router.push(
      `/checkout?product=${selectedProductId}&redirect=${encodeURIComponent('/settings/billing')}`
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] overflow-y-auto border-zinc-700 bg-zinc-950 p-0 text-white shadow-2xl sm:max-w-2xl sm:rounded-[1.75rem]">
        <div className="relative bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.2),transparent_38%)] px-5 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8">
          <div
            className="mb-7 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.05] p-1"
            role="tablist"
            aria-label={m['landing.pricing.title']()}
          >
            {OFFER_GROUPS.map((group, index) => (
              <button
                key={group}
                ref={(element) => {
                  groupRefs.current[index] = element;
                }}
                id={`offer-tab-${group}`}
                type="button"
                role="tab"
                aria-selected={activeGroup === group}
                aria-controls="offer-products"
                tabIndex={activeGroup === group ? 0 : -1}
                onClick={() => selectGroup(group)}
                onKeyDown={(event) => handleGroupKeyDown(event, index)}
                className={cn(
                  'min-h-11 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300',
                  activeGroup === group
                    ? 'bg-yellow-300 text-zinc-950'
                    : 'text-zinc-300 hover:bg-white/[0.06] hover:text-white'
                )}
              >
                {group === 'credit-packs'
                  ? m['landing.pricing.credit_packs']()
                  : m['landing.pricing.card_monthly']()}
              </button>
            ))}
          </div>

          <div
            id="offer-products"
            role="tabpanel"
            aria-labelledby={`offer-tab-${activeGroup}`}
          >
            <div
              className="grid gap-2 sm:grid-cols-3"
              role="radiogroup"
              aria-label={
                activeGroup === 'credit-packs'
                  ? m['landing.pricing.credit_packs']()
                  : m['landing.pricing.card_monthly']()
              }
            >
              {productIds.map((productId, index) => {
                const item = pricingCatalog[productId];
                const copy = productCopy[productId];
                const selected = selectedProductId === productId;
                return (
                  <button
                    key={productId}
                    ref={(element) => {
                      productRefs.current[index] = element;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => selectProduct(productId)}
                    onKeyDown={(event) => handleProductKeyDown(event, index)}
                    className={cn(
                      'relative min-h-[5.75rem] rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300',
                      selected
                        ? 'border-yellow-300 bg-yellow-300/10'
                        : 'border-white/10 bg-white/[0.035] hover:border-white/25 hover:bg-white/[0.06]'
                    )}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-white">
                        {copy.name}
                      </span>
                      {copy.badge ? (
                        <span className="shrink-0 rounded-full bg-yellow-300 px-2 py-0.5 text-[9px] font-bold tracking-wide text-zinc-950 uppercase">
                          {copy.badge}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-2 flex items-baseline justify-between gap-2">
                      <span className="text-xl font-semibold text-yellow-300 tabular-nums">
                        ${(item.priceInCents / 100).toFixed(2)}
                      </span>
                      <span className="text-xs text-zinc-400 tabular-nums">
                        {item.credits.toLocaleString()}{' '}
                        {m['growth.rewards.credit_unit']()}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              key={selectedProductId}
              className="animate-in fade-in-0 mt-7 duration-150 motion-reduce:animate-none"
            >
              <DialogTitle className="max-w-lg text-3xl leading-tight font-semibold tracking-tight text-white sm:text-4xl">
                {selectedCopy.name}
              </DialogTitle>
              <DialogDescription className="mt-2 max-w-xl text-sm leading-6 text-zinc-300 sm:text-base">
                {selectedCopy.description}
              </DialogDescription>

              <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="text-5xl font-semibold tracking-tight text-yellow-300 tabular-nums sm:text-6xl">
                  ${(product.priceInCents / 100).toFixed(2)}
                </span>
                <span className="pb-1.5 text-sm text-zinc-400">
                  {isSubscription
                    ? m['landing.pricing.monthly']()
                    : m['landing.pricing.pack_one_time']()}
                </span>
              </div>

              <div className="mt-6 grid overflow-hidden rounded-xl border border-white/10 bg-white/[0.05] sm:grid-cols-2">
                <div className="p-4 sm:border-r sm:border-white/10">
                  <Sparkles
                    className="mb-3 size-5 text-yellow-300"
                    aria-hidden="true"
                  />
                  <p className="text-2xl font-semibold tabular-nums">
                    {product.credits.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {m['growth.rewards.credit_unit']()}
                  </p>
                </div>
                <div className="border-t border-white/10 p-4 sm:border-t-0">
                  <Images
                    className="mb-3 size-5 text-yellow-300"
                    aria-hidden="true"
                  />
                  <p className="text-sm leading-5 font-medium text-white">
                    {m['landing.pricing.request_estimate']({
                      model: PRIMARY_IMAGE_MODEL.label,
                      resolution: estimate.resolution,
                      count: estimate.count,
                      credits: estimate.unitCredits,
                    })}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
                {isSubscription ? (
                  <CreditCard className="size-4 shrink-0" aria-hidden="true" />
                ) : (
                  <CalendarDays
                    className="size-4 shrink-0"
                    aria-hidden="true"
                  />
                )}
                {isSubscription
                  ? m['landing.pricing.auto_renew_note']()
                  : m['landing.pricing.pack_validity']()}
              </div>

              <Button
                className="mt-6 h-12 w-full rounded-full bg-yellow-300 text-base font-semibold text-zinc-950 hover:bg-yellow-200"
                onClick={handleCheckout}
              >
                {isSubscription
                  ? `${m['common.pricing.get_started']()} · ${selectedCopy.name}`
                  : `${m['landing.pricing.buy_credits']()} · ${product.credits.toLocaleString()}`}
              </Button>
              <div className="mt-4 text-center">
                <Link
                  href="/pricing"
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-zinc-300 underline decoration-zinc-600 underline-offset-4 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
                >
                  {m['landing.pricing.view_all']()}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
