import {
  CREATIVE_MODELS,
  getCreativeOutputLimit,
  type CreativeModelDefinition,
} from '@/config/creative-studio';

export const CREATIVE_SCENE_IDS = [
  'product',
  'character',
  'social',
  'poster',
  'science',
  'logo',
] as const;
export function normalizeCreativeScene(value: unknown): string {
  return typeof value === 'string' &&
    CREATIVE_SCENE_IDS.some((id) => id === value)
    ? value
    : 'general';
}
type ActiveCreativeTask = {
  id: string;
  model: CreativeModelDefinition;
  mode: 'generate' | 'edit';
  ratio: string;
  scene: string;
  outputCount: number;
  resolution?: string;
};

export function parseActiveCreativeTask(
  raw: string
): ActiveCreativeTask | null {
  try {
    const saved: unknown = JSON.parse(raw);
    if (
      !saved ||
      typeof saved !== 'object' ||
      !('model' in saved) ||
      !('id' in saved) ||
      !('mode' in saved)
    )
      return null;
    const model = CREATIVE_MODELS.find((item) => item.id === saved.model);
    if (
      !model ||
      typeof saved.id !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,128}$/.test(saved.id) ||
      (saved.mode !== 'generate' && saved.mode !== 'edit')
    )
      return null;
    const ratio =
      'ratio' in saved &&
      typeof saved.ratio === 'string' &&
      model.sizes.includes(saved.ratio)
        ? saved.ratio
        : model.sizes[0];
    return {
      id: saved.id,
      model,
      mode: saved.mode,
      ratio,
      resolution: model.resolutions?.length
        ? 'resolution' in saved &&
          typeof saved.resolution === 'string' &&
          model.resolutions.includes(saved.resolution)
          ? saved.resolution
          : model.resolutions[0]
        : undefined,
      outputCount:
        'outputCount' in saved &&
        typeof saved.outputCount === 'number' &&
        Number.isInteger(saved.outputCount) &&
        saved.outputCount >= 1 &&
        saved.outputCount <= getCreativeOutputLimit(model.id)
          ? saved.outputCount
          : 1,
      scene: normalizeCreativeScene('scene' in saved ? saved.scene : undefined),
    };
  } catch {
    return null;
  }
}
