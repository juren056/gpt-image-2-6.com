import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { runCreativeImage } from '@/modules/images/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

async function POST({ request }: { request: Request }) {
  const limited = await enforceMinIntervalRateLimit(request, {
    intervalMs: 3000,
    keyPrefix: 'creative-studio-run',
  });
  if (limited) return limited;
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session?.user) return respErr('Sign in to use Creative Studio');
    const body = (await request.json()) as Record<string, unknown>;
    return respData(
      await runCreativeImage({
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
        // Forward unknown values to validation; do not silently default an
        // invalid high-resolution request to a cheaper resolution.
        resolution: body.resolution,
        outputFormat:
          typeof body.outputFormat === 'string' ? body.outputFormat : undefined,
        outputCount: body.outputCount,
        maskUrl: typeof body.maskUrl === 'string' ? body.maskUrl : undefined,
        conversationParts: Array.isArray(body.conversationParts)
          ? (body.conversationParts as Array<Record<string, unknown>>)
          : undefined,
      })
    );
  } catch (error) {
    return respErr(
      error instanceof Error ? error.message : 'Creative request failed'
    );
  }
}

export const Route = createFileRoute('/api/studio/run')({
  server: { handlers: { POST } },
});
