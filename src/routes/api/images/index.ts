import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { listImages } from '@/modules/images/service';
import { respData, respErr } from '@/lib/resp';

async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.min(
      50,
      Math.max(1, Number(url.searchParams.get('limit') || 20))
    );

    const items = await listImages(session.user.id, page, limit);
    return respData({ items, total: items.length });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to list images';
    return respErr(message);
  }
}

export const Route = createFileRoute('/api/images/')({
  server: { handlers: { GET } },
});
