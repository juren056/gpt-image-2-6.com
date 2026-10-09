import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { Pricing } from '@/blocks/pricing';

export const Route = createFileRoute('/pricing')({
  loader: () => {
    const locale = getLocale();
    return {
      title: m['seo.pricing.meta_title']({}, { locale }),
      description: m['seo.pricing.meta_description']({}, { locale }),
      locale,
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path: '/pricing',
          type: 'website',
          dateModified: '2026-08-31',
          extraSchemas: [
            {
              '@type': 'Service',
              name: 'Qwen Image generation plans',
              provider: { '@type': 'Organization', name: 'Qwen Image 3' },
              offers: [
                { '@type': 'Offer', price: '8.99', priceCurrency: 'USD' },
                { '@type': 'Offer', price: '19.99', priceCurrency: 'USD' },
                { '@type': 'Offer', price: '44.99', priceCurrency: 'USD' },
              ],
            },
          ],
        })
      : {},
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Pricing headingLevel="h1" />
      </main>
      <Footer />
    </div>
  );
}
