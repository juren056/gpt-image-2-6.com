const PROVIDER_VALIDATION_ERROR =
  /unexpected status code:\s*422|http\s*422|status(?:\s+code)?\s*422|input or content validation failed|validation failed/i;

const PROVIDER_SAFETY_ERROR =
  /flagged by a content checker|content (?:safety|policy)|safety (?:checker|filter)|nsfw|not safe for work|moderation/i;

const PROVIDER_AVAILABILITY_ERROR =
  /fal|queue\.fal\.run|downstream service|provider (?:status|result|request)|service unavailable|request timed out/i;

export function getPublicGenerationError(message: string): string {
  if (PROVIDER_VALIDATION_ERROR.test(message)) {
    return 'The AI provider rejected this prompt or input during validation. Remove public-figure identity swaps, watermark-removal requests, or unsupported content and try again. Your credits were restored.';
  }

  if (PROVIDER_SAFETY_ERROR.test(message)) {
    return "This prompt was blocked by the AI provider's content safety filter. Try removing protected character names or sensitive details, then try again. Your credits were restored.";
  }

  if (PROVIDER_AVAILABILITY_ERROR.test(message)) {
    return 'The AI generation service is temporarily unavailable. Please try again shortly. Credits are restored when a generation task fails.';
  }

  return message;
}

const GENERATION_SIGNATURE_KEYS = [
  'studioModelId',
  'operation',
  'resolution',
  'image_size',
  'aspect_ratio',
  'num_images',
  'image_urls',
  'input_images',
  'image_input',
] as const;

function comparableGenerationOptions(options: Record<string, unknown>) {
  return Object.fromEntries(
    GENERATION_SIGNATURE_KEYS.filter((key) => options[key] !== undefined).map(
      (key) => [key, options[key]]
    )
  );
}

export function isSameGenerationAttempt(
  storedOptions: string | null,
  requestedOptions: Record<string, unknown>
) {
  if (!storedOptions) return false;
  try {
    const parsed = JSON.parse(storedOptions) as Record<string, unknown>;
    if (!parsed.studioModelId || !parsed.operation) return false;
    return (
      JSON.stringify(comparableGenerationOptions(parsed)) ===
      JSON.stringify(comparableGenerationOptions(requestedOptions))
    );
  } catch {
    return false;
  }
}
