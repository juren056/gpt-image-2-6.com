import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  getCreativeUtilityAvailability,
  runCreativeUtility,
} from '@/modules/images/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

async function POST({ request }: { request: Request }) {
  const limited = await enforceMinIntervalRateLimit(request, {
    intervalMs: 3000,
    keyPrefix: 'creative-studio-utility',
  });
  if (limited) return limited;
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session?.user) return respErr('Sign in to use Creative Studio');
    const body = (await request.json()) as Record<string, unknown>;
    const operation = body.operation;
    if (
      !['remove-background', 'upscale', 'vectorize'].includes(String(operation))
    ) {
      return respErr('Unsupported studio utility');
    }
    return respData(
      await runCreativeUtility({
        userId: session.user.id,
        operation: operation as 'remove-background' | 'upscale' | 'vectorize',
        imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl : '',
        scale: body.scale === 4 ? 4 : 2,
      })
    );
  } catch (error) {
    return respErr(
      error instanceof Error ? error.message : 'Studio utility failed'
    );
  }
}

async function GET() {
  return respData(await getCreativeUtilityAvailability());
}

export const Route = createFileRoute('/api/studio/utility')({
  server: { handlers: { GET, POST } },
});
