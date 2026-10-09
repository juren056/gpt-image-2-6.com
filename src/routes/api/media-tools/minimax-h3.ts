import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { generateMinimaxH3Video } from '@/modules/images/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

async function POST({ request }: { request: Request }) {
  const limited = await enforceMinIntervalRateLimit(request, {
    intervalMs: 5000,
    keyPrefix: 'minimax-h3-generate',
  });
  if (limited) return limited;

  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const body = await request.json();
    const result = await generateMinimaxH3Video({
      userId: session.user.id,
      prompt: typeof body.prompt === 'string' ? body.prompt : '',
      options:
        body.options && typeof body.options === 'object'
          ? body.options
          : undefined,
    });
    return respData(result);
  } catch (error) {
    return respErr(
      error instanceof Error
        ? error.message
        : 'Failed to generate MiniMax H3 video'
    );
  }
}

export const Route = createFileRoute('/api/media-tools/minimax-h3')({
  server: { handlers: { POST } },
});
