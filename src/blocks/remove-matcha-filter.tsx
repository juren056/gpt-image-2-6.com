import { tDynamic } from '@/core/i18n/dynamic';
import { MATCHA_FILTER_REMOVAL_COST } from '@/config/media-tools';
import { m } from '@/paraglide/messages.js';
import {
  RemoveMatchaFilterPage,
  type MatchaPageCopy,
} from '@/components/remove-matcha-filter-page';
import type { MatchaWorkspaceCopy } from '@/components/special-tool-workspaces';

function workspaceCopy(): MatchaWorkspaceCopy {
  return {
    signIn: m['tools.special.sign_in'](),
    credits: m['tools.special.credits']({ credits: '{credits}' }),
    creditsLoading: m['tools.special.credits_loading'](),
    buyCredits: m['tools.special.buy_credits'](),
    generating: m['tools.special.generating'](),
    ready: m['tools.special.ready'](),
    failed: m['tools.special.failed'](),
    uploadTitle: m['tools.matcha_filter.upload_title'](),
    uploadHint: m['tools.matcha_filter.upload_hint'](),
    remove: m['tools.matcha_filter.remove'](),
    resultTitle: m['tools.matcha_filter.result_title'](),
    resultHint: m['tools.matcha_filter.result_hint'](),
    download: m['tools.matcha_filter.download'](),
    beforeAlt: m['tools.matcha_filter.before_alt'](),
    afterAlt: m['tools.matcha_filter.after_alt'](),
    cost: m['tools.matcha_filter.cost']({
      credits: MATCHA_FILTER_REMOVAL_COST,
    }),
    uploaderPreviewAlt: m['tools.matcha_filter.uploader_preview_alt'](),
    uploaderReplace: m['tools.matcha_filter.uploader_replace'](),
    uploaderUploading: m['tools.matcha_filter.uploader_uploading'](),
    uploaderFailed: m['tools.matcha_filter.uploader_failed'](),
    uploaderRemove: m['tools.matcha_filter.uploader_remove'](),
    uploaderUpload: m['tools.matcha_filter.uploader_upload'](),
    uploaderMaxSize: (sizeMB) =>
      m['tools.matcha_filter.uploader_max_size']({ size: sizeMB }),
  };
}

function pageCopy(): MatchaPageCopy {
  return {
    breadcrumbHome: m['tools.common.home'](),
    breadcrumbTools: m['tools.common.tools'](),
    eyebrow: m['tools.matcha_filter.eyebrow'](),
    title: m['tools.matcha_filter.title'](),
    description: m['tools.matcha_filter.description'](),
    primaryAction: m['tools.matcha_filter.primary_action'](),
    trustItems: Array.from({ length: 3 }, (_, index) =>
      tDynamic(`tools.matcha_filter.trust_${index + 1}`)
    ),
    exampleTitle: m['tools.matcha_filter.example_title'](),
    toolTitle: m['tools.matcha_filter.tool_title'](),
    toolEyebrow: m['tools.matcha_filter.tool_eyebrow'](),
    toolDescription: m['tools.matcha_filter.tool_description'](),
    benefitsTitle: m['tools.matcha_filter.benefits_title'](),
    benefits: Array.from({ length: 3 }, (_, index) => ({
      title: tDynamic(`tools.matcha_filter.benefit_${index + 1}_title`),
      body: tDynamic(`tools.matcha_filter.benefit_${index + 1}_body`),
    })),
    howTitle: m['tools.matcha_filter.how_title'](),
    howDescription: m['tools.matcha_filter.how_description'](),
    steps: Array.from({ length: 3 }, (_, index) => ({
      title: tDynamic(`tools.matcha_filter.step_${index + 1}_title`),
      body: tDynamic(`tools.matcha_filter.step_${index + 1}_body`),
    })),
    faqTitle: m['tools.common.faq_title'](),
    faqs: Array.from({ length: 5 }, (_, index) => ({
      question: tDynamic(`tools.matcha_filter.faq_${index + 1}_question`),
      answer: tDynamic(`tools.matcha_filter.faq_${index + 1}_answer`),
    })),
    ctaTitle: m['tools.matcha_filter.cta_title'](),
    ctaBody: m['tools.matcha_filter.cta_body'](),
    ctaAction: m['tools.matcha_filter.cta_action'](),
  };
}

export function RemoveMatchaFilterToolPage() {
  return (
    <RemoveMatchaFilterPage copy={pageCopy()} workspace={workspaceCopy()} />
  );
}

export function getMatchaFilterFaqs(locale: string) {
  const localized = (key: string) => {
    const fn = (m as Record<string, unknown>)[key];
    return typeof fn === 'function'
      ? (fn as (inputs: object, options: { locale: string }) => string)(
          {},
          { locale }
        )
      : key;
  };
  return Array.from({ length: 5 }, (_, index) => ({
    question: localized(`tools.matcha_filter.faq_${index + 1}_question`),
    answer: localized(`tools.matcha_filter.faq_${index + 1}_answer`),
  }));
}
