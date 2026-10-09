import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import {
  getQwen21TransparentFaqs,
  Qwen21TransparentPage,
} from '@/blocks/qwen-image-2-1-transparent-page';

const path = '/qwen-image-2-1-transparent-png';

export const Route = createFileRoute('/qwen-image-2-1-transparent-png')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['qwen21_transparent.meta_title']({}, { locale }),
      description: m['qwen21_transparent.meta_description']({}, { locale }),
      faqItems: getQwen21TransparentFaqs(locale),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path,
          type: 'website',
          image: '/imgs/qwen-2-1/transparent-png-workflow.webp',
          imageWidth: 1200,
          imageHeight: 630,
          datePublished: '2026-09-21',
          dateModified: '2026-09-21',
          indexableLocales: ['en', 'zh'],
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <Qwen21TransparentPage />
      <Footer />
    </div>
  ),
});
