import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { organizationSchema, seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { CreativeHome } from '@/blocks/creative-home';
import { FAQ, getHomepageFaqs } from '@/blocks/faq';
import { Footer } from '@/blocks/footer';
import { HomepageEnhancements } from '@/blocks/homepage-enhancements';
import { Pricing } from '@/blocks/pricing';

function HomePage() {
  return (
    <CreativeHome>
      <Pricing compact />
      <FAQ compact />
      <Footer />
      <HomepageEnhancements />
    </CreativeHome>
  );
}

export const Route = createFileRoute('/')({
  loader: () => {
    const locale = getLocale();
    return { locale, faqItems: getHomepageFaqs(locale) };
  },
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? 'en';
    const title = m['common.metadata.title']({}, { locale: locale as any });
    const description = m['common.metadata.description'](
      {},
      { locale: locale as any }
    );
    return seoHead({
      locale,
      path: '/',
      title,
      description,
      type: 'website',
      dateModified: '2026-10-10',
      faqItems: loaderData?.faqItems ?? [],
      extraSchemas: [
        organizationSchema(),
        {
          '@type': 'WebSite',
          '@id': `${envConfigs.app_url}/#website`,
          name: envConfigs.app_name,
          url: envConfigs.app_url,
          publisher: { '@id': `${envConfigs.app_url}/#organization` },
        },
      ],
    });
  },
  component: HomePage,
});
