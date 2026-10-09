export type ModerationDecision = 'allow' | 'block' | 'review';

export type ModerationResult = {
  decision: ModerationDecision;
  category: string;
  severity: 'none' | 'medium' | 'high' | 'critical';
  confidence: number;
  detector: 'openai' | 'provider' | 'none';
  detectorVersion: string;
  reasonCode: string;
  scores: Record<string, number>;
};

const ALLOWED: ModerationResult = {
  decision: 'allow',
  category: '',
  severity: 'none',
  confidence: 100,
  detector: 'none',
  detectorVersion: '',
  reasonCode: 'not_flagged',
  scores: {},
};

const PROVIDER_FLAG_KEYS = new Set([
  'has_nsfw_concepts',
  'has_nsfw_content',
  'is_nsfw',
  'nsfw_detected',
  'safety_checker_flagged',
]);

function walkProviderFlags(value: unknown, depth = 0): boolean[] {
  if (depth > 7 || value === null || value === undefined) return [];
  if (typeof value === 'string' && value.length <= 100_000) {
    const trimmed = value.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return walkProviderFlags(JSON.parse(trimmed), depth + 1);
      } catch {
        return [];
      }
    }
  }
  if (typeof value !== 'object') return [];
  if (Array.isArray(value))
    return value.flatMap((item) => walkProviderFlags(item, depth + 1));
  const flags: boolean[] = [];
  for (const [key, nested] of Object.entries(value)) {
    if (PROVIDER_FLAG_KEYS.has(key.toLowerCase())) {
      if (typeof nested === 'boolean') flags.push(nested);
      if (nested === 0 || nested === 1) flags.push(nested === 1);
      if (nested === 'true' || nested === 'false')
        flags.push(nested === 'true');
      if (Array.isArray(nested))
        flags.push(
          ...nested.flatMap((item) => {
            if (typeof item === 'boolean') return [item];
            if (item === 0 || item === 1) return [item === 1];
            if (item === 'true' || item === 'false') return [item === 'true'];
            return [];
          })
        );
      continue;
    }
    flags.push(...walkProviderFlags(nested, depth + 1));
  }
  return flags;
}

export function inspectProviderSafetyPayload(
  ...payloads: unknown[]
): ModerationResult | null {
  const flags = payloads.flatMap((payload) => walkProviderFlags(payload));
  if (!flags.length) return null;
  if (flags.some(Boolean))
    return {
      decision: 'block',
      category: 'provider_nsfw',
      severity: 'high',
      confidence: 100,
      detector: 'provider',
      detectorVersion: 'provider-response-v1',
      reasonCode: 'provider_nsfw_flag',
      scores: {},
    };
  return {
    ...ALLOWED,
    detector: 'provider',
    detectorVersion: 'provider-response-v1',
    reasonCode: 'provider_safe_flag',
  };
}

function moderationUrl(baseUrl: string) {
  const parsed = new URL(baseUrl || 'https://api.openai.com/v1');
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:')
    throw new Error('unsupported_moderation_protocol');
  return `${parsed.toString().replace(/\/$/, '')}/moderations`;
}

export async function moderateWithOpenAI(params: {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  text?: string;
  imageUrls?: string[];
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): Promise<ModerationResult> {
  const text = params.text?.trim();
  const imageUrls = (params.imageUrls || []).filter(Boolean).slice(0, 10);
  if (!text && !imageUrls.length) return ALLOWED;
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    params.timeoutMs || 7000
  );
  try {
    const input: unknown = imageUrls.length
      ? [
          ...(text ? [{ type: 'text', text }] : []),
          ...imageUrls.map((url) => ({
            type: 'image_url',
            image_url: { url },
          })),
        ]
      : text;
    const response = await (params.fetchImpl || fetch)(
      moderationUrl(params.baseUrl || 'https://api.openai.com/v1'),
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${params.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: params.model || 'omni-moderation-latest',
          input,
        }),
        signal: controller.signal,
      }
    );
    if (!response.ok) throw new Error(`moderation_http_${response.status}`);
    const data = (await response.json()) as {
      model?: string;
      results?: Array<{
        flagged?: boolean;
        categories?: Record<string, boolean>;
        category_scores?: Record<string, number>;
      }>;
    };
    const result = data.results?.[0];
    if (!result) throw new Error('moderation_response_invalid');
    const scores = result.category_scores || {};
    const categories = result.categories || {};
    const highest = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    const category =
      Object.entries(categories).find(([, flagged]) => flagged)?.[0] ||
      highest?.[0] ||
      '';
    const score = Math.max(0, Math.min(1, highest?.[1] || 0));
    const categoryScore = Math.max(0, Math.min(1, scores[category] ?? score));
    if (categories['sexual/minors'] || (scores['sexual/minors'] || 0) >= 0.01)
      return {
        decision: 'block',
        category: 'sexual_minors',
        severity: 'critical',
        // Never borrow a higher score from a different category. Automated
        // account penalties must use the exact category's confidence.
        confidence: Math.round((scores['sexual/minors'] || 0) * 100),
        detector: 'openai',
        detectorVersion: data.model || params.model || 'omni-moderation-latest',
        reasonCode: 'sexual_minors',
        scores,
      };
    if (result.flagged)
      return {
        decision: 'block',
        category: category.replaceAll('/', '_'),
        severity: 'high',
        confidence: Math.round(categoryScore * 100),
        detector: 'openai',
        detectorVersion: data.model || params.model || 'omni-moderation-latest',
        reasonCode: 'moderation_flagged',
        scores,
      };
    if ((scores.sexual || 0) >= 0.12)
      return {
        decision: 'review',
        category: 'sexual',
        severity: 'medium',
        confidence: Math.round((scores.sexual || 0) * 100),
        detector: 'openai',
        detectorVersion: data.model || params.model || 'omni-moderation-latest',
        reasonCode: 'sexual_review_threshold',
        scores,
      };
    return {
      ...ALLOWED,
      detector: 'openai',
      detectorVersion: data.model || params.model || 'omni-moderation-latest',
      scores,
    };
  } catch (error) {
    return {
      decision: 'review',
      category: 'moderation_unavailable',
      severity: 'medium',
      confidence: 0,
      detector: 'openai',
      detectorVersion: params.model || 'omni-moderation-latest',
      reasonCode:
        error instanceof Error
          ? error.message.slice(0, 120)
          : 'moderation_unavailable',
      scores: {},
    };
  } finally {
    clearTimeout(timeout);
  }
}

function isRetryableModerationFailure(reasonCode: string) {
  if (/^moderation_http_(400|401|403|404)$/.test(reasonCode)) return false;
  return (
    reasonCode === 'moderation_unavailable' ||
    reasonCode === 'moderation_response_invalid' ||
    /abort|timeout|network|fetch|moderation_http_(408|409|425|429|5\d\d)/i.test(
      reasonCode
    )
  );
}

export async function moderateWithOpenAIRetry(
  params: Parameters<typeof moderateWithOpenAI>[0],
  maxAttempts = 2
) {
  const attempts = Math.max(1, Math.min(3, maxAttempts));
  let result = await moderateWithOpenAI(params);
  for (
    let attempt = 1;
    attempt < attempts &&
    result.category === 'moderation_unavailable' &&
    isRetryableModerationFailure(result.reasonCode);
    attempt += 1
  ) {
    result = await moderateWithOpenAI(params);
  }
  return result;
}
