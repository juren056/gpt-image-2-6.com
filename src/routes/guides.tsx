import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { GUIDE_CATALOG } from '@/lib/guides';
import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale, localizeUrl } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { GuidesDirectory } from '@/blocks/guides-directory';
import { Header } from '@/blocks/header';

export const Route = createFileRoute('/guides')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['guides.meta_title']({}, { locale }),
      description: m['guides.meta_description']({}, { locale }),
      itemList: GUIDE_CATALOG.map((guide, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: m[`seo.${guide.kind}.title`]({}, { locale }),
        url: localizeUrl(`${envConfigs.app_url}${guide.path}`, { locale }).href,
      })),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          locale: loaderData.locale,
          path: '/guides',
          title: loaderData.title,
          description: loaderData.description,
          type: 'website',
          dateModified: '2026-07-24',
          extraSchemas: [
            {
              '@type': 'ItemList',
              name: loaderData.title,
              numberOfItems: loaderData.itemList.length,
              itemListElement: loaderData.itemList,
            },
          ],
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <GuidesDirectory />
      <Footer />
    </div>
  ),
});
