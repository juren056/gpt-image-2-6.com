import { FalProvider } from '@/core/ai/fal';
import { AIMediaType, AITaskStatus, type AITaskResult } from '@/core/ai/types';
import { CREATIVE_MODELS, UTILITY_MODELS } from '@/config/creative-studio';

const REFERENCE_IMAGE =
  'https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png';
const POLL_INTERVAL_MS = 2_000;
const MAX_POLLS = 120;

type AcceptanceCase = {
  label: string;
  model: string;
  prompt: string;
  options: Record<string, unknown>;
};

export type FalAcceptanceResult = {
  label: string;
  model: string;
  requestId: string;
  outputHost: string;
  elapsedMs: number;
};

export function getFalAcceptanceCases(): AcceptanceCase[] {
  const cases: AcceptanceCase[] = [];
  for (const definition of CREATIVE_MODELS) {
    for (const [operation, endpoint] of Object.entries(definition.endpoints)) {
      if (!endpoint) continue;
      const options: Record<string, unknown> = {
        num_images: 1,
        output_format: 'png',
        [definition.sizeParameter]: definition.sizes[0],
      };
      if (definition.qualities.length) {
        options.quality = definition.qualities[0];
      }
      if (operation === 'edit') {
        options.image_urls = [REFERENCE_IMAGE];
      }
      cases.push({
        label: `${definition.acceptanceId}-${operation}`,
        model: endpoint,
        prompt:
          operation === 'edit'
            ? 'Keep the main subject unchanged and make the background pale blue.'
            : 'A small cobalt blue ceramic cup on a white studio table, clean product photography.',
        options,
      });
    }
  }

  for (const [operation, model] of Object.entries(UTILITY_MODELS)) {
    cases.push({
      label: `utility-${operation}`,
      model,
      prompt: operation,
      options: {
        image_url: REFERENCE_IMAGE,
        ...(operation === 'upscale' ? { upscale_factor: 2 } : {}),
      },
    });
  }
  return cases;
}

async function runOne(
  provider: FalProvider,
  test: AcceptanceCase
): Promise<FalAcceptanceResult> {
  const startedAt = Date.now();
  let submitted: AITaskResult;
  try {
    submitted = await provider.generate({
      params: {
        mediaType: AIMediaType.IMAGE,
        model: test.model,
        prompt: test.prompt,
        options: test.options,
      },
    });
  } catch (error) {
    throw new Error(
      `${test.label} submission failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  let latest: AITaskResult = submitted;
  for (let attempt = 1; attempt <= MAX_POLLS; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    try {
      latest = await provider.query!({
        taskId: submitted.taskId,
        mediaType: AIMediaType.IMAGE,
        model: test.model,
        taskResult: submitted.taskResult,
      });
    } catch (error) {
      throw new Error(
        `${test.label} query failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    if (latest.taskStatus === AITaskStatus.SUCCESS) break;
    if (
      latest.taskStatus === AITaskStatus.FAILED ||
      latest.taskStatus === AITaskStatus.CANCELED
    ) {
      throw new Error(
        `${test.label} failed: ${latest.taskInfo?.errorMessage || latest.taskStatus}`
      );
    }
  }

  if (latest.taskStatus !== AITaskStatus.SUCCESS) {
    throw new Error(`${test.label} timed out without resubmission`);
  }
  const outputUrl = latest.taskInfo?.images?.[0]?.imageUrl;
  if (!outputUrl) {
    throw new Error(`${test.label} completed without an image output`);
  }
  return {
    label: test.label,
    model: test.model,
    requestId: submitted.taskId,
    outputHost: new URL(outputUrl).hostname,
    elapsedMs: Date.now() - startedAt,
  };
}

export async function runFalLiveAcceptance(
  apiKey: string,
  labels?: readonly string[]
) {
  const provider = new FalProvider({ apiKey });
  const allCases = getFalAcceptanceCases();
  const queue = labels?.length
    ? allCases.filter((test) => labels.includes(test.label))
    : allCases;
  if (labels?.length && queue.length !== labels.length) {
    throw new Error('Unknown Fal acceptance label');
  }
  const results: FalAcceptanceResult[] = [];
  const failures: Error[] = [];
  const workers = Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const test = queue.shift();
      if (!test) return;
      try {
        results.push(await runOne(provider, test));
      } catch (error) {
        failures.push(
          error instanceof Error ? error : new Error(`${test.label} failed`)
        );
      }
    }
  });
  await Promise.all(workers);
  if (failures.length) {
    throw new Error(
      `${failures.length} Fal acceptance check(s) failed: ${failures
        .map((failure) => failure.message)
        .join(' | ')}`
    );
  }
  return results.sort((a, b) => a.label.localeCompare(b.label));
}
