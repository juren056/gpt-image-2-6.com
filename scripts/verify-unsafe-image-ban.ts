import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';

// Always use an isolated database; this verification cannot ban a real user.
const directory = mkdtempSync(join(tmpdir(), 'image-unsafe-image-ban-'));
process.env.DATABASE_PROVIDER = 'sqlite';
process.env.DATABASE_URL = `file:${join(directory, 'test.db').replaceAll('\\', '/')}`;
execFileSync(
  process.execPath,
  ['node_modules/drizzle-kit/bin.cjs', 'push', '--config=drizzle.config.ts'],
  { env: process.env, stdio: 'pipe' }
);

const { db } = await import('../src/core/db');
const {
  aiTask,
  apikey,
  session,
  user,
  userAccountState,
  userSafetyState,
  userStatusAudit,
} = await import('../src/config/db/schema');
const {
  assertUserSafetyAllowed,
  countsAsConfirmedUnsafeImage,
  recalculateUserSafety,
} = await import('../src/modules/images/content-safety');

const id = 'unsafe-image-ban-test';
await db().insert(user).values({
  id,
  name: 'Test',
  email: 'ban-test@example.test',
  emailVerified: true,
});
await db()
  .insert(session)
  .values({
    id: 'test-session',
    userId: id,
    token: 'test-session-token',
    expiresAt: new Date(Date.now() + 60000),
  });
await db().insert(apikey).values({
  id: 'test-key',
  userId: id,
  title: 'Test',
  keyHash: 'test-key-hash',
  keyPrefix: 'test-key',
  status: 'active',
});

const output = {
  mediaType: 'image',
  safetyStatus: 'blocked',
  safetyAction: 'output_quarantined',
  safetyReviewStatus: 'confirmed',
  safetyCategory: 'sexual',
};
assert.equal(countsAsConfirmedUnsafeImage(output), true);
for (const change of [
  { safetyAction: 'request_blocked' },
  { safetyReviewStatus: 'not_required' },
  { safetyReviewStatus: 'false_positive' },
  { safetyCategory: 'moderation_unavailable' },
  { mediaType: 'video' },
  { safetyStatus: 'review' },
])
  assert.equal(countsAsConfirmedUnsafeImage({ ...output, ...change }), false);

async function add(taskId: string, overrides = {}) {
  await db()
    .insert(aiTask)
    .values({
      id: taskId,
      userId: id,
      provider: 'test',
      model: 'test',
      prompt: 'test',
      status: 'failed',
      ...output,
      safetySeverity: 'high',
      safetySource: 'external',
      safetyConfidence: 99,
      costCredits: 0,
      ...overrides,
    });
}
for (let index = 1; index <= 4; index++)
  await add(`input-${index}`, {
    safetyAction: 'request_blocked',
    safetyReviewStatus: 'not_required',
  });
await add('outage', {
  safetyCategory: 'moderation_unavailable',
  safetyReviewStatus: 'not_required',
});
await recalculateUserSafety(id);
assert.equal((await db().select().from(userAccountState)).length, 0);

// Lifetime counting: old confirmed output still counts beyond 30 days.
await add('first', { createdAt: new Date(Date.now() - 40 * 86400000) });
await add('second');
await recalculateUserSafety(id);
assert.equal(
  (await db().select().from(userAccountState)).length,
  0,
  'two outputs cannot permanently ban'
);
await add('third');
assert.equal((await recalculateUserSafety(id)).status, 'banned');
assert.equal((await db().select().from(userAccountState))[0].status, 'banned');
assert.equal((await db().select().from(session)).length, 0);
assert.equal((await db().select().from(apikey))[0].status, 'disabled');
await assert.rejects(() => assertUserSafetyAllowed(id), /disabled/);
await recalculateUserSafety(id);
assert.equal(
  (await db().select().from(userStatusAudit)).length,
  1,
  'duplicate callbacks cannot duplicate the ban audit'
);

// Neither aging records nor marking a false positive silently clears a permanent ban.
await db()
  .update(aiTask)
  .set({ safetyReviewStatus: 'false_positive' })
  .where(eq(aiTask.id, 'third'));
assert.equal((await recalculateUserSafety(id)).status, 'banned');

// A deliberate administrator restoration resets the counting period.
await db()
  .update(userAccountState)
  .set({ status: 'active' })
  .where(eq(userAccountState.userId, id));
await db()
  .update(userSafetyState)
  .set({ status: 'active' })
  .where(eq(userSafetyState.userId, id));
await db()
  .insert(userStatusAudit)
  .values({
    id: 'reset',
    userId: id,
    actorUserId: 'test-admin',
    scope: 'generation',
    previousStatus: 'banned',
    nextStatus: 'active',
    reasonCode: 'admin_reset',
    reason: 'Test administrator reset',
    requestId: '',
    createdAt: new Date(Date.now() + 1000),
  });
await recalculateUserSafety(id);
assert.equal((await db().select().from(userAccountState))[0].status, 'active');
console.log(
  'Unsafe image ban verification passed: strict output counting, third-output account ban, session/key revocation, callback idempotency, permanent status, administrator reset.'
);
db().$client.close();
