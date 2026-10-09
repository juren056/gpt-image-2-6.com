import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { getMinimaxH3Faqs, MinimaxH3Page } from '@/blocks/minimax-h3-page';

const path = '/minimax-h3';

export const Route = createFileRoute('/minimax-h3')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['minimax_h3.meta_title']({}, { locale }),
      description: m['minimax_h3.meta_description']({}, { locale }),
      faqItems: getMinimaxH3Faqs(locale),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path,
          type: 'website',
          datePublished: '2026-08-02',
          dateModified: '2026-08-02',
          extraSchemas: [
            {
              '@type': 'WebApplication',
              name: loaderData.title,
              description: loaderData.description,
              applicationCategory: 'MultimediaApplication',
              operatingSystem: 'Web',
              browserRequirements: 'Requires JavaScript',
              isAccessibleForFree: false,
              featureList: [
                'MiniMax H3 text-to-video generation through fal',
                '2K output with native stereo audio',
                '5, 10, or 15 second video generation',
                'Six landscape, square, and portrait aspect ratios',
                'Credit-based generation without a subscription requirement',
              ],
            },
          ],
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <MinimaxH3Page />
      <Footer />
    </div>
  ),
});
