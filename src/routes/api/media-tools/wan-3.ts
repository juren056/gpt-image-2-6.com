import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { generateWan3Video } from '@/modules/images/service';
import {
  getCurrentSubscription,
  SubscriptionStatus,
} from '@/modules/subscriptions/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

async function POST({ request }: { request: Request }) {
  const limited = await enforceMinIntervalRateLimit(request, {
    intervalMs: 5000,
    keyPrefix: 'wan3-video-generate',
  });
  if (limited) return limited;

  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const subscription = await getCurrentSubscription(session.user.id);
    if (
      !subscription ||
      ![SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING_CANCEL].includes(
        subscription.status as SubscriptionStatus
      )
    ) {
      return respErr(
        'An active paid membership is required to generate Wan 3.0 videos'
      );
    }

    const body = await request.json();
    return respData(
      await generateWan3Video({
        userId: session.user.id,
        prompt: typeof body.prompt === 'string' ? body.prompt : '',
        options:
          body.options && typeof body.options === 'object'
            ? body.options
            : undefined,
      })
    );
  } catch (error) {
    return respErr(
      error instanceof Error
        ? error.message
        : 'Failed to generate Wan 3.0 video'
    );
  }
}

export const Route = createFileRoute('/api/media-tools/wan-3')({
  server: { handlers: { POST } },
});
