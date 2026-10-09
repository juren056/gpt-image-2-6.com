import type { ReactNode } from 'react';

import { hasDynamicMessage, tDynamic } from '@/core/i18n/dynamic';
import { GUIDE_IMAGES, GUIDE_PATHS, type GuideKind } from '@/lib/guides';
import { TOOL_PATHS } from '@/lib/tools';
import { m } from '@/paraglide/messages.js';
import {
  SeoGuidePage,
  type SeoGuideFaq,
  type SeoGuideLink,
  type SeoGuidePageProps,
  type SeoGuideSection,
  type SeoGuideVisual,
} from '@/components/seo-guide-page';

export type SeoGuideKind = GuideKind;

const RELATED_PATHS: Record<SeoGuideKind, SeoGuideKind[]> = {
  prompts: ['text_rendering', 'ecommerce', 'api', 'comparison'],
  api: ['open_source', 'prompts', 'ecommerce', 'comparison'],
  comfyui: ['open_source', 'prompts', 'api', 'comparison'],
  comparison: ['text_rendering', 'api', 'prompts', 'open_source'],
  open_source: ['api', 'comfyui', 'comparison', 'text_rendering'],
  text_rendering: ['prompts', 'ecommerce', 'comparison', 'api'],
  ecommerce: ['prompts', 'text_rendering', 'api', 'comparison'],
};

function guideFaqs(kind: SeoGuideKind, locale?: string): SeoGuideFaq[] {
  const options = locale ? { locale } : undefined;
  return [1, 2, 3, 4, 5, 6]
    .filter(
      (index) =>
        hasDynamicMessage(`seo.${kind}.faq_${index}_question`) &&
        hasDynamicMessage(`seo.${kind}.faq_${index}_answer`)
    )
    .map((index) => ({
      question: tDynamic(
        `seo.${kind}.faq_${index}_question`,
        undefined,
        options
      ),
      answer: tDynamic(`seo.${kind}.faq_${index}_answer`, undefined, options),
    }));
}

export function getSeoGuideFaqs(kind: SeoGuideKind, locale: string) {
  return guideFaqs(kind, locale);
}

function sectionsFor(kind: SeoGuideKind): SeoGuideSection[] {
  return [1, 2, 3, 4, 5, 6, 7]
    .filter(
      (index) =>
        hasDynamicMessage(`seo.${kind}.section_${index}_title`) &&
        hasDynamicMessage(`seo.${kind}.section_${index}_body`)
    )
    .map((index) => {
      const bullets = [1, 2, 3, 4]
        .map((bullet) => {
          const key = `seo.${kind}.section_${index}_bullet_${bullet}`;
          return hasDynamicMessage(key) ? tDynamic(key) : null;
        })
        .filter((value): value is string => Boolean(value));
      return {
        heading: tDynamic(`seo.${kind}.section_${index}_title`),
        body: tDynamic(`seo.${kind}.section_${index}_body`),
        ...(bullets.length ? { bullets } : {}),
      };
    });
}

function sourcesFor(kind: SeoGuideKind): SeoGuideLink[] {
  const sources: SeoGuideLink[] = [
    {
      label: m['seo.common.official_source'](),
      href: 'https://qwen.ai/blog?id=qwen-image-3.0',
    },
  ];
  if (kind === 'api') {
    sources.push({
      label: m['seo.common.api_documentation'](),
      href: 'https://help.aliyun.com/en/model-studio/image-model/',
    });
  }
  if (kind === 'comfyui') {
    sources.push({
      label: m['seo.common.comfyui_documentation'](),
      href: 'https://docs.comfy.org/tutorials/image/qwen/qwen-image',
    });
  }
  if (kind === 'comparison') {
    sources.push({
      label: m['seo.common.qwen_2_source'](),
      href: 'https://qwen.ai/blog?id=qwen-image-2.0',
    });
  }
  if (kind === 'open_source') {
    sources.push(
      {
        label: m['seo.common.qwen_hugging_face'](),
        href: 'https://huggingface.co/Qwen',
      },
      {
        label: m['seo.common.qwen_github'](),
        href: 'https://github.com/QwenLM/Qwen-Image',
      }
    );
  }
  return sources;
}

function relatedFor(kind: SeoGuideKind): SeoGuideLink[] {
  const toolLinks: Partial<Record<SeoGuideKind, SeoGuideLink>> = {
    prompts: {
      href: '/tools',
      label: m['tools.common.all_tools'](),
    },
    text_rendering: {
      href: TOOL_PATHS.poster,
      label: m['tools.poster.link_label'](),
    },
    ecommerce: {
      href: TOOL_PATHS.product_photo,
      label: m['tools.product_photo.link_label'](),
    },
  };

  return [
    ...(toolLinks[kind] ? [toolLinks[kind]] : []),
    ...RELATED_PATHS[kind].map((related) => ({
      href: GUIDE_PATHS[related],
      label: m[`seo.${related}.link_label`](),
    })),
  ];
}

function visualFor(kind: SeoGuideKind): SeoGuideVisual | undefined {
  const src = GUIDE_IMAGES[kind];
  if (!src) return undefined;

  return {
    src,
    alt: m[`seo.${kind}.visual_alt`](),
    eyebrow: m['seo.common.visual_eyebrow'](),
    title: m[`seo.${kind}.visual_title`](),
    caption: m[`seo.${kind}.visual_caption`](),
    disclosure: m['seo.common.visual_disclosure'](),
  };
}

function contentFor(kind: SeoGuideKind): SeoGuidePageProps {
  return {
    eyebrow: m[`seo.${kind}.eyebrow`](),
    title: m[`seo.${kind}.title`](),
    description: m[`seo.${kind}.description`](),
    statusLabel: m['seo.common.status_label'](),
    status: m[`seo.${kind}.status`](),
    sources: sourcesFor(kind),
    visual: visualFor(kind),
    sections: sectionsFor(kind),
    faqTitle: m['seo.common.faq_title'](),
    faqs: guideFaqs(kind),
    relatedTitle: m['seo.common.related_title'](),
    relatedLinks: relatedFor(kind),
    allGuidesLabel: m['seo.common.all_guides'](),
    ctaTitle: m['seo.common.cta_title'](),
    ctaDescription: m['seo.common.cta_description'](),
    ctaButton: m['seo.common.cta_button'](),
    ctaSecondaryButton: m['seo.common.cta_secondary_button'](),
  };
}

export function SeoGuide({
  kind,
  afterHero,
}: {
  kind: SeoGuideKind;
  afterHero?: ReactNode;
}) {
  return <SeoGuidePage {...contentFor(kind)} afterHero={afterHero} />;
}
