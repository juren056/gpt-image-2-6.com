import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { getSeoGuideFaqs, SeoGuide } from '@/blocks/seo-guide';

export const Route = createFileRoute('/qwen-image-3-for-ecommerce')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['seo.ecommerce.meta_title']({}, { locale }),
      description: m['seo.ecommerce.meta_description']({}, { locale }),
      faqItems: getSeoGuideFaqs('ecommerce', locale),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path: '/qwen-image-3-for-ecommerce',
          datePublished: '2026-07-24',
          dateModified: '2026-07-24',
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <SeoGuide kind="ecommerce" />
      <Footer />
    </div>
  ),
});
