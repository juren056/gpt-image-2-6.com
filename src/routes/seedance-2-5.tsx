import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { SeedancePage } from '@/blocks/seedance-page';

const path = '/seedance-2-5';

function localizedFaqs(locale: string) {
  const localized = (key: string) => {
    const fn = (m as Record<string, unknown>)[key];
    return typeof fn === 'function'
      ? (fn as (inputs: object, options: { locale: string }) => string)(
          {},
          { locale }
        )
      : key;
  };

  return [1, 2, 4, 5].map((index) => ({
    question: localized(`seedance25.faq_${index}_question`),
    answer: localized(`seedance25.faq_${index}_answer`),
  }));
}

export const Route = createFileRoute('/seedance-2-5')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['seedance25.meta_title']({}, { locale }),
      description: m['seedance25.meta_description']({}, { locale }),
      faqItems: localizedFaqs(locale),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path,
          type: 'website',
          image: '/imgs/tools/seedance-motion-preview.webp',
          imageWidth: 960,
          imageHeight: 540,
          datePublished: '2026-07-31',
          dateModified: '2026-09-05',
          extraSchemas: [
            {
              '@type': 'WebApplication',
              name: loaderData.title,
              description: loaderData.description,
              applicationCategory: 'MultimediaApplication',
              operatingSystem: 'Web',
              browserRequirements: 'Requires JavaScript',
              isAccessibleForFree: true,
              featureList: [
                'Free Seedance 2.5 prompt builder',
                'Native Seedance 2.5 text-to-video generation through fal',
                'Up to 30 second 720p output with synchronized audio',
              ],
            },
          ],
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <SeedancePage />
      <Footer />
    </div>
  ),
});
