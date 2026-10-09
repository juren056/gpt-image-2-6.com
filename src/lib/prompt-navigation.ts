import { APPLY_GENERATOR_PROMPT_EVENT } from '@/lib/homepage-events';

const GENERATOR_DRAFT_KEY = 'image-studio:generator-draft';
const VIDEO_PROMPT_DRAFT_KEY = 'image-studio:video-prompt-draft';

export function stageGeneratorPrompt(prompt: string): void {
  if (typeof window === 'undefined') return;
  const normalized = prompt.trim();
  if (!normalized) return;

  window.sessionStorage.setItem(
    GENERATOR_DRAFT_KEY,
    JSON.stringify({ prompt: normalized, aspect: 'square' })
  );
  window.dispatchEvent(
    new CustomEvent(APPLY_GENERATOR_PROMPT_EVENT, {
      detail: { prompt: normalized },
    })
  );
}
export function stageVideoPrompt(prompt: string): void {
  if (typeof window === 'undefined') return;
  const normalized = prompt.trim();
  if (!normalized) return;
  window.sessionStorage.setItem(VIDEO_PROMPT_DRAFT_KEY, normalized);
}

export function consumeStagedVideoPrompt(): string {
  if (typeof window === 'undefined') return '';
  const prompt = window.sessionStorage.getItem(VIDEO_PROMPT_DRAFT_KEY) ?? '';
  window.sessionStorage.removeItem(VIDEO_PROMPT_DRAFT_KEY);
  return prompt.trim();
}
