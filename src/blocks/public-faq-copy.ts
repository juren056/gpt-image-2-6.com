import { tDynamic } from '@/core/i18n/lookups/public-faqs';
import type { ScenarioToolKind } from '@/lib/tools';

function faqCopy(prefix: string, count: number, locale?: string) {
  const options = locale ? { locale } : undefined;
  return Array.from({ length: count }, (_, index) => ({
    question: tDynamic(
      `${prefix}.faq_${index + 1}_question`,
      undefined,
      options
    ),
    answer: tDynamic(`${prefix}.faq_${index + 1}_answer`, undefined, options),
  }));
}

// Loaders need schema copy without importing video/image workspaces or their UI.
export const getToolFaqs = (kind: ScenarioToolKind, locale?: string) =>
  faqCopy(`tools.${kind}`, 6, locale);
export const getSpecialToolFaqs = (
  kind: 'youtube_thumbnail' | 'video' | 'background_remover',
  locale: string
) => faqCopy(`tools.${kind}`, 5, locale);
export const getMatchaFilterFaqs = (locale: string) =>
  faqCopy('tools.matcha_filter', 5, locale);
export const getWan3Faqs = (locale?: string) => faqCopy('wan3', 6, locale);
export const getMinimaxH3Faqs = (locale?: string) =>
  faqCopy('minimax_h3', 5, locale);
