import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { getAllConfigs } from '@/modules/config/service';
import {
  checkEligibility,
  claimImpression,
  dismissFeedback,
  FEEDBACK_OPTIONS,
  FEEDBACK_SCENES,
  submitFeedback,
  type FeedbackOption,
  type FeedbackScene,
} from '@/modules/generation-feedback/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

function asEnabled(value: string | undefined, fallback: boolean) {
  if (value === undefined || value === '') return fallback;
  return value === 'true';
}

function boundedInt(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number
) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed)
    ? Math.min(max, Math.max(min, parsed))
    : fallback;
}

function inRollout(userId: string, percent: number) {
  let hash = 0;
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 100 < percent;
}

async function context(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw new Error('Unauthorized');
  const configs = await getAllConfigs();
  const enabled = asEnabled(configs.generation_feedback_enabled, true);
  const rolloutPercent = boundedInt(
    configs.generation_feedback_rollout_percent,
    100,
    0,
    100
  );
  const configuredLaunchAt =
    configs.generation_feedback_launch_at || '2026-09-29T00:00:00.000Z';
  const launchAt = new Date(configuredLaunchAt);
  return {
    session,
    enabled: enabled && inRollout(session.user.id, rolloutPercent),
    rewardCredits: boundedInt(
      configs.generation_feedback_reward_credits,
      10,
      1,
      100
    ),
    rewardValidDays: boundedInt(
      configs.generation_feedback_reward_valid_days,
      30,
      1,
      365
    ),
    delayMs:
      boundedInt(configs.generation_feedback_delay_seconds, 5, 1, 30) * 1000,
    launchAt: Number.isNaN(launchAt.getTime())
      ? new Date('2026-09-29T00:00:00.000Z')
      : launchAt,
  };
}

async function GET({ request }: { request: Request }) {
  try {
    const state = await context(request);
    const taskId = new URL(request.url).searchParams.get('taskId') || '';
    if (!taskId) return respErr('Task ID is required');
    const result = await checkEligibility({
      userId: state.session.user.id,
      taskId,
      enabled: state.enabled,
      launchAt: state.launchAt,
    });
    return respData({
      ...result,
      rewardCredits: state.rewardCredits,
      delayMs: state.delayMs,
    });
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}

async function POST({ request }: { request: Request }) {
  try {
    const state = await context(request);
    const contentLength = Number(request.headers.get('content-length') || '0');
    if (contentLength > 16_384) return respErr('Feedback request is too large');
    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === 'string' ? body.action : '';
    if (!['impression', 'dismiss', 'submit'].includes(action)) {
      return respErr('Invalid feedback action');
    }
    const taskId = typeof body.taskId === 'string' ? body.taskId : '';
    if (!taskId || taskId.length > 191) return respErr('Invalid task ID');
    const limited = await enforceMinIntervalRateLimit(request, {
      intervalMs: 800,
      keyPrefix: 'generation-feedback',
      extraKey: `${state.session.user.id}:${action}`,
    });
    if (limited) return limited;

    if (action === 'impression') {
      return respData(
        await claimImpression({
          userId: state.session.user.id,
          taskId,
          enabled: state.enabled,
          launchAt: state.launchAt,
          modelId: typeof body.modelId === 'string' ? body.modelId : '',
          pagePath: typeof body.pagePath === 'string' ? body.pagePath : '',
          locale: typeof body.locale === 'string' ? body.locale : 'en',
          rewardCredits: state.rewardCredits,
        })
      );
    }

    if (action === 'dismiss') {
      return respData({
        dismissed: await dismissFeedback({
          userId: state.session.user.id,
          taskId,
        }),
      });
    }

    if (action === 'submit') {
      if (!FEEDBACK_SCENES.includes(body.usageScene as FeedbackScene))
        return respErr('Choose a valid usage scene');
      if (!FEEDBACK_OPTIONS.includes(body.feedbackOption as FeedbackOption))
        return respErr('Choose a valid feedback option');
      return respData(
        await submitFeedback({
          userId: state.session.user.id,
          userEmail: state.session.user.email || '',
          taskId,
          usageScene: body.usageScene,
          feedbackOption: body.feedbackOption,
          customText:
            typeof body.customText === 'string' ? body.customText : '',
          rewardValidDays: state.rewardValidDays,
        })
      );
    }
    return respErr('Invalid feedback action');
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}

export const Route = createFileRoute('/api/generation-feedback')({
  server: { handlers: { GET, POST } },
});
