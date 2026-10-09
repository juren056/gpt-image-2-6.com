import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  gt,
  gte,
  isNull,
} from 'drizzle-orm';

import { db } from '@/core/db';
import { aiTask, session, user } from '@/config/db/schema';
import type { PublicStats } from '@/lib/public-stats';

/**
 * Public, privacy-safe activity summary for the landing page.
 * "Online" means a signed-in creator whose session was refreshed in the last
 * 15 minutes. No email, user id, prompt, or generated asset is exposed.
 */
export async function getPublicStats(): Promise<PublicStats> {
  const now = new Date();
  const activeSince = new Date(now.getTime() - 15 * 60 * 1000);
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [onlineRows, todayRows, creatorRows, leaderboardRows] =
    await Promise.all([
      db()
        .select({ value: countDistinct(session.userId) })
        .from(session)
        .where(
          and(gte(session.updatedAt, activeSince), gt(session.expiresAt, now))
        ),
      db()
        .select({ value: count(aiTask.id) })
        .from(aiTask)
        .where(
          and(
            eq(aiTask.mediaType, 'image'),
            eq(aiTask.status, 'success'),
            gte(aiTask.createdAt, startOfDay),
            isNull(aiTask.deletedAt)
          )
        ),
      db()
        .select({ value: count(user.id) })
        .from(user),
      db()
        .select({
          name: user.name,
          image: user.image,
          generations: count(aiTask.id),
        })
        .from(aiTask)
        .innerJoin(user, eq(aiTask.userId, user.id))
        .where(
          and(
            eq(aiTask.mediaType, 'image'),
            eq(aiTask.status, 'success'),
            gte(aiTask.createdAt, weekAgo),
            isNull(aiTask.deletedAt)
          )
        )
        .groupBy(user.id, user.name, user.image)
        .orderBy(desc(count(aiTask.id)))
        .limit(5),
    ]);

  return {
    onlineCreators: Number(onlineRows[0]?.value ?? 0),
    generationsToday: Number(todayRows[0]?.value ?? 0),
    totalCreators: Number(creatorRows[0]?.value ?? 0),
    leaderboard: leaderboardRows.map(
      (row: { name: string; image: string | null; generations: unknown }) => ({
        name: row.name,
        image: row.image,
        generations: Number(row.generations),
      })
    ),
    measuredAt: now.toISOString(),
  };
}
