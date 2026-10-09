import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  claimDailyCheckIn,
  getDailyCheckInState,
} from '@/modules/credits/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

async function requireUser(request: Request) {
  return getAuth().api.getSession({ headers: request.headers });
}

async function GET({ request }: { request: Request }) {
  try {
    const session = await requireUser(request);
    if (!session?.user) return respErr('Unauthorized');
    return respData(await getDailyCheckInState(session.user.id));
  } catch (error) {
    return respErr(
      error instanceof Error ? error.message : 'Unable to load daily reward'
    );
  }
}

async function POST({ request }: { request: Request }) {
  const limited = await enforceMinIntervalRateLimit(request, {
    intervalMs: 2500,
    keyPrefix: 'daily-check-in',
  });
  if (limited) return limited;

  try {
    const session = await requireUser(request);
    if (!session?.user) return respErr('Unauthorized');
    return respData(
      await claimDailyCheckIn({
        userId: session.user.id,
        userEmail: session.user.email,
      })
    );
  } catch (error) {
    return respErr(
      error instanceof Error ? error.message : 'Unable to claim daily reward'
    );
  }
}

export const Route = createFileRoute('/api/check-in')({
  server: { handlers: { GET, POST } },
});
