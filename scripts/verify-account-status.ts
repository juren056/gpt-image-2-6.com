#!/usr/bin/env node
import assert from 'node:assert/strict';
import { and, eq, inArray } from 'drizzle-orm';

import {
  apikey,
  session,
  user,
  userAccountState,
  userSafetyState,
  userStatusAudit,
} from '../src/config/db/schema';
import { isAccountAccessAllowed } from '../src/core/auth/account-access';
import { db } from '../src/core/db';
import { getUuid } from '../src/lib/hash';
import {
  changeUserStatuses,
  getUserStatusDetails,
} from '../src/modules/account-status/service';
import {
  create as createApiKey,
  validate as validateApiKey,
} from '../src/modules/apikeys/service';
import { assertUserSafetyAllowed } from '../src/modules/images/content-safety';

const actorId = `status-test-actor-${getUuid()}`;
const targetId = `status-test-target-${getUuid()}`;
const ids = [actorId, targetId];

async function cleanup() {
  await db().delete(user).where(inArray(user.id, ids));
}

async function main() {
  await cleanup();
  try {
    await db()
      .insert(user)
      .values([
        {
          id: actorId,
          name: 'Status test admin',
          email: `${actorId}@example.test`,
          emailVerified: true,
        },
        {
          id: targetId,
          name: 'Status test target',
          email: `${targetId}@example.test`,
          emailVerified: true,
        },
      ]);

    const createdKey = await createApiKey({
      userId: targetId,
      title: 'status test key',
    });
    await db()
      .insert(session)
      .values({
        id: getUuid(),
        token: `status-test-token-${getUuid()}`,
        userId: targetId,
        expiresAt: new Date(Date.now() + 60_000),
      });

    await assert.rejects(
      () =>
        changeUserStatuses({
          actorUserId: actorId,
          userIds: [actorId],
          scope: 'account',
          accountStatus: 'banned',
          reasonCode: 'test',
          reason: 'Self-ban must always be rejected.',
        }),
      /own account/
    );

    await changeUserStatuses({
      actorUserId: actorId,
      userIds: [targetId],
      scope: 'account',
      accountStatus: 'banned',
      reasonCode: 'policy_violation',
      reason: 'Automated verification of permanent account blocking.',
      expectedVersion: 0,
      requestId: 'verify-ban',
    });

    const [banned] = await db()
      .select()
      .from(userAccountState)
      .where(eq(userAccountState.userId, targetId));
    assert.equal(banned.status, 'banned');
    assert.equal(await isAccountAccessAllowed(targetId), false);
    assert.equal(await validateApiKey(createdKey.key), null);
    assert.equal(
      (await db().select().from(session).where(eq(session.userId, targetId)))
        .length,
      0
    );
    assert.equal(
      (
        await db()
          .select()
          .from(apikey)
          .where(
            and(eq(apikey.userId, targetId), eq(apikey.status, 'disabled'))
          )
      ).length,
      1
    );

    await changeUserStatuses({
      actorUserId: actorId,
      userIds: [targetId],
      scope: 'account',
      accountStatus: 'active',
      reasonCode: 'user_appeal',
      reason: 'Automated verification of the appeal and unblock flow.',
      expectedVersion: 1,
      requestId: 'verify-unban',
    });
    assert.equal(await isAccountAccessAllowed(targetId), true);
    assert.equal(
      (
        await db()
          .select()
          .from(apikey)
          .where(
            and(eq(apikey.userId, targetId), eq(apikey.status, 'disabled'))
          )
      ).length,
      1,
      'Unblocking must not silently reactivate old API keys.'
    );

    const until = new Date(Date.now() + 60_000);
    await changeUserStatuses({
      actorUserId: actorId,
      userIds: [targetId],
      scope: 'generation',
      generationStatus: 'restricted',
      reasonCode: 'policy_violation',
      reason: 'Automated verification of generation-only restriction.',
      effectiveUntil: until,
      requestId: 'verify-generation-restrict',
    });
    assert.equal(await isAccountAccessAllowed(targetId), true);
    await assert.rejects(
      () => assertUserSafetyAllowed(targetId),
      /Generation is temporarily restricted/
    );

    await changeUserStatuses({
      actorUserId: actorId,
      userIds: [targetId],
      scope: 'generation',
      generationStatus: 'active',
      reasonCode: 'admin_correction',
      reason: 'Automated verification of generation restriction removal.',
      requestId: 'verify-generation-restore',
    });
    await assertUserSafetyAllowed(targetId);

    const details = await getUserStatusDetails(targetId);
    assert.equal(details.account.status, 'active');
    assert.equal(details.generation.status, 'active');
    assert.equal(details.generation.strikePoints, 0);
    assert.equal(details.audit.length, 4);
    assert.deepEqual(
      new Set(details.audit.map((row: { scope: string }) => row.scope)),
      new Set(['account', 'generation'])
    );

    const auditRows = await db()
      .select()
      .from(userStatusAudit)
      .where(eq(userStatusAudit.userId, targetId));
    assert.equal(auditRows.length, 4);
    const [safety] = await db()
      .select()
      .from(userSafetyState)
      .where(eq(userSafetyState.userId, targetId));
    assert.equal(safety.status, 'active');

    console.log(
      '[account-status] PASS: self-protection, session/key revocation, account unblock, independent generation restriction and audit history'
    );
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error('[account-status] FAIL:', error);
  process.exit(1);
});
