import {
  messages as scopedMessages,
  tDynamic,
} from '@/core/i18n/lookups/tools';
import { PUBLIC_TOOL_PAGES } from '@/config/public-creative';
import {
  TOOL_IMAGES,
  TOOL_PATHS,
  type ScenarioToolKind,
  type ToolKind,
} from '@/lib/tools';
import { m } from '@/paraglide/messages.js';
import { getLocalizedTools } from '@/blocks/tool-catalog';
import type { ScenarioGeneratorCopy } from '@/components/scenario-generator-workspace';
import {
  ToolLandingPage,
  type ToolFaq,
  type ToolLandingPageProps,
} from '@/components/tool-landing-page';
import {
  ToolsDirectoryPage,
  type ToolsDirectoryItem,
} from '@/components/tools-directory-page';

function optionsFor(
  prefix:
    | 'tools.poster.purpose'
    | 'tools.poster.style'
    | 'tools.product_photo.setting'
    | 'tools.product_photo.lighting',
  count: number
) {
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    return {
      value: `${prefix}-${number}`,
      label: tDynamic(`${prefix}_${number}_label`),
      prompt: tDynamic(`${prefix}_${number}_prompt`),
    };
  });
}

function generatorCopy(kind: ScenarioToolKind): ScenarioGeneratorCopy {
  return {
    path: TOOL_PATHS[kind],
    workspaceLabel: tDynamic(`tools.${kind}.workspace_label`),
    workspaceDescription: tDynamic(`tools.${kind}.workspace_description`),
    privateLabel: m['tools.generator.private_label'](),
    creditsLabel: m['tools.generator.credits_label']({
      credits: '{credits}',
    }),
    creditsLoading: m['tools.generator.credits_loading'](),
    creditsSignIn: m['tools.generator.credits_sign_in'](),
    creditsUnavailable: m['tools.generator.credits_unavailable'](),
    getCredits: m['tools.generator.get_credits'](),
    requiredLabel: m['tools.generator.required'](),
    optionalLabel: m['tools.generator.optional'](),
    poster: {
      headlineLabel: m['tools.poster.field_headline'](),
      headlinePlaceholder: m['tools.poster.field_headline_placeholder'](),
      supportingLabel: m['tools.poster.field_supporting'](),
      supportingPlaceholder: m['tools.poster.field_supporting_placeholder'](),
      purposeLabel: m['tools.poster.field_purpose'](),
      purposeOptions: optionsFor('tools.poster.purpose', 4),
      styleLabel: m['tools.poster.field_style'](),
      styleOptions: optionsFor('tools.poster.style', 4),
      paletteLabel: m['tools.poster.field_palette'](),
      palettePlaceholder: m['tools.poster.field_palette_placeholder'](),
    },
    productPhoto: {
      productLabel: m['tools.product_photo.field_product'](),
      productPlaceholder: m['tools.product_photo.field_product_placeholder'](),
      detailsLabel: m['tools.product_photo.field_details'](),
      detailsPlaceholder: m['tools.product_photo.field_details_placeholder'](),
      settingLabel: m['tools.product_photo.field_setting'](),
      settingOptions: optionsFor('tools.product_photo.setting', 4),
      lightingLabel: m['tools.product_photo.field_lighting'](),
      lightingOptions: optionsFor('tools.product_photo.lighting', 4),
      paletteLabel: m['tools.product_photo.field_palette'](),
      palettePlaceholder: m['tools.product_photo.field_palette_placeholder'](),
    },
    aspectLabel: m['tools.generator.aspect_label'](),
    square: m['tools.generator.square'](),
    landscape: m['tools.generator.landscape'](),
    portrait: m['tools.generator.portrait'](),
    promptPreviewLabel: m['tools.generator.prompt_preview'](),
    cost: m['tools.generator.cost']({ credits: '{credits}' }),
    generate: m['tools.generator.generate'](),
    generating: m['tools.generator.generating'](),
    signUpToGenerate: m['tools.generator.sign_up'](),
    resultTitle: m['tools.generator.result_title'](),
    resultEmpty: tDynamic(`tools.${kind}.result_empty`),
    resultReady: m['tools.generator.result_ready'](),
    openStudio: m['tools.generator.open_studio'](),
    originalImage: m['settings.generate.compare_original_title'](),
    downloadPreview: m['editor.download'](),
    error: m['tools.generator.error'](),
    success: m['tools.generator.success'](),
  };
}

function faqsFor(kind: ScenarioToolKind, locale?: string): ToolFaq[] {
  const localized = (key: string) => {
    const fn = scopedMessages[key];
    if (typeof fn !== 'function') return key;
    return locale
      ? (fn as (inputs: object, options: { locale: string }) => string)(
          {},
          { locale }
        )
      : (fn as () => string)();
  };
  return Array.from({ length: 6 }, (_, index) => {
    const number = index + 1;
    return {
      question: localized(`tools.${kind}.faq_${number}_question`),
      answer: localized(`tools.${kind}.faq_${number}_answer`),
    };
  });
}

export function getToolFaqs(kind: ScenarioToolKind, locale: string) {
  return faqsFor(kind, locale);
}

function contentFor(kind: ScenarioToolKind): ToolLandingPageProps {
  const otherKind: ScenarioToolKind =
    kind === 'poster' ? 'product_photo' : 'poster';
  const guidePath =
    kind === 'poster' ? '/ai-poster-generator' : '/ai-product-photo-generator';

  return {
    kind,
    path: TOOL_PATHS[kind],
    image: TOOL_IMAGES[kind],
    eyebrow: tDynamic(`tools.${kind}.eyebrow`),
    title: tDynamic(`tools.${kind}.title`),
    description: tDynamic(`tools.${kind}.description`),
    trustNote: tDynamic(`tools.${kind}.trust_note`),
    breadcrumbHome: m['tools.common.home'](),
    breadcrumbTools: m['tools.common.tools'](),
    showcaseAlt: tDynamic(`tools.${kind}.showcase_alt`),
    showcaseCaption: tDynamic(`tools.${kind}.showcase_caption`),
    showcaseDisclosure: m['tools.common.showcase_disclosure'](),
    generatorTitle: tDynamic(`tools.${kind}.generator_title`),
    generatorDescription: tDynamic(`tools.${kind}.generator_description`),
    generatorCopy: generatorCopy(kind),
    outcomesTitle: tDynamic(`tools.${kind}.outcomes_title`),
    outcomesDescription: tDynamic(`tools.${kind}.outcomes_description`),
    outcomes: Array.from({ length: 3 }, (_, index) => {
      const number = index + 1;
      return {
        title: tDynamic(`tools.${kind}.outcome_${number}_title`),
        description: tDynamic(`tools.${kind}.outcome_${number}_description`),
      };
    }),
    workflowTitle: tDynamic(`tools.${kind}.workflow_title`),
    workflowDescription: tDynamic(`tools.${kind}.workflow_description`),
    steps: Array.from({ length: 4 }, (_, index) => {
      const number = index + 1;
      return {
        title: tDynamic(`tools.${kind}.step_${number}_title`),
        description: tDynamic(`tools.${kind}.step_${number}_description`),
      };
    }),
    promptsTitle: tDynamic(`tools.${kind}.prompts_title`),
    promptsDescription: tDynamic(`tools.${kind}.prompts_description`),
    prompts: Array.from({ length: 3 }, (_, index) => {
      const number = index + 1;
      return {
        title: tDynamic(`tools.${kind}.prompt_${number}_title`),
        prompt: tDynamic(`tools.${kind}.prompt_${number}_body`),
      };
    }),
    guidanceTitle: tDynamic(`tools.${kind}.guidance_title`),
    guidanceDescription: tDynamic(`tools.${kind}.guidance_description`),
    tips: Array.from({ length: 4 }, (_, index) =>
      tDynamic(`tools.${kind}.tip_${index + 1}`)
    ),
    limitationTitle: tDynamic(`tools.${kind}.limitation_title`),
    limitation: tDynamic(`tools.${kind}.limitation_body`),
    faqTitle: m['tools.common.faq_title'](),
    faqs: faqsFor(kind),
    relatedTitle: m['tools.common.related_title'](),
    relatedLinks: [
      {
        href: guidePath,
        label: tDynamic(`tools.${kind}.guide_link`),
      },
      {
        href: TOOL_PATHS[otherKind],
        label: tDynamic(`tools.${otherKind}.link_label`),
      },
      {
        href: '/prompts',
        label: m['seo.prompts.link_label'](),
      },
    ],
    ctaTitle: tDynamic(`tools.${kind}.cta_title`),
    ctaDescription: tDynamic(`tools.${kind}.cta_description`),
    ctaPrimary: tDynamic(`tools.${kind}.cta_primary`),
    ctaSecondary: m['tools.common.all_tools'](),
  };
}

export function ToolPage({ kind }: { kind: ScenarioToolKind }) {
  return <ToolLandingPage {...contentFor(kind)} />;
}

export function ToolsDirectory() {
  const workflowKinds = new Set<ToolKind>([
    'poster',
    'product_photo',
    'youtube_thumbnail',
    'video',
    'background_remover',
    'matcha_filter',
  ]);
  const specialFeatures: Partial<Record<ToolKind, string[]>> = {
    image: [
      m['landing.features.generate.title'](),
      m['landing.features.styles.title'](),
      m['landing.features.quality.title'](),
    ],
    wan3: [
      m['wan3.fact_1_title'](),
      m['wan3.fact_2_title'](),
      m['wan3.fact_3_title'](),
    ],
    seedance25: [
      m['seedance25.fact_1_title'](),
      m['seedance25.fact_2_title'](),
      m['seedance25.fact_3_title'](),
    ],
    minimax_h3: [
      m['minimax_h3.fact_1_title'](),
      m['minimax_h3.fact_2_title'](),
      m['minimax_h3.fact_3_title'](),
    ],
  };
  const existingItems: ToolsDirectoryItem[] = getLocalizedTools()
    .filter((tool) => tool.kind !== 'creative_studio')
    .map((tool) => {
      const features = workflowKinds.has(tool.kind)
        ? Array.from({ length: 3 }, (_, index) =>
            tDynamic(`tools.${tool.kind}.directory_feature_${index + 1}`)
          )
        : (specialFeatures[tool.kind] ?? []);
      return {
        href: tool.href,
        image: tool.image,
        title: tool.title,
        description: tool.description,
        features,
        action: m['landing.tools_launchpad.open'](),
        alt: tool.title,
        category: tool.category,
        input: tool.input,
        output: tool.output,
        pricing: tool.pricing,
        keywords: tool.keywords,
        popular: tool.popular,
        isNew: tool.isNew,
        isPreview: tool.isPreview,
        directoryRank: tool.directoryRank,
      };
    });
  const publicItems: ToolsDirectoryItem[] = PUBLIC_TOOL_PAGES.map(
    (tool, index) => {
      const remote = [
        'generate',
        'edit',
        'relight',
        'mask',
        'outpaint',
        'logo',
        'sketch',
        'annotate',
      ].includes(tool.panel);
      const utility = ['upload', 'vectorize'].includes(tool.panel);
      const noImage = [
        'generate',
        'brand',
        'logo',
        'templates',
        'prompt',
      ].includes(tool.panel);
      return {
        creativeToolId: tool.id,
        href: tool.path,
        image: tool.cardImage,
        title: tool.name,
        description: tool.summary,
        features: [
          `${tool.category} task-specific controls`,
          remote
            ? 'Server-verified model and credits'
            : 'Preview before export',
          'Dedicated public workspace',
        ],
        action: tool.action,
        alt: `${tool.name} task illustration`,
        category: tool.category === 'Create' ? 'image' : 'edit',
        input: noImage ? (remote ? ['prompt'] : []) : ['image'],
        output: 'image',
        pricing: remote
          ? { type: 'range' as const, minCredits: 3, maxCredits: 15 }
          : utility
            ? { type: 'fixed' as const, credits: 5 }
            : { type: 'fixed' as const, credits: 0 },
        keywords: [tool.name, tool.category, tool.panel],
        popular: ['T03', 'T04', 'T05', 'T07', 'T10', 'T18'].includes(tool.id),
        isNew: true,
        directoryRank: 20 + index,
      };
    }
  );
  const keywordItems: ToolsDirectoryItem[] = [
    {
      href: '/shirt-mockup-generator',
      image: '/imgs/keyword/shirt-mockup-example.webp',
      title: m['keyword.mockup.directory_title'](),
      description: m['keyword.mockup.meta_description'](),
      features: [
        m['keyword.mockup.color'](),
        m['keyword.mockup.scale'](),
        m['keyword.mockup.download'](),
      ],
      action: m['landing.tools_launchpad.open'](),
      alt: m['keyword.mockup.preview_alt'](),
      category: 'edit',
      input: ['image'],
      output: 'image',
      pricing: { type: 'fixed', credits: 0 },
      keywords: ['shirt mockup', 't-shirt mockup', 'product sample'],
      isNew: true,
      directoryRank: 49,
    },
    {
      href: '/pixel-art-generator',
      image: '/imgs/keyword/pixel-art-example.webp',
      title: m['keyword.pixel.directory_title'](),
      description: m['keyword.pixel.meta_description'](),
      features: [
        m['keyword.pixel.grid'](),
        m['keyword.pixel.palette'](),
        m['keyword.pixel.download'](),
      ],
      action: m['landing.tools_launchpad.open'](),
      alt: m['keyword.pixel.preview_alt'](),
      category: 'image',
      input: ['prompt', 'image'],
      output: 'image',
      pricing: { type: 'range', minCredits: 0, maxCredits: 5 },
      keywords: ['pixel art generator', 'pixelate image', 'sprite maker'],
      isNew: true,
      directoryRank: 50,
    },
  ];
  const items = [...existingItems, ...publicItems, ...keywordItems];

  return (
    <>
      <ToolsDirectoryPage
        eyebrow={m['tools.directory.eyebrow']()}
        title={m['tools.directory.title']()}
        description={m['tools.directory.description']()}
        principleTitle={m['tools.directory.principle_title']()}
        principleDescription={m['tools.directory.principle_description']()}
        items={items}
        copy={{
          searchPlaceholder: m['tools.directory.search_placeholder'](),
          categoryAll: m['landing.tools_launchpad.category_all'](),
          categoryImage: m['landing.tools_launchpad.category_image'](),
          categoryVideo: m['landing.tools_launchpad.category_video'](),
          categoryEdit: m['landing.tools_launchpad.category_edit'](),
          filterAll: m['tools.directory.filter_all'](),
          filterPopular: m['tools.directory.filter_popular'](),
          filterNew: m['tools.directory.filter_new'](),
          pricingFixed: m['tools.directory.pricing_fixed']({
            credits: '{credits}',
          }),
          pricingRange: m['tools.directory.pricing_range']({
            min: '{min}',
            max: '{max}',
          }),
          pricingPreview: m['tools.directory.pricing_preview'](),
          inputPrompt: m['tools.directory.input_prompt'](),
          inputImage: m['tools.directory.input_image'](),
          inputVideo: m['tools.directory.input_video'](),
          outputImage: m['tools.directory.output_image'](),
          outputVideo: m['tools.directory.output_video'](),
          noResultsTitle: m['tools.directory.no_results_title'](),
          noResultsDescription: m['tools.directory.no_results_description'](),
        }}
      />
    </>
  );
}
