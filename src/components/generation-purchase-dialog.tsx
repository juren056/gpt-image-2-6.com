import type { CheckoutProduct } from '@/types/checkout';
import { Check, CreditCard, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: CheckoutProduct[];
  recommendedProductId?: string;
  selectedProductId?: string;
  requiredCredits: number;
  balance: number;
  copy: Record<string, string>;
  onSelect: (productId: string) => void;
  onCheckout: () => void;
  onComparePlans: () => void;
};

export function GenerationPurchaseDialog({
  open,
  onOpenChange,
  products,
  recommendedProductId,
  selectedProductId,
  requiredCredits,
  balance,
  copy,
  onSelect,
  onCheckout,
  onComparePlans,
}: Props) {
  const selected = products.find(
    (product) => product.productId === selectedProductId
  );
  const shortfall = Math.max(0, requiredCredits - balance);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] overflow-y-auto border-zinc-700 bg-zinc-950 p-0 text-white shadow-2xl sm:max-w-xl sm:rounded-[1.75rem]">
        <div className="bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.18),transparent_42%)] px-5 pt-9 pb-6 sm:px-8 sm:pt-10 sm:pb-8">
          <div className="mb-5 flex size-11 items-center justify-center rounded-full bg-yellow-300 text-black">
            <Sparkles className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            {copy.purchase_title}
          </DialogTitle>
          <DialogDescription className="mt-3 text-sm leading-6 text-zinc-300 sm:text-base">
            {copy.purchase_description}
          </DialogDescription>

          <dl className="mt-6 grid grid-cols-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] text-center">
            {[
              [copy.purchase_required, requiredCredits],
              [copy.purchase_balance, balance],
              [copy.purchase_shortfall, shortfall],
            ].map(([label, value], index) => (
              <div
                key={String(label)}
                className={cn(
                  'px-2 py-3',
                  index > 0 && 'border-l border-white/10'
                )}
              >
                <dt className="text-[11px] text-zinc-400 sm:text-xs">
                  {label}
                </dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums sm:text-xl">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <div
            className="mt-6 grid gap-2 sm:grid-cols-3"
            role="radiogroup"
            aria-label={copy.purchase_choose_pack}
          >
            {products.map((product) => {
              const active = product.productId === selectedProductId;
              const recommended = product.productId === recommendedProductId;
              return (
                <button
                  key={product.productId}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onSelect(product.productId)}
                  className={cn(
                    'relative min-h-24 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300',
                    active
                      ? 'border-yellow-300 bg-yellow-300/10'
                      : 'border-white/10 bg-white/[0.035] hover:border-white/25'
                  )}
                >
                  <span className="flex items-start justify-between gap-2">
                    <strong className="text-sm">{product.productName}</strong>
                    {active ? (
                      <Check
                        className="size-4 text-yellow-300"
                        aria-hidden="true"
                      />
                    ) : null}
                  </span>
                  <span className="mt-2 block text-xl font-semibold text-yellow-300 tabular-nums">
                    ${(product.priceInCents / 100).toFixed(2)}
                  </span>
                  <span className="mt-1 block text-xs text-zinc-400">
                    {product.credits.toLocaleString()} {copy.credits}
                  </span>
                  {recommended ? (
                    <span className="mt-2 inline-flex rounded-full bg-yellow-300 px-2 py-0.5 text-[9px] font-bold tracking-wide text-black uppercase">
                      {copy.purchase_recommended}
                    </span>
                  ) : null}
                </button>
              );
            })}
            {products.length === 0 ? (
              <p
                className="col-span-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-5 text-center text-sm text-zinc-400"
                role="status"
              >
                {copy.checking}
              </p>
            ) : null}
          </div>

          <p className="mt-4 text-xs leading-5 text-zinc-400">
            {copy.purchase_validity}
          </p>

          <Button
            type="button"
            className="mt-6 h-12 w-full rounded-full bg-yellow-300 text-base font-semibold text-black hover:bg-yellow-200"
            disabled={!selected}
            onClick={onCheckout}
          >
            <CreditCard className="size-4" aria-hidden="true" />
            {selected
              ? `${copy.purchase_pay} $${(selected.priceInCents / 100).toFixed(2)}`
              : copy.purchase_pay}
          </Button>
          <button
            type="button"
            className="mt-4 w-full text-center text-sm font-medium text-zinc-300 underline decoration-zinc-600 underline-offset-4 hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
            onClick={onComparePlans}
          >
            {copy.purchase_compare_monthly}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
