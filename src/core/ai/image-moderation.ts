import { moderateWithOpenAIRetry, type ModerationResult } from './moderation';
import {
  moderateWithSeeAPI,
  type SeeapiModerationOptions,
} from './seeapi-moderation';

export type ImageModerationConfig = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  seeapi?: SeeapiModerationOptions;
};

type Runtime = {
  fetchImpl?: typeof fetch;
  sleepImpl?: (ms: number, signal: AbortSignal) => Promise<void>;
  idempotencyPrefix?: string;
};

/** SeeAPI handles only images. Keep OpenAI text moderation and its opt-out intact. */
export async function moderateConfiguredInput(
  config: ImageModerationConfig,
  input: { text: string; imageUrls?: string[] },
  runtime: Runtime = {}
): Promise<ModerationResult | null> {
  const useSeeapi = Boolean(config.seeapi && input.imageUrls?.length);
  if (config.apiKey) {
    const result = await moderateWithOpenAIRetry({
      ...config,
      apiKey: config.apiKey,
      text: input.text,
      imageUrls: useSeeapi ? undefined : input.imageUrls,
      fetchImpl: runtime.fetchImpl,
    });
    if (!useSeeapi || result.decision === 'block') return result;
    // Preserve text-only outage/review behavior while the separate image check runs.
  }
  if (useSeeapi && config.seeapi) {
    return moderateWithSeeAPI({
      ...config.seeapi,
      imageUrls: input.imageUrls!,
      ...runtime,
    });
  }
  return null;
}

export async function moderateConfiguredImages(
  config: ImageModerationConfig,
  imageUrls: string[],
  runtime: Runtime = {}
): Promise<ModerationResult | null> {
  if (config.seeapi)
    return moderateWithSeeAPI({ ...config.seeapi, imageUrls, ...runtime });
  if (config.apiKey)
    return moderateWithOpenAIRetry({
      ...config,
      apiKey: config.apiKey,
      imageUrls,
      fetchImpl: runtime.fetchImpl,
    });
  return null;
}
