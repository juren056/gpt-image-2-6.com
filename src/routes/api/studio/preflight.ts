import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { preflightCreativeImage } from '@/modules/images/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

async function POST({ request }: { request: Request }) {
  const limited = await enforceMinIntervalRateLimit(request, {
    intervalMs: 1500,
    keyPrefix: 'creative-studio-preflight',
  });
  if (limited) return limited;
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session?.user) return respErr('Sign in to use Creative Studio');
    const body = (await request.json()) as Record<string, unknown>;
    return respData(
      await preflightCreativeImage({
        userId: session.user.id,
        model: typeof body.model === 'string' ? body.model : '',
        operation: typeof body.operation === 'string' ? body.operation : '',
        prompt: typeof body.prompt === 'string' ? body.prompt : '',
        imageUrls: Array.isArray(body.imageUrls)
          ? body.imageUrls.filter(
              (value): value is string => typeof value === 'string'
            )
          : [],
        size: typeof body.size === 'string' ? body.size : undefined,
        quality: typeof body.quality === 'string' ? body.quality : undefined,
        resolution: body.resolution,
        outputFormat:
          typeof body.outputFormat === 'string' ? body.outputFormat : undefined,
        outputCount: body.outputCount,
      })
    );
  } catch (error) {
    return respErr(
      error instanceof Error ? error.message : 'Creative preflight failed'
    );
  }
}

export const Route = createFileRoute('/api/studio/preflight')({
  server: { handlers: { POST } },
});
