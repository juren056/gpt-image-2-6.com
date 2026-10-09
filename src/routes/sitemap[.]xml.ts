import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { GPT_IMAGE_OPPORTUNITIES } from '@/config/gpt-image-opportunities';
import {
  PUBLIC_MODEL_PAGES,
  PUBLIC_TOOL_PAGES,
} from '@/config/public-creative';
import { INDEXABLE_LOCALES, seoLanguageTag } from '@/lib/seo';
import { baseLocale, locales, localizeUrl } from '@/paraglide/runtime.js';
import { getLocalPosts, mergePosts } from '@/content/posts';

const SITE_LAST_UPDATED = '2026-10-06';

const STATIC_PATHS: Array<
  Pick<
    Entry,
    | 'path'
    | 'lastModified'
    | 'changeFrequency'
    | 'priority'
    | 'indexableLocales'
  >
> = [
  {
    path: '',
    lastModified: SITE_LAST_UPDATED,
    changeFrequency: 'weekly',
    priority: 1,
  },
  { path: '/pricing', changeFrequency: 'weekly', priority: 0.9 },
  {
    path: '/prompts',
    lastModified: SITE_LAST_UPDATED,
    changeFrequency: 'weekly',
    priority: 0.95,
  },
  ...[
    'poster',
    'product',
    'typography',
    'infographic',
    'ecommerce',
    'ui',
    'illustration',
    'photography',
    'chinese',
  ].map((category) => ({
    path: `/prompts/${category}`,
    lastModified: SITE_LAST_UPDATED,
    changeFrequency: 'monthly',
    priority: 0.75,
    indexableLocales: ['en'],
  })),
  {
    path: '/tools',
    lastModified: SITE_LAST_UPDATED,
    changeFrequency: 'weekly',
    priority: 0.9,
  },
  {
    path: '/models',
    lastModified: SITE_LAST_UPDATED,
    changeFrequency: 'weekly',
    priority: 0.9,
    indexableLocales: ['en'],
  },
  ...PUBLIC_MODEL_PAGES.map((model) => ({
    path: model.path,
    lastModified: model.dateModified ?? SITE_LAST_UPDATED,
    changeFrequency: 'weekly',
    priority: 0.9,
    indexableLocales: ['en'],
  })),
  ...Object.values(GPT_IMAGE_OPPORTUNITIES).map((page) => ({
    path: page.path,
    lastModified: '2026-09-29',
    changeFrequency: 'weekly',
    priority: 0.9,
    indexableLocales: ['en'],
  })),
  ...PUBLIC_TOOL_PAGES.filter(
    (tool) => tool.path !== '/image-background-remover'
  ).map((tool) => ({
    path: tool.path,
    lastModified: SITE_LAST_UPDATED,
    changeFrequency: 'weekly',
    priority: 0.85,
    indexableLocales: ['en'],
  })),
  {
    path: '/shirt-mockup-generator',
    lastModified: SITE_LAST_UPDATED,
    changeFrequency: 'weekly',
    priority: 0.85,
    indexableLocales: ['en', 'zh'],
  },
  {
    path: '/pixel-art-generator',
    lastModified: SITE_LAST_UPDATED,
    changeFrequency: 'weekly',
    priority: 0.85,
    indexableLocales: ['en', 'zh'],
  },
  {
    path: '/ai-poster-generator',
    lastModified: SITE_LAST_UPDATED,
    changeFrequency: 'weekly',
    priority: 0.9,
  },
  {
    path: '/ai-product-photo-generator',
    lastModified: SITE_LAST_UPDATED,
    changeFrequency: 'weekly',
    priority: 0.9,
  },
  {
    path: '/ai-youtube-thumbnail-generator',
    lastModified: SITE_LAST_UPDATED,
    changeFrequency: 'weekly',
    priority: 0.9,
  },
  {
    path: '/ai-video-generator',
    lastModified: SITE_LAST_UPDATED,
    changeFrequency: 'weekly',
    priority: 0.9,
  },
  {
    path: '/minimax-h3',
    lastModified: SITE_LAST_UPDATED,
    changeFrequency: 'daily',
    priority: 1,
  },
  {
    path: '/wan-3-0',
    lastModified: SITE_LAST_UPDATED,
    changeFrequency: 'daily',
    priority: 1,
  },
  {
    path: '/seedance-2-5',
    lastModified: SITE_LAST_UPDATED,
    changeFrequency: 'daily',
    priority: 0.9,
  },
  {
    path: '/seedance-2-5-draft-mode',
    lastModified: SITE_LAST_UPDATED,
    changeFrequency: 'daily',
    priority: 0.9,
    indexableLocales: ['en', 'zh'],
  },
  {
    path: '/image-background-remover',
    lastModified: SITE_LAST_UPDATED,
    changeFrequency: 'weekly',
    priority: 0.9,
  },
  {
    path: '/remove-matcha-filter',
    lastModified: SITE_LAST_UPDATED,
    changeFrequency: 'weekly',
    priority: 0.9,
  },
  { path: '/blog', changeFrequency: 'daily', priority: 0.8 },
  { path: '/privacy-policy', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/terms-of-service', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/refund-policy', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
];

type Entry = {
  path: string;
  lastModified?: string;
  changeFrequency: string;
  priority: number;
  indexableLocales?: readonly string[];
};

function urlFor(path: string, locale: string): string {
  return localizeUrl(`${envConfigs.app_url}${path || '/'}`, {
    locale: locale as (typeof locales)[number],
  }).href;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function entryXml(e: Entry, locale: string): string {
  const indexableLocales = e.indexableLocales ?? INDEXABLE_LOCALES;
  const alternates = indexableLocales
    .map(
      (loc) =>
        `    <xhtml:link rel="alternate" hreflang="${seoLanguageTag(loc)}" href="${escapeXml(urlFor(e.path, loc))}"/>`
    )
    .join('\n');
  const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(urlFor(e.path, baseLocale))}"/>`;
  return [
    '  <url>',
    `    <loc>${escapeXml(urlFor(e.path, locale))}</loc>`,
    alternates,
    xDefault,
    e.lastModified ? `    <lastmod>${e.lastModified}</lastmod>` : null,
    `    <changefreq>${e.changeFrequency}</changefreq>`,
    `    <priority>${e.priority}</priority>`,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const entries: Entry[] = STATIC_PATHS.map((entry) => ({ ...entry }));

        // Blog posts: db posts merged with local MDX posts.
        try {
          const { listPublishedArticles } =
            await import('@/modules/posts/service');
          const rows = await listPublishedArticles().catch(() => []);
          const dbPosts = rows.map((row) => ({
            slug: row.slug,
            title: row.title || row.slug,
            description: row.description || '',
            createdAt: new Date(row.createdAt).toISOString(),
            source: 'db' as const,
          }));
          const posts = mergePosts(dbPosts, getLocalPosts(baseLocale));
          for (const post of posts) {
            entries.push({
              path: `/blog/${post.slug}`,
              lastModified: post.updatedAt ?? post.createdAt,
              changeFrequency: 'monthly',
              priority: 0.6,
            });
          }
        } catch {
          // Database unreachable — static paths + local posts still listed.
          for (const post of getLocalPosts(baseLocale)) {
            entries.push({
              path: `/blog/${post.slug}`,
              lastModified: post.updatedAt ?? post.createdAt,
              changeFrequency: 'monthly',
              priority: 0.6,
            });
          }
        }

        const uniqueEntries = Array.from(
          new Map(entries.map((entry) => [entry.path, entry])).values()
        );

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
          ...uniqueEntries.flatMap((entry) =>
            (entry.indexableLocales ?? INDEXABLE_LOCALES).map((locale) =>
              entryXml(entry, locale)
            )
          ),
          '</urlset>',
          '',
        ].join('\n');

        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control':
              'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
          },
        });
      },
    },
  },
});
