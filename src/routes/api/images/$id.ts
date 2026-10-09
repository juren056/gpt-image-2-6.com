import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { refreshImageTask } from '@/modules/images/service';
import { respData, respErr } from '@/lib/resp';

async function GET({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const task = await refreshImageTask(params.id, session.user.id);
    return respData(task);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to get image task';
    return respErr(message);
  }
}

export const Route = createFileRoute('/api/images/$id')({
  server: { handlers: { GET } },
});
