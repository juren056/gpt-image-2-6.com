import { PaymentInterval, PaymentType } from '@/core/payment/types';

export type PricingPlanInfo = {
  name: string;
  interval: PaymentInterval;
  intervalCount: number;
};

export type PricingProduct = {
  productId: string;
  productName: string;
  planName: string;
  description: string;
  type: PaymentType;
  priceInCents: number;
  currency: string;
  credits: number;
  creditsValidDays?: number;
  plan?: PricingPlanInfo;
  membership?: {
    renewalMode: 'auto' | 'prepaid';
    durationMonths?: number;
  };
  requiredProvider?: string;
  paymentMethodTypes?: string[];
};

const subscription = (
  productId: string,
  name: string,
  priceInCents: number,
  credits: number,
  interval: PaymentInterval
): PricingProduct => ({
  productId,
  productName: name,
  planName: name,
  description: `${name} ${
    interval === PaymentInterval.MONTH ? 'Monthly' : 'Yearly'
  }`,
  type: PaymentType.SUBSCRIPTION,
  priceInCents,
  currency: 'usd',
  credits,
  plan: { name, interval, intervalCount: 1 },
  membership: { renewalMode: 'auto' },
  requiredProvider: 'stripe',
  paymentMethodTypes: ['card'],
});

const prepaidMonthlyMembership = (
  productId: string,
  name: string,
  priceInCents: number,
  credits: number
): PricingProduct => ({
  productId,
  productName: `${name} Prepaid Membership`,
  planName: name,
  description: `${name} monthly prepaid membership · one-time payment · no automatic renewal`,
  type: PaymentType.ONE_TIME,
  priceInCents,
  currency: 'usd',
  credits,
  plan: {
    name,
    interval: PaymentInterval.MONTH,
    intervalCount: 1,
  },
  membership: { renewalMode: 'prepaid', durationMonths: 1 },
  requiredProvider: 'stripe',
  paymentMethodTypes: ['alipay'],
});

const creditPack = (
  productId: string,
  name: string,
  priceInCents: number,
  credits: number
): PricingProduct => ({
  productId,
  productName: `${name} Credit Pack`,
  planName: name,
  description: `${credits.toLocaleString('en-US')} credits · one-time purchase · valid for 365 days`,
  type: PaymentType.ONE_TIME,
  priceInCents,
  currency: 'usd',
  credits,
  creditsValidDays: 365,
});

/** Server-authoritative catalog. Stripe product IDs are configured later. */
export const pricingCatalog: Record<string, PricingProduct> = {
  starter_monthly: subscription(
    'starter_monthly',
    'Starter',
    899,
    400,
    PaymentInterval.MONTH
  ),
  creator_monthly: subscription(
    'creator_monthly',
    'Creator',
    1999,
    1100,
    PaymentInterval.MONTH
  ),
  pro_monthly: subscription(
    'pro_monthly',
    'Pro',
    4499,
    2800,
    PaymentInterval.MONTH
  ),
  starter_prepaid_monthly: prepaidMonthlyMembership(
    'starter_prepaid_monthly',
    'Starter',
    899,
    400
  ),
  creator_prepaid_monthly: prepaidMonthlyMembership(
    'creator_prepaid_monthly',
    'Creator',
    1999,
    1100
  ),
  pro_prepaid_monthly: prepaidMonthlyMembership(
    'pro_prepaid_monthly',
    'Pro',
    4499,
    2800
  ),
  credits_boost: creditPack('credits_boost', 'Mini Pack', 499, 200),
  credits_flex: creditPack('credits_flex', 'Flex', 1199, 600),
  credits_power: creditPack('credits_power', 'Power', 2699, 1500),
  starter_yearly: subscription(
    'starter_yearly',
    'Starter',
    9170,
    4800,
    PaymentInterval.YEAR
  ),
  creator_yearly: subscription(
    'creator_yearly',
    'Creator',
    20390,
    13200,
    PaymentInterval.YEAR
  ),
  pro_yearly: subscription(
    'pro_yearly',
    'Pro',
    45890,
    33600,
    PaymentInterval.YEAR
  ),
};

export function getPricingProduct(productId: string): PricingProduct | null {
  const product = productId ? pricingCatalog[productId] : undefined;
  // Annual checkout remains disabled until monthly credit-tranche scheduling
  // is implemented. Keeping the catalog entries preserves the planned prices
  // without exposing an unsafe all-at-once annual grant.
  if (product?.plan?.interval === PaymentInterval.YEAR) return null;
  return product ?? null;
}

export function listPricingProducts(): PricingProduct[] {
  return Object.values(pricingCatalog);
}
