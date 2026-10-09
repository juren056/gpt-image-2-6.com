import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { getToolFaqs, ToolPage } from '@/blocks/tool-pages';

export const Route = createFileRoute('/ai-product-photo-generator')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['tools.product_photo.meta_title']({}, { locale }),
      description: m['tools.product_photo.meta_description']({}, { locale }),
      faqItems: getToolFaqs('product_photo', locale),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path: '/ai-product-photo-generator',
          type: 'website',
          image: '/imgs/tools/ai-product-photo-showcase.webp',
          imageWidth: 1200,
          imageHeight: 800,
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
                'AI product photo generation',
                'Commercial scene controls',
                'Lighting and composition controls',
              ],
            },
          ],
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <ToolPage kind="product_photo" />
      <Footer />
    </div>
  ),
});
