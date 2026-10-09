import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  archiveProject,
  getProject,
} from '@/modules/creative-projects/service';
import { respData, respErr } from '@/lib/resp';

async function GET({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  const user = (await getAuth().api.getSession({ headers: request.headers }))
    ?.user;
  if (!user) return respErr('Unauthorized');
  const project = await getProject(user.id, params.id);
  return project ? respData(project) : respErr('Project not found');
}

async function DELETE({
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
    return respData(await archiveProject(user.id, params.id));
  } catch (error) {
    return respErr(
      error instanceof Error ? error.message : 'Unable to archive project'
    );
  }
}

export const Route = createFileRoute('/api/studio/projects/$id')({
  server: { handlers: { GET, DELETE } },
});
