import { createFileRoute } from '@tanstack/react-router';

import { messages as scopedMessages } from '@/core/i18n/lookups/seedance_draft';
import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { SeedanceDraftModePage } from '@/blocks/seedance-draft-mode-page';

const path = '/seedance-2-5-draft-mode';
function localized(locale: string, key: string) {
  const fn = scopedMessages[key];
  return typeof fn === 'function'
    ? (fn as (inputs: object, options: { locale: string }) => string)(
        {},
        { locale }
      )
    : key;
}

export const Route = createFileRoute('/seedance-2-5-draft-mode')({
  loader: () => {
    const locale = getLocale();
    return {
      locale,
      title: localized(locale, 'seedance_draft.meta_title'),
      description: localized(locale, 'seedance_draft.meta_description'),
      faqItems: Array.from({ length: 4 }, (_, index) => ({
        question: localized(locale, `seedance_draft.faq_${index + 1}_question`),
        answer: localized(locale, `seedance_draft.faq_${index + 1}_answer`),
      })),
    };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          ...loaderData,
          path,
          type: 'website',
          image: '/imgs/tools/seedance-motion-preview.webp',
          imageWidth: 960,
          imageHeight: 540,
          datePublished: '2026-09-24',
          dateModified: '2026-10-18',
          extraSchemas: [
            {
              '@type': 'SoftwareApplication',
              name: loaderData.title,
              description: loaderData.description,
              applicationCategory: 'MultimediaApplication',
              operatingSystem: 'Web',
              browserRequirements: 'Requires JavaScript',
              isAccessibleForFree: true,
              featureList: [
                'Seedance 2.5 draft workflow planner',
                'Editable draft and final cost comparison',
                'Candidate comparison workspace preview',
                'Transparent API availability status',
              ],
            },
          ],
        })
      : {},
  component: () => (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <SeedanceDraftModePage />
      <Footer />
    </div>
  ),
});
