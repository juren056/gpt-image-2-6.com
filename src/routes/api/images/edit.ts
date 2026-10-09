import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { generateImageEdit } from '@/modules/images/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

async function POST({ request }: { request: Request }) {
  const limited = await enforceMinIntervalRateLimit(request, {
    intervalMs: 3000,
    keyPrefix: 'images-edit',
  });
  if (limited) return limited;
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session?.user) return respErr('Sign in to edit an image');
    const body = await request.json().catch(() => ({}));
    return respData(
      await generateImageEdit({
        userId: session.user.id,
        prompt: typeof body.prompt === 'string' ? body.prompt : '',
        imageUrls: Array.isArray(body.image_urls) ? body.image_urls : [],
        options:
          body.options && typeof body.options === 'object'
            ? body.options
            : undefined,
      })
    );
  } catch (error: unknown) {
    return respErr(
      error instanceof Error ? error.message : 'Image editing failed'
    );
  }
}

export const Route = createFileRoute('/api/images/edit')({
  server: { handlers: { POST } },
});
