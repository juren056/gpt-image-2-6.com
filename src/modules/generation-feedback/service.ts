import { and, eq, isNull } from 'drizzle-orm';

import { db } from '@/core/db';
import {
  aiTask,
  generationFeedback,
  ticket,
  ticketMessage,
  user,
} from '@/config/db/schema';
import { CreditTransactionScene, grant } from '@/modules/credits/service';
import { getUuid } from '@/lib/hash';

export const FEEDBACK_OPTIONS = [
  'great',
  'usable_with_edits',
  'prompt_mismatch',
  'detail_error',
  'too_slow',
  'credits_too_high',
  'moderation_issue',
  'other',
] as const;

export const FEEDBACK_SCENES = [
  'product_photo',
  'poster',
  'teaching_material',
  'social_media',
  'personal_creative',
  'other',
] as const;

export type FeedbackOption = (typeof FEEDBACK_OPTIONS)[number];
export type FeedbackScene = (typeof FEEDBACK_SCENES)[number];

type EligibilityParams = {
  userId: string;
  taskId: string;
  enabled: boolean;
  launchAt?: Date;
};

async function eligibleTask(params: EligibilityParams) {
  if (!params.enabled) return { eligible: false as const, reason: 'disabled' };

  const [account] = await db()
    .select({ emailVerified: user.emailVerified })
    .from(user)
    .where(eq(user.id, params.userId))
    .limit(1);
  if (!account?.emailVerified)
    return { eligible: false as const, reason: 'email_unverified' };

  const [existing] = await db()
    .select({ id: generationFeedback.id, status: generationFeedback.status })
    .from(generationFeedback)
    .where(
      and(
        eq(generationFeedback.userId, params.userId),
        isNull(generationFeedback.deletedAt)
      )
    )
    .limit(1);
  if (existing)
    return {
      eligible: false as const,
      reason: 'already_seen',
      status: existing.status,
    };

  const [task] = await db()
    .select({
      id: aiTask.id,
      userId: aiTask.userId,
      status: aiTask.status,
      taskResult: aiTask.taskResult,
      costCredits: aiTask.costCredits,
      model: aiTask.model,
      createdAt: aiTask.createdAt,
    })
    .from(aiTask)
    .where(eq(aiTask.id, params.taskId))
    .limit(1);

  if (!task || task.userId !== params.userId)
    return { eligible: false as const, reason: 'task_not_found' };
  if (task.status !== 'success' || !task.taskResult)
    return { eligible: false as const, reason: 'task_not_successful' };
  if (task.costCredits <= 0)
    return { eligible: false as const, reason: 'non_billable_task' };
  if (params.launchAt && task.createdAt < params.launchAt)
    return { eligible: false as const, reason: 'task_before_launch' };

  return { eligible: true as const, task };
}

export async function checkEligibility(params: EligibilityParams) {
  const result = await eligibleTask(params);
  return {
    eligible: result.eligible,
    reason: 'reason' in result ? result.reason : null,
  };
}

export async function claimImpression(
  params: EligibilityParams & {
    modelId?: string;
    pagePath?: string;
    locale?: string;
    rewardCredits: number;
  }
) {
  const result = await eligibleTask(params);
  if (!result.eligible) return { show: false, reason: result.reason };

  try {
    const [row] = await db()
      .insert(generationFeedback)
      .values({
        id: getUuid(),
        userId: params.userId,
        taskId: result.task.id,
        status: 'shown',
        modelId: (params.modelId || result.task.model).slice(0, 191),
        pagePath: (params.pagePath || '').slice(0, 500),
        locale: (params.locale || 'en').slice(0, 20),
        usageScene: '',
        feedbackOption: '',
        customText: '',
        rewardTransactionNo: '',
        rewardCredits: params.rewardCredits,
        shownAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return { show: true, feedbackId: row.id };
  } catch (error) {
    const [existing] = await db()
      .select({ id: generationFeedback.id })
      .from(generationFeedback)
      .where(
        and(
          eq(generationFeedback.userId, params.userId),
          isNull(generationFeedback.deletedAt)
        )
      )
      .limit(1);
    if (existing) return { show: false, reason: 'already_seen' };
    throw error;
  }
}

export async function dismissFeedback(params: {
  userId: string;
  taskId: string;
}) {
  const [row] = await db()
    .update(generationFeedback)
    .set({ status: 'dismissed', updatedAt: new Date() })
    .where(
      and(
        eq(generationFeedback.userId, params.userId),
        eq(generationFeedback.taskId, params.taskId),
        eq(generationFeedback.status, 'shown')
      )
    )
    .returning();
  return Boolean(row);
}

export async function submitFeedback(params: {
  userId: string;
  userEmail?: string;
  taskId: string;
  usageScene: FeedbackScene;
  feedbackOption: FeedbackOption;
  customText?: string;
  rewardValidDays: number;
}) {
  const customText = (params.customText || '').trim();
  if (customText.length > 2000) throw new Error('Feedback is too long');

  return db().transaction(async (tx: any) => {
    const [feedback] = await tx
      .select()
      .from(generationFeedback)
      .where(
        and(
          eq(generationFeedback.userId, params.userId),
          eq(generationFeedback.taskId, params.taskId),
          isNull(generationFeedback.deletedAt)
        )
      )
      .limit(1);
    if (!feedback) throw new Error('Feedback invitation is unavailable');
    if (feedback.status === 'rewarded') {
      return {
        ticketId: feedback.ticketId,
        rewardCredits: feedback.rewardCredits,
        alreadyRewarded: true,
      };
    }
    if (feedback.status !== 'shown')
      throw new Error('Feedback invitation is no longer available');

    const now = new Date();
    const ticketId = getUuid();
    const transactionNo = `feedback:first-generation:${params.userId}`;
    const metadata = JSON.stringify({
      source: 'first_generation_feedback',
      taskId: feedback.taskId,
      modelId: feedback.modelId,
      pagePath: feedback.pagePath,
      locale: feedback.locale,
      usageScene: params.usageScene,
      feedbackOption: params.feedbackOption,
      rewardCredits: feedback.rewardCredits,
    });
    const content = [
      `Usage scene: ${params.usageScene}`,
      `Feedback: ${params.feedbackOption}`,
      `Model: ${feedback.modelId || 'unknown'}`,
      `Task: ${feedback.taskId}`,
      customText ? `Comment: ${customText}` : 'Comment: (none)',
    ].join('\n');

    await tx.insert(ticket).values({
      id: ticketId,
      userId: params.userId,
      title: '[Product feedback] First successful generation',
      status: 'open',
      category: 'feedback',
      metadata,
      createdAt: now,
      updatedAt: now,
    });
    await tx.insert(ticketMessage).values({
      id: getUuid(),
      ticketId,
      userId: params.userId,
      role: 'user',
      content,
      attachments: '[]',
      createdAt: now,
    });

    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + params.rewardValidDays);
    const reward = await grant({
      userId: params.userId,
      userEmail: params.userEmail || '',
      transactionNo,
      credits: feedback.rewardCredits,
      description: 'Product feedback reward',
      scene: CreditTransactionScene.REWARD,
      expiresAt,
      metadata,
      tx,
    });

    await tx
      .update(generationFeedback)
      .set({
        status: 'rewarded',
        usageScene: params.usageScene,
        feedbackOption: params.feedbackOption,
        customText,
        ticketId,
        rewardTransactionNo: transactionNo,
        submittedAt: now,
        rewardedAt: now,
        updatedAt: now,
      })
      .where(eq(generationFeedback.id, feedback.id));

    return {
      ticketId,
      rewardCredits: feedback.rewardCredits,
      balanceAfter: reward.balanceAfter,
      alreadyRewarded: false,
    };
  });
}
