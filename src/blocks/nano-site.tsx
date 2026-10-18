import type { ReactNode } from 'react';

import { Link } from '@/core/i18n/navigation';
import {
  NANO_API_SAMPLE,
  NANO_PAGE_SOURCES,
  NANO_SITE_PAGES,
  NANO_SITE_REVIEW_DATE,
  NANO_SITE_SOURCES,
  type NanoPageId,
} from '@/config/nano-site';
import { sitemapLastModified } from '@/config/sitemap-updates';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { BANANA_GENERATOR_KEYS, BananaHome } from '@/blocks/banana-home';
import { bananaText } from '@/blocks/banana-messages';
import { AccountPromptLibrary } from '@/blocks/banana-prompt-library';
import { Footer } from '@/blocks/footer';
import { FreeExperience } from '@/blocks/free-experience';
import { Header } from '@/blocks/header';
import { nanoSiteText } from '@/blocks/nano-site-messages';
import { Pricing } from '@/blocks/pricing';
import { SeoEditorial } from '@/blocks/seo-editorial';
import { workflowCopy } from '@/blocks/workflow-copy';
import { BananaArticle, type NanoPageCopy } from '@/components/banana-article';
import { BananaGenerator } from '@/components/banana-generator';

export function getNanoPageCopy(id: NanoPageId, locale: string): NanoPageCopy {
  const config = NANO_SITE_PAGES[id];
  const contentLocale = locale === 'zh' ? 'zh' : 'en';
  const text = (key: string) => nanoSiteText(`${id}.${key}`, contentLocale);
  return {
    path: config.path,
    title: text('title'),
    description: text('description'),
    heading: text('heading'),
    intro: text('intro'),
    sections: Array.from({ length: config.sections }, (_, i) => ({
      id: `section-${i}`,
      title: text(`section_${i}.title`),
      paragraphs: text(`section_${i}.body`).split('\n\n'),
    })),
    faqs: Array.from({ length: config.faqs }, (_, i) => ({
      question: text(`faq_${i}.question`),
      answer: text(`faq_${i}.answer`),
    })),
  };
}

const SHARED_KEYS = [
  'home',
  'contents',
  'updated',
  'sources',
  'related',
  'faq',
  'start',
  'browse',
  'illustration',
  'independent',
  'nav_editor',
  'prompt_product',
  'workbench',
  'model',
  'prompt',
  'placeholder',
  'shape',
  'generate_mode',
  'edit_mode',
  'reference',
  'reference_hint',
  'pending',
  'checking',
  'check_failed',
  'ready',
  'copy',
  'copied',
  'copy_failed',
  'save',
  'run',
  'working',
  'signin',
  'result',
  'empty',
  'error',
  'download',
  'credits',
  'preview',
  'replace',
  'uploading',
  'failed',
  'remove',
  'upload',
  'max_size',
  'recipes',
  'use_prompt',
  'prompt_note',
  'priority',
  'tutorials',
  'draft_restored',
  'draft_saved',
  'retry',
] as const;

export function getNanoGeneratorContent(locale: string) {
  const contentLocale = locale === 'zh' ? 'zh' : 'en';
  return {
    copy: {
      ...Object.fromEntries(
        Object.entries(workflowCopy()).map(([key, value]) => [
          `flow_${key}`,
          value,
        ])
      ),
      ...Object.fromEntries(
        SHARED_KEYS.map((key) => [key, nanoSiteText(key, contentLocale)])
      ),
      ...Object.fromEntries(
        BANANA_GENERATOR_KEYS.map((key) => [key, bananaText(key, locale)])
      ),
    },
    recipes: [
      'product',
      'poster',
      'portrait',
      'edit',
      'science',
      'story',
      'logo',
    ].map((key) => ({
      id: key,
      title: nanoSiteText(`prompt_${key}`, contentLocale),
      prompt: nanoSiteText(`prompt_${key}_body`, contentLocale),
    })),
  };
}

const RELATED_PAGES: Partial<Record<NanoPageId, NanoPageId[]>> = {
  home: ['prompts', 'comparison', 'science', 'pricing', 'api', 'blog'],
  prompts: [
    'editor',
    'science',
    'logo',
    'blogProduct',
    'blogText',
    'blogReferences',
  ],
  comparison: [
    'versus2',
    'versusGpt',
    'pro',
    'prompts',
    'pricing',
    'migration',
  ],
  versus2: ['comparison', 'migration', 'guide', 'prompts', 'pricing'],
  versusGpt: ['comparison', 'versus2', 'blogText', 'blogReferences', 'pricing'],
  science: ['prompts', 'editor', 'blogText', 'blogExport', 'blogRights'],
  api: ['mcp', 'pricing', 'migration', 'guide', 'versus2'],
  mcp: ['api', 'guide', 'prompts', 'blogRights'],
  blogText: ['prompts', 'blogReferences', 'blogExport', 'blogRights'],
  blogRights: ['blogText', 'blogProduct', 'api'],
  migration: ['versus2', 'api', 'guide', 'comparison'],
  logo: ['prompts', 'editor', 'blogText', 'blogRights'],
  blog: ['prompts', 'science', 'logo', 'editor', 'guide'],
};
const BLOG_PAGES: NanoPageId[] = [
  'blogProduct',
  'blogText',
  'blogReferences',
  'blogExport',
  'blogRights',
];

export function NanoSitePage({
  id,
  children,
}: {
  id: NanoPageId;
  children?: ReactNode;
}) {
  const locale = getLocale();
  const contentLocale = locale === 'zh' ? 'zh' : 'en';
  const { copy, recipes } = getNanoGeneratorContent(locale);
  const page = getNanoPageCopy(id, locale);
  const hasWorkbench = [
    'home',
    'free',
    'science',
    'editor',
    'pro',
    'logo',
  ].includes(id);
  const related = (
    RELATED_PAGES[id] ||
    (id.startsWith('blog')
      ? (['blog', 'prompts', 'editor', 'science', 'pricing'] as NanoPageId[])
      : ([
          'prompts',
          'comparison',
          'science',
          'pricing',
          'api',
          'blog',
        ] as NanoPageId[]))
  )
    .filter((key) => key !== id)
    .map((key) => {
      const item = getNanoPageCopy(key, locale);
      return {
        href: item.path,
        label: item.heading.replace('\n', ' '),
        description: item.description,
      };
    });
  if (id === 'home')
    return <BananaHome page={page} copy={copy} recipes={recipes} />;
  return (
    <div className="nano-site bg-background text-foreground min-h-screen">
      <Header />
      <BananaArticle
        page={page}
        editorial={<SeoEditorial id={id} />}
        copy={{
          ...copy,
          updated: m['product.reviewed_date'](
            { date: sitemapLastModified(page.path, NANO_SITE_REVIEW_DATE)! },
            { locale: contentLocale }
          ),
        }}
        primaryHref={hasWorkbench ? '#generator' : '/#tool-generator'}
        sources={NANO_PAGE_SOURCES[id] || NANO_SITE_SOURCES}
        related={related}
        sample={id === 'api' ? NANO_API_SAMPLE : undefined}
      >
        {id === 'prompts' && <AccountPromptLibrary publicView />}
        {id === 'free' && <FreeExperience />}
        {hasWorkbench && (
          <BananaGenerator
            copy={{
              ...copy,
              ...Object.fromEntries(
                BANANA_GENERATOR_KEYS.map((key) => [
                  key,
                  bananaText(key, locale),
                ])
              ),
            }}
            recipes={
              id === 'science' || id === 'logo'
                ? recipes.filter((recipe) => recipe.id === id)
                : recipes
            }
            initialModel={id === 'pro' ? 'nano-banana-pro' : 'nano-banana-2.1'}
            initialMode={id === 'editor' ? 'edit' : 'generate'}
            returnPath={page.path}
          />
        )}
        {id === 'pricing' && <Pricing />}
        {id === 'blog' && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold">{copy.tutorials}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {BLOG_PAGES.map((key) => {
                const item = getNanoPageCopy(key, locale);
                return (
                  <Link
                    key={key}
                    href={item.path}
                    className="border-border hover:bg-muted rounded-xl border p-5"
                  >
                    <h3 className="font-semibold">{item.heading}</h3>
                    <p className="text-muted-foreground mt-3 text-sm leading-7">
                      {item.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
        {id === 'prompts' && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold">{copy.recipes}</h2>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              {recipes.map((recipe) => (
                <article
                  key={recipe.id}
                  className="border-border rounded-xl border p-5"
                >
                  <h3 className="font-semibold">{recipe.title}</h3>
                  <p className="text-muted-foreground mt-3 text-sm leading-7">
                    {recipe.prompt}
                  </p>
                  <Link
                    href={`/?prompt=${encodeURIComponent(recipe.prompt)}#generator`}
                    className="mt-4 inline-flex min-h-11 items-center font-medium underline underline-offset-4"
                  >
                    {copy.use_prompt}
                  </Link>
                </article>
              ))}
            </div>
            <nav aria-label={copy.browse} className="mt-6 flex flex-wrap gap-4">
              {[
                'poster',
                'product',
                'typography',
                'infographic',
                'ecommerce',
                'illustration',
                'photography',
              ].map((category) => (
                <Link
                  key={category}
                  href={`/prompts/${category}`}
                  className="min-h-10 text-sm underline underline-offset-4"
                >
                  {nanoSiteText(`category.${category}`, contentLocale)}
                </Link>
              ))}
            </nav>
          </section>
        )}
        {children}
      </BananaArticle>
      <Footer />
    </div>
  );
}
