'use client';

import { useState, type ComponentType, type SVGProps } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check } from 'lucide-react';

import { apiPost } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type PricingFeature =
  | string
  | { icon?: IconComponent; label: string; tooltip?: string };

export interface PricingPlan {
  id: string;
  name: string;
  description?: string;
  price: string;
  originalPrice?: string;
  currency?: string;
  interval?: string;
  featured?: boolean;
  badge?: string;
  promotionLabel?: string;
  billingNote?: string;
  features: PricingFeature[];
  buttonText?: string;
  productId?: string;
  productName?: string;
  paymentProvider?: string;
  priceInCents?: number;
  credits?: number;
  creditsValidDays?: number;
  plan?: {
    name: string;
    interval: string;
    intervalCount: number;
  };
}

export interface PricingGroup {
  key: string;
  label: string;
  plans: PricingPlan[];
}

export function PricingTable({
  groups,
  onCheckout,
  recommendedTier,
  selectedPlanId,
  valueLabel,
}: {
  groups: PricingGroup[];
  onCheckout?: (plan: PricingPlan) => void;
  recommendedTier?: string;
  selectedPlanId?: string;
  valueLabel?: string;
}) {
  const [activeGroup, setActiveGroup] = useState(groups[0]?.key || '');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const currentGroup = groups.find((g) => g.key === activeGroup) || groups[0];

  const checkoutMutation = useMutation({
    mutationFn: (plan: PricingPlan) =>
      apiPost<{ checkout_url?: string }>('/api/payment/checkout', {
        product_id: plan.productId,
        product_name: plan.productName || plan.name,
        plan_name: plan.plan?.name || plan.name,
        price: plan.priceInCents,
        currency: plan.currency || 'usd',
        type: plan.plan ? 'subscription' : 'one-time',
        description: plan.name,
        plan: plan.plan,
        credits: plan.credits,
        credits_valid_days: plan.creditsValidDays,
        payment_provider: plan.paymentProvider || 'stripe',
      }),
    onSuccess: (data) => {
      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      }
    },
    onSettled: () => {
      setLoadingId(null);
    },
  });

  function handleCheckout(plan: PricingPlan) {
    if (onCheckout) {
      onCheckout(plan);
      return;
    }

    if (!plan.productId || !plan.priceInCents) return;

    setLoadingId(plan.id);
    checkoutMutation.mutate(plan);
  }

  return (
    <div className="space-y-7 sm:space-y-10">
      {/* Group tabs — pill toggle */}
      {groups.length > 1 && (
        <div className="flex justify-center">
          <div className="border-border bg-muted/40 inline-flex max-w-full items-center overflow-x-auto rounded-full border p-1">
            {groups.map((group) => (
              <button
                key={group.key}
                onClick={() => setActiveGroup(group.key)}
                className={cn(
                  'min-h-10 shrink-0 rounded-full px-5 py-1.5 text-sm font-medium transition-colors',
                  activeGroup === group.key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {group.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div
        className={cn(
          'mx-auto grid snap-x snap-mandatory auto-cols-[88%] grid-flow-col gap-3 overflow-x-auto px-1 pb-4 [scrollbar-width:none] sm:snap-none sm:auto-cols-auto sm:grid-flow-row sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden',
          currentGroup?.plans.length === 2
            ? 'max-w-3xl sm:grid-cols-2'
            : currentGroup?.plans.length === 3
              ? 'max-w-5xl sm:grid-cols-2 lg:grid-cols-3'
              : 'max-w-6xl sm:grid-cols-2 lg:grid-cols-4'
        )}
      >
        {currentGroup?.plans.map((plan) => {
          const isRecommended = Boolean(
            recommendedTier && plan.id.startsWith(recommendedTier)
          );
          const perImage =
            plan.priceInCents && plan.credits
              ? plan.priceInCents / (plan.credits / 5) / 100
              : null;
          return (
            <div
              key={plan.id}
              className={cn(
                'border-border relative flex min-w-0 snap-center flex-col rounded-[1.5rem] border p-6 transition-all sm:rounded-2xl sm:p-8',
                isRecommended || plan.featured
                  ? 'bg-card ring-foreground/10 shadow-md ring-1'
                  : 'bg-background hover:border-foreground/30',
                selectedPlanId === plan.id &&
                  'ring-primary border-primary shadow-primary/10 shadow-lg ring-2'
              )}
            >
              {plan.badge && !isRecommended ? (
                <span className="bg-primary text-primary-foreground absolute top-5 right-5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase">
                  {plan.badge}
                </span>
              ) : null}
              {isRecommended ? (
                <span className="absolute top-5 right-5 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white uppercase">
                  {m['landing.pricing.recommended']()}
                </span>
              ) : null}
              <div data-tour={plan.featured ? 'subscription-plan' : undefined}>
                {/* Plan name */}
                {plan.name && (
                  <p className="text-foreground mb-2 text-sm font-medium">
                    {plan.name}
                  </p>
                )}

                {plan.promotionLabel && (
                  <p className="text-primary mb-2 text-xs font-semibold tracking-[0.12em] uppercase">
                    {plan.promotionLabel}
                  </p>
                )}

                {/* Price */}
                <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-primary font-serif text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                    {plan.price}
                  </span>
                  {plan.originalPrice && (
                    <span
                      className="text-muted-foreground text-base tabular-nums line-through decoration-2"
                      aria-label={`${m['landing.pricing.original_price']()} ${plan.originalPrice}`}
                    >
                      {plan.originalPrice}
                    </span>
                  )}
                  {plan.interval && (
                    <span className="text-muted-foreground text-sm">
                      /{plan.interval}
                    </span>
                  )}
                </div>

                {/* Description */}
                {plan.description && (
                  <p className="text-muted-foreground mb-3 text-sm">
                    {plan.description}
                  </p>
                )}
                {plan.billingNote && (
                  <p className="bg-muted text-foreground mb-8 rounded-lg px-3 py-2 text-xs leading-5">
                    {plan.billingNote}
                  </p>
                )}
                {perImage !== null && valueLabel ? (
                  <p className="text-primary mb-5 text-sm font-semibold">
                    {valueLabel.replace('{price}', `$${perImage.toFixed(3)}`)}
                  </p>
                ) : null}
              </div>

              {/* CTA — full-width pill */}
              <Button
                data-tour={plan.featured ? 'subscription-checkout' : undefined}
                variant={plan.featured ? 'default' : 'outline'}
                className="h-10 w-full rounded-full text-sm font-medium"
                onClick={() => handleCheckout(plan)}
                disabled={loadingId === plan.id}
              >
                {loadingId === plan.id
                  ? m['common.pricing.processing']()
                  : plan.buttonText || m['common.pricing.get_started']()}
              </Button>

              {/* Features */}
              <ul className="mt-6 space-y-3 sm:mt-8">
                {plan.features.map((feature, i) => {
                  const isObj = typeof feature !== 'string';
                  const Icon: IconComponent = (isObj && feature.icon) || Check;
                  const label = isObj ? feature.label : feature;
                  return (
                    <li key={i} className="flex items-center gap-2.5 text-sm">
                      <Icon className="text-muted-foreground size-4 shrink-0" />
                      <span className="text-foreground/90">{label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
