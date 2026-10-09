import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/core/db';
import { post } from '@/config/db/schema';
import { getUuid } from '@/lib/hash';

const PROJECT_TYPE = 'creative_project';
const SHARE_TYPE = 'creative_share';
const MAX_PROJECT_BYTES = 2 * 1024 * 1024;

export type StudioLayer = {
  id: string;
  type: 'image' | 'background' | 'text' | 'shape' | 'mask' | 'annotation';
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  groupId?: string;
  assetId?: string;
  data: Record<string, unknown>;
};

export type StudioAsset = {
  id: string;
  version: number;
  parentAssetId?: string;
  sourceTaskId?: string;
  operation: string;
  url: string;
  mimeType?: string;
  width?: number;
  height?: number;
  createdAt: string;
};

export type StudioProjectState = {
  version: 1;
  canvas: { width: number; height: number; background: string };
  layers: StudioLayer[];
  assets: StudioAsset[];
  prompt?: string;
  modelId?: string;
  selectedAssetId?: string;
  brand?: {
    name?: string;
    colors?: string[];
    logoUrl?: string;
    fontNames?: string[];
  };
};

function parseState(content: string | null): StudioProjectState {
  const value = JSON.parse(content || '{}') as Partial<StudioProjectState>;
  if (
    value.version !== 1 ||
    !value.canvas ||
    !Array.isArray(value.layers) ||
    !Array.isArray(value.assets)
  ) {
    throw new Error('Invalid Creative Studio project');
  }
  return value as StudioProjectState;
}

function serializeState(state: StudioProjectState) {
  const content = JSON.stringify(state);
  if (new TextEncoder().encode(content).byteLength > MAX_PROJECT_BYTES) {
    throw new Error('Project exceeds the 2 MB metadata limit');
  }
  parseState(content);
  return content;
}

export async function listProjects(userId: string) {
  return db()
    .select({
      id: post.id,
      title: post.title,
      image: post.image,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    })
    .from(post)
    .where(
      and(
        eq(post.userId, userId),
        eq(post.type, PROJECT_TYPE),
        eq(post.status, 'active'),
        isNull(post.deletedAt)
      )
    )
    .orderBy(desc(post.updatedAt));
}

export async function getProject(userId: string, id: string) {
  const [row] = await db()
    .select()
    .from(post)
    .where(
      and(
        eq(post.id, id),
        eq(post.userId, userId),
        eq(post.type, PROJECT_TYPE),
        eq(post.status, 'active'),
        isNull(post.deletedAt)
      )
    )
    .limit(1);
  return row ? { ...row, state: parseState(row.content) } : null;
}

export async function saveProject(input: {
  userId: string;
  id?: string;
  title: string;
  previewUrl?: string;
  state: StudioProjectState;
}) {
  const title = input.title.trim().slice(0, 120) || 'Untitled project';
  const content = serializeState(input.state);
  if (input.id) {
    const [updated] = await db()
      .update(post)
      .set({ title, image: input.previewUrl || '', content })
      .where(
        and(
          eq(post.id, input.id),
          eq(post.userId, input.userId),
          eq(post.type, PROJECT_TYPE),
          eq(post.status, 'active')
        )
      )
      .returning();
    if (!updated) throw new Error('Project not found');
    return updated;
  }
  const id = getUuid();
  const [created] = await db()
    .insert(post)
    .values({
      id,
      userId: input.userId,
      slug: `studio-${id}`,
      type: PROJECT_TYPE,
      title,
      image: input.previewUrl || '',
      content,
      status: 'active',
    })
    .returning();
  return created;
}

export async function archiveProject(userId: string, id: string) {
  const [updated] = await db()
    .update(post)
    .set({ status: 'archived' })
    .where(
      and(eq(post.id, id), eq(post.userId, userId), eq(post.type, PROJECT_TYPE))
    )
    .returning({ id: post.id });
  if (!updated) throw new Error('Project not found');
  return updated;
}

export async function createProjectShare(userId: string, projectId: string) {
  const project = await getProject(userId, projectId);
  if (!project) throw new Error('Project not found');
  const token = crypto.randomUUID().replaceAll('-', '');
  const id = getUuid();
  const [share] = await db()
    .insert(post)
    .values({
      id,
      userId,
      parentId: projectId,
      slug: `studio-share-${token}`,
      type: SHARE_TYPE,
      title: project.title,
      image: project.image,
      content: serializeState(project.state),
      status: 'published',
    })
    .returning({ id: post.id, token: post.slug });
  return { id: share.id, token: share.token.replace('studio-share-', '') };
}

export async function getProjectShare(token: string) {
  if (!/^[a-f0-9]{32}$/i.test(token)) return null;
  const [share] = await db()
    .select({ title: post.title, image: post.image, content: post.content })
    .from(post)
    .where(
      and(
        eq(post.slug, `studio-share-${token.toLowerCase()}`),
        eq(post.type, SHARE_TYPE),
        eq(post.status, 'published'),
        isNull(post.deletedAt)
      )
    )
    .limit(1);
  return share
    ? {
        title: share.title,
        image: share.image,
        state: parseState(share.content),
      }
    : null;
}

export async function revokeProjectShare(userId: string, shareId: string) {
  const [updated] = await db()
    .update(post)
    .set({ status: 'archived' })
    .where(
      and(
        eq(post.id, shareId),
        eq(post.userId, userId),
        eq(post.type, SHARE_TYPE)
      )
    )
    .returning({ id: post.id });
  if (!updated) throw new Error('Share not found');
  return updated;
}
