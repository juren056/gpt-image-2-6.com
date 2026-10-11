import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { getAuth } from '@/core/auth';
import {
  createAssetCollection,
  getAssetLibrary,
  updateLibraryItem,
} from '@/modules/asset-library/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

const actionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('collection'),
    name: z.string().trim().min(1).max(60),
  }),
  z.object({
    action: z.literal('item'),
    taskId: z.string().min(1).max(160),
    favorite: z.boolean(),
    collectionId: z.string().min(1).max(160).nullable(),
    trashed: z.boolean().optional(),
    kind: z.enum(['character', 'product', 'style']).nullable().optional(),
  }),
]);
async function GET({ request }: { request: Request }) {
  try {
    const user = (await getAuth().api.getSession({ headers: request.headers }))
      ?.user;
    if (!user)
      return respErr('Unauthorized', {
        status: 401,
        headers: { 'Cache-Control': 'private, no-store' },
      });
    return respData(await getAssetLibrary(user.id), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return respErr('Unable to load asset library', {
      status: 500,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }
}
async function POST({ request }: { request: Request }) {
  try {
    const user = (await getAuth().api.getSession({ headers: request.headers }))
      ?.user;
    if (!user) return respErr('Unauthorized', { status: 401 });
    const limited = await enforceMinIntervalRateLimit(request, {
      intervalMs: 500,
      keyPrefix: 'asset-library-write',
      extraKey: user.id,
    });
    if (limited) return limited;
    const input = actionSchema.parse(await request.json());
    return respData(
      input.action === 'collection'
        ? await createAssetCollection(user.id, input.name)
        : await updateLibraryItem(user.id, input)
    );
  } catch (error) {
    const safeMessage =
      error instanceof z.ZodError
        ? 'Invalid library request'
        : error instanceof Error &&
            /^(Invalid asset|Asset not found|Collection not found|Collection limit reached|Collection name must contain)/.test(
              error.message
            )
          ? error.message
          : 'Unable to update library';
    return respErr(safeMessage, {
      status: 400,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }
}
export const Route = createFileRoute('/api/assets/library')({
  server: { handlers: { GET, POST } },
});
