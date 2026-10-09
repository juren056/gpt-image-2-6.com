import assert from 'node:assert/strict';
import { and, count, eq, inArray, like } from 'drizzle-orm';

import {
  aiTask,
  credit,
  generationFeedback,
  ticket,
  ticketMessage,
  user,
} from '../src/config/db/schema';
import { db } from '../src/core/db';
import {
  checkEligibility,
  claimImpression,
  dismissFeedback,
  submitFeedback,
} from '../src/modules/generation-feedback/service';

const runId = `feedback-test-${Date.now()}`;
const userIds = [1, 2, 3].map((number) => `${runId}-user-${number}`);
const taskIds = [1, 2, 3].map((number) => `${runId}-task-${number}`);

async function cleanup() {
  const database = db();
  const feedbackRows = await database
    .select({ ticketId: generationFeedback.ticketId })
    .from(generationFeedback)
    .where(inArray(generationFeedback.userId, userIds));
  const ticketIds = feedbackRows
    .map((row: { ticketId: string | null }) => row.ticketId)
    .filter((id: string | null): id is string => Boolean(id));
  if (ticketIds.length) {
    await database
      .delete(ticketMessage)
      .where(inArray(ticketMessage.ticketId, ticketIds));
    await database.delete(ticket).where(inArray(ticket.id, ticketIds));
  }
  await database
    .delete(generationFeedback)
    .where(inArray(generationFeedback.userId, userIds));
  await database
    .delete(credit)
    .where(like(credit.transactionNo, `feedback:first-generation:${runId}%`));
  await database.delete(aiTask).where(inArray(aiTask.id, taskIds));
  await database.delete(user).where(inArray(user.id, userIds));
}

async function main() {
  const database = db();
  await cleanup();
  const now = new Date();
  await database.insert(user).values([
    {
      id: userIds[0],
      name: 'Feedback verified',
      email: `${userIds[0]}@example.test`,
      emailVerified: true,
    },
    {
      id: userIds[1],
      name: 'Feedback unverified',
      email: `${userIds[1]}@example.test`,
      emailVerified: false,
    },
    {
      id: userIds[2],
      name: 'Feedback dismissed',
      email: `${userIds[2]}@example.test`,
      emailVerified: true,
    },
  ]);
  await database.insert(aiTask).values([
    {
      id: taskIds[0],
      userId: userIds[0],
      mediaType: 'image',
      provider: 'test',
      model: 'test/image',
      prompt: 'safe product image',
      status: 'success',
      taskResult: JSON.stringify({ images: [{ imageUrl: '/test.png' }] }),
      costCredits: 5,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: taskIds[1],
      userId: userIds[1],
      mediaType: 'image',
      provider: 'test',
      model: 'test/image',
      prompt: 'safe product image',
      status: 'success',
      taskResult: JSON.stringify({ images: [{ imageUrl: '/test.png' }] }),
      costCredits: 5,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: taskIds[2],
      userId: userIds[2],
      mediaType: 'image',
      provider: 'test',
      model: 'test/image',
      prompt: 'safe product image',
      status: 'success',
      taskResult: JSON.stringify({ images: [{ imageUrl: '/test.png' }] }),
      costCredits: 5,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  const eligibility = await checkEligibility({
    userId: userIds[0],
    taskId: taskIds[0],
    enabled: true,
    launchAt: new Date(now.getTime() - 1000),
  });
  assert.equal(eligibility.eligible, true);

  const unverified = await checkEligibility({
    userId: userIds[1],
    taskId: taskIds[1],
    enabled: true,
  });
  assert.deepEqual(unverified, {
    eligible: false,
    reason: 'email_unverified',
  });

  const firstClaim = await claimImpression({
    userId: userIds[0],
    taskId: taskIds[0],
    enabled: true,
    rewardCredits: 10,
    modelId: 'test/image',
    pagePath: '/test',
    locale: 'en',
  });
  assert.equal(firstClaim.show, true);
  const duplicateClaim = await claimImpression({
    userId: userIds[0],
    taskId: taskIds[0],
    enabled: true,
    rewardCredits: 10,
  });
  assert.equal(duplicateClaim.show, false);

  const submitted = await submitFeedback({
    userId: userIds[0],
    userEmail: `${userIds[0]}@example.test`,
    taskId: taskIds[0],
    usageScene: 'product_photo',
    feedbackOption: 'great',
    customText: 'Useful result',
    rewardValidDays: 30,
  });
  assert.equal(submitted.rewardCredits, 10);
  assert.equal(submitted.alreadyRewarded, false);

  const idempotentSubmit = await submitFeedback({
    userId: userIds[0],
    taskId: taskIds[0],
    usageScene: 'product_photo',
    feedbackOption: 'great',
    rewardValidDays: 30,
  });
  assert.equal(idempotentSubmit.alreadyRewarded, true);

  const [rewardCount] = await database
    .select({ value: count() })
    .from(credit)
    .where(eq(credit.transactionNo, `feedback:first-generation:${userIds[0]}`));
  assert.equal(rewardCount.value, 1);
  const [feedbackTicketCount] = await database
    .select({ value: count() })
    .from(ticket)
    .where(and(eq(ticket.userId, userIds[0]), eq(ticket.category, 'feedback')));
  assert.equal(feedbackTicketCount.value, 1);

  const dismissClaim = await claimImpression({
    userId: userIds[2],
    taskId: taskIds[2],
    enabled: true,
    rewardCredits: 10,
  });
  assert.equal(dismissClaim.show, true);
  assert.equal(
    await dismissFeedback({ userId: userIds[2], taskId: taskIds[2] }),
    true
  );
  await assert.rejects(
    () =>
      submitFeedback({
        userId: userIds[2],
        taskId: taskIds[2],
        usageScene: 'other',
        feedbackOption: 'other',
        rewardValidDays: 30,
      }),
    /no longer available/
  );

  console.log(
    'generation feedback verification passed: eligibility, single impression, atomic reward, idempotency, ticket audit, and dismissal'
  );
}

main()
  .finally(cleanup)
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
