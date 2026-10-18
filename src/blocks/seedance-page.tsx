import { tDynamic } from '@/core/i18n/lookups/seedance25-seedance_draft-nav_label';
import { m } from '@/paraglide/messages.js';
import { SeedanceLandingPage } from '@/components/seedance-landing-page';

export function SeedancePage() {
  const copy = {
    breadcrumbHome: m['tools.common.home'](),
    breadcrumbTools: m['tools.common.tools'](),
    eyebrow: m['seedance25.eyebrow'](),
    title: m['seedance25.title'](),
    description: m['seedance25.description'](),
    freeBadge: m['seedance25.free_badge'](),
    primaryAction: m['seedance25.primary_action'](),
    paidAction: m['seedance25.paid_action'](),
    statusLabel: m['seedance25.status_label'](),
    statusTitle: m['seedance25.status_title'](),
    statusBody: m['seedance25.status_body'](),
    statusUpdated: m['seedance25.status_updated'](),
    generatorTitle: m['seedance25.generator_title'](),
    generatorDescription: m['seedance25.generator_description'](),
    promptTitle: m['seedance25.prompt_title'](),
    promptDescription: m['seedance25.prompt_description'](),
    sceneLabel: m['seedance25.scene_label'](),
    scenePlaceholder: m['seedance25.scene_placeholder'](),
    cameraLabel: m['seedance25.camera_label'](),
    rhythmLabel: m['seedance25.rhythm_label'](),
    durationLabel: m['seedance25.duration_label'](),
    copyPrompt: m['seedance25.copy_prompt'](),
    copied: m['seedance25.copied'](),
    cameras: Array.from({ length: 3 }, (_, index) => ({
      label: tDynamic(`seedance25.camera_${index + 1}_label`),
      prompt: tDynamic(`seedance25.camera_${index + 1}_prompt`),
    })),
    rhythms: Array.from({ length: 3 }, (_, index) => ({
      label: tDynamic(`seedance25.rhythm_${index + 1}_label`),
      prompt: tDynamic(`seedance25.rhythm_${index + 1}_prompt`),
    })),
    demoTitle: m['seedance25.demo_title'](),
    demoCaption: m['seedance25.demo_caption'](),
    factsTitle: m['seedance25.facts_title'](),
    factsDescription: m['seedance25.facts_description'](),
    facts: Array.from({ length: 3 }, (_, index) => ({
      title: tDynamic(`seedance25.fact_${index + 1}_title`),
      description: tDynamic(`seedance25.fact_${index + 1}_description`),
    })),
    faqTitle: m['tools.common.faq_title'](),
    faqs: [1, 2, 4, 5].map((index) => ({
      question: tDynamic(`seedance25.faq_${index}_question`),
      answer: tDynamic(`seedance25.faq_${index}_answer`),
    })),
    relatedTitle: m['tools.common.related_title'](),
    relatedVideo: m['seedance25.related_video'](),
    relatedDraftMode: tDynamic('seedance_draft.nav_label'),
    relatedPricing: m['seedance25.related_pricing'](),
    relatedTools: m['tools.common.all_tools'](),
  };

  const workspace = {
    signIn: m['tools.special.sign_in'](),
    credits: m['tools.special.credits']({ credits: '{credits}' }),
    creditsLoading: m['tools.special.credits_loading'](),
    buyCredits: m['tools.special.buy_credits'](),
    generating: m['tools.special.generating'](),
    ready: m['tools.special.ready'](),
    failed: m['tools.special.failed'](),
    sceneLabel: copy.sceneLabel,
    scenePlaceholder: copy.scenePlaceholder,
    cameraLabel: copy.cameraLabel,
    cameras: copy.cameras,
    rhythmLabel: copy.rhythmLabel,
    rhythms: copy.rhythms,
    formatLabel: m['tools.video.field_format'](),
    durationLabel: copy.durationLabel,
    generate: copy.primaryAction,
    emptyTitle: m['tools.video.result_empty_title'](),
    emptyBody: m['tools.video.result_empty_body'](),
    cost: m['tools.special.credits']({ credits: '{credits}' }),
    subscribe: m['tools.video.subscribe'](),
  };

  return <SeedanceLandingPage copy={copy} workspace={workspace} />;
}
