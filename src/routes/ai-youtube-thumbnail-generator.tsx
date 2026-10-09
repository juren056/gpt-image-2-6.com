import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import {
  getSpecialToolFaqs,
  YouTubeThumbnailToolPage,
} from '@/blocks/special-tool-pages';

const path = '/ai-youtube-thumbnail-generator';

export const Route = createFileRoute('/ai-youtube-thumbnail-generator')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['tools.youtube_thumbnail.meta_title']({}, { locale }),
      description: m['tools.youtube_thumbnail.meta_description'](
        {},
        { locale }
      ),
      faqItems: getSpecialToolFaqs('youtube_thumbnail', locale),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path,
          type: 'website',
          image: '/imgs/tools/ai-youtube-thumbnail-showcase.webp',
          imageWidth: 1280,
          imageHeight: 720,
          datePublished: '2026-07-24',
          dateModified: '2026-07-24',
          extraSchemas: [
            {
              '@type': 'WebApplication',
              name: loaderData.title,
              description: loaderData.description,
              applicationCategory: 'DesignApplication',
              operatingSystem: 'Web',
              browserRequirements: 'Requires JavaScript',
              featureList: [
                'Native 16:9 AI thumbnail generation',
                'Title, subject and curiosity-hook controls',
                'Authenticated credit-based generation',
              ],
            },
          ],
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <YouTubeThumbnailToolPage />
      <Footer />
    </div>
  ),
});
