import { and, eq, gt, inArray, isNotNull, isNull, or } from 'drizzle-orm';

import { db } from '@/core/db';
import { order } from '@/config/db/schema';

/**
 * Live community totals are a paid-customer benefit. Free signup credits do
 * not qualify because access is derived only from a successfully paid order.
 */
export async function canViewCommunityMetrics(userId: string) {
  const [qualifyingOrder] = await db()
    .select({ id: order.id })
    .from(order)
    .where(
      and(
        eq(order.userId, userId),
        inArray(order.status, ['paid', 'partially_refunded']),
        isNotNull(order.paidAt),
        isNull(order.deletedAt),
        or(gt(order.creditsAmount, 0), isNotNull(order.subscriptionNo))
      )
    )
    .limit(1);

  return Boolean(qualifyingOrder);
}
