import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  listProjects,
  saveProject,
  type StudioProjectState,
} from '@/modules/creative-projects/service';
import { respData, respErr } from '@/lib/resp';

async function sessionUser(request: Request) {
  return (await getAuth().api.getSession({ headers: request.headers }))?.user;
}

async function GET({ request }: { request: Request }) {
  const user = await sessionUser(request);
  if (!user) return respErr('Unauthorized');
  return respData(await listProjects(user.id));
}

async function POST({ request }: { request: Request }) {
  try {
    const user = await sessionUser(request);
    if (!user) return respErr('Unauthorized');
    const body = (await request.json()) as Record<string, unknown>;
    return respData(
      await saveProject({
        userId: user.id,
        id: typeof body.id === 'string' ? body.id : undefined,
        title: typeof body.title === 'string' ? body.title : '',
        previewUrl:
          typeof body.previewUrl === 'string' ? body.previewUrl : undefined,
        state: body.state as StudioProjectState,
      })
    );
  } catch (error) {
    return respErr(
      error instanceof Error ? error.message : 'Unable to save project'
    );
  }
}

export const Route = createFileRoute('/api/studio/projects')({
  server: { handlers: { GET, POST } },
});
