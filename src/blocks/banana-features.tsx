import { getLocale } from '@/paraglide/runtime.js';
import { bananaText } from '@/blocks/banana-messages';
import {
  BananaFeaturesSection,
  type BananaFeature,
} from '@/components/banana-features';

const posterPrompt =
  'Design a warm cafe poster with the exact headline "FRESH COFFEE" and the subheading "Every morning, made for you". Use large readable lettering, a cream background, one illustrated espresso cup and generous space around the text. Keep all spelling exact.';

export function BananaFeatures() {
  const locale = getLocale();
  const text = (key: string) => bananaText(`features.${key}`, locale);
  const features: BananaFeature[] = [
    {
      id: 'references',
      title: text('references.title'),
      body: text('references.body'),
      cta: text('references.cta'),
      href: '/editor',
      selection: { mode: 'edit', model: 'nano-banana-pro' },
      image: '/images/workflows/feature-references.svg',
      imageAlt: text('references.alt'),
    },
    {
      id: 'text',
      title: text('text.title'),
      body: text('text.body'),
      cta: text('text.cta'),
      href: `/?prompt=${encodeURIComponent(posterPrompt)}#tool-generator`,
      selection: {
        mode: 'generate',
        model: 'nano-banana-pro',
        prompt: posterPrompt,
        focus: 'prompt',
      },
      image: '/images/workflows/feature-text.svg',
      imageAlt: text('text.alt'),
    },
    {
      id: 'ratios',
      title: text('ratios.title'),
      body: text('ratios.body'),
      cta: text('ratios.cta'),
      href: '/#tool-generator',
      selection: { focus: 'shape' },
      image: '/images/workflows/feature-ratios.svg',
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
