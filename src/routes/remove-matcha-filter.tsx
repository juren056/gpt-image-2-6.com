import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { getMatchaFilterFaqs } from '@/blocks/public-faq-copy';
import { RemoveMatchaFilterToolPage } from '@/blocks/remove-matcha-filter';

const path = '/remove-matcha-filter';

export const Route = createFileRoute('/remove-matcha-filter')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['tools.matcha_filter.meta_title']({}, { locale }),
      description: m['tools.matcha_filter.meta_description']({}, { locale }),
      faqItems: getMatchaFilterFaqs(locale),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path,
          type: 'website',
          image: '/imgs/tools/remove-matcha-filter/after.webp',
          imageWidth: 1440,
          imageHeight: 960,
          datePublished: '2026-08-12',
          dateModified: '2026-08-12',
          extraSchemas: [
            {
              '@type': 'WebApplication',
              name: loaderData.title,
              description: loaderData.description,
              applicationCategory: 'PhotographyApplication',
              operatingSystem: 'Web',
              browserRequirements: 'Requires JavaScript',
              featureList: [
                'AI matcha-green color cast removal',
                'Natural skin tone and white balance restoration',
                'Interactive before-and-after comparison',
              ],
            },
          ],
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <RemoveMatchaFilterToolPage />
      <Footer />
    </div>
  ),
});
