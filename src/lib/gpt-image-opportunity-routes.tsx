import {
  GPT_IMAGE_OPPORTUNITIES,
  type GptImageOpportunityKind,
} from '@/config/gpt-image-opportunities';
import { seoHead } from '@/lib/seo';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { GptImageOpportunityPage } from '@/components/gpt-image-opportunity-page';

export function gptImageOpportunityRouteOptions(kind: GptImageOpportunityKind) {
  const page = GPT_IMAGE_OPPORTUNITIES[kind];
  return {
    loader: () => ({ locale: getLocale() }),
    head: ({ loaderData }: { loaderData?: { locale: string } }) =>
      loaderData
        ? seoHead({
            locale: loaderData.locale,
            path: page.path,
            title: page.metaTitle,
            description: page.description,
            type: 'website',
            image: page.image,
            dateModified: '2026-09-29',
            indexableLocales: ['en'],
            faqItems: page.faqs,
            extraSchemas: [
              {
                '@type': 'WebApplication',
                name: page.title,
                applicationCategory: 'MultimediaApplication',
                operatingSystem: 'Web',
              },
            ],
          })
        : {},
    component: () => (
      <div className="bg-background text-foreground flex min-h-screen flex-col">
        <Header />
        <GptImageOpportunityPage kind={kind} />
        <Footer />
      </div>
    ),
  };
}
