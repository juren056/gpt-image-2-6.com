import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { seoHead } from '@/lib/seo';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { CTA } from '@/blocks/cta';
import { FAQ, getHomepageFaqs } from '@/blocks/faq';
import { Features } from '@/blocks/features';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { Hero } from '@/blocks/hero';
import { HomepageDiscovery } from '@/blocks/homepage-discovery';
import { HomepageEnhancements } from '@/blocks/homepage-enhancements';
import {
  HomepageLab,
  ImageEditingFeature,
} from '@/blocks/homepage-studio-sections';
import { HowItWorks } from '@/blocks/how-it-works';
import { Pricing } from '@/blocks/pricing';
import { PromptLibrary } from '@/blocks/prompt-library';

function HomePage() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main>
        <Hero />
        <div className="[&>section]:[contain-intrinsic-size:auto_900px] [&>section]:[content-visibility:auto]">
          <HomepageDiscovery />
          <HowItWorks />
          <Features />
          <ImageEditingFeature />
          <PromptLibrary compact />
          <HomepageLab />
          <Pricing compact />
          <FAQ />
          <CTA />
        </div>
      </main>
      <Footer />
      <HomepageEnhancements />
    </div>
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
      dateModified: '2026-10-06',
      faqItems: loaderData?.faqItems ?? [],
      extraSchemas: [
        {
          '@type': 'WebSite',
          name: envConfigs.app_name,
          url: envConfigs.app_url,
          about: {
            '@type': 'Thing',
            name: 'Qwen Image 3.0',
            url: 'https://qwen.ai/blog?id=qwen-image-3.0',
          },
        },
      ],
    });
  },
  component: HomePage,
});
