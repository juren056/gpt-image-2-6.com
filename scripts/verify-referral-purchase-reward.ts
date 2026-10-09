import assert from 'node:assert/strict';
import { eq, inArray } from 'drizzle-orm';

import { credit, order, referral, user } from '../src/config/db/schema';
import { db } from '../src/core/db';
import { getUuid } from '../src/lib/hash';
import { rewardPendingReferralAfterFirstPurchase } from '../src/modules/payment/service';

const marker = getUuid();
const referrerId = `verify-referrer-${marker}`;
const referredId = `verify-referred-${marker}`;
const zeroAmountUserId = `verify-zero-${marker}`;
const orderNo = `VERIFY-REFERRAL-${marker}`;
const rollbackMessage = `rollback-${marker}`;
let assertionsCompleted = false;

try {
  await db().transaction(async (tx: any) => {
    await tx.insert(user).values([
      {
        id: referrerId,
        name: 'Referral verifier',
        email: `${referrerId}@example.invalid`,
        emailVerified: true,
      },
      {
        id: referredId,
        name: 'Referred verifier',
        email: `${referredId}@example.invalid`,
        emailVerified: true,
      },
      {
        id: zeroAmountUserId,
        name: 'Zero amount verifier',
        email: `${zeroAmountUserId}@example.invalid`,
        emailVerified: true,
      },
    ]);

    const referralId = `verify-referral-${marker}`;
    const zeroReferralId = `verify-zero-referral-${marker}`;
    await tx.insert(referral).values([
      {
        id: referralId,
        referrerId,
        referredUserId: referredId,
        sourceHash: `source-${marker}`,
        rewardCredits: 10,
        status: 'pending',
      },
      {
        id: zeroReferralId,
        referrerId,
        referredUserId: zeroAmountUserId,
        sourceHash: `zero-source-${marker}`,
        rewardCredits: 10,
        status: 'pending',
      },
    ]);
    await tx.insert(order).values([
      {
        id: `verify-order-${marker}`,
        orderNo,
        userId: referredId,
        userEmail: `${referredId}@example.invalid`,
        status: 'paid',
        amount: 500,
        currency: 'usd',
        paymentProvider: 'verify',
        checkoutInfo: '{}',
      },
      {
        id: `verify-zero-order-${marker}`,
        orderNo: `VERIFY-ZERO-${marker}`,
        userId: zeroAmountUserId,
        userEmail: `${zeroAmountUserId}@example.invalid`,
        status: 'paid',
        amount: 0,
        currency: 'usd',
        paymentProvider: 'verify',
        checkoutInfo: '{}',
      },
    ]);

    await rewardPendingReferralAfterFirstPurchase({
      tx,
      userId: referredId,
      userEmail: `${referredId}@example.invalid`,
      orderNo,
      paidAmount: 500,
    });
    await rewardPendingReferralAfterFirstPurchase({
      tx,
      userId: referredId,
      userEmail: `${referredId}@example.invalid`,
      orderNo,
      paidAmount: 500,
    });
    await rewardPendingReferralAfterFirstPurchase({
      tx,
      userId: zeroAmountUserId,
      userEmail: `${zeroAmountUserId}@example.invalid`,
      orderNo: `VERIFY-ZERO-${marker}`,
      paidAmount: 0,
    });

    const rewards = await tx
      .select()
      .from(credit)
      .where(
        inArray(credit.transactionNo, [
          `referral:${referralId}:referrer`,
          `referral:${referralId}:referred`,
        ])
      );
    assert.equal(rewards.length, 2, 'both accounts should be rewarded once');
    assert.deepEqual(
      rewards.map((item: typeof credit.$inferSelect) => item.credits).sort(),
      [10, 10]
    );

    const [rewarded] = await tx
      .select()
      .from(referral)
      .where(eq(referral.id, referralId));
    const [zeroAmount] = await tx
      .select()
      .from(referral)
      .where(eq(referral.id, zeroReferralId));
    assert.equal(rewarded?.status, 'rewarded');
    assert.ok(rewarded?.rewardedAt);
    assert.equal(zeroAmount?.status, 'pending');

    const positiveOrderNo = `VERIFY-AFTER-ZERO-${marker}`;
    await tx.insert(order).values({
      id: `verify-after-zero-order-${marker}`,
      orderNo: positiveOrderNo,
      userId: zeroAmountUserId,
      userEmail: `${zeroAmountUserId}@example.invalid`,
      status: 'paid',
      amount: 900,
      paymentAmount: 900,
      currency: 'usd',
      paymentProvider: 'verify',
      checkoutInfo: '{}',
    });
    await rewardPendingReferralAfterFirstPurchase({
      tx,
      userId: zeroAmountUserId,
      userEmail: `${zeroAmountUserId}@example.invalid`,
      orderNo: positiveOrderNo,
      paidAmount: 900,
    });
    const zeroThenPaidRewards = await tx
      .select()
      .from(credit)
      .where(
        inArray(credit.transactionNo, [
          `referral:${zeroReferralId}:referrer`,
          `referral:${zeroReferralId}:referred`,
        ])
      );
    assert.equal(zeroThenPaidRewards.length, 2);
    const [zeroThenPaidReferral] = await tx
      .select()
      .from(referral)
      .where(eq(referral.id, zeroReferralId));
    assert.equal(zeroThenPaidReferral?.status, 'rewarded');
    assertionsCompleted = true;
    throw new Error(rollbackMessage);
  });
} catch (error) {
  if (!(error instanceof Error) || error.message !== rollbackMessage)
    throw error;
}

assert.equal(assertionsCompleted, true);
const leaked = await db()
  .select({ id: user.id })
  .from(user)
  .where(inArray(user.id, [referrerId, referredId, zeroAmountUserId]));
assert.equal(leaked.length, 0, 'verification transaction must roll back');
console.log(
  'Referral purchase reward verified: pending before payment, both accounts rewarded once after first paid purchase, zero amount ignored.'
);
