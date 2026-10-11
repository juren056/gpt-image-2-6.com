import { and, eq, isNull, or } from 'drizzle-orm';

import { db } from '@/core/db';
import { aiTask, post } from '@/config/db/schema';
import { getUuid, md5 } from '@/lib/hash';

const ASSET_TYPE = 'asset_library_item';
const COLLECTION_TYPE = 'asset_library_collection';
export type AssetLibraryItem = {
  taskId: string;
  favorite: boolean;
  collectionId: string | null;
  trashed: boolean;
  kind: 'character' | 'product' | 'style' | null;
};
function parseMetadata(content: string | null) {
  let data: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(content || '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
      data = parsed as Record<string, unknown>;
  } catch {
    /* recover old metadata */
  }
  return {
    favorite: data.favorite === true,
    collectionId:
      typeof data.collectionId === 'string' ? data.collectionId : null,
    trashed: data.trashed === true,
    kind: ['character', 'product', 'style'].includes(String(data.kind))
      ? (data.kind as AssetLibraryItem['kind'])
      : null,
  };
}

export async function getAssetLibrary(userId: string) {
  const rows = await db()
    .select()
    .from(post)
    .where(
      and(
        eq(post.userId, userId),
        or(eq(post.type, ASSET_TYPE), eq(post.type, COLLECTION_TYPE)),
        isNull(post.deletedAt)
      )
    )
    .limit(10000);
  return {
    items: rows
      .filter((row: typeof post.$inferSelect) => row.type === ASSET_TYPE)
      .flatMap((row: typeof post.$inferSelect) => {
        try {
          const data = parseMetadata(row.content);
          return row.parentId
            ? [
                {
                  taskId: row.parentId,
                  favorite: data.favorite === true,
                  trashed: data.trashed,
                  kind: data.kind,
                  collectionId:
                    typeof data.collectionId === 'string'
                      ? data.collectionId
                      : null,
                },
              ]
            : [];
        } catch {
          return [];
        }
      }),
    collections: rows
      .filter(
        (row: typeof post.$inferSelect) =>
          row.type === COLLECTION_TYPE && row.status === 'active'
      )
      .map((row: typeof post.$inferSelect) => ({
        id: row.id,
        name: row.title || '',
      })),
  };
}

export async function createAssetCollection(userId: string, name: string) {
  const title = name.trim();
  if (!title || title.length > 60)
    throw new Error('Collection name must contain 1–60 characters');
  const existing = await db()
    .select({ id: post.id })
    .from(post)
    .where(
      and(
        eq(post.userId, userId),
        eq(post.type, COLLECTION_TYPE),
        eq(post.status, 'active')
      )
    )
    .limit(101);
  if (existing.length >= 100) throw new Error('Collection limit reached');
  const id = getUuid();
  await db()
    .insert(post)
    .values({
      id,
      userId,
      slug: `asset-collection-${id}`,
      type: COLLECTION_TYPE,
      title,
      status: 'active',
    });
  return { id, name: title };
}

export async function updateLibraryItem(
  userId: string,
  input: Pick<AssetLibraryItem, 'taskId' | 'favorite' | 'collectionId'> &
    Partial<Pick<AssetLibraryItem, 'trashed' | 'kind'>>
) {
  if (!input.taskId || input.taskId.length > 160)
    throw new Error('Invalid asset');
  const [task] = await db()
    .select({ id: aiTask.id })
    .from(aiTask)
    .where(
      and(
        eq(aiTask.id, input.taskId),
        eq(aiTask.userId, userId),
        eq(aiTask.mediaType, 'image'),
        isNull(aiTask.deletedAt)
      )
    )
    .limit(1);
  if (!task) throw new Error('Asset not found');
  if (input.collectionId) {
    const [collection] = await db()
      .select({ id: post.id })
      .from(post)
      .where(
        and(
          eq(post.id, input.collectionId),
          eq(post.userId, userId),
          eq(post.type, COLLECTION_TYPE),
          eq(post.status, 'active'),
          isNull(post.deletedAt)
        )
      )
      .limit(1);
    if (!collection) throw new Error('Collection not found');
  }
  // One deterministic record per owner/task; conflict writes cannot create duplicates.
  const id = `asset-library-${md5(`${userId}:${input.taskId}`)}`;
  const [existing] = await db()
    .select({ content: post.content })
    .from(post)
    .where(
      and(eq(post.id, id), eq(post.userId, userId), eq(post.type, ASSET_TYPE))
    )
    .limit(1);
  const previous = parseMetadata(existing?.content || null);
  const metadata = {
    favorite: input.favorite,
    collectionId: input.collectionId,
    trashed: input.trashed ?? previous.trashed,
    kind: input.kind === undefined ? previous.kind : input.kind,
  };
  const values = {
    id,
    userId,
    parentId: input.taskId,
    slug: id,
    type: ASSET_TYPE,
    status: 'active',
    content: JSON.stringify(metadata),
  };
  await db()
    .insert(post)
    .values(values)
    .onConflictDoUpdate({
      target: post.id,
      set: { content: values.content, updatedAt: new Date() },
    });
  return { taskId: input.taskId, ...metadata };
}
