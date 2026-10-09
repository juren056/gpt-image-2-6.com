import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { revokeProjectShare } from '@/modules/creative-projects/service';
import { respData, respErr } from '@/lib/resp';

async function POST({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  try {
    const user = (await getAuth().api.getSession({ headers: request.headers }))
      ?.user;
    if (!user) return respErr('Unauthorized');
    return respData(await revokeProjectShare(user.id, params.id));
  } catch (error) {
    return respErr(
      error instanceof Error ? error.message : 'Unable to revoke share'
    );
  }
}

export const Route = createFileRoute('/api/studio/shares/$id/revoke')({
  server: { handlers: { POST } },
});
