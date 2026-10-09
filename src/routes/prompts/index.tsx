import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { PromptDirectory } from '@/blocks/prompt-directory';

export const Route = createFileRoute('/prompts/')({
  loader: () => ({ locale: getLocale() }),
  head: ({ loaderData }) =>
    seoHead({
      locale: loaderData?.locale ?? 'en',
      path: '/prompts',
      title: m['prompts.meta_title'](
        {},
        { locale: loaderData?.locale ?? 'en' }
      ),
      description: m['prompts.meta_description'](
        {},
        { locale: loaderData?.locale ?? 'en' }
      ),
      dateModified: '2026-09-04',
    }),
  component: () => (
    <div className="bg-background text-foreground min-h-screen">
      <Header />
      <PromptDirectory />
      <Footer />
    </div>
  ),
});
