import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { generateImage } from '@/modules/images/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

async function POST({ request }: { request: Request }) {
  const limited = await enforceMinIntervalRateLimit(request, {
    intervalMs: 3000,
    keyPrefix: 'images-generate',
  });
  if (limited) return limited;

  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const body = await request.json();
    const prompt = typeof body.prompt === 'string' ? body.prompt : '';
    const model = typeof body.model === 'string' ? body.model : undefined;
    const options =
      body.options && typeof body.options === 'object'
        ? body.options
        : undefined;

    const result = await generateImage({
      userId: session.user.id,
      prompt,
      model,
      options,
    });

    return respData(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to generate image';
    return respErr(message);
  }
}

export const Route = createFileRoute('/api/images/generate')({
  server: { handlers: { POST } },
});
