import { randomBytes } from 'node:crypto';
import { and, count, desc, eq, gt, isNull, or, sum } from 'drizzle-orm';

import { db } from '@/core/db';
import { order, referral, referralCode, user } from '@/config/db/schema';
import { getUuid } from '@/lib/hash';

export const REFERRAL_REWARD_CREDITS = 10;

function makeCode() {
  return randomBytes(6).toString('base64url').toUpperCase();
}

export async function getOrCreateReferralCode(userId: string) {
  const existing = await db()
    .select()
    .from(referralCode)
    .where(eq(referralCode.userId, userId))
    .limit(1);
  if (existing[0]) return existing[0];
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const value = { id: getUuid(), userId, code: makeCode() };
      await db().insert(referralCode).values(value);
      return value;
    } catch {
      const raced = await db()
        .select()
        .from(referralCode)
        .where(eq(referralCode.userId, userId))
        .limit(1);
      if (raced[0]) return raced[0];
    }
  }
  throw new Error('Unable to create referral code');
}

export async function getReferralOverview(userId: string) {
  const code = await getOrCreateReferralCode(userId);
  const [items, totals, pendingTotals] = await Promise.all([
    db()
      .select({
        id: referral.id,
        status: referral.status,
        rewardCredits: referral.rewardCredits,
        createdAt: referral.createdAt,
      })
      .from(referral)
      .where(eq(referral.referrerId, userId))
      .orderBy(desc(referral.createdAt))
      .limit(20),
    db()
      .select({ total: count(), credits: sum(referral.rewardCredits) })
      .from(referral)
      .where(
        and(eq(referral.referrerId, userId), eq(referral.status, 'rewarded'))
      ),
    db()
      .select({ total: count() })
      .from(referral)
      .where(
        and(eq(referral.referrerId, userId), eq(referral.status, 'pending'))
      ),
  ]);
  return {
    code: code.code,
    rewardCredits: REFERRAL_REWARD_CREDITS,
    successfulReferrals: Number(totals[0]?.total || 0),
    pendingReferrals: Number(pendingTotals[0]?.total || 0),
    earnedCredits: Number(totals[0]?.credits || 0),
    items,
  };
}

export async function reserveReferralClaim(params: {
  code: string;
  referredUserId: string;
  sourceHash: string;
}) {
  return db().transaction(async (tx: any) => {
    const [referred] = await tx
      .select()
      .from(user)
      .where(eq(user.id, params.referredUserId))
      .limit(1);
    if (!referred) throw new Error('Account not found');
    if (Date.now() - new Date(referred.createdAt).getTime() > 7 * 86_400_000)
      throw new Error('Referral rewards are for new accounts only');

    const [owner] = await tx
      .select({ userId: referralCode.userId })
      .from(referralCode)
      .where(eq(referralCode.code, params.code.trim().toUpperCase()))
      .limit(1);
    if (!owner) throw new Error('Invalid referral code');
    if (owner.userId === params.referredUserId)
      throw new Error('You cannot refer yourself');

    const [previousPurchase] = await tx
      .select({ id: order.id })
      .from(order)
      .where(
        and(
          eq(order.userId, params.referredUserId),
          eq(order.status, 'paid'),
          or(
            gt(order.paymentAmount, 0),
            and(isNull(order.paymentAmount), gt(order.amount, 0))
          ),
          isNull(order.deletedAt)
        )
      )
      .limit(1);
    if (previousPurchase)
      throw new Error('Referral must be registered before the first purchase');

    const [existing] = await tx
      .select()
      .from(referral)
      .where(eq(referral.referredUserId, params.referredUserId))
      .limit(1);
    if (existing) return existing;

    const [referrer] = await tx
      .select({ ip: user.ip })
      .from(user)
      .where(eq(user.id, owner.userId))
      .limit(1);
    if (referred.ip && referrer?.ip && referred.ip === referrer.ip)
      throw new Error('Referral could not be verified');
    if (params.sourceHash) {
      const [sourceUsage] = await tx
        .select({ total: count() })
        .from(referral)
        .where(
          and(
            eq(referral.sourceHash, params.sourceHash),
            eq(referral.status, 'rewarded')
          )
        );
      if (Number(sourceUsage?.total || 0) >= 2)
        throw new Error('Referral limit reached');
    }

    const value = {
      id: getUuid(),
      referrerId: owner.userId,
      referredUserId: params.referredUserId,
      sourceHash: params.sourceHash,
      rewardCredits: REFERRAL_REWARD_CREDITS,
      status: 'pending',
    };
    await tx.insert(referral).values(value);
    return value;
  });
}
