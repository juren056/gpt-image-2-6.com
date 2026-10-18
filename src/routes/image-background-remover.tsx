import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { getSpecialToolFaqs } from '@/blocks/public-faq-copy';
import { BackgroundRemoverToolPage } from '@/blocks/special-tool-pages';

const path = '/image-background-remover';

export const Route = createFileRoute('/image-background-remover')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['tools.background_remover.meta_title']({}, { locale }),
      description: m['tools.background_remover.meta_description'](
        {},
        { locale }
      ),
      faqItems: getSpecialToolFaqs('background_remover', locale),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path,
          type: 'website',
          image: '/imgs/tools/background-remover-robot-cutout.png',
          imageWidth: 1254,
          imageHeight: 1254,
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
                'BiRefNet v2 background removal',
                'Transparent PNG output',
                'Interactive before-and-after edge inspection',
              ],
            },
          ],
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <BackgroundRemoverToolPage />
      <Footer />
    </div>
  ),
});
