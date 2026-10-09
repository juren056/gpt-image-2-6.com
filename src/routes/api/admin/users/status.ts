import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { getAuth } from '@/core/auth';
import {
  changeUserStatuses,
  getUserStatusDetails,
} from '@/modules/account-status/service';
import { hasAnyPermission, hasPermission } from '@/modules/rbac/service';
import { respData, respErr } from '@/lib/resp';

const updateSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1).max(100),
  scope: z.enum(['account', 'generation', 'both']),
  accountStatus: z.enum(['active', 'suspended', 'banned']).optional(),
  generationStatus: z
    .enum(['active', 'warned', 'restricted', 'suspended', 'banned'])
    .optional(),
  reasonCode: z.string().trim().min(2).max(80),
  reason: z.string().trim().min(8).max(1000),
  effectiveUntil: z.string().datetime().nullable().optional(),
  expectedVersion: z.number().int().min(0).optional(),
});

async function requireAdmin(request: Request, permission: string) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw new Error('Unauthorized');
  if (!(await hasPermission(session.user.id, permission))) {
    throw new Error('Forbidden');
  }
  return session.user;
}

async function requireStatusAdmin(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw new Error('Unauthorized');
  const allowed = await hasAnyPermission(session.user.id, [
    'admin.users.status.write',
    'admin.users.write',
  ]);
  if (!allowed) throw new Error('Forbidden');
  return session.user;
}

async function GET({ request }: { request: Request }) {
  try {
    await requireAdmin(request, 'admin.users.read');
    const userId = new URL(request.url).searchParams.get('userId');
    if (!userId) return respErr('userId is required');
    return respData(await getUserStatusDetails(userId));
  } catch (error) {
    return respErr(error instanceof Error ? error.message : 'Internal error');
  }
}

async function PATCH({ request }: { request: Request }) {
  try {
    const actor = await requireStatusAdmin(request);
    const input = updateSchema.parse(await request.json());
    return respData(
      await changeUserStatuses({
        ...input,
        actorUserId: actor.id,
        effectiveUntil: input.effectiveUntil
          ? new Date(input.effectiveUntil)
          : null,
        requestId: request.headers.get('x-request-id') ?? '',
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return respErr(error.issues[0]?.message || 'Invalid request');
    }
    return respErr(error instanceof Error ? error.message : 'Internal error');
  }
}

export const Route = createFileRoute('/api/admin/users/status')({
  server: { handlers: { GET, PATCH } },
});
