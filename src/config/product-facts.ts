import {
  CREATIVE_MODELS,
  getCreativeUnitCredits,
} from '@/config/creative-studio';
import { pricingCatalog } from '@/config/pricing';

export const PRIMARY_IMAGE_MODEL = CREATIVE_MODELS.find(
  (model) => model.id === 'nano-banana-2.1'
)!;

export const DEFAULT_IMAGE_QUOTES = {
  model: PRIMARY_IMAGE_MODEL.label,
  resolution: PRIMARY_IMAGE_MODEL.resolutions?.[0] ?? 'provider default',
  credits: getCreativeUnitCredits(PRIMARY_IMAGE_MODEL, 'generate') ?? 0,
  nano2:
    CREATIVE_MODELS.find((model) => model.id === 'nano-banana-2')?.credits
      .generate ?? 0,
  pro:
    CREATIVE_MODELS.find((model) => model.id === 'nano-banana-pro')?.credits
      .generate ?? 0,
  lite:
    CREATIVE_MODELS.find((model) => model.id === 'nano-banana-2-lite')?.credits
      .generate ?? 0,
};

/** Estimates count quoted requests, not usable finished artwork. */
export function imageRequestEstimates(credits: number) {
  return Object.entries(PRIMARY_IMAGE_MODEL.resolutionCredits ?? {}).map(
    ([resolution, unitCredits]) => ({
      resolution,
      unitCredits,
      count: Math.floor(credits / unitCredits),
    })
  );
}

export function productCredits(productId: string, fallback: number) {
  return pricingCatalog[productId]?.credits ?? fallback;
}

export function welcomeReward(configs?: Record<string, string>) {
  if (configs?.initial_credits_enabled !== 'true') return null;
  const amount = Number(configs.initial_credits_amount);
  const days = Number(configs.initial_credits_valid_days ?? '0');
  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    !Number.isSafeInteger(days) ||
    days < 0
  )
    return null;
  return { amount, days };
}
