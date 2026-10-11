import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { Checkout } from '@/blocks/banana-checkout';

export const Route = createFileRoute('/checkout')({
  validateSearch: (search: Record<string, unknown>) => ({
    product: typeof search.product === 'string' ? search.product : undefined,
    redirect:
      typeof search.redirect === 'string' &&
      search.redirect.startsWith('/') &&
      !search.redirect.startsWith('//')
        ? search.redirect
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: `Checkout | ${envConfigs.app_name}` },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
    links: [{ rel: 'canonical', href: `${envConfigs.app_url}/checkout` }],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { product, redirect } = Route.useSearch();
  return (
    <Checkout
      productId={product || 'credits_flex'}
      returnPath={redirect || '/settings/billing'}
    />
  );
}
