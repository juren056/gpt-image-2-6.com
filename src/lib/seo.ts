import { envConfigs } from '@/config';
import { locales, localizeUrl } from '@/paraglide/runtime.js';

export const DEFAULT_SOCIAL_IMAGE = '/brand/nano-banana-social.png';

export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': `${envConfigs.app_url}/#organization`,
    name: envConfigs.app_name,
    url: envConfigs.app_url,
    logo: {
      '@type': 'ImageObject',
      url: `${envConfigs.app_url}/logo.png`,
      contentUrl: `${envConfigs.app_url}/logo.png`,
      width: 512,
      height: 512,
    },
  };
}

// Only advertise locales whose editorial and legal content is complete and
// reviewed. Other UI translations remain available to users, but are kept out
// of search until their long-form content reaches the same standard.
export const INDEXABLE_LOCALES = [
  'en',
  'zh',
] as const satisfies readonly (typeof locales)[number][];

export function isIndexableLocale(locale: string): boolean {
  return INDEXABLE_LOCALES.some((candidate) => candidate === locale);
}

const SEO_LANGUAGE_TAGS: Record<string, string> = {
  en: 'en',
  ko: 'ko',
  ja: 'ja',
  es: 'es',
  de: 'de',
  fr: 'fr',
  zh: 'zh-Hans',
  'zh-TW': 'zh-Hant',
  ru: 'ru',
  ar: 'ar',
  pt: 'pt',
  it: 'it',
  tr: 'tr',
  vi: 'vi',
  nl: 'nl',
  th: 'th',
  pl: 'pl',
  hu: 'hu',
};

const HOME_LABELS: Record<string, string> = {
  en: 'Home',
  ko: '홈',
  ja: 'ホーム',
  es: 'Inicio',
  de: 'Startseite',
  fr: 'Accueil',
  zh: '首页',
  'zh-TW': '首頁',
  ru: 'Главная',
  ar: 'الرئيسية',
  pt: 'Início',
  it: 'Home',
  tr: 'Ana sayfa',
  vi: 'Trang chủ',
  nl: 'Home',
  th: 'หน้าหลัก',
  pl: 'Strona główna',
  hu: 'Kezdőlap',
};

export function seoLanguageTag(locale: string): string {
  return SEO_LANGUAGE_TAGS[locale] ?? locale;
}

export function socialImageUrl(image = DEFAULT_SOCIAL_IMAGE): string {
  if (/^https?:\/\//.test(image)) return image;
  return `${envConfigs.app_url}${image.startsWith('/') ? image : `/${image}`}`;
}

export function seoHead(params: {
  locale: string;
  path: string;
  title: string;
  description: string;
  type?: 'website' | 'article';
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  datePublished?: string;
  dateModified?: string;
  faqItems?: Array<{ question: string; answer: string }>;
  extraSchemas?: Array<Record<string, unknown>>;
  indexableLocales?: readonly string[];
}) {
  const {
    locale,
    path,
    title,
    description,
    type = 'article',
    image,
    imageWidth = image ? 1024 : 1200,
    imageHeight = image ? 576 : 630,
    datePublished,
    dateModified,
    faqItems = [],
    extraSchemas = [],
    indexableLocales = INDEXABLE_LOCALES,
  } = params;
  const socialImage = socialImageUrl(image);
  const allowIndexing = indexableLocales.includes(locale);
  const canonicalLocale = allowIndexing
    ? locale
    : (indexableLocales[0] ?? 'en');
  const urlFor = (loc: string) =>
    localizeUrl(`${envConfigs.app_url}${path}`, { locale: loc as any }).href;
  const canonicalUrl = urlFor(canonicalLocale);
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      ...(!allowIndexing
        ? [
            { name: 'robots', content: 'noindex, follow' },
            { name: 'googlebot', content: 'noindex, follow' },
          ]
        : []),
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: type },
      { property: 'og:url', content: canonicalUrl },
      {
        property: 'og:locale',
        content: seoLanguageTag(canonicalLocale).replace('-', '_'),
      },
      ...indexableLocales
        .filter((loc) => loc !== locale)
        .map((loc) => ({
          property: 'og:locale:alternate',
          content: seoLanguageTag(loc).replace('-', '_'),
        })),
      { property: 'og:image', content: socialImage },
      { property: 'og:image:width', content: String(imageWidth) },
      { property: 'og:image:height', content: String(imageHeight) },
      { property: 'og:image:alt', content: title },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: socialImage },
      ...(datePublished
        ? [{ property: 'article:published_time', content: datePublished }]
        : []),
      ...(dateModified
        ? [{ property: 'article:modified_time', content: dateModified }]
        : []),
      {
        'script:ld+json': {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': type === 'article' ? 'Article' : 'WebPage',
              headline: title,
              name: title,
              description,
              url: canonicalUrl,
              image: socialImage,
              inLanguage: seoLanguageTag(canonicalLocale),
              ...(datePublished ? { datePublished } : {}),
              ...(dateModified ? { dateModified } : {}),
              publisher: organizationSchema(),
            },
            ...(path === '/'
              ? []
              : [
                  {
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                      {
                        '@type': 'ListItem',
                        position: 1,
                        name: HOME_LABELS[locale] ?? HOME_LABELS.en,
                        item: canonicalUrl.replace(path, '/'),
                      },
                      {
                        '@type': 'ListItem',
                        position: 2,
                        name: title,
                        item: canonicalUrl,
                      },
                    ],
                  },
                ]),
            ...(faqItems.length
              ? [
                  {
                    '@type': 'FAQPage',
                    mainEntity: faqItems.map(({ question, answer }) => ({
                      '@type': 'Question',
                      name: question,
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: answer,
                      },
                    })),
                  },
                ]
              : []),
            ...extraSchemas,
          ],
        },
      },
    ],
    links: [
      { rel: 'canonical', href: canonicalUrl },
      ...indexableLocales.map((loc) => ({
        rel: 'alternate',
        hreflang: seoLanguageTag(loc),
        href: urlFor(loc),
      })),
      { rel: 'alternate', hreflang: 'x-default', href: urlFor('en') },
    ],
  };
}
