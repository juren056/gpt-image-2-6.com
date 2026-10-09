import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  MEDIA_TOOL_MODELS,
  sanitizeVideoOptions,
} from '../src/config/media-tools';
import { FalProvider } from '../src/core/ai/fal';
import {
  AIMediaType,
  AITaskStatus,
  type AITaskResult,
} from '../src/core/ai/types';
import { getAllConfigs } from '../src/modules/config/service';

const POLL_INTERVAL_MS = 3_000;
const MAX_POLLS = 100;
const outputDirectory = resolve('public/videos');
const outputPath = resolve(outputDirectory, 'seedance-2-demo.mp4');

const configs = await getAllConfigs();
if (!configs.fal_api_key) {
  throw new Error(
    'Fal API key is unavailable. Load the configured database before generating the demo.'
  );
}

const provider = new FalProvider({ apiKey: configs.fal_api_key });
const startedAt = Date.now();
const submitted = await provider.generate({
  params: {
    mediaType: AIMediaType.VIDEO,
    model: MEDIA_TOOL_MODELS.seedance20TextToVideo,
    prompt:
      'A premium five-second product film of a translucent cobalt-blue glass perfume bottle standing on black mirror water. Violet petals orbit once while a soft circular wave expands from the bottle. The camera makes one slow cinematic push-in and finishes with the bottle centered. Dramatic violet and silver studio lighting, photorealistic glass and water, synchronized water ripple and a subtle glass chime, no captions, logos, text or watermark.',
    options: sanitizeVideoOptions({ duration: 5, aspect_ratio: '16:9' }),
  },
});

console.log(
  JSON.stringify({
    event: 'submitted',
    model: MEDIA_TOOL_MODELS.seedance20TextToVideo,
    requestId: submitted.taskId,
  })
);

let latest: AITaskResult = submitted;
for (let attempt = 1; attempt <= MAX_POLLS; attempt += 1) {
  await new Promise((resolvePoll) => setTimeout(resolvePoll, POLL_INTERVAL_MS));
  latest = await provider.query!({
    taskId: submitted.taskId,
    mediaType: AIMediaType.VIDEO,
    model: MEDIA_TOOL_MODELS.seedance20TextToVideo,
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
  throw new Error('Timed out waiting for the Seedance demo video');
}

const videoUrl = latest.taskInfo?.videos?.[0]?.videoUrl;
if (!videoUrl) throw new Error('Fal completed without returning a video URL');

const response = await fetch(videoUrl);
if (!response.ok) {
  throw new Error(`Failed to download the demo video (${response.status})`);
}

const video = Buffer.from(await response.arrayBuffer());
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, video);

console.log(
  JSON.stringify({
    event: 'completed',
    model: MEDIA_TOOL_MODELS.seedance20TextToVideo,
    requestId: submitted.taskId,
    outputPath,
    bytes: video.byteLength,
    elapsedMs: Date.now() - startedAt,
  })
);
