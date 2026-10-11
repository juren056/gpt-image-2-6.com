import { createFileRoute } from '@tanstack/react-router';
import { and, count, desc, eq, isNull, like, or, type SQL } from 'drizzle-orm';

import { getAuth } from '@/core/auth';
import { db } from '@/core/db';
import { credit, user } from '@/config/db/schema';
import { hasPermission } from '@/modules/rbac/service';
import { respErr, respPage } from '@/lib/resp';

async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const isAdmin = await hasPermission(session.user.id, "admin.credits.read");
    if (!isAdmin) return respErr('Forbidden');

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') || '10'))
    );
    const offset = (page - 1) * pageSize;

    const transactionType = searchParams.get('transactionType');
    const status = searchParams.get('status');

    const search = searchParams.get('search');

    const conditions: SQL[] = [];
    if (transactionType)
      conditions.push(eq(credit.transactionType, transactionType));
    if (status) conditions.push(eq(credit.status, status));
    conditions.push(isNull(credit.deletedAt) as unknown as SQL);
    if (search) {
      conditions.push(
        or(
          like(credit.transactionNo, `%${search}%`),
          like(credit.userEmail, `%${search}%`),
          like(user.email, `%${search}%`)
        )!
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db()
      .select({ count: count() })
      .from(credit)
      .leftJoin(user, eq(user.id, credit.userId))
      .where(where);
    const total = totalResult.count;

    const rows = await db()
      .select({
        id: credit.id,
        userId: credit.userId,
        userEmail: credit.userEmail,
        userTableEmail: user.email,
        transactionNo: credit.transactionNo,
        transactionType: credit.transactionType,
        transactionScene: credit.transactionScene,
        credits: credit.credits,
        remainingCredits: credit.remainingCredits,
        balanceBefore: credit.balanceBefore,
        balanceAfter: credit.balanceAfter,
        description: credit.description,
        expiresAt: credit.expiresAt,
        status: credit.status,
        createdAt: credit.createdAt,
      })
      .from(credit)
      .leftJoin(user, eq(user.id, credit.userId))
      .where(where)
      .orderBy(desc(credit.createdAt))
      .limit(pageSize)
      .offset(offset);

    const credits = rows.map((r: (typeof rows)[number]) => {
      const { userTableEmail, ...rest } = r;
      return {
        ...rest,
        userEmail: rest.userEmail || userTableEmail || null,
        balanceBefore:
          rest.balanceBefore ??
          (rest.transactionType === 'consume'
            ? rest.remainingCredits - rest.credits
            : null),
        balanceAfter:
          rest.balanceAfter ??
          (rest.transactionType === 'consume' ? rest.remainingCredits : null),
      };
    });

    return respPage(credits, total);
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}

export const Route = createFileRoute('/api/admin/credits')({
  server: {
    handlers: { GET },
  },
});
