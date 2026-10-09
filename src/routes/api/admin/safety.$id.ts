import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { reviewSafetyTask } from '@/modules/images/content-safety';
import { hasPermission } from '@/modules/rbac/service';
import { respData, respErr } from '@/lib/resp';

const ACTIONS = ['confirm', 'false_positive', 'release_account'] as const;

async function PATCH({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session?.user) return respErr('Unauthorized');
    if (!(await hasPermission(session.user.id, 'admin.*'))) {
      return respErr('Forbidden');
    }
    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === 'string' ? body.action : '';
    if (!ACTIONS.includes(action as (typeof ACTIONS)[number])) {
      return respErr('Invalid safety review action');
    }
    return respData(
      await reviewSafetyTask({
        taskId: params.id,
        action: action as (typeof ACTIONS)[number],
        actorUserId: session.user.id,
      })
    );
  } catch {
    return respErr('Review failed');
  }
}

export const Route = createFileRoute('/api/admin/safety/$id')({
  server: { handlers: { PATCH } },
});
