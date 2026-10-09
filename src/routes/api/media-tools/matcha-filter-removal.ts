import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { removeMatchaFilter } from '@/modules/images/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

async function POST({ request }: { request: Request }) {
  const limited = await enforceMinIntervalRateLimit(request, {
    intervalMs: 3000,
    keyPrefix: 'matcha-filter-removal',
  });
  if (limited) return limited;

  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const body = await request.json();
    return respData(
      await removeMatchaFilter({
        userId: session.user.id,
        imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl : '',
        strength: typeof body.strength === 'number' ? body.strength : undefined,
      })
    );
  } catch (error) {
    return respErr(
      error instanceof Error
        ? error.message
        : 'Failed to remove the matcha filter'
    );
  }
}

export const Route = createFileRoute('/api/media-tools/matcha-filter-removal')({
  server: { handlers: { POST } },
});
