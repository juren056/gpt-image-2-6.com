import { and, count, desc, eq, inArray, isNull, like, lte } from 'drizzle-orm';

import { db } from '@/core/db';
import { subscription } from '@/config/db/schema';
import { getSnowId, getUuid } from '@/lib/hash';

export enum SubscriptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PENDING_CANCEL = 'pending_cancel',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  EXPIRED = 'expired',
  PAUSED = 'paused',
}

export const PREPAID_SUBSCRIPTION_PREFIX = 'prepaid_';

export type SubscriptionRenewalMode = 'auto' | 'prepaid';

export function isPrepaidSubscriptionId(
  subscriptionId?: string | null
): boolean {
  return Boolean(subscriptionId?.startsWith(PREPAID_SUBSCRIPTION_PREFIX));
}

export function getSubscriptionRenewalMode(
  subscriptionId?: string | null
): SubscriptionRenewalMode {
  return isPrepaidSubscriptionId(subscriptionId) ? 'prepaid' : 'auto';
}

/** Add calendar months without turning January 31 into a March date. */
export function addCalendarMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const originalDay = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();
  result.setUTCDate(Math.min(originalDay, lastDay));
  return result;
}

export async function expirePrepaidSubscriptions(userId?: string) {
  const now = new Date();
  await db()
    .update(subscription)
    .set({ status: SubscriptionStatus.EXPIRED })
    .where(
      and(
        userId ? eq(subscription.userId, userId) : undefined,
        like(subscription.subscriptionId, `${PREPAID_SUBSCRIPTION_PREFIX}%`),
        inArray(subscription.status, [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.TRIALING,
        ]),
        lte(subscription.currentPeriodEnd, now),
        isNull(subscription.deletedAt)
      )
    );
}

function withRenewalMode<T extends { subscriptionId?: string | null }>(
  value: T
) {
  return {
    ...value,
    renewalMode: getSubscriptionRenewalMode(value.subscriptionId),
  };
}

export type NewSubscription = typeof subscription.$inferInsert;
export type UpdateSubscription = Partial<
  Omit<NewSubscription, 'id' | 'subscriptionNo' | 'createdAt'>
>;

export async function createSubscription(data: NewSubscription) {
  const [result] = await db().insert(subscription).values(data).returning();
  return result;
}

export async function updateBySubscriptionNo(
  subscriptionNo: string,
  data: UpdateSubscription
) {
  const [result] = await db()
    .update(subscription)
    .set(data)
    .where(eq(subscription.subscriptionNo, subscriptionNo))
    .returning();
  return result;
}

export async function findBySubscriptionNo(subscriptionNo: string) {
  const [result] = await db()
    .select()
    .from(subscription)
    .where(eq(subscription.subscriptionNo, subscriptionNo));
  return result;
}

export async function findByProviderSubscriptionId(params: {
  provider: string;
  subscriptionId: string;
}) {
  const [result] = await db()
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.paymentProvider, params.provider),
        eq(subscription.subscriptionId, params.subscriptionId)
      )
    );
  return result;
}

export async function getCurrentSubscription(userId: string) {
  await expirePrepaidSubscriptions(userId);
  const [result] = await db()
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.userId, userId),
        inArray(subscription.status, [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.PENDING_CANCEL,
          SubscriptionStatus.TRIALING,
          SubscriptionStatus.PAST_DUE,
          SubscriptionStatus.UNPAID,
          SubscriptionStatus.INCOMPLETE,
        ]),
        isNull(subscription.deletedAt)
      )
    )
    .orderBy(desc(subscription.createdAt))
    .limit(1);
  return result ? withRenewalMode(result) : undefined;
}

export async function getSubscriptions(params: {
  userId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { userId, status, page = 1, limit = 30 } = params;
  await expirePrepaidSubscriptions(userId);
  const rows = await db()
    .select()
    .from(subscription)
    .where(
      and(
        userId ? eq(subscription.userId, userId) : undefined,
        status ? eq(subscription.status, status) : undefined
      )
    )
    .orderBy(desc(subscription.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
  return rows.map(withRenewalMode);
}
