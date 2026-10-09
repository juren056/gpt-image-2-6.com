import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { getBalanceBreakdown, getHistory } from '@/modules/credits/service';
import { respData, respErr } from '@/lib/resp';

async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return respErr('Unauthorized');
    }

    // Balance settlement can create explicit expiration entries. Read history
    // afterwards so the response is internally consistent.
    const breakdown = await getBalanceBreakdown(session.user.id);
    const history = await getHistory(session.user.id);

    return respData({ ...breakdown, history });
  } catch (error: any) {
    return respErr(error.message || 'Failed to get credits');
  }
}

export const Route = createFileRoute('/api/credits')({
  server: {
    handlers: { GET },
  },
});
