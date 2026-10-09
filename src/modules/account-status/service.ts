import { and, desc, eq, gt, inArray, isNull, or } from 'drizzle-orm';

import { ROLES } from '@/core/auth/rbac';
import { db } from '@/core/db';
import {
  apikey,
  role,
  session,
  user,
  userAccountState,
  userRole,
  userSafetyState,
  userStatusAudit,
} from '@/config/db/schema';
import { getUuid } from '@/lib/hash';

export type AccountStatus = 'active' | 'suspended' | 'banned';
export type GenerationStatus =
  | 'active'
  | 'warned'
  | 'restricted'
  | 'suspended'
  | 'banned';
export type StatusScope = 'account' | 'generation' | 'both';

export interface ChangeUserStatusInput {
  actorUserId: string;
  userIds: string[];
  scope: StatusScope;
  accountStatus?: AccountStatus;
  generationStatus?: GenerationStatus;
  reasonCode: string;
  reason: string;
  effectiveUntil?: Date | null;
  requestId?: string;
  expectedVersion?: number;
}

function requiresUntil(status?: AccountStatus | GenerationStatus) {
  return status === 'suspended' || status === 'restricted';
}

async function getRoleNames(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, string[]>();
  const now = new Date();
  const rows = await db()
    .select({ userId: userRole.userId, roleName: role.name })
    .from(userRole)
    .innerJoin(role, eq(userRole.roleId, role.id))
    .where(
      and(
        inArray(userRole.userId, userIds),
        eq(role.status, 'active'),
        or(isNull(userRole.expiresAt), gt(userRole.expiresAt, now))
      )
    );
  const result = new Map<string, string[]>();
  for (const row of rows) {
    result.set(row.userId, [...(result.get(row.userId) ?? []), row.roleName]);
  }
  return result;
}

export async function changeUserStatuses(input: ChangeUserStatusInput) {
  const userIds = [...new Set(input.userIds)].filter(Boolean);
  if (userIds.length === 0 || userIds.length > 100) {
    throw new Error('Select between 1 and 100 users.');
  }
  if (input.reasonCode.trim().length < 2) {
    throw new Error('A reason code is required.');
  }
  if (input.reason.trim().length < 8) {
    throw new Error('Add a clear reason of at least 8 characters.');
  }
  if (userIds.includes(input.actorUserId)) {
    throw new Error('You cannot suspend or ban your own account.');
  }
  if (
    (input.scope === 'account' || input.scope === 'both') &&
    !input.accountStatus
  ) {
    throw new Error('Choose an account status.');
  }
  if (
    (input.scope === 'generation' || input.scope === 'both') &&
    !input.generationStatus
  ) {
    throw new Error('Choose a generation status.');
  }
  if (
    (requiresUntil(input.accountStatus) ||
      requiresUntil(input.generationStatus)) &&
    (!input.effectiveUntil || input.effectiveUntil.getTime() <= Date.now())
  ) {
    throw new Error('Temporary restrictions require a future end time.');
  }

  const users = await db()
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(inArray(user.id, userIds));
  if (users.length !== userIds.length)
    throw new Error('One or more users no longer exist.');

  const roleNames = await getRoleNames([...userIds, input.actorUserId]);
  const actorRoles = roleNames.get(input.actorUserId) ?? [];
  const actorIsSuperAdmin = actorRoles.includes(ROLES.SUPER_ADMIN);
  for (const targetId of userIds) {
    const targetRoles = roleNames.get(targetId) ?? [];
    if (targetRoles.includes(ROLES.SUPER_ADMIN)) {
      throw new Error('Super administrator accounts cannot be changed here.');
    }
    if (targetRoles.includes(ROLES.ADMIN) && !actorIsSuperAdmin) {
      throw new Error(
        'Only a super administrator can change an administrator.'
      );
    }
  }

  await db().transaction(async (tx: any) => {
    for (const targetId of userIds) {
      if (input.scope === 'account' || input.scope === 'both') {
        const [current] = await tx
          .select()
          .from(userAccountState)
          .where(eq(userAccountState.userId, targetId))
          .limit(1);
        const previousStatus = current?.status ?? 'active';
        if (
          input.expectedVersion !== undefined &&
          userIds.length === 1 &&
          (current?.version ?? 0) !== input.expectedVersion
        ) {
          throw new Error('This user status changed. Refresh and try again.');
        }
        const values = {
          status: input.accountStatus!,
          reasonCode: input.reasonCode.trim(),
          reason: input.reason.trim(),
          suspendedUntil:
            input.accountStatus === 'suspended'
              ? (input.effectiveUntil ?? null)
              : null,
          changedBy: input.actorUserId,
          version: (current?.version ?? 0) + 1,
          updatedAt: new Date(),
        };
        if (current) {
          await tx
            .update(userAccountState)
            .set(values)
            .where(eq(userAccountState.userId, targetId));
        } else {
          await tx
            .insert(userAccountState)
            .values({ userId: targetId, ...values });
        }
        await tx.insert(userStatusAudit).values({
          id: getUuid(),
          userId: targetId,
          actorUserId: input.actorUserId,
          scope: 'account',
          previousStatus,
          nextStatus: input.accountStatus!,
          reasonCode: input.reasonCode.trim(),
          reason: input.reason.trim(),
          effectiveUntil:
            input.accountStatus === 'suspended'
              ? (input.effectiveUntil ?? null)
              : null,
          requestId: input.requestId ?? '',
        });

        if (input.accountStatus !== 'active') {
          await tx.delete(session).where(eq(session.userId, targetId));
          await tx
            .update(apikey)
            .set({ status: 'disabled' })
            .where(
              and(eq(apikey.userId, targetId), eq(apikey.status, 'active'))
            );
        }
      }

      if (input.scope === 'generation' || input.scope === 'both') {
        const [current] = await tx
          .select()
          .from(userSafetyState)
          .where(eq(userSafetyState.userId, targetId))
          .limit(1);
        const previousStatus = current?.status ?? 'active';
        const activating = input.generationStatus === 'active';
        const values = {
          status: input.generationStatus!,
          restrictedUntil: requiresUntil(input.generationStatus)
            ? (input.effectiveUntil ?? null)
            : null,
          strikePoints: activating ? 0 : (current?.strikePoints ?? 0),
          warningCount: activating ? 0 : (current?.warningCount ?? 0),
          lastCategory: activating ? '' : (current?.lastCategory ?? ''),
          updatedAt: new Date(),
        };
        if (current) {
          await tx
            .update(userSafetyState)
            .set(values)
            .where(eq(userSafetyState.userId, targetId));
        } else {
          await tx
            .insert(userSafetyState)
            .values({ userId: targetId, ...values });
        }
        await tx.insert(userStatusAudit).values({
          id: getUuid(),
          userId: targetId,
          actorUserId: input.actorUserId,
          scope: 'generation',
          previousStatus,
          nextStatus: input.generationStatus!,
          reasonCode: input.reasonCode.trim(),
          reason: input.reason.trim(),
          effectiveUntil: requiresUntil(input.generationStatus)
            ? (input.effectiveUntil ?? null)
            : null,
          requestId: input.requestId ?? '',
        });
      }
    }
  });

  return { updated: userIds.length };
}

export async function getUserStatusDetails(userId: string) {
  const [account] = await db()
    .select()
    .from(userAccountState)
    .where(eq(userAccountState.userId, userId))
    .limit(1);
  const [generation] = await db()
    .select()
    .from(userSafetyState)
    .where(eq(userSafetyState.userId, userId))
    .limit(1);
  const audit = await db()
    .select()
    .from(userStatusAudit)
    .where(eq(userStatusAudit.userId, userId))
    .orderBy(desc(userStatusAudit.createdAt))
    .limit(30);

  return {
    account: account ?? {
      userId,
      status: 'active',
      reasonCode: '',
      reason: '',
      suspendedUntil: null,
      changedBy: null,
      version: 0,
    },
    generation: generation ?? {
      userId,
      status: 'active',
      strikePoints: 0,
      warningCount: 0,
      restrictedUntil: null,
      lastCategory: '',
    },
    audit,
  };
}
