import { createFileRoute } from '@tanstack/react-router';
import { gte, inArray } from 'drizzle-orm';

import { getAuth } from '@/core/auth';
import { isDisposableEmail } from '@/core/auth/abuse-protection';
import { db } from '@/core/db';
import {
  aiTask,
  inviteCode,
  order as orderTable,
  subscription,
  ticket,
  user,
  userInvite,
} from '@/config/db/schema';
import { getAllConfigs } from '@/modules/config/service';
import { revokeSignupCreditsForAbuse } from '@/modules/credits/service';
import { hasPermission } from '@/modules/rbac/service';
import { respData, respErr } from '@/lib/resp';

const MAX_LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000;
const CONFIRM_PHRASE = 'CLEAN_DISPOSABLE_SIGNUPS';

type Candidate = Pick<
  typeof user.$inferSelect,
  'id' | 'email' | 'emailVerified' | 'createdAt'
>;

function parseCreatedAfter(value: unknown) {
  const timestamp = Number(value);
  const earliest = Date.now() - MAX_LOOKBACK_MS;
  if (
    !Number.isFinite(timestamp) ||
    timestamp < earliest ||
    timestamp > Date.now()
  ) {
    throw new Error('Cleanup start must be within the last 14 days');
  }
  return new Date(timestamp);
}

async function relatedUserIds(candidates: Candidate[], currentAdminId: string) {
  const ids = candidates.map((item) => item.id);
  if (!ids.length) return new Set<string>([currentAdminId]);

  const [orders, subscriptions, tasks, tickets, invites, createdInvites] =
    (await Promise.all([
      db()
        .select({ userId: orderTable.userId })
        .from(orderTable)
        .where(inArray(orderTable.userId, ids)),
      db()
        .select({ userId: subscription.userId })
        .from(subscription)
        .where(inArray(subscription.userId, ids)),
      db()
        .select({ userId: aiTask.userId })
        .from(aiTask)
        .where(inArray(aiTask.userId, ids)),
      db()
        .select({ userId: ticket.userId })
        .from(ticket)
        .where(inArray(ticket.userId, ids)),
      db()
        .select({ userId: userInvite.userId })
        .from(userInvite)
        .where(inArray(userInvite.userId, ids)),
      db()
        .select({ userId: inviteCode.createdBy })
        .from(inviteCode)
        .where(inArray(inviteCode.createdBy, ids)),
    ])) as [
      Array<{ userId: string }>,
      Array<{ userId: string }>,
      Array<{ userId: string }>,
      Array<{ userId: string }>,
      Array<{ userId: string }>,
      Array<{ userId: string | null }>,
    ];

  return new Set<string>([
    currentAdminId,
    ...orders.map((row) => row.userId),
    ...subscriptions.map((row) => row.userId),
    ...tasks.map((row) => row.userId),
    ...tickets.map((row) => row.userId),
    ...invites.map((row) => row.userId),
    ...createdInvites.flatMap((row) => (row.userId ? [row.userId] : [])),
  ]);
}

async function assess(createdAfter: Date, currentAdminId: string) {
  const configs = await getAllConfigs();
  const rows = (await db()
    .select({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(gte(user.createdAt, createdAfter))
    .limit(2000)) as Candidate[];

  const candidates = rows.filter((item) =>
    isDisposableEmail(item.email, configs)
  );
  const protectedIds = await relatedUserIds(candidates, currentAdminId);
  const deletable = candidates.filter(
    (item) => !item.emailVerified && !protectedIds.has(item.id)
  );
  const revokeCredits = candidates.filter(
    (item) => item.emailVerified && !protectedIds.has(item.id)
  );
  const preserved = candidates.filter((item) => protectedIds.has(item.id));

  const domains = [
    ...new Set(candidates.map((item) => item.email.split('@')[1])),
  ]
    .filter(Boolean)
    .sort();

  return { candidates, deletable, revokeCredits, preserved, domains };
}

async function authorize(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return { error: respErr('Unauthorized') };
  if (!(await hasPermission(session.user.id, 'admin.*'))) {
    return { error: respErr('Forbidden') };
  }
  return { userId: session.user.id };
}

async function GET({ request }: { request: Request }) {
  try {
    const access = await authorize(request);
    if (access.error) return access.error;
    const createdAfter = parseCreatedAfter(
      new URL(request.url).searchParams.get('createdAfter')
    );
    const result = await assess(createdAfter, access.userId!);
    return respData({
      suspicious: result.candidates.length,
      deletable: result.deletable.length,
      creditsToRevoke: result.revokeCredits.length,
      preserved: result.preserved.length,
      domains: result.domains,
    });
  } catch (error) {
    return respErr(error instanceof Error ? error.message : 'Preview failed');
  }
}

async function POST({ request }: { request: Request }) {
  try {
    const access = await authorize(request);
    if (access.error) return access.error;
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (body.confirm !== CONFIRM_PHRASE) {
      return respErr('Cleanup confirmation is invalid');
    }
    const createdAfter = parseCreatedAfter(body.createdAfter);
    const result = await assess(createdAfter, access.userId!);

    let revoked = 0;
    for (const item of result.revokeCredits) {
      const deduction = await revokeSignupCreditsForAbuse({
        userId: item.id,
        userEmail: item.email,
      });
      if (deduction.revoked > 0) revoked += 1;
    }

    const deletableIds = result.deletable.map((item) => item.id);
    if (deletableIds.length) {
      await db().delete(user).where(inArray(user.id, deletableIds));
    }

    console.warn('[auth-abuse]', {
      event: 'admin_cleanup',
      adminUserId: access.userId,
      deleted: deletableIds.length,
      revoked,
      preserved: result.preserved.length,
    });
    return respData({
      deleted: deletableIds.length,
      revoked,
      preserved: result.preserved.length,
    });
  } catch (error) {
    return respErr(error instanceof Error ? error.message : 'Cleanup failed');
  }
}

export const Route = createFileRoute('/api/admin/users/abuse-cleanup')({
  server: { handlers: { GET, POST } },
});
