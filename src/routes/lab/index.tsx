import { createFileRoute } from '@tanstack/react-router';

import { Link } from '@/core/i18n/navigation';
import { seoHead } from '@/lib/seo';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { LAB_PAGES } from '@/content/lab-pages';

export const Route = createFileRoute('/lab/')({
  loader: () => ({ locale: getLocale() }),
  head: ({ loaderData }) =>
    seoHead({
      locale: loaderData?.locale ?? 'en',
      path: '/lab',
      title: 'Qwen Image 3 Lab – Real Tests, Prompts & Results',
      description:
        'Inspect practical Qwen Image 3 typography, Chinese text, product photography, infographic and image-editing tests with prompts and observed limitations.',
      dateModified: '2026-09-04',
      indexableLocales: ['en'],
    }),
  component: LabIndex,
});
function LabIndex() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <Header />
      <main className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-serif text-4xl tracking-tight sm:text-6xl">
            Qwen Image 3 Lab
          </h1>
          <p className="text-muted-foreground mt-5 max-w-2xl text-lg leading-8">
            Real prompts, visible examples, observed strengths and honest
            failure notes. No invented scores.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {LAB_PAGES.map((page) => (
              <Link
                key={page.slug}
                href={`/${page.slug}`}
                className="border-border bg-card rounded-2xl border p-6 transition hover:-translate-y-1"
              >
                <h2 className="font-serif text-2xl">{page.title}</h2>
                <p className="text-muted-foreground mt-3 leading-7">
                  {page.shortAnswer}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
