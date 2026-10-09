import assert from 'node:assert/strict';

import {
  getMinimaxH3GenerationCost,
  getSeedance25GenerationCost,
  getVideoGenerationCost,
  getWan3GenerationCost,
  MATCHA_FILTER_REMOVAL_COST,
  MEDIA_TOOL_MODELS,
  sanitizeBackgroundRemovalOptions,
  sanitizeMatchaFilterRemovalOptions,
  sanitizeMinimaxH3VideoOptions,
  sanitizeSeedance25VideoOptions,
  sanitizeVideoOptions,
  sanitizeWan3VideoOptions,
} from '../src/config/media-tools';
import { FalProvider } from '../src/core/ai/fal';
import { AIMediaType, AITaskStatus } from '../src/core/ai/types';
import {
  estimateMatchaFilterStrength,
  sanitizeMatchaFilterStrength,
  shouldRunMatchaColorization,
} from '../src/lib/matcha-filter';

const originalFetch = globalThis.fetch;
const requests: Array<{ url: string; method: string; body?: any }> = [];
const videoModels = new Set([
  MEDIA_TOOL_MODELS.seedance20TextToVideo,
  MEDIA_TOOL_MODELS.seedance25TextToVideo,
  MEDIA_TOOL_MODELS.wan3TextToVideo,
  MEDIA_TOOL_MODELS.minimaxH3TextToVideo,
]);

globalThis.fetch = async (input, init) => {
  const url = String(input);
  const method = init?.method || 'GET';
  const body =
    typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
  requests.push({ url, method, body });

  if (method === 'POST') {
    return Response.json({
      request_id: url.includes(MEDIA_TOOL_MODELS.backgroundRemoval)
        ? 'background-1'
        : 'video-1',
    });
  }
  if (url.endsWith('/status')) return Response.json({ status: 'COMPLETED' });
  if ([...videoModels].some((model) => url.includes(model))) {
    return Response.json({
      video: { url: 'https://v3b.fal.media/test/video.mp4' },
    });
  }
  return Response.json({
    image: { url: 'https://v3b.fal.media/test/cutout.png' },
  });
};

try {
  const provider = new FalProvider({ apiKey: 'test-key' });
  assert.equal(
    MEDIA_TOOL_MODELS.seedance20TextToVideo,
    'bytedance/seedance-2.0/text-to-video'
  );
  assert.equal(
    MEDIA_TOOL_MODELS.seedance25TextToVideo,
    'bytedance/seedance-2.5/text-to-video'
  );
  assert.equal(
    MEDIA_TOOL_MODELS.wan3TextToVideo,
    'alibaba/wan-3.0/text-to-video'
  );
  assert.equal(
    MEDIA_TOOL_MODELS.minimaxH3TextToVideo,
    'minimax/h3/text-to-video'
  );
  const videoOptions = sanitizeVideoOptions({
    aspect_ratio: '9:16',
    duration: 8,
    resolution: '1080p',
    enable_safety_checker: false,
  });
  assert.equal(getVideoGenerationCost(videoOptions), 240);
  assert.equal(videoOptions.resolution, '720p');
  assert.equal(videoOptions.generate_audio, true);
  assert.equal('enable_safety_checker' in videoOptions, false);
  assert.equal('negative_prompt' in videoOptions, false);

  const submittedVideo = await provider.generate({
    params: {
      mediaType: AIMediaType.VIDEO,
      model: MEDIA_TOOL_MODELS.seedance20TextToVideo,
      prompt: 'A paper moth unfolds and rises into moonlight.',
      options: videoOptions,
    },
  });
  assert.equal(
    requests[0]?.body.prompt,
    'A paper moth unfolds and rises into moonlight.'
  );
  assert.equal(requests[0]?.body.aspect_ratio, '9:16');
  assert.equal(requests[0]?.body.duration, '8');
  const completedVideo = await provider.query!({
    taskId: submittedVideo.taskId,
    mediaType: AIMediaType.VIDEO,
    model: MEDIA_TOOL_MODELS.seedance20TextToVideo,
    taskResult: submittedVideo.taskResult,
  });
  assert.equal(completedVideo.taskStatus, AITaskStatus.SUCCESS);
  assert.equal(
    completedVideo.taskInfo?.videos?.[0]?.videoUrl,
    'https://v3b.fal.media/test/video.mp4'
  );

  const seedance25Options = sanitizeSeedance25VideoOptions({
    aspect_ratio: '21:9',
    duration: 30,
  });
  assert.equal(getSeedance25GenerationCost(seedance25Options), 1500);
  assert.deepEqual(seedance25Options, {
    resolution: '720p',
    duration: '30',
    aspect_ratio: '21:9',
    generate_audio: true,
    bitrate_mode: 'standard',
  });
  const submittedSeedance25 = await provider.generate({
    params: {
      mediaType: AIMediaType.VIDEO,
      model: MEDIA_TOOL_MODELS.seedance25TextToVideo,
      prompt: 'A continuous cinematic shot across a stormy harbor.',
      options: seedance25Options,
    },
  });
  const seedance25Submission = requests.find(
    (request) =>
      request.method === 'POST' &&
      request.url.includes(MEDIA_TOOL_MODELS.seedance25TextToVideo)
  );
  assert.equal(
    seedance25Submission?.url,
    `https://queue.fal.run/${MEDIA_TOOL_MODELS.seedance25TextToVideo}`
  );
  assert.equal(seedance25Submission?.body.duration, '30');
  assert.equal(seedance25Submission?.body.generate_audio, true);
  const completedSeedance25 = await provider.query!({
    taskId: submittedSeedance25.taskId,
    mediaType: AIMediaType.VIDEO,
    model: MEDIA_TOOL_MODELS.seedance25TextToVideo,
    taskResult: submittedSeedance25.taskResult,
  });
  assert.equal(completedSeedance25.taskStatus, AITaskStatus.SUCCESS);
  assert.equal(
    completedSeedance25.taskInfo?.videos?.[0]?.videoUrl,
    'https://v3b.fal.media/test/video.mp4'
  );

  const wan3Options = sanitizeWan3VideoOptions({
    aspect_ratio: '9:16',
    duration: 15,
  });
  assert.equal(getWan3GenerationCost(wan3Options), 450);
  assert.deepEqual(wan3Options, {
    resolution: '720p',
    aspect_ratio: '9:16',
    duration: 15,
    audio: true,
    enable_prompt_expansion: false,
    enable_thinking: false,
    enable_safety_checker: true,
  });
  const submittedWan3 = await provider.generate({
    params: {
      mediaType: AIMediaType.VIDEO,
      model: MEDIA_TOOL_MODELS.wan3TextToVideo,
      prompt: 'A dancer spins under neon street lights.',
      options: wan3Options,
    },
  });
  const wan3Submission = requests.find(
    (request) =>
      request.method === 'POST' &&
      request.url.includes(MEDIA_TOOL_MODELS.wan3TextToVideo)
  );
  assert.equal(
    wan3Submission?.url,
    `https://queue.fal.run/${MEDIA_TOOL_MODELS.wan3TextToVideo}`
  );
  assert.equal(wan3Submission?.body.audio, true);
  assert.equal(wan3Submission?.body.duration, 15);
  const completedWan3 = await provider.query!({
    taskId: submittedWan3.taskId,
    mediaType: AIMediaType.VIDEO,
    model: MEDIA_TOOL_MODELS.wan3TextToVideo,
    taskResult: submittedWan3.taskResult,
  });
  assert.equal(completedWan3.taskStatus, AITaskStatus.SUCCESS);
  assert.equal(
    completedWan3.taskInfo?.videos?.[0]?.videoUrl,
    'https://v3b.fal.media/test/video.mp4'
  );

  const minimaxOptions = sanitizeMinimaxH3VideoOptions({
    aspect_ratio: '1:1',
    duration: 15,
  });
  assert.equal(getMinimaxH3GenerationCost(minimaxOptions), 450);
  const submittedMinimax = await provider.generate({
    params: {
      mediaType: AIMediaType.VIDEO,
      model: MEDIA_TOOL_MODELS.minimaxH3TextToVideo,
      prompt: 'A glass sculpture rotates in a dark studio.',
      options: minimaxOptions,
    },
  });
  const minimaxSubmission = requests.find(
    (request) =>
      request.method === 'POST' &&
      request.url.includes(MEDIA_TOOL_MODELS.minimaxH3TextToVideo)
  );
  assert.equal(
    minimaxSubmission?.url,
    `https://queue.fal.run/${MEDIA_TOOL_MODELS.minimaxH3TextToVideo}`
  );
  assert.equal(minimaxSubmission?.body.resolution, '2K');
  assert.equal(minimaxSubmission?.body.enable_safety_checker, true);
  assert.equal(minimaxSubmission?.body.prompt_expansion_mode, 'fast');
  const completedMinimax = await provider.query!({
    taskId: submittedMinimax.taskId,
    mediaType: AIMediaType.VIDEO,
    model: MEDIA_TOOL_MODELS.minimaxH3TextToVideo,
    taskResult: submittedMinimax.taskResult,
  });
  assert.equal(completedMinimax.taskStatus, AITaskStatus.SUCCESS);
  assert.equal(
    completedMinimax.taskInfo?.videos?.[0]?.videoUrl,
    'https://v3b.fal.media/test/video.mp4'
  );

  const backgroundOptions = sanitizeBackgroundRemovalOptions(
    'https://cdn.example.com/source.webp'
  );
  const submittedBackground = await provider.generate({
    params: {
      mediaType: AIMediaType.IMAGE,
      model: MEDIA_TOOL_MODELS.backgroundRemoval,
      prompt: 'Remove the background.',
      options: backgroundOptions,
    },
  });
  const backgroundSubmission = requests.find(
    (request) =>
      request.method === 'POST' &&
      request.url.includes(MEDIA_TOOL_MODELS.backgroundRemoval)
  );
  assert.equal(
    backgroundSubmission?.url,
    `https://queue.fal.run/${MEDIA_TOOL_MODELS.backgroundRemoval}`
  );
  assert.deepEqual(backgroundSubmission?.body, backgroundOptions);
  assert.equal('prompt' in backgroundSubmission!.body, false);
  const completedBackground = await provider.query!({
    taskId: submittedBackground.taskId,
    mediaType: AIMediaType.IMAGE,
    model: MEDIA_TOOL_MODELS.backgroundRemoval,
    taskResult: submittedBackground.taskResult,
  });
  assert.equal(completedBackground.taskStatus, AITaskStatus.SUCCESS);
  assert.equal(
    completedBackground.taskInfo?.images?.[0]?.imageUrl,
    'https://v3b.fal.media/test/cutout.png'
  );

  assert.equal(MATCHA_FILTER_REMOVAL_COST, 10);
  const matchaOptions = sanitizeMatchaFilterRemovalOptions(
    'https://cdn.example.com/matcha-filtered.webp'
  );
  assert.equal(matchaOptions.strength, 0.86);
  assert.equal(
    matchaOptions.image_urls[0],
    'https://cdn.example.com/matcha-filtered.webp'
  );
  assert.equal(
    estimateMatchaFilterStrength(
      new Uint8ClampedArray([120, 120, 120, 255, 180, 180, 180, 255])
    ),
    0.58
  );
  assert.equal(
    estimateMatchaFilterStrength(
      new Uint8ClampedArray([120, 135, 30, 255, 170, 180, 35, 255])
    ),
    0.92
  );
  assert.equal(sanitizeMatchaFilterStrength(2), 0.92);
  assert.equal(sanitizeMatchaFilterStrength(0.1), 0.55);
  assert.equal(shouldRunMatchaColorization(0.78), false);
  assert.equal(shouldRunMatchaColorization(0.88), true);
  assert.equal(shouldRunMatchaColorization(0.92), true);
  assert.equal(
    sanitizeMatchaFilterRemovalOptions(
      'https://cdn.example.com/matcha-filtered.webp',
      0.78
    ).strength,
    0.78
  );

  console.log('Media tool provider verification passed.');
} finally {
  globalThis.fetch = originalFetch;
}
