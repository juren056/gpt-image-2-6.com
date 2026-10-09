import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { getToolFaqs, ToolPage } from '@/blocks/tool-pages';

export const Route = createFileRoute('/ai-poster-generator')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['tools.poster.meta_title']({}, { locale }),
      description: m['tools.poster.meta_description']({}, { locale }),
      faqItems: getToolFaqs('poster', locale),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path: '/ai-poster-generator',
          type: 'website',
          image: '/imgs/tools/ai-poster-showcase.webp',
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
                'AI poster generation',
                'Exact headline input',
                'Poster format and style controls',
              ],
            },
          ],
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <ToolPage kind="poster" />
      <Footer />
    </div>
  ),
});
