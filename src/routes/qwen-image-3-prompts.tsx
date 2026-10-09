import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { getSeoGuideFaqs, SeoGuide } from '@/blocks/seo-guide';

export const Route = createFileRoute('/qwen-image-3-prompts')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['seo.prompts.meta_title']({}, { locale }),
      description: m['seo.prompts.meta_description']({}, { locale }),
      faqItems: getSeoGuideFaqs('prompts', locale),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path: '/qwen-image-3-prompts',
          dateModified: '2026-09-04',
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <SeoGuide kind="prompts" />
      <Footer />
    </div>
  ),
});
