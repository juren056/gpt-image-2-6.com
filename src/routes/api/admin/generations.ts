import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { listAdminGenerations } from '@/modules/admin-generations/service';
import { hasPermission } from '@/modules/rbac/service';
import { respData, respErr } from '@/lib/resp';

function parseDate(value: string | null, endOfDay = false) {
  if (!value) return undefined;
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00'}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function positiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function allowedValue(value: string | null, allowed: readonly string[]) {
  return value && allowed.includes(value) ? value : undefined;
}

async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');
    if (!(await hasPermission(session.user.id, "admin.ai-tasks.read"))) {
      return respErr('Forbidden');
    }

    const { searchParams } = new URL(request.url);
    const data = await listAdminGenerations({
      page: positiveInt(searchParams.get('page'), 1),
      pageSize: positiveInt(searchParams.get('pageSize'), 24),
      search: searchParams.get('search')?.trim().slice(0, 200) || undefined,
      mediaType: allowedValue(searchParams.get('mediaType'), [
        'image',
        'video',
      ]),
      status: allowedValue(searchParams.get('status'), [
        'pending',
        'processing',
        'success',
        'failed',
        'canceled',
      ]),
      safetyStatus: allowedValue(searchParams.get('safetyStatus'), [
        'unchecked',
        'allowed',
        'blocked',
        'review',
      ]),
      model: searchParams.get('model')?.trim().slice(0, 200) || undefined,
      from: parseDate(searchParams.get('from')),
      to: parseDate(searchParams.get('to'), true),
    });
    return respData(data);
  } catch {
    return respErr('Could not load generations');
  }
}

export const Route = createFileRoute('/api/admin/generations')({
  server: { handlers: { GET } },
});
