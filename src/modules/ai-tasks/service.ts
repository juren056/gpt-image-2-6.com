import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/core/db';
import { aiTask } from '@/config/db/schema';
import { consume, revoke } from '@/modules/credits/service';
import { getUuid } from '@/lib/hash';

export enum AITaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export type TaskSafetyMetadata = {
  safetyStatus: string;
  safetyCategory: string;
  safetySeverity: string;
  safetySource: string;
  safetyConfidence: number;
  safetyReviewStatus: string;
  safetyAction: string;
};

function forUpdate(query: any) {
  return typeof query.for === 'function' ? query.for('update') : query;
}

/**
 * Create an AI task with optional credit consumption.
 */
export async function createTask(params: {
  userId: string;
  mediaType: string;
  provider: string;
  model: string;
  prompt: string;
  costCredits?: number;
  options?: any;
  safety?: Partial<TaskSafetyMetadata>;
}): Promise<any> {
  const {
    userId,
    mediaType,
    provider,
    model,
    prompt,
    costCredits,
    options,
    safety,
  } = params;

  return db().transaction(async (tx: any) => {
    // 1. Insert task
    const taskData: any = {
      id: getUuid(),
      userId,
      mediaType,
      provider,
      model,
      prompt,
      status: AITaskStatus.PENDING,
      costCredits: costCredits || 0,
      options: options ? JSON.stringify(options) : null,
      ...(safety || {}),
    };

    const [task] = await tx.insert(aiTask).values(taskData).returning();

    // 2. Consume credits if cost > 0
    if (costCredits && costCredits > 0) {
      const result = await consume({
        userId,
        credits: costCredits,
        scene: 'ai_task',
        description: `AI ${mediaType} generation`,
        metadata: JSON.stringify({ taskId: task.id }),
        tx,
      });

      if (!result.success) {
        throw new Error('Insufficient credits');
      }

      // Store consumed credit ID for potential revocation
      if (result.consumedCredit) {
        await tx
          .update(aiTask)
          .set({
            taskInfo: JSON.stringify({ creditId: result.consumedCredit.id }),
          })
          .where(eq(aiTask.id, task.id));
      }
    }

    return task;
  });
}

/**
 * Update task status. Revokes credits on failure.
 */
export async function updateTask(params: {
  taskId: string;
  status: AITaskStatus;
  taskResult?: any;
  safety?: Partial<TaskSafetyMetadata>;
}) {
  const { taskId, status, taskResult, safety } = params;

  return db().transaction(async (tx: any) => {
    const taskQuery = tx
      .select()
      .from(aiTask)
      .where(eq(aiTask.id, taskId))
      .limit(1);
    const [task] = await forUpdate(taskQuery);

    if (!task) throw new Error('Task not found');
    if (
      task.status === AITaskStatus.SUCCESS ||
      task.status === AITaskStatus.FAILED ||
      task.status === AITaskStatus.CANCELED
    ) {
      return;
    }

    const updateData: any = { status };
    if (taskResult) {
      updateData.taskResult = JSON.stringify(taskResult);
    }
    if (safety) Object.assign(updateData, safety);

    await tx.update(aiTask).set(updateData).where(eq(aiTask.id, taskId));

    // The failure state and its credit restoration commit together. If the
    // restoration fails, the task stays retryable instead of losing credits.
    if (status === AITaskStatus.FAILED && task.taskInfo) {
      try {
        const info = JSON.parse(task.taskInfo as string);
        if (info.creditId) {
          await revoke(info.creditId, tx);
        }
      } catch (error) {
        if (error instanceof SyntaxError) return;
        throw error;
      }
    }
  });
}

/**
 * Get tasks for a user.
 */
export async function getTasks(params: {
  userId: string;
  mediaType?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { userId, mediaType, status, page = 1, limit = 20 } = params;

  return db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.userId, userId),
        mediaType ? eq(aiTask.mediaType, mediaType) : undefined,
        status ? eq(aiTask.status, status) : undefined,
        isNull(aiTask.deletedAt)
      )
    )
    .orderBy(desc(aiTask.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
}

/**
 * Find task by ID.
 */
export async function findTask(taskId: string) {
  const [result] = await db()
    .select()
    .from(aiTask)
    .where(eq(aiTask.id, taskId))
    .limit(1);
  return result;
}
