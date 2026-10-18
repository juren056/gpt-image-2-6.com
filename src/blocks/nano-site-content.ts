import { NANO_SITE_PAGES, type NanoPageId } from '@/config/nano-site';
import type { getLocale } from '@/paraglide/runtime.js';
import { BANANA_GENERATOR_KEYS } from '@/blocks/banana-home';
import { bananaText } from '@/blocks/banana-messages';
import { nanoSiteText } from '@/blocks/nano-site-messages';
import { workflowCopy } from '@/blocks/workflow-copy';
import type { NanoPageCopy } from '@/components/banana-article';

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
        Object.entries(
          workflowCopy(locale as ReturnType<typeof getLocale>)
        ).map(([key, value]) => [`flow_${key}`, value])
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

export function getNanoSitePresentation(id: NanoPageId, locale: string) {
  const { copy, recipes } = getNanoGeneratorContent(locale);
  const page = getNanoPageCopy(id, locale);
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
  const blogs =
    id === 'blog' ? BLOG_PAGES.map((key) => getNanoPageCopy(key, locale)) : [];
  const categories = Object.fromEntries(
    [
      'poster',
      'product',
      'typography',
      'infographic',
      'ecommerce',
      'illustration',
      'photography',
    ].map((category) => [
      category,
      nanoSiteText(`category.${category}`, locale === 'zh' ? 'zh' : 'en'),
    ])
  );
  return { locale, page, copy, recipes, related, blogs, categories };
}

export type NanoSitePresentation = ReturnType<typeof getNanoSitePresentation>;
