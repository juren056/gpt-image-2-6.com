import { createFileRoute, notFound } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { PromptDirectory } from '@/blocks/prompt-directory';
import {
  PROMPT_CATEGORIES,
  type PromptCategory,
} from '@/content/studio-prompts';

export const Route = createFileRoute('/prompts/$category')({
  beforeLoad: ({ params }) => {
    if (!PROMPT_CATEGORIES.includes(params.category as PromptCategory))
      throw notFound();
  },
  loader: ({ params }) => ({
    locale: getLocale(),
    category: params.category as PromptCategory,
  }),
  head: ({ loaderData }) =>
    seoHead({
      locale: loaderData?.locale ?? 'en',
      path: `/prompts/${loaderData?.category}`,
      title:
        loaderData?.category === 'chinese'
          ? m['prompts.chinese.title']({}, { locale: loaderData.locale })
          : m['prompts.category_meta_title'](
              { category: loaderData?.category ?? '' },
              { locale: loaderData?.locale ?? 'en' }
            ),
      description:
        loaderData?.category === 'chinese'
          ? m['prompts.chinese.description']({}, { locale: loaderData.locale })
          : (loaderData?.category ?? 'AI image') +
            ' prompt examples with copy-ready instructions, reference images, and practical generation workflows.',
      ...(loaderData?.category === 'chinese'
        ? {
            image: '/evidence/2026-10-13/NB-05.webp',
            imageWidth: 640,
            imageHeight: 640,
          }
        : {}),
      dateModified:
        loaderData?.category === 'chinese' ? '2026-10-18' : '2026-09-20',
      indexableLocales:
        loaderData?.category === 'chinese' ? ['en', 'zh'] : ['en'],
    }),
  component: PromptCategoryPage,
});

function PromptCategoryPage() {
  const { category } = Route.useLoaderData();
  return (
    <div className="bg-background text-foreground min-h-screen">
      <Header />
      <PromptDirectory category={category} />
      <Footer />
    </div>
  );
}
