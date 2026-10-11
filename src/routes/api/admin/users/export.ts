import { createFileRoute } from '@tanstack/react-router';
import {
  and,
  asc,
  eq,
  gt,
  inArray,
  isNull,
  like,
  or,
  sum,
  type SQL,
} from 'drizzle-orm';

import { getAuth } from '@/core/auth';
import { db } from '@/core/db';
import { credit, user } from '@/config/db/schema';
import { CreditStatus, CreditTransactionType } from '@/modules/credits/service';
import { hasPermission } from '@/modules/rbac/service';
import { respErr } from '@/lib/resp';

const EXPORT_LIMIT = 10_000;

function csvCell(value: unknown) {
  const raw = value == null ? '' : String(value);
  // Prevent spreadsheet formula injection from user-controlled names/emails.
  const text = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${text.replace(/"/g, '""')}"`;
}

async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized', { status: 401 });
    if (!(await hasPermission(session.user.id, "admin.users.read"))) {
      return respErr('Forbidden', { status: 403 });
    }

    const search = new URL(request.url).searchParams.get('search')?.trim();
    const conditions: SQL[] = [];
    const userId = new URL(request.url).searchParams.get('userId');
    if (userId) conditions.push(eq(user.id, userId));
    if (search) {
      conditions.push(
        or(like(user.email, `%${search}%`), like(user.name, `%${search}%`))!
      );
    }
    const where = conditions.length ? and(...conditions) : undefined;
    const users = await db()
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(where)
      .orderBy(asc(user.createdAt))
      .limit(EXPORT_LIMIT);

    const balances = users.length
      ? await db()
          .select({
            userId: credit.userId,
            total: sum(credit.remainingCredits),
          })
          .from(credit)
          .where(
            and(
              inArray(
                credit.userId,
                users.map((entry: { id: string }) => entry.id)
              ),
              eq(credit.transactionType, CreditTransactionType.GRANT),
              eq(credit.status, CreditStatus.ACTIVE),
              gt(credit.remainingCredits, 0),
              or(isNull(credit.expiresAt), gt(credit.expiresAt, new Date()))
            )
          )
          .groupBy(credit.userId)
      : [];
    const balanceByUser = new Map(
      balances.map((entry: { userId: string; total: string | null }) => [
        entry.userId,
        Number.parseInt(entry.total || '0'),
      ])
    );

    const rows = users.map(
      (entry: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
        createdAt: Date;
      }) => [
        entry.name,
        entry.email,
        entry.emailVerified ? 'Verified' : 'Pending verification',
        balanceByUser.get(entry.id) || 0,
        new Date(entry.createdAt).toISOString(),
      ]
    );
    const csv = [
      ['Name', 'Email', 'Verification', 'Credits', 'Joined'],
      ...rows,
    ]
      .map((row) => row.map(csvCell).join(','))
      .join('\r\n');

    const date = new Date().toISOString().slice(0, 10);
    return new Response(`\uFEFF${csv}`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="users-${date}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    return respErr(error.message || 'Internal error', { status: 500 });
  }
}

export const Route = createFileRoute('/api/admin/users/export')({
  server: { handlers: { GET } },
});
