import { createFileRoute } from '@tanstack/react-router';
import { and, count, desc, eq, gte, like, or, type SQL } from 'drizzle-orm';

import { getAuth } from '@/core/auth';
import { db } from '@/core/db';
import { user, userAccountState, userSafetyState } from '@/config/db/schema';
import { getBalance } from '@/modules/credits/service';
import { hasPermission } from '@/modules/rbac/service';
import { respErr, respPage } from '@/lib/resp';

async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const isAdmin = await hasPermission(session.user.id, 'admin.*');
    if (!isAdmin) return respErr('Forbidden');

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') || '10'))
    );
    const offset = (page - 1) * pageSize;
    const search = searchParams.get('search');
    const userId = searchParams.get('userId');
    const createdAfter = Number(searchParams.get('createdAfter'));

    const conditions: SQL[] = [];
    if (userId) conditions.push(eq(user.id, userId));
    if (Number.isFinite(createdAfter) && createdAfter > 0) {
      conditions.push(gte(user.createdAt, new Date(createdAfter)));
    }
    if (search) {
      conditions.push(
        or(like(user.email, `%${search}%`), like(user.name, `%${search}%`))!
      );
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db()
      .select({ count: count() })
      .from(user)
      .where(where);
    const total = totalResult.count;

    const users = await db()
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        accountStatus: userAccountState.status,
        accountReasonCode: userAccountState.reasonCode,
        accountSuspendedUntil: userAccountState.suspendedUntil,
        accountVersion: userAccountState.version,
        generationStatus: userSafetyState.status,
        generationRestrictedUntil: userSafetyState.restrictedUntil,
        strikePoints: userSafetyState.strikePoints,
        warningCount: userSafetyState.warningCount,
      })
      .from(user)
      .leftJoin(userAccountState, eq(userAccountState.userId, user.id))
      .leftJoin(userSafetyState, eq(userSafetyState.userId, user.id))
      .where(where)
      .orderBy(desc(user.createdAt))
      .limit(pageSize)
      .offset(offset);

    const withCredits = await Promise.all(
      users.map(async (u: (typeof users)[number]) => ({
        ...u,
        accountStatus: u.accountStatus ?? 'active',
        accountReasonCode: u.accountReasonCode ?? '',
        accountSuspendedUntil: u.accountSuspendedUntil ?? null,
        accountVersion: u.accountVersion ?? 0,
        generationStatus: u.generationStatus ?? 'active',
        generationRestrictedUntil: u.generationRestrictedUntil ?? null,
        strikePoints: u.strikePoints ?? 0,
        warningCount: u.warningCount ?? 0,
        credits: await getBalance(u.id),
      }))
    );

    return respPage(withCredits, total);
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}

export const Route = createFileRoute('/api/admin/users/')({
  server: {
    handlers: { GET },
  },
});
