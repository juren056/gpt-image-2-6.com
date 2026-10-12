import type { ModerationResult } from './moderation';

export type SeeapiModerationOptions = {
  apiKey: string;
  thresholdOffset?: number;
  strictSpecialCare?: boolean;
};

type Inference = {
  id: string;
  status: string;
  error?: unknown;
  result?: {
    type?: string;
    data?: {
      flagged?: boolean;
      categories?: { nsfw?: unknown; special_care?: unknown };
    };
  } | null;
};

const ENDPOINT = 'https://api.seeapi.com/v1/inferences';
const BASE: ModerationResult = {
  decision: 'allow',
  category: '',
  severity: 'none',
  // SeeAPI supplies no confidence score. Never fabricate one for account penalties.
  confidence: 0,
  detector: 'seeapi',
  detectorVersion: 'nsfw-filter/image-moderation',
  reasonCode: 'not_flagged',
  scores: {},
};

function unavailable(reasonCode: string): ModerationResult {
  return {
    ...BASE,
    decision: 'review',
    category: 'moderation_unavailable',
    reasonCode,
  };
}

function labels(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((label) => typeof label === 'string')
  );
}

/** Every image is a separate inference; a batch is safe only when every image passes. */
export async function moderateWithSeeAPI(
  params: SeeapiModerationOptions & {
    imageUrls: string[];
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
    // Injectable delay keeps verification offline and fast.
    sleepImpl?: (ms: number, signal: AbortSignal) => Promise<void>;
    idempotencyPrefix?: string;
  }
): Promise<ModerationResult> {
  const urls = [...new Set(params.imageUrls.filter(Boolean))];
  if (!urls.length) return { ...BASE };
  if (urls.length > 14) return unavailable('seeapi_too_many_images');
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    params.timeoutMs ?? 30_000
  );
  const sleep =
    params.sleepImpl ||
    ((ms: number, signal: AbortSignal) =>
      new Promise<void>((resolve, reject) => {
        if (signal.aborted) return reject(new Error('seeapi_timeout'));
        const abort = () => {
          clearTimeout(timer);
          reject(new Error('seeapi_timeout'));
        };
        const timer = setTimeout(() => {
          signal.removeEventListener('abort', abort);
          resolve();
        }, ms);
        signal.addEventListener('abort', abort, { once: true });
      }));
  const request = async (
    url: string,
    init?: RequestInit
  ): Promise<Inference> => {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (controller.signal.aborted) throw new Error('seeapi_timeout');
      let response: Response;
      try {
        response = await (params.fetchImpl || fetch)(url, {
          ...init,
          headers: {
            authorization: `Bearer ${params.apiKey}`,
            'content-type': 'application/json',
            ...init?.headers,
          },
          signal: controller.signal,
          redirect: 'error',
        });
      } catch {
        if (controller.signal.aborted) throw new Error('seeapi_timeout');
        if (attempt === 2) throw new Error('seeapi_network_error');
        await sleep(500 * 2 ** attempt, controller.signal);
        continue;
      }
      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        await response.body?.cancel();
        if (retryable && attempt < 2) {
          const retryAfter = Number(response.headers.get('retry-after'));
          await sleep(
            Math.min(
              5000,
              Math.max(500 * 2 ** attempt, retryAfter * 1000 || 0)
            ),
            controller.signal
          );
          continue;
        }
        throw new Error(`seeapi_http_${response.status}`);
      }
      try {
        return (await response.json()) as Inference;
      } catch {
        throw new Error('seeapi_response_invalid');
      }
    }
    throw new Error('seeapi_unavailable');
  };
  const inspect = async (imageUrl: string): Promise<ModerationResult> => {
    try {
      const image = new URL(imageUrl);
      if (
        !['https:', 'http:'].includes(image.protocol) ||
        image.username ||
        image.password
      ) {
        throw new Error('seeapi_image_url_invalid');
      }
      // One key/body per logical inference, including all transient POST retries.
      const body = JSON.stringify({
        model: 'nsfw-filter',
        endpoint: 'image-moderation',
        provider: 'seeapi',
        input: {
          image_url: imageUrl,
          threshold_offset: params.thresholdOffset ?? 0.02,
          strict_special_care: params.strictSpecialCare ?? true,
        },
      });
      const digest = params.idempotencyPrefix
        ? await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(`${params.idempotencyPrefix}:${body}`)
          )
        : undefined;
      const key = digest
        ? `image-review-${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}`
        : crypto.randomUUID();
      const accepted = await request(ENDPOINT, {
        method: 'POST',
        headers: { 'Idempotency-Key': key },
        body,
      });
      if (
        !accepted ||
        typeof accepted.id !== 'string' ||
        !accepted.id ||
        accepted.id.length > 255
      ) {
        throw new Error('seeapi_response_invalid');
      }
      let delay = 500;
      for (;;) {
        const task = await request(
          `${ENDPOINT}/${encodeURIComponent(accepted.id)}`
        );
        if (!task || task.id !== accepted.id)
          throw new Error('seeapi_response_invalid');
        if (task.error) throw new Error('seeapi_task_failed');
        if (task.status === 'succeeded') {
          const data = task.result?.data;
          if (
            task.result?.type !== 'json' ||
            typeof data?.flagged !== 'boolean' ||
            !labels(data.categories?.nsfw) ||
            !labels(data.categories?.special_care)
          ) {
            throw new Error('seeapi_response_invalid');
          }
          return {
            ...BASE,
            decision: data.flagged ? 'block' : 'allow',
            category: data.flagged ? 'seeapi_nsfw' : '',
            severity: data.flagged ? 'high' : 'none',
            reasonCode: data.flagged ? 'seeapi_nsfw_flagged' : 'not_flagged',
            labels: {
              nsfw: data.categories.nsfw,
              special_care: data.categories.special_care,
            },
          };
        }
        if (task.status !== 'queued' && task.status !== 'processing')
          throw new Error('seeapi_task_failed');
        await sleep(delay, controller.signal);
        delay = Math.min(delay * 2, 2000);
      }
    } catch (error) {
      // Do not expose response bodies, image URLs, or secrets in error records.
      const reason =
        error instanceof Error && /^seeapi_[a-z_0-9]+$/.test(error.message)
          ? error.message
          : controller.signal.aborted
            ? 'seeapi_timeout'
            : 'seeapi_response_invalid';
      return unavailable(reason);
    }
  };
  try {
    let next = 0;
    const results: ModerationResult[] = [];
    await Promise.all(
      Array.from({ length: Math.min(3, urls.length) }, async () => {
        while (next < urls.length) results.push(await inspect(urls[next++]));
      })
    );
    // A flagged image wins over an outage on another image; an outage wins over passes.
    return (
      results.find((r) => r.decision === 'block') ||
      results.find((r) => r.decision === 'review') ||
      results[0]
    );
  } finally {
    clearTimeout(timeout);
  }
}
