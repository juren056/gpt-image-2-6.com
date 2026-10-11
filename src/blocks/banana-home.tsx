import { CREATIVE_MODELS } from '@/config/creative-studio';
import { getLocale } from '@/paraglide/runtime.js';
import { BananaFeatures } from '@/blocks/banana-features';
import { bananaText } from '@/blocks/banana-messages';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { Pricing } from '@/blocks/pricing';
import type { NanoPageCopy } from '@/components/banana-article';
import {
  BananaGenerator,
  type NanoRecipe,
} from '@/components/banana-generator';
import {
  BananaCapabilities,
  BananaClosing,
  BananaFaq,
  BananaHero,
  BananaIntro,
  BananaModelComparison,
  BananaSteps,
  BananaUseCases,
  SectionHeading,
} from '@/components/banana-home-content';

export const BANANA_GENERATOR_KEYS = [
  'operation',
  'generate_mode',
  'edit_mode',
  'studio_title',
  'studio_description',
  'studio_link',
  'model_21_summary',
  'model_2_summary',
  'model_pro_summary',
  'model_lite_summary',
  'search_models',
  'no_models',
  'resolution',
  'provider_default',
  'output_count',
  'outputs_hint',
  'preview_heading',
  'empty',
  'prompt_required',
  'prompt',
  'run',
  'signin',
  'recent',
  'view_history',
  'history_failed',
  'no_history',
  'reuse_prompt',
  'manage_assets',
] as const;

export function BananaHome({
  page,
  copy,
  recipes,
}: {
  page: NanoPageCopy;
  copy: Record<string, string>;
  recipes: NanoRecipe[];
}) {
  const locale = getLocale();
  const text = (key: string) => bananaText(key, locale);
  const cards = (prefix: string, count: number) =>
    Array.from({ length: count }, (_, index) => ({
      title: text(`${prefix}.${index}.title`),
      body: text(`${prefix}.${index}.body`),
    }));
  const models = [
    'nano-banana-2.1',
    'nano-banana-2',
    'nano-banana-pro',
    'nano-banana-2-lite',
  ].map((id, index) => {
    const model = CREATIVE_MODELS.find((model) => model.id === id)!;
    return {
      id,
      name: model.label,
      title: text(`models.${index}.title`),
      body: text(`models.${index}.body`),
      references: String(model.maxReferences),
      credits: model.credits.generate
        ? String(model.credits.generate)
        : text('models.pending'),
      href: id === 'nano-banana-2.1' ? '/#tool-generator' : `/${id}`,
    };
  });
  const caseImages = ['product', 'character', 'localize', 'social'];
  const caseLinks = [
    '/prompts',
    '/blog/consistent-characters',
    '/blog/readable-text-in-ai-images',
    '/blog/image-export-resolution',
  ];
  const cases = cards('cases', 4).map((card, index) => ({
    ...card,
    image: `/images/workflows/case-${caseImages[index]}.svg`,
    alt: text(`cases.${index}.alt`),
    href: caseLinks[index],
  }));
  return (
    <div className="banana-app">
      <div className="banana-ambient">
        <div className="banana-wash" aria-hidden="true">
          <span />
          <span />
        </div>
        <Header />
        <BananaHero
          badge={text('hero.badge')}
          name={text('hero.name')}
          heading={text('hero.heading')}
          intro={text('hero.intro')}
          start={text('hero.start')}
        />
        <div
          id="tool-generator"
          className="banana-generator-wrap banana-container"
        >
          <span id="generator" aria-hidden="true" />
          <BananaGenerator
            copy={{
              ...copy,
              ...Object.fromEntries(
                BANANA_GENERATOR_KEYS.map((key) => [key, text(key)])
              ),
            }}
            recipes={recipes}
          />
        </div>
      </div>
      <main>
        <BananaIntro
          title={text('intro.title')}
          body={text('intro.body')}
          tags={text('intro.tags').split('|')}
          start={text('intro.start')}
        />
        <BananaFeatures />
        <BananaSteps
          eyebrow={text('steps.eyebrow')}
          title={text('steps.title')}
          intro={text('steps.intro')}
          steps={cards('steps', 4)}
          start={text('steps.start')}
        />
        <BananaModelComparison
          eyebrow={text('models.eyebrow')}
          title={text('models.title')}
          intro={text('models.intro')}
          models={models}
          labels={{
            best: text('models.best'),
            references: text('models.references'),
            credits: text('models.credits'),
            default: text('models.default'),
          }}
          select={text('models.select')}
          comparison={{
            title: text('comparison.title'),
            body: text('comparison.body'),
            link: text('comparison.link'),
          }}
        />
        <BananaCapabilities
          eyebrow={text('capabilities.eyebrow')}
          title={text('capabilities.title')}
          intro={text('capabilities.intro')}
          items={cards('capabilities', 4)}
        />
        <BananaUseCases
          eyebrow={text('cases.eyebrow')}
          title={text('cases.title')}
          intro={text('cases.intro')}
          items={cases}
          caption={text('cases.caption')}
        />
        <section className="banana-section banana-pricing">
          <div className="banana-container">
            <SectionHeading
              eyebrow={text('pricing.eyebrow')}
              title={text('pricing.title')}
              intro={text('pricing.intro')}
            />
            <Pricing title={text('pricing.title')} compact showHeader={false} />
          </div>
        </section>
        <BananaFaq title={text('faq.title')} faqs={page.faqs} />
        <BananaClosing
          eyebrow={text('closing.eyebrow')}
          title={text('closing.title')}
          intro={text('closing.intro')}
          start={text('hero.start')}
          links={[
            { href: '/prompts', label: text('closing.prompts') },
            { href: '/scientific-figures', label: text('closing.science') },
            { href: '/guide', label: text('closing.guide') },
            {
              href: '/posts/nano-banana-21-vs-pro',
              label: text('closing.pro'),
            },
          ]}
        />
      </main>
      <Footer />
    </div>
  );
}
