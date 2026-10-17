import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { PaymentType } from '@/core/payment/types';
import { getPricingProduct } from '@/config/pricing';
import { getAllConfigs } from '@/modules/config/service';
import { createCheckout } from '@/modules/payment/service';
import { getCurrentSubscription } from '@/modules/subscriptions/service';
import { isProduction } from '@/lib/env';
import { isStripeCheckoutReady } from '@/lib/payment-readiness';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

function safeSameOriginPath(
  input: string | undefined | null,
  fallbackPath: string,
  baseUrl: string
): string {
  if (!input) return fallbackPath;
  try {
    const appUrl = new URL(baseUrl);
    const candidate = new URL(input, appUrl);
    if (candidate.origin !== appUrl.origin) return fallbackPath;
    return candidate.pathname + candidate.search + candidate.hash;
  } catch {
    return fallbackPath;
  }
}

async function POST({ request }: { request: Request }) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return respErr('Forbidden', { status: 403 });
  }
  const limited = await enforceMinIntervalRateLimit(request, {
    intervalMs: 1000,
    keyPrefix: 'checkout',
  });
  if (limited) return limited;

  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return respErr('Unauthorized');
    }

    const body = await request.json().catch(() => ({}));
    const { product_id, payment_provider, redirect, ui_mode } = body;
    if (
      ui_mode !== undefined &&
      ui_mode !== 'embedded' &&
      ui_mode !== 'hosted'
    ) {
      return respErr('Invalid checkout mode', { status: 400 });
    }

    if (!product_id || typeof product_id !== 'string') {
      return respErr('Missing product_id');
    }

    // Look up product in the authoritative server-side catalog.
    // We DO NOT trust price / credits / plan from the request body.
    const product = getPricingProduct(product_id);
    if (!product) {
      return respErr('Unknown product');
    }

    if (product.membership) {
      const current = await getCurrentSubscription(session.user.id);
      if (current) {
        return respErr(
          'You already have an active subscription. Manage it from Billing before buying another plan.',
          { status: 409 }
        );
      }
    }

    // Optional per-provider "test amount" override (admin-configured).
    // Only the charged amount is overridden — credits granted and order
    // amount stored both come from the authoritative catalog.
    const configs = await getAllConfigs();
    const providerKey =
      product.requiredProvider ||
      payment_provider ||
      configs.default_payment_provider;
    if (!providerKey || configs[`${providerKey}_enabled`] !== 'true') {
      return respErr('This payment provider is not enabled', { status: 400 });
    }
    if (providerKey === 'stripe' && !isStripeCheckoutReady(configs)) {
      return respErr(
        'Payment could not be opened. Please retry or contact support.',
        {
          status: 503,
        }
      );
    }
    if (ui_mode === 'embedded' && providerKey !== 'stripe') {
      return respErr('Embedded checkout requires Stripe', { status: 400 });
    }
    if (
      ui_mode === 'embedded' &&
      !configs.stripe_publishable_key?.startsWith('pk_')
    ) {
      return respErr('Stripe publishable key is not configured', {
        status: 503,
      });
    }
    const testAmountRaw = providerKey
      ? configs[`${providerKey}_test_amount`]
      : undefined;
    // Never permit the admin test-amount override in a production deployment.
    const testAmount =
      !isProduction && testAmountRaw ? parseInt(testAmountRaw) : 0;
    const chargeAmount = testAmount > 0 ? testAmount : product.priceInCents;

    // Build success/cancel URLs — only accept same-origin redirects.
    const baseUrl = configs.app_url || 'http://localhost:3000';
    const safeRedirectPath = safeSameOriginPath(
      redirect,
      '/settings/billing',
      baseUrl
    );
    const finalRedirect = redirect
      ? `${baseUrl}${safeRedirectPath}`
      : `${baseUrl}/settings/billing?purchase=success`;
    const successUrl = finalRedirect;
    const cancelUrl = `${baseUrl}/checkout?product=${encodeURIComponent(product.productId)}&redirect=${encodeURIComponent(safeRedirectPath)}`;

    const checkout = await createCheckout({
      userId: session.user.id,
      userEmail: session.user.email,
      productName: product.productName,
      planName: product.planName,
      credits: product.credits,
      creditsValidDays: product.creditsValidDays,
      paymentOrder: {
        productId: product.productId,
        price: { amount: chargeAmount, currency: product.currency },
        type: product.type,
        description: product.description,
        successUrl,
        cancelUrl,
        customer: {
          email: session.user.email,
          name: session.user.name,
        },
        plan: product.plan
          ? {
              name: product.plan.name,
              interval: product.plan.interval,
              intervalCount: product.plan.intervalCount,
            }
          : undefined,
        paymentMethodTypes: product.paymentMethodTypes,
        checkoutUi: ui_mode === 'embedded' ? 'embedded' : 'hosted',
      },
      provider: providerKey,
    });

    const payload =
      ui_mode === 'embedded'
        ? {
            client_secret: checkout.checkoutInfo.clientSecret,
            publishable_key: configs.stripe_publishable_key,
          }
        : { checkout_url: checkout.checkoutInfo.checkoutUrl };
    return respData(payload, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error: any) {
    console.error('checkout error:', error);
    return respErr(error.message || 'Checkout failed');
  }
}

export const Route = createFileRoute('/api/payment/checkout')({
  server: {
    handlers: { POST },
  },
});
