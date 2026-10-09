import { tDynamic } from '@/core/i18n/dynamic';
import { m } from '@/paraglide/messages.js';
import { SeedanceDraftModePage as Page } from '@/components/seedance-draft-mode-page';
import type { SeedanceDraftModeCopy } from '@/components/seedance-draft-types';

export function SeedanceDraftModePage() {
  const text = (name: string) => tDynamic(`seedance_draft.${name}`);
  const copy = {
    breadcrumbHome: m['tools.common.home'](),
    breadcrumbSeedance: m['seedance25.title'](),
    ...Object.fromEntries(
      [
        'eyebrow',
        'title',
        'description',
        'status',
        'status_body',
        'workspace_title',
        'workspace_description',
        'prompt_label',
        'prompt_placeholder',
        'references_label',
        'references_hint',
        'duration_label',
        'ratio_label',
        'candidates_label',
        'draft_action',
        'unavailable_note',
        'comparison_title',
        'comparison_body',
        'candidate_label',
        'waiting_label',
        'select_label',
        'final_title',
        'final_body',
        'final_action',
        'calculator_title',
        'calculator_body',
        'usual_attempts_label',
        'draft_rate_label',
        'final_rate_label',
        'old_cost_label',
        'draft_cost_label',
        'estimate_note',
        'how_title',
        'how_description',
        'trust_title',
        'trust_body',
        'related_generator',
      ].map((name) => [camel(name), text(name)])
    ),
    steps: Array.from({ length: 4 }, (_, index) => ({
      title: text(`step_${index + 1}_title`),
      body: text(`step_${index + 1}_body`),
    })),
    trustItems: Array.from({ length: 4 }, (_, index) =>
      text(`trust_${index + 1}`)
    ),
    faqTitle: m['tools.common.faq_title'](),
    faqs: Array.from({ length: 4 }, (_, index) => ({
      question: text(`faq_${index + 1}_question`),
      answer: text(`faq_${index + 1}_answer`),
    })),
    relatedTitle: m['tools.common.related_title'](),
    relatedPricing: m['seedance25.related_pricing'](),
    relatedTools: m['tools.common.all_tools'](),
  } as unknown as SeedanceDraftModeCopy;
  return <Page copy={copy} />;
}

function camel(value: string) {
  return value.replace(/_([a-z])/g, (_, letter: string) =>
    letter.toUpperCase()
  );
}
