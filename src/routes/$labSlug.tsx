import { createFileRoute, notFound, redirect } from '@tanstack/react-router';

import { seoHead } from '@/lib/seo';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { LabPage } from '@/blocks/lab-page';
import { QwenLandingPage } from '@/blocks/qwen-landing-page';
import { getLabPage } from '@/content/lab-pages';
import { getQwenLandingPage } from '@/content/qwen-landing-pages';

export const Route = createFileRoute('/$labSlug')({
  beforeLoad: ({ params }) => {
    if (params.labSlug === 'qwen-image-3-standard-vs-pro') {
      throw redirect({
        href: '/qwen-image-3-vs-pro',
        statusCode: 301,
      });
    }
    if (!getLabPage(params.labSlug) && !getQwenLandingPage(params.labSlug))
      throw notFound();
  },
  loader: ({ params }) => ({
    locale: getLocale(),
    page: getLabPage(params.labSlug),
    landing: getQwenLandingPage(params.labSlug),
  }),
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          locale: loaderData.locale,
          path: `/${(loaderData.page ?? loaderData.landing)!.slug}`,
          title: (loaderData.page ?? loaderData.landing)!.title,
          description:
            loaderData.page?.shortAnswer ?? loaderData.landing!.description,
          type: loaderData.page ? 'article' : 'website',
          image: (loaderData.page ?? loaderData.landing)!.image,
          datePublished: '2026-09-04',
          dateModified: '2026-09-04',
          indexableLocales: ['en'],
        })
      : {},
  component: LabArticle,
});

function LabArticle() {
  const { page, landing } = Route.useLoaderData();
  return (
    <div className="bg-background text-foreground min-h-screen">
      <Header />
      {page ? <LabPage page={page} /> : <QwenLandingPage page={landing!} />}
      <Footer />
    </div>
  );
}
