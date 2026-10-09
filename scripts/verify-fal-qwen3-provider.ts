import assert from 'node:assert/strict';

import {
  DEFAULT_IMAGE_MODEL_ID,
  IMAGE_MODEL_IDS,
  sanitizeImageGenerationOptions,
} from '../src/config/image-models';
import { FalProvider } from '../src/core/ai/fal';
import { AIMediaType, AITaskStatus } from '../src/core/ai/types';

const originalFetch = globalThis.fetch;
const requests: Array<{
  url: string;
  method: string;
  body?: unknown;
  headers?: HeadersInit;
}> = [];
const requestId = 'qwen3-smoke-request';
const base = `https://queue.fal.run/${DEFAULT_IMAGE_MODEL_ID}`;
let resultAttempts = 0;

globalThis.fetch = async (input, init) => {
  const url = String(input);
  const method = init?.method || 'GET';
  const body =
    typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
  requests.push({ url, method, body, headers: init?.headers });

  if (method === 'POST' && url.startsWith('https://queue.fal.run/')) {
    return Response.json({
      request_id: requestId,
      status_url: `${base}/requests/${requestId}/status`,
      response_url: `${base}/requests/${requestId}`,
    });
  }
  if (url === `${base}/requests/${requestId}/status`) {
    return Response.json({ status: 'COMPLETED' });
  }
  if (url === `${base}/requests/${requestId}`) {
    resultAttempts += 1;
    if (resultAttempts < 3) {
      return new Response('Downstream service unavailable', { status: 504 });
    }
    return Response.json({
      images: [{ url: 'https://v3b.fal.media/files/test/qwen3.png' }],
      seed: 42,
    });
  }
  return new Response('unexpected request', { status: 404 });
};

try {
  const provider = new FalProvider({ apiKey: 'test-key' });
  const options = sanitizeImageGenerationOptions({
    image_size: 'landscape_4_3',
    enable_safety_checker: false,
    num_images: 99,
  });
  const submitted = await provider.generate({
    params: {
      mediaType: AIMediaType.IMAGE,
      model: DEFAULT_IMAGE_MODEL_ID,
      prompt: 'A product poster with precise bilingual typography',
      options,
      callbackUrl:
        'https://qwenimage3.com/api/images/fal-webhook?task=local&token=a+b',
    },
  });

  assert.equal(submitted.taskId, requestId);
  const submissionUrl = new URL(requests[0]!.url);
  assert.equal(`${submissionUrl.origin}${submissionUrl.pathname}`, base);
  assert.equal(
    submissionUrl.searchParams.get('fal_webhook'),
    'https://qwenimage3.com/api/images/fal-webhook?task=local&token=a+b'
  );
  assert.equal(
    (requests[0]?.headers as Record<string, string>)['X-Fal-Queue-Priority'],
    'normal'
  );
  assert.equal(
    (requests[0]?.headers as Record<string, string>)['X-Fal-Request-Timeout'],
    '180'
  );
  assert.deepEqual(requests[0]?.body, {
    prompt: 'A product poster with precise bilingual typography',
    image_size: 'landscape_4_3',
    enable_prompt_expansion: false,
    enable_safety_checker: true,
    num_images: 1,
    output_format: 'png',
  });

  const completed = await provider.query!({
    taskId: requestId,
    mediaType: AIMediaType.IMAGE,
    model: DEFAULT_IMAGE_MODEL_ID,
    taskResult: submitted.taskResult,
  });
  assert.equal(completed.taskStatus, AITaskStatus.SUCCESS);
  assert.equal(
    completed.taskInfo?.images?.[0]?.imageUrl,
    'https://v3b.fal.media/files/test/qwen3.png'
  );
  assert.equal(resultAttempts, 3);
  assert.deepEqual(
    requests.slice(1).map((request) => request.url),
    [
      `${base}/requests/${requestId}/status`,
      `${base}/requests/${requestId}`,
      `${base}/requests/${requestId}`,
      `${base}/requests/${requestId}`,
    ]
  );

  for (const model of [
    IMAGE_MODEL_IDS.qwen2Standard,
    IMAGE_MODEL_IDS.qwen2Pro,
  ]) {
    const modelBase = `https://queue.fal.run/${model}`;
    await provider.generate({
      params: {
        mediaType: AIMediaType.IMAGE,
        model,
        prompt: 'Quality-preserving provider check',
        options: sanitizeImageGenerationOptions(),
      },
    });
    const request = requests.at(-1)!;
    assert.equal(request.url, modelBase);
    assert.equal(request.method, 'POST');
    assert.equal(
      (request.headers as Record<string, string>)['X-Fal-Queue-Priority'],
      'normal'
    );
    assert.deepEqual(request.body, {
      prompt: 'Quality-preserving provider check',
      image_size: 'square_hd',
      enable_prompt_expansion: false,
      enable_safety_checker: true,
      num_images: 1,
      output_format: 'png',
    });
  }

  const failedRequestId = 'qwen3-policy-failure';
  const failedBase = `https://queue.fal.run/${DEFAULT_IMAGE_MODEL_ID}`;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.endsWith(`/${failedRequestId}/status`)) {
      return Response.json({
        status: 'FAILED',
        error_code: 'content_policy_violation',
        error: 'Unexpected status code: 422',
      });
    }
    if (url.endsWith(`/${failedRequestId}`)) {
      return Response.json(
        {
          detail: [
            {
              loc: ['body', 'prompt'],
              msg: 'The prompt was blocked by the content safety filter',
              type: 'content_policy_violation',
            },
          ],
        },
        {
          status: 422,
          headers: {
            'x-fal-error-type': 'content_policy_violation',
            'x-fal-request-id': failedRequestId,
          },
        }
      );
    }
    return new Response('unexpected request', { status: 404 });
  };
  const failed = await provider.query!({
    taskId: failedRequestId,
    mediaType: AIMediaType.IMAGE,
    model: DEFAULT_IMAGE_MODEL_ID,
    taskResult: {
      status_url: `${failedBase}/requests/${failedRequestId}/status`,
      response_url: `${failedBase}/requests/${failedRequestId}`,
    },
  });
  assert.equal(failed.taskStatus, AITaskStatus.FAILED);
  assert.equal(failed.taskInfo?.errorCode, 'content_policy_violation');
  assert.match(
    failed.taskInfo?.errorMessage || '',
    /Content safety policy violation/
  );
  assert.match(failed.taskInfo?.errorMessage || '', /body\.prompt/);
  assert.match(
    failed.taskInfo?.errorMessage || '',
    /blocked by the content safety filter/
  );

  console.log('All Fal Qwen Image provider verifications passed.');
} finally {
  globalThis.fetch = originalFetch;
}
