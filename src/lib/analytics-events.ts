export type FunnelEvent =
  | 'landing_view'
  | 'prompt_started'
  | 'generate_clicked'
  | 'generate_started'
  | 'generate_success'
  | 'generate_failed'
  | 'anonymous_generation'
  | 'anonymous_generate_started'
  | 'anonymous_generate_success'
  | 'anonymous_generate_failed'
  | 'signup_modal_shown'
  | 'google_signup_clicked'
  | 'email_signup_clicked'
  | 'signup_success'
  | 'signup_after_generation'
  | 'second_generation'
  | 'image_edit_started'
  | 'image_edit_success'
  | 'credit_balance_low'
  | 'prompt_used'
  | 'recipe_prefilled'
  | 'recipe_prefill_failed'
  | 'evidence_opened'
  | 'pricing_view'
  | 'pricing_viewed'
  | 'offer_group_selected'
  | 'offer_product_selected'
  | 'checkout_started'
  | 'credit_pack_clicked'
  | 'subscription_clicked'
  | 'purchase_success'
  | 'image_download'
  | 'result_next_step'
  | 'lab_to_generator';

const PRIVATE_ANALYTICS_KEYS = new Set([
  'prompt',
  'imageurl',
  'image_url',
  'email',
  'ip',
  'ip_address',
  'authorization',
  'token',
  'transaction_id',
  'order_no',
]);

export type Ga4PurchaseEvent = {
  event: 'purchase';
  params: {
    transaction_id: string;
    value: number;
    currency: string;
  };
};

export function buildGa4PurchaseEvent(input: {
  transactionId: string;
  amountMinor: number;
  currency: string;
}): Ga4PurchaseEvent | null {
  const transactionId = input.transactionId.trim();
  const currency = input.currency.trim().toUpperCase();
  if (!transactionId || !/^[A-Z]{3}$/.test(currency)) return null;
  if (!Number.isInteger(input.amountMinor) || input.amountMinor < 0)
    return null;
  return {
    event: 'purchase',
    params: {
      transaction_id: transactionId,
      value: input.amountMinor / 100,
      currency,
    },
  };
}

export function normalizeFunnelEvent(
  event: FunnelEvent,
  params: Record<string, string | number | boolean>
) {
  const normalizedEvent = event === 'pricing_viewed' ? 'pricing_view' : event;
  const safeParams = Object.fromEntries(
    Object.entries(params).filter(
      ([key]) => !PRIVATE_ANALYTICS_KEYS.has(key.toLowerCase())
    )
  );
  return { event: normalizedEvent, params: safeParams };
}

export function trackFunnelEvent(
  event: FunnelEvent,
  params: Record<string, string | number | boolean> = {}
) {
  if (typeof window === 'undefined') return;
  const normalized = normalizeFunnelEvent(event, params);
  const analyticsWindow = window as typeof window & {
    gtag?: (...args: unknown[]) => void;
    plausible?: (...args: unknown[]) => void;
  };
  analyticsWindow.gtag?.('event', normalized.event, normalized.params);
  analyticsWindow.plausible?.(normalized.event, {
    props: normalized.params,
  });
}
