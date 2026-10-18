import { tDynamic } from '@/core/i18n/lookups/minimax_h3';
import { m } from '@/paraglide/messages.js';
import { MinimaxH3Page as MinimaxH3PageComponent } from '@/components/minimax-h3-page';

export function getMinimaxH3Faqs(locale?: string) {
  const options = locale ? { locale } : undefined;
  return Array.from({ length: 5 }, (_, index) => ({
    question: tDynamic(
      `minimax_h3.faq_${index + 1}_question`,
      undefined,
      options
    ),
    answer: tDynamic(`minimax_h3.faq_${index + 1}_answer`, undefined, options),
  }));
}

export function MinimaxH3Page() {
  const copy = {
    breadcrumbHome: m['tools.common.home'](),
    breadcrumbTools: m['tools.common.tools'](),
    eyebrow: m['minimax_h3.eyebrow'](),
    title: m['minimax_h3.title'](),
    description: m['minimax_h3.description'](),
    officialSource: m['minimax_h3.official_source'](),
    disclosure: m['minimax_h3.disclosure'](),
    workspaceTitle: m['minimax_h3.workspace_title'](),
    workspaceDescription: m['minimax_h3.workspace_description'](),
    promptLabel: m['minimax_h3.prompt_label'](),
    promptPlaceholder: m['minimax_h3.prompt_placeholder'](),
    promptHint: m['minimax_h3.prompt_hint'](),
    aspectLabel: m['minimax_h3.aspect_label'](),
    durationLabel: m['minimax_h3.duration_label'](),
    cost: m['minimax_h3.cost']({ credits: '{credits}' }),
    credits: m['tools.special.credits']({ credits: '{credits}' }),
    creditsLoading: m['tools.special.credits_loading'](),
    buyCredits: m['tools.special.buy_credits'](),
    generate: m['minimax_h3.generate'](),
    generating: m['tools.special.generating'](),
    signUp: m['minimax_h3.sign_up'](),
    resultTitle: m['minimax_h3.result_title'](),
    resultEmpty: m['minimax_h3.result_empty'](),
    ready: m['tools.special.ready'](),
    failed: m['tools.special.failed'](),
    facts: Array.from({ length: 3 }, (_, index) => ({
      title: tDynamic(`minimax_h3.fact_${index + 1}_title`),
      description: tDynamic(`minimax_h3.fact_${index + 1}_description`),
    })),
    useCasesTitle: m['minimax_h3.use_cases_title'](),
    useCasesDescription: m['minimax_h3.use_cases_description'](),
    useCases: Array.from({ length: 4 }, (_, index) => ({
      title: tDynamic(`minimax_h3.use_case_${index + 1}_title`),
      description: tDynamic(`minimax_h3.use_case_${index + 1}_description`),
    })),
    howTitle: m['minimax_h3.how_title'](),
    steps: Array.from({ length: 3 }, (_, index) => ({
      title: tDynamic(`minimax_h3.step_${index + 1}_title`),
      description: tDynamic(`minimax_h3.step_${index + 1}_description`),
    })),
    faqTitle: m['tools.common.faq_title'](),
    faqs: getMinimaxH3Faqs(),
    relatedTitle: m['tools.common.related_title'](),
    relatedVideo: m['minimax_h3.related_video'](),
    relatedSeedance: m['minimax_h3.related_seedance'](),
    relatedTools: m['tools.common.all_tools'](),
  };

  return <MinimaxH3PageComponent copy={copy} />;
}
