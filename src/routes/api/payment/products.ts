import { createFileRoute } from '@tanstack/react-router';
import type { CheckoutProduct } from '@/types/checkout';

import { PaymentType } from '@/core/payment/types';
import { listPricingProducts } from '@/config/pricing';
import { respData } from '@/lib/resp';

export const Route = createFileRoute('/api/payment/products')({
  server: {
    handlers: {
      GET: () =>
        respData(
          listPricingProducts().map(
            (product): CheckoutProduct => ({
              productId: product.productId,
              productName: product.productName,
              priceInCents: product.priceInCents,
              currency: product.currency,
              credits: product.credits,
              creditsValidDays: product.creditsValidDays,
              recurring: product.type === PaymentType.SUBSCRIPTION,
              prepaidMonths: product.membership?.durationMonths,
              paymentMethods: product.paymentMethodTypes ?? ['card'],
            })
          ),
          { headers: { 'Cache-Control': 'public, max-age=60' } }
        ),
    },
  },
});
