import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { getSpecialToolFaqs } from '@/blocks/public-faq-copy';
import { AiVideoToolPage } from '@/blocks/special-tool-pages';

const path = '/ai-video-generator';

export const Route = createFileRoute('/ai-video-generator')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['tools.video.meta_title']({}, { locale }),
      description: m['tools.video.meta_description']({}, { locale }),
      faqItems: getSpecialToolFaqs('video', locale),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path,
          type: 'website',
          image: '/imgs/tools/ai-video-storyboard-showcase.webp',
          imageWidth: 1536,
          imageHeight: 864,
          datePublished: '2026-07-24',
          dateModified: '2026-07-31',
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
                'Seedance 2.0 text-to-video generation through fal',
                'Native synchronized audio',
                'Camera and motion-rhythm controls',
                '5 or 8 second 720p video output',
              ],
            },
          ],
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <AiVideoToolPage />
      <Footer />
    </div>
  ),
});
