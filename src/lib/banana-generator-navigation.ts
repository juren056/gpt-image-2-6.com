export type BananaGeneratorSelection = {
  model?: string;
  mode?: 'generate' | 'edit';
  prompt?: string;
  focus?: 'prompt' | 'shape';
  aspectRatio?: string;
  scene?: string;
  imageUrls?: string[];
};

/** Prepare the visible generator without submitting a paid request. */
export function prepareBananaGenerator(selection: BananaGeneratorSelection) {
  window.dispatchEvent(
    new CustomEvent('banana:prepare-generator', { detail: selection })
  );
  document.getElementById('tool-generator')?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'instant'
      : 'smooth',
    block: 'start',
  });
}
