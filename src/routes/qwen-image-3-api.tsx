import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { ApiExamples } from '@/blocks/api-examples';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { getSeoGuideFaqs, SeoGuide } from '@/blocks/seo-guide';

export const Route = createFileRoute('/qwen-image-3-api')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['seo.api.meta_title']({}, { locale }),
      description: m['seo.api.meta_description']({}, { locale }),
      faqItems: getSeoGuideFaqs('api', locale),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path: '/qwen-image-3-api',
          dateModified: '2026-07-24',
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <SeoGuide kind="api" afterHero={<ApiExamples />} />
      <Footer />
    </div>
  ),
});
