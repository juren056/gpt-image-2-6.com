import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { ModelsDirectory } from '@/components/public-model-generator';

export const Route = createFileRoute('/models')({
  loader: () => ({ locale: getLocale() }),
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          locale: loaderData.locale,
          path: '/models',
          title: 'AI Image Models for Generation & Editing | QwenImage3',
          description:
            'Compare image generation and editing models, then open a dedicated generator with accurate inputs, limits, and credit pricing.',
          type: 'website',
          dateModified: '2026-09-12',
          indexableLocales: ['en'],
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <ModelsDirectory />
      <Footer />
    </div>
  ),
});
