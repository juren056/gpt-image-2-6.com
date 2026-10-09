import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { resumeUserSubscription } from '@/modules/payment/service';
import { respData, respErr } from '@/lib/resp';

async function POST({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized', { status: 401 });

    const body = await request.json().catch(() => ({}));
    if (!body?.subscriptionNo || typeof body.subscriptionNo !== 'string') {
      return respErr('subscriptionNo is required', { status: 400 });
    }

    return respData(
      await resumeUserSubscription({
        userId: session.user.id,
        subscriptionNo: body.subscriptionNo,
      })
    );
  } catch (error) {
    return respErr(
      error instanceof Error ? error.message : 'Unable to resume subscription',
      { status: 400 }
    );
  }
}

export const Route = createFileRoute('/api/user/subscriptions/resume')({
  server: { handlers: { POST } },
});
