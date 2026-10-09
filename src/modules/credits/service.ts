import {
  and,
  asc,
  desc,
  eq,
  gt,
  isNull,
  like,
  lte,
  or,
  sql,
  sum,
} from 'drizzle-orm';

import { db } from '@/core/db';
import { credit, user } from '@/config/db/schema';
import { getSnowId, getUuid } from '@/lib/hash';

// --- Enums ---

export enum CreditStatus {
  ACTIVE = 'active',
  REVERSED = 'reversed',
  EXPIRED = 'expired',
  DELETED = 'deleted',
}

export enum CreditTransactionType {
  GRANT = 'grant',
  CONSUME = 'consume',
}

export enum CreditTransactionScene {
  PAYMENT = 'payment',
  SUBSCRIPTION = 'subscription',
  RENEWAL = 'renewal',
  SIGNUP = 'signup',
  GIFT = 'gift',
  REWARD = 'reward',
  REFUND = 'refund',
  EXPIRATION = 'expiration',
}

type NewCredit = typeof credit.$inferInsert;

async function lockCreditAccount(executor: any, userId: string) {
  const query = executor
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (typeof query.for === 'function') {
    await query.for('update');
  } else {
    await query;
  }
}

function forUpdate(query: any) {
  return typeof query.for === 'function' ? query.for('update') : query;
}

export function calculateExpirationBalanceSnapshots(
  spendableBalance: number,
  amounts: number[]
) {
  let runningBalance =
    spendableBalance +
    amounts.reduce((total, amount) => total + Math.max(0, amount), 0);

  return amounts.map((rawAmount) => {
    const amount = Math.max(0, rawAmount);
    const balanceBefore = runningBalance;
    const balanceAfter = balanceBefore - amount;
    runningBalance = balanceAfter;
    return { amount, balanceBefore, balanceAfter };
  });
}

// --- Expiration ---

export function calculateCreditExpirationTime(params: {
  creditsValidDays: number;
  currentPeriodEnd?: Date;
}): Date | null {
  const { creditsValidDays, currentPeriodEnd } = params;

  // Subscription credits always follow the paid billing period, even when a
  // separate valid-day value is not configured on the catalog product.
  if (currentPeriodEnd) {
    return new Date(currentPeriodEnd.getTime());
  }

  if (!creditsValidDays || creditsValidDays <= 0) {
    return null; // never expires
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + creditsValidDays);
  return expiresAt;
}

function validCreditConditions(userId: string, now = new Date()) {
  return and(
    eq(credit.userId, userId),
    eq(credit.transactionType, CreditTransactionType.GRANT),
    eq(credit.status, CreditStatus.ACTIVE),
    gt(credit.remainingCredits, 0),
    or(isNull(credit.expiresAt), gt(credit.expiresAt, now))
  );
}

async function getBalanceWithExecutor(
  executor: any,
  userId: string,
  now = new Date()
): Promise<number> {
  const [result] = await executor
    .select({ total: sum(credit.remainingCredits) })
    .from(credit)
    .where(validCreditConditions(userId, now));

  return Number.parseInt(String(result?.total ?? '0'), 10) || 0;
}

async function settleExpiredCreditsWithExecutor(
  executor: any,
  userId: string,
  now = new Date()
) {
  const expiredQuery = executor
    .select()
    .from(credit)
    .where(
      and(
        eq(credit.userId, userId),
        eq(credit.transactionType, CreditTransactionType.GRANT),
        eq(credit.status, CreditStatus.ACTIVE),
        gt(credit.remainingCredits, 0),
        lte(credit.expiresAt, now)
      )
    )
    .orderBy(asc(credit.expiresAt), asc(credit.createdAt));
  const expiredGrants = await forUpdate(expiredQuery);

  if (!expiredGrants.length) return;

  const spendableBalance = await getBalanceWithExecutor(executor, userId, now);
  const snapshots = calculateExpirationBalanceSnapshots(
    spendableBalance,
    expiredGrants.map((item: NewCredit) => item.remainingCredits || 0)
  );

  for (const [index, item] of expiredGrants.entries()) {
    const { amount, balanceBefore, balanceAfter } = snapshots[index];
    if (!amount) continue;

    await executor
      .update(credit)
      .set({
        remainingCredits: 0,
        status: CreditStatus.EXPIRED,
      })
      .where(eq(credit.id, item.id));
    await executor.insert(credit).values({
      id: getUuid(),
      userId,
      userEmail: item.userEmail || '',
      orderNo: item.orderNo || '',
      subscriptionNo: item.subscriptionNo || '',
      transactionNo: `expire:${item.transactionNo}`,
      transactionType: CreditTransactionType.CONSUME,
      transactionScene: CreditTransactionScene.EXPIRATION,
      credits: -amount,
      remainingCredits: balanceAfter,
      balanceBefore,
      balanceAfter,
      status: CreditStatus.ACTIVE,
      description: 'Credits expired',
      metadata: JSON.stringify({ expiredCreditId: item.id }),
    });
  }
}

// --- Balance ---

export async function getBalance(userId: string): Promise<number> {
  return db().transaction(async (tx: any) => {
    await lockCreditAccount(tx, userId);
    await settleExpiredCreditsWithExecutor(tx, userId);
    return getBalanceWithExecutor(tx, userId);
  });
}

export type CreditBalanceBreakdown = {
  balance: number;
  subscriptionCredits: number;
  purchasedCredits: number;
  promotionalCredits: number;
  nextExpiresAt: Date | null;
};

/** Return a user-facing balance split without changing the credit ledger. */
export async function getBalanceBreakdown(
  userId: string
): Promise<CreditBalanceBreakdown> {
  const grants = await db().transaction(async (tx: any) => {
    await lockCreditAccount(tx, userId);
    await settleExpiredCreditsWithExecutor(tx, userId);
    return tx
      .select({
        transactionScene: credit.transactionScene,
        remainingCredits: credit.remainingCredits,
        expiresAt: credit.expiresAt,
      })
      .from(credit)
      .where(validCreditConditions(userId));
  });

  let subscriptionCredits = 0;
  let purchasedCredits = 0;
  let promotionalCredits = 0;
  let nextExpiresAt: Date | null = null;

  for (const item of grants) {
    const amount = Math.max(0, item.remainingCredits || 0);
    if (
      item.transactionScene === CreditTransactionScene.SUBSCRIPTION ||
      item.transactionScene === CreditTransactionScene.RENEWAL
    ) {
      subscriptionCredits += amount;
    } else if (item.transactionScene === CreditTransactionScene.PAYMENT) {
      purchasedCredits += amount;
    } else {
      promotionalCredits += amount;
    }

    if (
      item.expiresAt &&
      (!nextExpiresAt || item.expiresAt.getTime() < nextExpiresAt.getTime())
    ) {
      nextExpiresAt = item.expiresAt;
    }
  }

  return {
    balance: subscriptionCredits + purchasedCredits + promotionalCredits,
    subscriptionCredits,
    purchasedCredits,
    promotionalCredits,
    nextExpiresAt,
  };
}

// --- Grant ---

export async function grant(params: {
  userId: string;
  userEmail?: string;
  transactionNo?: string;
  credits: number;
  description?: string;
  orderNo?: string;
  subscriptionNo?: string;
  scene?: string;
  expiresAt?: Date | null;
  metadata?: string;
  tx?: any;
}) {
  const amount = Math.floor(params.credits);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Credits to grant must be a positive integer');
  }

  const execute = async (executor: any) => {
    await lockCreditAccount(executor, params.userId);
    await settleExpiredCreditsWithExecutor(executor, params.userId);
    const balanceBefore = await getBalanceWithExecutor(executor, params.userId);
    const newCredit: NewCredit = {
      id: getUuid(),
      userId: params.userId,
      userEmail: params.userEmail || '',
      transactionNo: params.transactionNo || getSnowId(),
      transactionType: CreditTransactionType.GRANT,
      transactionScene: params.scene || CreditTransactionScene.GIFT,
      credits: amount,
      remainingCredits: amount,
      balanceBefore,
      balanceAfter: balanceBefore + amount,
      status: CreditStatus.ACTIVE,
      description: params.description || 'Grant credit',
      orderNo: params.orderNo || '',
      subscriptionNo: params.subscriptionNo || '',
      expiresAt: params.expiresAt !== undefined ? params.expiresAt : null,
      metadata: params.metadata || '',
    };

    await executor.insert(credit).values(newCredit);
    return newCredit;
  };

  if (params.tx) return execute(params.tx);
  return db().transaction(execute);
}

/** Idempotent grant for retries from webhooks and growth flows. */
export async function grantOnce(
  params: Parameters<typeof grant>[0] & { transactionNo: string }
) {
  const [existing] = await db()
    .select()
    .from(credit)
    .where(eq(credit.transactionNo, params.transactionNo))
    .limit(1);
  if (existing) return existing;
  try {
    return await grant(params);
  } catch (error) {
    const [raced] = await db()
      .select()
      .from(credit)
      .where(eq(credit.transactionNo, params.transactionNo))
      .limit(1);
    if (raced) return raced;
    throw error;
  }
}

const DAILY_CHECK_IN_REWARDS = [3, 4, 4, 5, 5, 6, 6] as const;

function checkInDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function checkInTransactionNo(userId: string, dateKey: string) {
  return `checkin:${userId}:${dateKey}`;
}

export type DailyCheckInState = {
  claimedToday: boolean;
  streak: number;
  cycleDay: number;
  nextReward: number;
  cycleTotal: number;
  cycleRewards: number[];
  history: Array<{ date: string; reward: number }>;
};

type DailyCheckInLedgerRow = Pick<
  typeof credit.$inferSelect,
  'transactionNo' | 'credits' | 'metadata'
>;

/** Read the current UTC-based daily reward streak from the credit ledger. */
export async function getDailyCheckInState(
  userId: string,
  now = new Date()
): Promise<DailyCheckInState> {
  const rows = (await db()
    .select({
      transactionNo: credit.transactionNo,
      credits: credit.credits,
      metadata: credit.metadata,
    })
    .from(credit)
    .where(
      and(
        eq(credit.userId, userId),
        eq(credit.transactionType, CreditTransactionType.GRANT),
        eq(credit.transactionScene, CreditTransactionScene.REWARD),
        like(credit.transactionNo, `checkin:${userId}:%`)
      )
    )
    .orderBy(desc(credit.createdAt))
    .limit(14)) as DailyCheckInLedgerRow[];

  const claimedDates = new Set(
    rows
      .map((item) => item.transactionNo.split(':').at(-1) || '')
      .filter(Boolean)
  );
  const todayKey = checkInDateKey(now);
  const claimedToday = claimedDates.has(todayKey);
  let streak = 0;
  const cursor = new Date(now);
  cursor.setUTCHours(0, 0, 0, 0);
  if (!claimedToday) cursor.setUTCDate(cursor.getUTCDate() - 1);

  while (streak < 14 && claimedDates.has(checkInDateKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const rewardIndex = claimedToday
    ? Math.max(0, (streak - 1) % DAILY_CHECK_IN_REWARDS.length)
    : streak % DAILY_CHECK_IN_REWARDS.length;
  const activeCycleDay = claimedToday
    ? ((Math.max(streak, 1) - 1) % DAILY_CHECK_IN_REWARDS.length) + 1
    : streak % DAILY_CHECK_IN_REWARDS.length;
  const latestRecordedCycleDay = (() => {
    try {
      const value = Number(JSON.parse(rows[0]?.metadata || '{}')?.streakDay);
      return Number.isInteger(value) && value >= 1 && value <= 7 ? value : 0;
    } catch {
      return 0;
    }
  })();

  // Keep the most recently completed cycle days visible after a missed day.
  // The consecutive streak may correctly reset to zero, but hiding every
  // previously checked day makes the progress row contradict the ledger and
  // the history shown immediately below it. A new claim starts at day one and
  // replaces this retained display progress through its stored streakDay.
  const cycleDay = activeCycleDay || latestRecordedCycleDay;

  return {
    claimedToday,
    streak,
    cycleDay,
    nextReward: DAILY_CHECK_IN_REWARDS[rewardIndex],
    cycleTotal: DAILY_CHECK_IN_REWARDS.reduce(
      (total, value) => total + value,
      0
    ),
    cycleRewards: [...DAILY_CHECK_IN_REWARDS],
    history: rows.map((item) => ({
      date: item.transactionNo.split(':').at(-1) || '',
      reward: item.credits,
    })),
  };
}

/** Claim one idempotent daily reward. A full seven-day cycle grants 33 credits. */
export async function claimDailyCheckIn(params: {
  userId: string;
  userEmail?: string;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const before = await getDailyCheckInState(params.userId, now);
  if (before.claimedToday) return { claimed: false, reward: 0, ...before };

  const reward = before.nextReward;
  const expiresAt = new Date(now.getTime() + 30 * 86_400_000);
  await grantOnce({
    userId: params.userId,
    userEmail: params.userEmail,
    transactionNo: checkInTransactionNo(params.userId, checkInDateKey(now)),
    credits: reward,
    scene: CreditTransactionScene.REWARD,
    description: 'Daily check-in reward',
    expiresAt,
    metadata: JSON.stringify({ streakDay: (before.streak % 7) + 1 }),
  });

  const after = await getDailyCheckInState(params.userId, now);
  return { claimed: true, reward, ...after };
}

// --- Consume (FIFO with batching) ---

export async function consume(params: {
  userId: string;
  userEmail?: string;
  credits: number;
  scene?: string;
  description?: string;
  metadata?: string;
  tx?: any;
}): Promise<{ success: boolean; consumedCredit?: any }> {
  const {
    userId,
    userEmail,
    credits: requestedAmount,
    scene,
    description,
    metadata,
    tx,
  } = params;
  const amount = Math.floor(requestedAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Credits to consume must be a positive integer');
  }
  const now = new Date();

  const execute = async (tx: any) => {
    await lockCreditAccount(tx, userId);
    await settleExpiredCreditsWithExecutor(tx, userId, now);
    // 1. Check balance
    const balanceBefore = await getBalanceWithExecutor(tx, userId, now);

    if (balanceBefore < amount) {
      return { success: false };
    }

    // 2. FIFO consumption with batching
    let remainingToConsume = amount;
    const batchSize = 1000;
    const maxBatches = 10;
    let batchNo = 0;
    const consumedItems: any[] = [];

    while (remainingToConsume > 0 && batchNo < maxBatches) {
      const batchQuery = tx
        .select()
        .from(credit)
        .where(
          and(
            eq(credit.userId, userId),
            eq(credit.transactionType, CreditTransactionType.GRANT),
            eq(credit.status, CreditStatus.ACTIVE),
            gt(credit.remainingCredits, 0),
            or(isNull(credit.expiresAt), gt(credit.expiresAt, now))
          )
        )
        // Expiring grants are consumed first. Never-expiring grants sort last.
        .orderBy(
          sql`${credit.expiresAt} is null`,
          asc(credit.expiresAt),
          asc(credit.createdAt)
        )
        .limit(batchSize);
      const batchCredits = await forUpdate(batchQuery);

      if (!batchCredits || batchCredits.length === 0) break;

      for (const item of batchCredits) {
        if (remainingToConsume <= 0) break;
        const toConsume = Math.min(remainingToConsume, item.remainingCredits);

        await tx
          .update(credit)
          .set({ remainingCredits: item.remainingCredits - toConsume })
          .where(eq(credit.id, item.id));

        consumedItems.push({
          creditId: item.id,
          transactionNo: item.transactionNo,
          creditsConsumed: toConsume,
          creditsBefore: item.remainingCredits,
          creditsAfter: item.remainingCredits - toConsume,
        });

        remainingToConsume -= toConsume;
      }

      batchNo++;
    }

    if (remainingToConsume > 0) {
      throw new Error('Failed to consume the full credit amount');
    }

    // Snapshot the user's total spendable balance after every source grant has
    // been updated. Keeping this query in the same transaction makes the
    // history row match the balance users actually had after this operation.
    const balanceAfter = await getBalanceWithExecutor(tx, userId, now);

    // 3. Create consumption record
    const consumedCredit: NewCredit = {
      id: getUuid(),
      userId,
      userEmail: userEmail || '',
      transactionNo: getSnowId(),
      transactionType: CreditTransactionType.CONSUME,
      transactionScene: scene || '',
      status: CreditStatus.ACTIVE,
      description: description || '',
      credits: -amount,
      remainingCredits: balanceAfter,
      balanceBefore,
      balanceAfter,
      consumedDetail: JSON.stringify(consumedItems),
      metadata: metadata || '',
    };
    await tx.insert(credit).values(consumedCredit);

    return { success: true, consumedCredit };
  };

  if (tx) return execute(tx);
  return db().transaction(execute);
}

// --- Revoke (restore credits from a consumed record) ---

export async function revoke(consumeCreditId: string, tx?: any) {
  const execute = async (executor: any) => {
    const consumeQuery = executor
      .select()
      .from(credit)
      .where(
        and(
          eq(credit.id, consumeCreditId),
          eq(credit.transactionType, CreditTransactionType.CONSUME),
          eq(credit.status, CreditStatus.ACTIVE)
        )
      )
      .limit(1);
    const [consumeRecord] = await forUpdate(consumeQuery);

    if (!consumeRecord || !consumeRecord.consumedDetail) {
      return { restored: 0 };
    }
    await lockCreditAccount(executor, consumeRecord.userId);

    const items = JSON.parse(consumeRecord.consumedDetail) as Array<{
      creditId: string;
      creditsConsumed: number;
    }>;

    // Atomic increment per source grant — no read-modify-write race.
    const now = new Date();
    const replacementExpiry = new Date(now);
    replacementExpiry.setDate(replacementExpiry.getDate() + 7);

    let restored = 0;

    for (const item of items) {
      const sourceQuery = executor
        .select()
        .from(credit)
        .where(eq(credit.id, item.creditId))
        .limit(1);
      const [source] = await forUpdate(sourceQuery);
      if (!source) continue;

      const restoredAmount = Math.max(0, Math.floor(item.creditsConsumed));
      if (!restoredAmount) continue;

      const expiresAt =
        source.expiresAt && new Date(source.expiresAt) <= now
          ? replacementExpiry
          : source.expiresAt;
      const balanceBefore = await getBalanceWithExecutor(
        executor,
        consumeRecord.userId,
        now
      );

      // A restoration is a new immutable lot. Mutating the original grant
      // would rewrite history and make its old batch balance misleading.
      await executor.insert(credit).values({
        id: getUuid(),
        userId: consumeRecord.userId,
        userEmail: consumeRecord.userEmail || source.userEmail || '',
        orderNo: source.orderNo || '',
        subscriptionNo: source.subscriptionNo || '',
        transactionNo: `restore:${consumeRecord.transactionNo}:${source.id}`,
        transactionType: CreditTransactionType.GRANT,
        transactionScene:
          source.transactionScene || CreditTransactionScene.REFUND,
        credits: restoredAmount,
        remainingCredits: restoredAmount,
        balanceBefore,
        balanceAfter: balanceBefore + restoredAmount,
        status: CreditStatus.ACTIVE,
        description: 'Credits restored after failed task',
        expiresAt,
        metadata: JSON.stringify({
          restoredFromConsumeId: consumeRecord.id,
          restoredFromCreditId: source.id,
        }),
      });
      restored += restoredAmount;
    }

    const expectedRestoration = Math.abs(consumeRecord.credits);
    if (restored !== expectedRestoration) {
      throw new Error(
        `Credit restoration mismatch: expected ${expectedRestoration}, restored ${restored}`
      );
    }

    // Preserve the debit for auditing, but make its reversal explicit.
    await executor
      .update(credit)
      .set({ status: CreditStatus.REVERSED })
      .where(eq(credit.id, consumeCreditId));

    return { restored };
  };

  if (tx) return execute(tx);
  return db().transaction(execute);
}

/**
 * Remove unused credits that came from a specific paid order. This is used for
 * refunds and disputes so unrelated signup gifts or top-ups are never touched.
 */
export async function revokeByOrder(params: {
  orderNo: string;
  credits: number;
  scene: 'refund' | 'dispute';
  description: string;
}) {
  const amount = Math.max(0, Math.floor(params.credits));
  if (!amount) return { revoked: 0, shortfall: 0 };

  return db().transaction(async (tx: any) => {
    const now = new Date();
    const [owner] = await tx
      .select({ userId: credit.userId })
      .from(credit)
      .where(
        and(
          eq(credit.orderNo, params.orderNo),
          eq(credit.transactionType, CreditTransactionType.GRANT),
          eq(credit.status, CreditStatus.ACTIVE),
          gt(credit.remainingCredits, 0),
          or(isNull(credit.expiresAt), gt(credit.expiresAt, now))
        )
      )
      .limit(1);
    if (!owner) return { revoked: 0, shortfall: amount };

    await lockCreditAccount(tx, owner.userId);

    const grantsQuery = tx
      .select()
      .from(credit)
      .where(
        and(
          eq(credit.orderNo, params.orderNo),
          eq(credit.transactionType, CreditTransactionType.GRANT),
          eq(credit.status, CreditStatus.ACTIVE),
          gt(credit.remainingCredits, 0),
          or(isNull(credit.expiresAt), gt(credit.expiresAt, now))
        )
      )
      .orderBy(asc(credit.createdAt));
    const grants = await forUpdate(grantsQuery);

    let remaining = amount;
    const consumedItems: any[] = [];
    for (const item of grants) {
      if (remaining <= 0) break;
      const deducted = Math.min(remaining, item.remainingCredits);
      await tx
        .update(credit)
        .set({ remainingCredits: item.remainingCredits - deducted })
        .where(eq(credit.id, item.id));
      consumedItems.push({
        creditId: item.id,
        transactionNo: item.transactionNo,
        creditsConsumed: deducted,
        creditsBefore: item.remainingCredits,
        creditsAfter: item.remainingCredits - deducted,
      });
      remaining -= deducted;
    }

    const revoked = amount - remaining;
    if (revoked > 0) {
      const balanceAfter = await getBalanceWithExecutor(tx, grants[0].userId);
      await tx.insert(credit).values({
        id: getUuid(),
        userId: grants[0].userId,
        userEmail: grants[0].userEmail || '',
        orderNo: params.orderNo,
        transactionNo: getSnowId(),
        transactionType: CreditTransactionType.CONSUME,
        transactionScene: params.scene,
        credits: -revoked,
        remainingCredits: balanceAfter,
        balanceBefore: balanceAfter + revoked,
        balanceAfter,
        status: CreditStatus.ACTIVE,
        description: params.description,
        consumedDetail: JSON.stringify(consumedItems),
      });
    }

    return { revoked, shortfall: remaining };
  });
}

/** Remove only unused welcome credits from an abusive signup. */
export async function revokeSignupCreditsForAbuse(params: {
  userId: string;
  userEmail?: string;
}) {
  return db().transaction(async (tx: any) => {
    const now = new Date();
    await lockCreditAccount(tx, params.userId);

    const grantsQuery = tx
      .select()
      .from(credit)
      .where(
        and(
          eq(credit.userId, params.userId),
          eq(credit.transactionType, CreditTransactionType.GRANT),
          eq(credit.transactionScene, CreditTransactionScene.SIGNUP),
          eq(credit.status, CreditStatus.ACTIVE),
          gt(credit.remainingCredits, 0),
          or(isNull(credit.expiresAt), gt(credit.expiresAt, now))
        )
      )
      .orderBy(asc(credit.createdAt));
    const grants = await forUpdate(grantsQuery);
    if (!grants.length) return { revoked: 0 };

    const balanceBefore = await getBalanceWithExecutor(tx, params.userId, now);
    const consumedItems = [];
    let revoked = 0;
    for (const item of grants) {
      const deducted = Math.max(0, item.remainingCredits);
      if (!deducted) continue;
      await tx
        .update(credit)
        .set({ remainingCredits: 0 })
        .where(eq(credit.id, item.id));
      consumedItems.push({
        creditId: item.id,
        transactionNo: item.transactionNo,
        creditsConsumed: deducted,
        creditsBefore: item.remainingCredits,
        creditsAfter: 0,
      });
      revoked += deducted;
    }

    if (revoked > 0) {
      const balanceAfter = await getBalanceWithExecutor(tx, params.userId, now);
      await tx.insert(credit).values({
        id: getUuid(),
        userId: params.userId,
        userEmail: params.userEmail || grants[0].userEmail || '',
        transactionNo: getSnowId(),
        transactionType: CreditTransactionType.CONSUME,
        transactionScene: 'admin_deduct',
        credits: -revoked,
        remainingCredits: balanceAfter,
        balanceBefore,
        balanceAfter,
        status: CreditStatus.ACTIVE,
        description: 'Disposable-email signup abuse cleanup',
        consumedDetail: JSON.stringify(consumedItems),
      });
    }

    return { revoked };
  });
}

/** Restore a temporary dispute deduction when Stripe closes the dispute as won. */
export async function restoreOrderDisputeCredits(orderNo: string) {
  const rows = await db()
    .select({ id: credit.id })
    .from(credit)
    .where(
      and(
        eq(credit.orderNo, orderNo),
        eq(credit.transactionType, CreditTransactionType.CONSUME),
        eq(credit.transactionScene, 'dispute'),
        eq(credit.status, CreditStatus.ACTIVE)
      )
    );

  for (const row of rows) await revoke(row.id);
}

// --- Auto-grant for new user ---

export async function grantForNewUser(params: {
  userId: string;
  userEmail?: string;
  configs: Record<string, string>;
}) {
  const { userId, userEmail, configs } = params;

  if (configs.initial_credits_enabled !== 'true') return;

  const credits = parseInt(configs.initial_credits_amount) || 0;
  if (credits <= 0) return;

  const validDays = parseInt(configs.initial_credits_valid_days) || 0;
  const description = configs.initial_credits_description || 'Initial credits';
  const transactionNo = `signup:${userId}`;

  // The email-verification hook may be retried. Keep the welcome grant
  // idempotent, and recognize grants created by the older create-user hook so
  // existing users are not credited twice after this upgrade.
  const [existingGrant] = await db()
    .select()
    .from(credit)
    .where(
      and(
        eq(credit.userId, userId),
        eq(credit.transactionType, CreditTransactionType.GRANT),
        or(
          eq(credit.transactionNo, transactionNo),
          and(
            eq(credit.transactionScene, CreditTransactionScene.GIFT),
            eq(credit.credits, credits),
            eq(credit.description, description)
          )
        )
      )
    )
    .limit(1);
  if (existingGrant) return existingGrant;

  const expiresAt = calculateCreditExpirationTime({
    creditsValidDays: validDays,
  });

  try {
    return await grant({
      userId,
      userEmail,
      transactionNo,
      credits,
      description,
      scene: CreditTransactionScene.SIGNUP,
      expiresAt,
    });
  } catch (error) {
    // A concurrent verification request can race the initial lookup. The
    // unique transaction number makes the database the final idempotency gate.
    const [concurrentGrant] = await db()
      .select()
      .from(credit)
      .where(eq(credit.transactionNo, transactionNo))
      .limit(1);
    if (concurrentGrant) return concurrentGrant;
    throw error;
  }
}

// --- History ---

export async function getHistory(userId: string, limit = 50) {
  return db()
    .select()
    .from(credit)
    .where(and(eq(credit.userId, userId), isNull(credit.deletedAt)))
    .orderBy(desc(credit.createdAt))
    .limit(limit);
}
