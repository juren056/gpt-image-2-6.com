import { useMutation, useQuery } from '@tanstack/react-query';
import type { CheckoutProduct } from '@/types/checkout';

import { useSession } from '@/core/auth/client';
import { envConfigs } from '@/config';
import { trackFunnelEvent } from '@/lib/analytics-events';
import { apiGet, apiPost } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import { getLocale, localizeHref } from '@/paraglide/runtime.js';
import { usePublicConfig } from '@/hooks/use-public-config';
import { BananaCheckout } from '@/components/banana-checkout';

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
  const checkout = useMutation({
    mutationFn: () =>
      apiPost<{ checkout_url: string }>('/api/payment/checkout', {
        product_id: productId,
        payment_provider: 'stripe',
        redirect: returnPath,
      }),
    onSuccess: (result) => {
      const destination = new URL(result.checkout_url);
      if (
        destination.protocol !== 'https:' ||
        destination.hostname !== 'checkout.stripe.com'
      )
        throw new Error(m['checkout.error']());
      window.location.assign(destination.href);
    },
  });
  const callback = `/checkout?product=${encodeURIComponent(productId)}&redirect=${encodeURIComponent(returnPath)}`;
  const ready =
    configs.data?.stripe_ready === 'true' &&
    configs.data?.stripe_enabled === 'true';
  return (
    <BananaCheckout
      brand={envConfigs.app_name}
      logo={envConfigs.app_logo}
      locale={getLocale()}
      product={product}
      email={session?.user?.email}
      loading={products.isPending || configs.isPending || sessionPending}
      pending={checkout.isPending}
      error={checkout.error?.message || products.error?.message}
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
      }}
      onCheckout={() => {
        if (!session?.user) {
          window.location.assign(
            localizeHref(`/sign-in?callbackUrl=${encodeURIComponent(callback)}`)
          );
          return;
        }
        trackFunnelEvent('checkout_started', {
          product: productId,
          provider: 'stripe',
        });
        checkout.mutate();
      }}
      signedIn={!!session?.user}
      ready={ready}
      onRetry={() => {
        products.refetch();
        configs.refetch();
      }}
    />
  );
}
