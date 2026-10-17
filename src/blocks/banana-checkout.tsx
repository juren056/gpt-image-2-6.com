import { useMutation, useQuery } from '@tanstack/react-query';
import type { CheckoutProduct } from '@/types/checkout';

import { useSession } from '@/core/auth/client';
import { envConfigs } from '@/config';
import { trackFunnelEvent } from '@/lib/analytics-events';
import { ApiError, apiGet, apiPost } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import { getLocale, localizeHref } from '@/paraglide/runtime.js';
import { usePublicConfig } from '@/hooks/use-public-config';
import { BananaCheckout } from '@/components/banana-checkout';
import { StripeEmbeddedCheckout } from '@/components/stripe-embedded-checkout';

export function Checkout({
  productId,
  returnPath,
}: {
  productId: string;
  returnPath: string;
}) {
  const { data: session, isPending: sessionPending } = useSession();
  const configs = usePublicConfig();
  const products = useQuery({
    queryKey: ['checkout-products'],
    queryFn: () => apiGet<CheckoutProduct[]>('/api/payment/products'),
    staleTime: 60_000,
  });
  const product = products.data?.find((item) => item.productId === productId);
  const ready =
    configs.data?.stripe_ready === 'true' &&
    configs.data?.stripe_enabled === 'true';
  const checkout = useQuery({
    queryKey: ['embedded-checkout', session?.user?.id, productId, returnPath],
    enabled: !!session?.user && !!product && ready,
    queryFn: async () => {
      const result = await apiPost<{
        client_secret: string;
        publishable_key: string;
      }>('/api/payment/checkout', {
        product_id: productId,
        payment_provider: 'stripe',
        redirect: returnPath,
        ui_mode: 'embedded',
      });
      trackFunnelEvent('checkout_started', {
        product: productId,
        provider: 'stripe',
      });
      return result;
    },
    // Opening a checkout creates a pending order. Do not repeat it on focus,
    // remount, reconnect or a transient error; retry only at the user's request.
    staleTime: Infinity,
    gcTime: 15 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
  const hostedCheckout = useMutation({
    mutationKey: ['hosted-checkout-fallback', session?.user?.id, productId],
    mutationFn: async () => {
      // The checkout route is rate limited. Waiting also prevents a quick
      // fallback from racing an embedded request whose response was lost.
      await new Promise((resolve) => window.setTimeout(resolve, 1100));
      const result = await apiPost<{ checkout_url?: string }>(
        '/api/payment/checkout',
        {
          product_id: productId,
          payment_provider: 'stripe',
          redirect: returnPath,
          ui_mode: 'hosted',
        }
      );
      const checkoutUrl = new URL(result.checkout_url || '');
      if (
        checkoutUrl.protocol !== 'https:' ||
        checkoutUrl.hostname !== 'checkout.stripe.com'
      ) {
        throw new Error('Stripe checkout URL was not returned');
      }
      return checkoutUrl.href;
    },
    onSuccess: (checkoutUrl) => {
      trackFunnelEvent('checkout_started', {
        product: productId,
        provider: 'stripe_hosted_fallback',
      });
      window.location.assign(checkoutUrl);
    },
  });
  const checkoutError =
    hostedCheckout.error || checkout.error || products.error;
  const errorMessage = checkoutError
    ? checkoutError instanceof ApiError
      ? checkoutError.message
      : m['checkout.error']()
    : undefined;
  const fallbackAvailable =
    !!session?.user &&
    !!product &&
    ready &&
    (!!checkout.data ||
      (!!checkout.error && !(checkout.error instanceof ApiError)));
  const callback = `/checkout?product=${encodeURIComponent(productId)}&redirect=${encodeURIComponent(returnPath)}`;
  return (
    <BananaCheckout
      brand={envConfigs.app_name}
      logo={envConfigs.app_logo}
      locale={getLocale()}
      product={product}
      email={session?.user?.email}
      loading={products.isPending || configs.isPending || sessionPending}
      pending={checkout.isFetching}
      error={errorMessage}
      fallbackAvailable={fallbackAvailable}
      fallbackPending={hostedCheckout.isPending}
      paymentForm={
        checkout.data ? (
          <StripeEmbeddedCheckout
            clientSecret={checkout.data.client_secret}
            publishableKey={checkout.data.publishable_key}
            loadingLabel={m['checkout.working']()}
            errorLabel={m['checkout.error']()}
            retryLabel={m['checkout.retry']()}
            fallbackLabel={m['checkout.fallback']()}
            fallbackPending={hostedCheckout.isPending}
            onFallback={() => hostedCheckout.mutate()}
          />
        ) : undefined
      }
      copy={{
        back: m['checkout.back'](),
        title: m['checkout.title'](),
        description: m['checkout.description'](),
        headline: m['checkout.headline'](),
        accent: m['checkout.accent'](),
        intro: m['checkout.intro'](),
        details: m['checkout.details'](),
        credits: m['checkout.credits'](),
        validity: m['checkout.validity'](),
        renewal: m['checkout.renewal'](),
        monthly: m['checkout.monthly'](),
        once: m['checkout.once'](),
        prepaid: m['checkout.prepaid'](),
        days: m['checkout.days'](),
        cycle: m['checkout.cycle'](),
        email: m['checkout.email'](),
        method: m['checkout.method'](),
        card: m['checkout.card'](),
        alipay: m['checkout.alipay'](),
        pay: m['checkout.pay'](),
        working: m['checkout.working'](),
        secure: m['checkout.secure'](),
        coupon: m['checkout.coupon'](),
        total: m['checkout.total'](),
        terms: m['checkout.terms'](),
        refund: m['checkout.refund'](),
        tax: m['checkout.tax'](),
        signin: m['checkout.signin'](),
        missing: m['checkout.missing'](),
        unavailable: m['checkout.error'](),
        retry: m['checkout.retry'](),
        fallback: m['checkout.fallback'](),
      }}
      onCheckout={() => {
        if (!session?.user) {
          window.location.assign(
            localizeHref(`/sign-in?callbackUrl=${encodeURIComponent(callback)}`)
          );
          return;
        }
      }}
      signedIn={!!session?.user}
      ready={ready}
      backHref={returnPath}
      onFallback={() => hostedCheckout.mutate()}
      onRetry={() => {
        hostedCheckout.reset();
        products.refetch();
        configs.refetch();
        if (checkout.isError) checkout.refetch();
      }}
    />
  );
}
