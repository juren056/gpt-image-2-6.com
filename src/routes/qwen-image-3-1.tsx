import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { getQwen31Faqs, QwenImage31Page } from '@/blocks/qwen-image-3-1-page';

const path = '/qwen-image-3-1';

export const Route = createFileRoute('/qwen-image-3-1')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['qwen31.meta_title']({}, { locale }),
      description: m['qwen31.meta_description']({}, { locale }),
      faqItems: getQwen31Faqs(locale),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path,
          type: 'website',
          datePublished: '2026-09-23',
          dateModified: '2026-09-23',
          indexableLocales: ['en', 'zh'],
          extraSchemas: [
            {
              '@type': 'Thing',
              name: 'Qwen Image 3.1',
              description: loaderData.description,
            },
          ],
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <QwenImage31Page />
      <Footer />
    </div>
  ),
});
