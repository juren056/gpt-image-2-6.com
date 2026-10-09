import { eq, sql } from 'drizzle-orm';

import { db } from '@/core/db';
import { userAccountState } from '@/config/db/schema';

export type AccountAccessStatus = 'active' | 'suspended' | 'banned';

export interface AccountAccessState {
  status: AccountAccessStatus;
  suspendedUntil: Date | null;
  reasonCode: string;
  reason: string;
}

const ACTIVE_STATE: AccountAccessState = {
  status: 'active',
  suspendedUntil: null,
  reasonCode: '',
  reason: '',
};

export async function getAccountAccessState(
  userId: string
): Promise<AccountAccessState> {
  const [state] = await db()
    .select({
      status: userAccountState.status,
      suspendedUntil: userAccountState.suspendedUntil,
      reasonCode: userAccountState.reasonCode,
      reason: userAccountState.reason,
    })
    .from(userAccountState)
    .where(eq(userAccountState.userId, userId))
    .limit(1);

  if (!state) return ACTIVE_STATE;

  if (
    state.status === 'suspended' &&
    state.suspendedUntil &&
    state.suspendedUntil.getTime() <= Date.now()
  ) {
    await db()
      .update(userAccountState)
      .set({
        status: 'active',
        suspendedUntil: null,
        reasonCode: '',
        reason: '',
        version: sql`${userAccountState.version} + 1`,
      })
      .where(eq(userAccountState.userId, userId));
    return ACTIVE_STATE;
  }

  return {
    status:
      state.status === 'banned' || state.status === 'suspended'
        ? state.status
        : 'active',
    suspendedUntil: state.suspendedUntil,
    reasonCode: state.reasonCode,
    reason: state.reason,
  };
}

export async function isAccountAccessAllowed(userId: string) {
  return (await getAccountAccessState(userId)).status === 'active';
}

export async function assertAccountAccessAllowed(userId: string) {
  const state = await getAccountAccessState(userId);
  if (state.status === 'active') return;
  if (state.status === 'banned') {
    throw new Error(
      'This account has been disabled. Contact support to appeal.'
    );
  }
  throw new Error(
    state.suspendedUntil
      ? `This account is suspended until ${state.suspendedUntil.toISOString()}.`
      : 'This account is temporarily suspended. Contact support for details.'
  );
}
