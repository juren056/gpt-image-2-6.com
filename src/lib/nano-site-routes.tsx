import { envConfigs } from '@/config';
import {
  NANO_SITE_PAGES,
  NANO_SITE_REVIEW_DATE,
  type NanoPageId,
} from '@/config/nano-site';
import { sitemapLastModified } from '@/config/sitemap-updates';
import { organizationSchema, seoHead } from '@/lib/seo';
import { getLocale } from '@/paraglide/runtime.js';
import { getNanoPageCopy, NanoSitePage } from '@/blocks/nano-site';

const ARTICLE_PAGE_IDS: readonly NanoPageId[] = [
  'comparison',
  'migration',
  'guide',
  'versus2',
  'versusGpt',
  'blogProduct',
  'blogText',
  'blogReferences',
  'blogExport',
  'blogRights',
];

export function nanoSiteRouteOptions(id: NanoPageId) {
  return {
    loader: () => {
      const locale = getLocale();
      return { locale, page: getNanoPageCopy(id, locale) };
    },
    head: ({
      loaderData,
    }: {
      loaderData?: { locale: string; page: ReturnType<typeof getNanoPageCopy> };
    }) => {
      if (!loaderData) return {};
      return seoHead({
        locale: loaderData.locale,
        path: NANO_SITE_PAGES[id].path,
        title: loaderData.page.title,
        description: loaderData.page.description,
        type: ARTICLE_PAGE_IDS.includes(id) ? 'article' : 'website',
        dateModified: sitemapLastModified(
          NANO_SITE_PAGES[id].path,
          NANO_SITE_REVIEW_DATE
        ),
        faqItems: loaderData.page.faqs,
        extraSchemas:
          id === 'home'
            ? [
                organizationSchema(),
                {
                  '@type': 'WebSite',
                  '@id': `${envConfigs.app_url}/#website`,
                  name: envConfigs.app_name,
                  url: envConfigs.app_url,
                  publisher: { '@id': `${envConfigs.app_url}/#organization` },
                },
              ]
            : [],
      });
    },
    component: () => <NanoSitePage id={id} />,
  };
}
