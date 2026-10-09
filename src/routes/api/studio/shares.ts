import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { createProjectShare } from '@/modules/creative-projects/service';
import { respData, respErr } from '@/lib/resp';

async function POST({ request }: { request: Request }) {
  try {
    const user = (await getAuth().api.getSession({ headers: request.headers }))
      ?.user;
    if (!user) return respErr('Unauthorized');
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.projectId !== 'string')
      return respErr('Project is required');
    return respData(await createProjectShare(user.id, body.projectId));
  } catch (error) {
    return respErr(
      error instanceof Error ? error.message : 'Unable to share project'
    );
  }
}

export const Route = createFileRoute('/api/studio/shares')({
  server: { handlers: { POST } },
});
