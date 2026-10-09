import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { KeywordGeneratorPage } from '@/components/keyword-generator-page';

export const Route = createFileRoute('/pixel-art-generator')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['keyword.pixel.meta_title']({}, { locale }),
      description: m['keyword.pixel.meta_description']({}, { locale }),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path: '/pixel-art-generator',
          type: 'website',
          image: '/imgs/keyword/pixel-art-example.webp',
          imageWidth: 1024,
          imageHeight: 608,
          indexableLocales: ['en', 'zh'],
          extraSchemas: [
            {
              '@type': 'WebApplication',
              name: loaderData.title,
              applicationCategory: 'DesignApplication',
              operatingSystem: 'Web',
            },
          ],
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <KeywordGeneratorPage kind="pixel" />
      <Footer />
    </div>
  ),
});
