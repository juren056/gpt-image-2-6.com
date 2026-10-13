const STRING_SETTINGS = [
  'image_size',
  'aspect_ratio',
  'resolution',
  'quality',
  'output_format',
] as const;
const NUMBER_SETTINGS = ['num_images', 'seed'] as const;

/** Public recorded settings; never infer missing values or return references. */
export function publicImageTaskSettings(
  value: unknown
): Record<string, string | number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const output: Record<string, string | number> = {};
  for (const key of STRING_SETTINGS) {
    if (typeof input[key] === 'string' && input[key].length <= 128)
      output[key] = input[key];
  }
  for (const key of NUMBER_SETTINGS) {
    if (typeof input[key] === 'number' && Number.isFinite(input[key]))
      output[key] = input[key];
  }
  return output;
}
