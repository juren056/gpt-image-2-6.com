import {
  CREATIVE_MODELS,
  getCreativeOutputLimit,
} from '@/config/creative-studio';
import { VERIFIED_OUTPUTS } from '@/config/verified-examples';
import { STUDIO_PROMPTS } from '@/content/studio-prompts';

export const GENERATOR_DRAFT_KEY = 'nano-site:draft:v2';
export const PREVIOUS_GENERATOR_DRAFT_KEY = 'nano-site:draft:previous';
export type GeneratorDraft = {
  prompt: string;
  model: string;
  operation: 'generate' | 'edit';
  aspectRatio: string;
  resolution?: string;
  outputCount: number;
  imageUrls: string[];
};
export function normalizeGeneratorDraft(
  raw: unknown,
  fallback = 'nano-banana-2.1',
  allModels = false
): GeneratorDraft | null {
  if (
    !raw ||
    typeof raw !== 'object' ||
    !('prompt' in raw) ||
    typeof raw.prompt !== 'string'
  )
    return null;
  const data = raw as Record<string, unknown>;
  const available = CREATIVE_MODELS.filter(
    (m) => m.productionEnabled && (allModels || m.id.startsWith('nano-banana'))
  );
  const model =
    available.find(
      (m) =>
        m.id === data.model ||
        Object.values(m.endpoints).includes(data.model as string)
    ) || available.find((m) => m.id === fallback)!;
  if (!model) return null;
  const operation =
    data.operation === 'edit' || data.mode === 'edit' ? 'edit' : 'generate';
  const requestedRatio = data.aspectRatio ?? data.ratio;
  return {
    prompt: (data.prompt as string).slice(0, model.maxPromptLength),
    model: model.id,
    operation,
    aspectRatio:
      typeof requestedRatio === 'string' && model.sizes.includes(requestedRatio)
        ? requestedRatio
        : model.sizes[0],
    resolution:
      typeof data.resolution === 'string' &&
      model.resolutions?.includes(data.resolution)
        ? data.resolution
        : model.resolutions?.[0],
    outputCount:
      typeof data.outputCount === 'number' &&
      Number.isInteger(data.outputCount) &&
      data.outputCount >= 1 &&
      data.outputCount <= getCreativeOutputLimit(model.id)
        ? data.outputCount
        : 1,
    imageUrls:
      operation === 'edit' && Array.isArray(data.imageUrls)
        ? data.imageUrls
            .filter(
              (url): url is string =>
                typeof url === 'string' && /^https:\/\//.test(url)
            )
            .slice(0, model.maxReferences)
        : [],
  };
}
export function publicRecipeDraft(id: string): GeneratorDraft | null {
  const recipe = STUDIO_PROMPTS.find((item) => item.slug === id);
  if (!recipe) {
    const output = VERIFIED_OUTPUTS.find(
      (item) =>
        ['NB-05', 'NB-06', 'NB-07', 'NB-08', 'NB-16', 'NB-17'].includes(
          item.caseId
        ) && item.caseId === id
    );
    return output
      ? normalizeGeneratorDraft({
          prompt: output.prompt,
          model: 'nano-banana-2.1',
          operation: output.operation,
          aspectRatio: output.options.aspect_ratio,
          resolution: output.options.resolution,
          outputCount: 1,
          imageUrls: output.inputs,
        })
      : null;
  }
  return recipe
    ? normalizeGeneratorDraft({
        ...recipe,
        model: 'nano-banana-2.1',
        operation: 'generate',
        aspectRatio: recipe.ratio,
        outputCount: 1,
      })
    : null;
}
export function publicRecipeHref(id: string) {
  return `/?recipe=${encodeURIComponent(id)}#tool-generator`;
}
export function savePreviousGeneratorDraft(
  storage: Pick<Storage, 'getItem' | 'setItem'>
) {
  const draft = storage.getItem(GENERATOR_DRAFT_KEY);
  if (draft && normalizeGeneratorDraft(JSON.parse(draft))?.prompt.trim())
    storage.setItem(PREVIOUS_GENERATOR_DRAFT_KEY, draft);
}
/** Explicit navigation wins as a complete selection, never mixed with stale draft settings. */
export function resolveGeneratorEntry(
  params: URLSearchParams,
  saved: unknown,
  handoff: unknown,
  initialModel: string,
  allModels = false
) {
  const recipeId = params.get('recipe');
  if (recipeId)
    return {
      explicit: true,
      draft: publicRecipeDraft(recipeId),
      missing: !publicRecipeDraft(recipeId),
      source: 'public-recipe',
    };
  if (params.has('prompt'))
    return {
      explicit: true,
      missing: false,
      source: 'query',
      draft: normalizeGeneratorDraft(
        {
          prompt: params.get('prompt'),
          model: params.get('model') || initialModel,
          operation: params.get('mode'),
          aspectRatio: params.get('ratio'),
          resolution: params.get('resolution'),
          outputCount: Number(params.get('outputCount') || 1),
        },
        initialModel,
        allModels
      ),
    };
  if (['recipe', 'asset'].includes(params.get('resume') || '')) {
    const draft = normalizeGeneratorDraft(handoff, initialModel, allModels);
    return {
      explicit: true,
      draft,
      missing: !draft,
      source: 'account-handoff',
    };
  }
  return {
    explicit: Boolean(
      saved &&
      typeof saved === 'object' &&
      'pendingSelection' in saved &&
      saved.pendingSelection === true
    ),
    missing: false,
    source:
      saved &&
      typeof saved === 'object' &&
      'pendingSelection' in saved &&
      saved.pendingSelection === true
        ? 'saved-selection'
        : 'saved-draft',
    draft: normalizeGeneratorDraft(saved, initialModel, allModels),
  };
}

/** A delayed accepted request must not overwrite a newer selection in another view. */
export function markGeneratorDraftAccepted(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  submitted: GeneratorDraft
): boolean {
  try {
    const raw = storage.getItem(GENERATOR_DRAFT_KEY);
    if (!raw) return false;
    const saved: unknown = JSON.parse(raw);
    const current = normalizeGeneratorDraft(saved, submitted.model, true);
    const expected = normalizeGeneratorDraft(submitted, submitted.model, true);
    if (
      !current ||
      !expected ||
      JSON.stringify(current) !== JSON.stringify(expected)
    )
      return false;
    storage.setItem(
      GENERATOR_DRAFT_KEY,
      JSON.stringify({
        ...(saved as Record<string, unknown>),
        pendingSelection: false,
      })
    );
    return true;
  } catch {
    return false;
  }
}
