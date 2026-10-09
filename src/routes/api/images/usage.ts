import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { getMonthlyImageUsage } from '@/modules/images/service';
import { respData, respErr } from '@/lib/resp';

async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    return respData(await getMonthlyImageUsage(session.user.id));
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to get image usage';
    return respErr(message);
  }
}

export const Route = createFileRoute('/api/images/usage')({
  server: { handlers: { GET } },
});
