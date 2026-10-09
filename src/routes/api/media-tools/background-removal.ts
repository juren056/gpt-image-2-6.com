import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { removeImageBackground } from '@/modules/images/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

async function POST({ request }: { request: Request }) {
  const limited = await enforceMinIntervalRateLimit(request, {
    intervalMs: 3000,
    keyPrefix: 'background-removal',
  });
  if (limited) return limited;

  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const body = await request.json();
    const result = await removeImageBackground({
      userId: session.user.id,
      imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl : '',
    });
    return respData(result);
  } catch (error) {
    return respErr(
      error instanceof Error
        ? error.message
        : 'Failed to remove image background'
    );
  }
}

export const Route = createFileRoute('/api/media-tools/background-removal')({
  server: { handlers: { POST } },
});
