import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { ToolsDirectory } from '@/blocks/tool-pages';

export const Route = createFileRoute('/tools')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['tools.directory.meta_title']({}, { locale }),
      description: m['tools.directory.meta_description']({}, { locale }),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path: '/tools',
          type: 'website',
          datePublished: '2026-07-24',
          dateModified: '2026-07-24',
          extraSchemas: [
            {
              '@type': 'CollectionPage',
              name: loaderData.title,
              description: loaderData.description,
            },
          ],
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <ToolsDirectory />
      <Footer />
    </div>
  ),
});
