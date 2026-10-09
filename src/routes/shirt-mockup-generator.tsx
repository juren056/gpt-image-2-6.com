import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { KeywordGeneratorPage } from '@/components/keyword-generator-page';

export const Route = createFileRoute('/shirt-mockup-generator')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['keyword.mockup.meta_title']({}, { locale }),
      description: m['keyword.mockup.meta_description']({}, { locale }),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path: '/shirt-mockup-generator',
          type: 'website',
          image: '/imgs/keyword/shirt-mockup-example.webp',
          imageWidth: 900,
          imageHeight: 900,
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
      <KeywordGeneratorPage kind="mockup" />
      <Footer />
    </div>
  ),
});
