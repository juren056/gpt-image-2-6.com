import { createFileRoute } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { KeywordGeneratorPage } from '@/components/keyword-generator-page';

export const Route = createFileRoute('/image-to-prompt')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: m['keyword.prompt.meta_title']({}, { locale }),
      description: m['keyword.prompt.meta_description']({}, { locale }),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path: '/image-to-prompt',
          type: 'website',
          // A color/aspect draft is useful but does not yet satisfy the full
          // visual-understanding intent. Keep it out of search until consented,
          // tested server-side analysis is available.
          indexableLocales: [],
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <KeywordGeneratorPage kind="prompt" />
      <Footer />
    </div>
  ),
});
