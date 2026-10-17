import type { CheckoutProduct } from '@/types/checkout';

import type { GeneratorDraft } from '@/lib/generator-entry';

export const GENERATION_PURCHASE_INTENT_KEY =
  'nano-site:generation-purchase:v1';
export const GENERATION_RESUME_MAX_AGE_MS = 30 * 60 * 1000;

export type GenerationPurchaseIntent = {
  id: string;
  draft: GeneratorDraft;
  credits: number;
  createdAt: number;
};

export function recommendGenerationProduct(
  products: CheckoutProduct[],
  shortfall: number
) {
  const required = Math.max(1, Math.ceil(shortfall));
  return products
    .filter(
      (product) =>
        !product.recurring &&
        !product.prepaidMonths &&
        product.credits >= required
    )
    .sort(
      (left, right) =>
        left.priceInCents - right.priceInCents || left.credits - right.credits
    )[0];
}

export function createGenerationPurchaseIntent(
  draft: GeneratorDraft,
  credits: number,
  now = Date.now()
): GenerationPurchaseIntent {
  return {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${now}-${Math.random().toString(36).slice(2)}`,
    draft,
    credits,
    createdAt: now,
  };
}

export function parseGenerationPurchaseIntent(
  value: unknown,
  now = Date.now()
): GenerationPurchaseIntent | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<GenerationPurchaseIntent>;
  if (
    typeof candidate.id !== 'string' ||
    !candidate.id ||
    typeof candidate.credits !== 'number' ||
    !Number.isSafeInteger(candidate.credits) ||
    candidate.credits <= 0 ||
    typeof candidate.createdAt !== 'number' ||
    now - candidate.createdAt < 0 ||
    now - candidate.createdAt > GENERATION_RESUME_MAX_AGE_MS ||
    !candidate.draft ||
    typeof candidate.draft !== 'object'
  ) {
    return null;
  }
  return candidate as GenerationPurchaseIntent;
}
