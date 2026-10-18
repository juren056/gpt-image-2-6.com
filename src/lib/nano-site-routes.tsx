import { envConfigs } from '@/config';
import {
  NANO_SITE_PAGES,
  NANO_SITE_REVIEW_DATE,
  type NanoPageId,
} from '@/config/nano-site';
import { pricingCatalog } from '@/config/pricing';
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

const MARKDOWN_ALTERNATES: Partial<Record<NanoPageId, string>> = {
  home: '/index.md',
  pricing: '/pricing.md',
  prompts: '/prompts.md',
};

const PUBLIC_OFFER_IDS = [
  'starter_monthly',
  'creator_monthly',
  'pro_monthly',
  'credits_boost',
  'credits_flex',
  'credits_power',
] as const;

function softwareApplicationSchema(description: string) {
  return {
    '@type': 'SoftwareApplication',
    '@id': `${envConfigs.app_url}/#software-application`,
    name: envConfigs.app_name,
    url: envConfigs.app_url,
    description,
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    offers: PUBLIC_OFFER_IDS.map((id) => {
      const product = pricingCatalog[id];
      return {
        '@type': 'Offer',
        name: product.productName,
        price: (product.priceInCents / 100).toFixed(2),
        priceCurrency: product.currency.toUpperCase(),
        url: `${envConfigs.app_url}/pricing`,
        availability: 'https://schema.org/InStock',
      };
    }),
  };
}

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
        ...(['comparison', 'versus2', 'blogText'].includes(id)
          ? {
              image: `/evidence/2026-10-13/${id === 'blogText' ? 'NB-05' : 'NB-17'}.webp`,
              imageWidth: 640,
              imageHeight: 640,
            }
          : {}),
        type: ARTICLE_PAGE_IDS.includes(id) ? 'article' : 'website',
        dateModified: sitemapLastModified(
          NANO_SITE_PAGES[id].path,
          NANO_SITE_REVIEW_DATE
        ),
        faqItems: loaderData.page.faqs,
        markdownPath: MARKDOWN_ALTERNATES[id],
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
                softwareApplicationSchema(loaderData.page.description),
              ]
            : [],
      });
    },
    component: () => <NanoSitePage id={id} />,
  };
}
