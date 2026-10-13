import {
  HOMEPAGE_EXAMPLES,
  homepageExampleSelection,
  homepageImage,
} from '@/config/homepage-examples';
import { PRIMARY_IMAGE_MODEL } from '@/config/product-facts';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { bananaText } from '@/blocks/banana-messages';
import {
  BananaFeaturesSection,
  type BananaFeature,
} from '@/components/banana-features';

const posterPrompt = HOMEPAGE_EXAMPLES[1].prompt;

export function BananaFeatures() {
  const locale = getLocale();
  const text = (key: string) => bananaText(`features.${key}`, locale);
  const features: BananaFeature[] = [
    {
      id: 'references',
      title: m['banana.features.references.title'](
        { count: PRIMARY_IMAGE_MODEL.maxReferences },
        { locale: locale === 'zh' ? 'zh' : 'en' }
      ),
      body: text('references.body'),
      cta: text('references.cta'),
      href: '/editor',
      selection: homepageExampleSelection(HOMEPAGE_EXAMPLES[0]),
      image: homepageImage('feature-references'),
      imageAlt: text('references.alt'),
    },
    {
      id: 'text',
      title: text('text.title'),
      body: text('text.body'),
      cta: text('text.cta'),
      href: `/?prompt=${encodeURIComponent(posterPrompt)}#tool-generator`,
      selection: homepageExampleSelection(HOMEPAGE_EXAMPLES[1]),
      image: homepageImage('feature-text'),
      imageAlt: text('text.alt'),
    },
    {
      id: 'ratios',
      title: text('ratios.title'),
      body: text('ratios.body'),
      cta: text('ratios.cta'),
      href: '/#tool-generator',
      selection: {
        ...homepageExampleSelection(HOMEPAGE_EXAMPLES[2]),
        focus: 'shape',
      },
      image: homepageImage('feature-ratios'),
      imageAlt: text('ratios.alt'),
    },
  ];

  return (
    <BananaFeaturesSection
      eyebrow={text('eyebrow')}
      heading={text('heading')}
      subtitle={text('subtitle')}
      illustrationCaption={text('caption')}
      features={features}
    />
  );
}
