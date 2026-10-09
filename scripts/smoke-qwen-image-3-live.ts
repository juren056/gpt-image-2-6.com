import {
  DEFAULT_IMAGE_MODEL_ID,
  sanitizeImageGenerationOptions,
} from '../src/config/image-models';
import { FalProvider } from '../src/core/ai/fal';
import {
  AIMediaType,
  AITaskStatus,
  type AITaskResult,
} from '../src/core/ai/types';
import { getAllConfigs } from '../src/modules/config/service';

const POLL_INTERVAL_MS = 2_000;
const MAX_POLLS = 90;

const configs = await getAllConfigs();
if (!configs.fal_api_key) {
  throw new Error(
    'Fal API key is unavailable. Load the production DATABASE_URL and CONFIG_ENCRYPTION_KEY before running this smoke test.'
  );
}

const provider = new FalProvider({ apiKey: configs.fal_api_key });
const startedAt = Date.now();
const submitted = await provider.generate({
  params: {
    mediaType: AIMediaType.IMAGE,
    model: DEFAULT_IMAGE_MODEL_ID,
    prompt:
      'A small cobalt-blue ceramic cup on a white studio table, soft daylight, clean product photography',
    options: sanitizeImageGenerationOptions({ image_size: 'square_hd' }),
  },
});

console.log(
  JSON.stringify({
    event: 'submitted',
    model: DEFAULT_IMAGE_MODEL_ID,
    requestId: submitted.taskId,
  })
);

let latest: AITaskResult = submitted;
for (let attempt = 1; attempt <= MAX_POLLS; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  latest = await provider.query!({
    taskId: submitted.taskId,
    mediaType: AIMediaType.IMAGE,
    model: DEFAULT_IMAGE_MODEL_ID,
    taskResult: submitted.taskResult,
  });

  if (latest.taskStatus === AITaskStatus.SUCCESS) break;
  if (
    latest.taskStatus === AITaskStatus.FAILED ||
    latest.taskStatus === AITaskStatus.CANCELED
  ) {
    throw new Error(
      latest.taskInfo?.errorMessage || `Fal task ended as ${latest.taskStatus}`
    );
  }
}

if (latest.taskStatus !== AITaskStatus.SUCCESS) {
  throw new Error('Timed out waiting for the live Qwen Image 3 result');
}

const imageUrl = latest.taskInfo?.images?.[0]?.imageUrl;
if (!imageUrl) throw new Error('Fal completed without returning an image URL');

console.log(
  JSON.stringify({
    event: 'completed',
    model: DEFAULT_IMAGE_MODEL_ID,
    requestId: submitted.taskId,
    imageHost: new URL(imageUrl).hostname,
    elapsedMs: Date.now() - startedAt,
  })
);
