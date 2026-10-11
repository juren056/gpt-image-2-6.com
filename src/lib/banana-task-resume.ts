import {
  CREATIVE_MODELS,
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
      scene: normalizeCreativeScene('scene' in saved ? saved.scene : undefined),
    };
  } catch {
    return null;
  }
}
