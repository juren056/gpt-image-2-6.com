import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Images, Sparkles } from 'lucide-react';

import { useRouter } from '@/core/i18n/navigation';
import { pricingCatalog } from '@/config/pricing';
import {
  imageRequestEstimates,
  PRIMARY_IMAGE_MODEL,
} from '@/config/product-facts';
import { trackFunnelEvent } from '@/lib/analytics-events';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

const OFFER_DELAY_MS = 5_000;
const OFFER_PRODUCT_ID = 'credits_boost';

export function CreditPackOffer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const shownRef = useRef(false);
  const product = pricingCatalog[OFFER_PRODUCT_ID];
  const estimate = imageRequestEstimates(product.credits)[0];

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
        source: 'homepage_credit_offer',
        product: OFFER_PRODUCT_ID,
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

  function handleCheckout() {
    trackFunnelEvent('credit_pack_clicked', {
      source: 'homepage_credit_offer',
      product: OFFER_PRODUCT_ID,
    });
    setOpen(false);
    router.push(
      `/checkout?product=${OFFER_PRODUCT_ID}&redirect=${encodeURIComponent('/settings/billing')}`
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-lg overflow-hidden border-zinc-700 bg-zinc-950 p-0 text-white shadow-2xl sm:rounded-[1.75rem]">
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.24),transparent_42%)] px-6 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-yellow-300 uppercase">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {m['landing.pricing.credit_packs']()}
          </div>
          <DialogTitle className="max-w-sm text-3xl leading-tight font-semibold tracking-tight text-white sm:text-4xl">
            {m['landing.pricing.pack_boost']()}
          </DialogTitle>
          <DialogDescription className="mt-3 max-w-md text-sm leading-6 text-zinc-300 sm:text-base">
            {m['landing.pricing.pack_boost_desc']()}
          </DialogDescription>

          <div className="mt-7 flex items-end gap-3">
            <span className="text-5xl font-semibold tracking-tight text-yellow-300 tabular-nums sm:text-6xl">
              ${(product.priceInCents / 100).toFixed(2)}
            </span>
            <span className="pb-1.5 text-sm text-zinc-400">
              {m['landing.pricing.pack_one_time']()}
            </span>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
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
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
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
            <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
            {m['landing.pricing.pack_validity']()}
          </div>

          <Button
            className="mt-7 h-12 w-full rounded-full bg-yellow-300 text-base font-semibold text-zinc-950 hover:bg-yellow-200"
            onClick={handleCheckout}
          >
            {m['landing.pricing.buy_credits']()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
