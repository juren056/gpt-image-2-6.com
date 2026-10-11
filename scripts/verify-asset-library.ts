import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { createClient } from '@libsql/client';

// Isolated scratch DB: never writes to a deployment or a user's local database.
mkdirSync('.artifacts/account', { recursive: true });
const testUrl = `file:.artifacts/account/asset-library-${crypto.randomUUID()}.db`;
process.env.DATABASE_PROVIDER = 'sqlite';
process.env.DATABASE_URL = testUrl;
process.env.DB_SINGLETON_ENABLED = 'true';
const client = createClient({ url: testUrl });
await client.executeMultiple(
  readFileSync('drizzle/d1/0000_ambiguous_rattler.sql', 'utf8')
);
await client.execute(
  "INSERT INTO user (id,name,email,email_verified) VALUES ('owner-a','Owner A','a@example.test',1),('owner-b','Owner B','b@example.test',1)"
);
await client.execute(
  "INSERT INTO ai_task (id,user_id,media_type,provider,model,prompt,status) VALUES ('task-a','owner-a','image','fal','nano-banana-pro','Product photo','success'),('task-b','owner-b','image','fal','nano-banana-pro','Portrait','success')"
);
const { createAssetCollection, updateLibraryItem, getAssetLibrary } =
  await import('../src/modules/asset-library/service');
const collectionA = await createAssetCollection('owner-a', 'Campaign');
const collectionB = await createAssetCollection('owner-b', 'Private');
await updateLibraryItem('owner-a', {
  taskId: 'task-a',
  favorite: true,
  collectionId: collectionA.id,
});
await assert.rejects(
  () =>
    updateLibraryItem('owner-b', {
      taskId: 'task-a',
      favorite: true,
      collectionId: null,
    }),
  /Asset not found/
);
await assert.rejects(
  () =>
    updateLibraryItem('owner-a', {
      taskId: 'task-a',
      favorite: true,
      collectionId: collectionB.id,
    }),
  /Collection not found/
);
await assert.rejects(
  () => createAssetCollection('owner-a', ' '),
  /Collection name/
);
await updateLibraryItem('owner-a', {
  taskId: 'task-a',
  favorite: false,
  collectionId: collectionA.id,
});
const a = await getAssetLibrary('owner-a');
const b = await getAssetLibrary('owner-b');
assert.equal(a.items.length, 1, 'updating a favorite cannot duplicate a task');
assert.equal(a.items[0].favorite, false);
assert.equal(a.items[0].collectionId, collectionA.id);
assert.equal(a.collections.length, 1);
assert.equal(b.items.length, 0);
assert.equal(b.collections[0].name, 'Private');
await updateLibraryItem('owner-a', {
  taskId: 'task-a',
  favorite: true,
  collectionId: null,
});
assert.equal((await getAssetLibrary('owner-a')).items[0].collectionId, null);
await updateLibraryItem('owner-a', {
  taskId: 'task-a',
  favorite: true,
  collectionId: collectionA.id,
  kind: 'product',
  trashed: true,
});
await updateLibraryItem('owner-a', {
  taskId: 'task-a',
  favorite: false,
  collectionId: collectionA.id,
});
let metadata = (await getAssetLibrary('owner-a')).items[0];
assert.equal(
  metadata.trashed,
  true,
  'legacy favorite toggle must preserve soft trash'
);
assert.equal(
  metadata.kind,
  'product',
  'legacy favorite toggle must preserve category'
);
await assert.rejects(
  () =>
    updateLibraryItem('owner-b', {
      taskId: 'task-a',
      favorite: false,
      collectionId: null,
      trashed: false,
      kind: 'character',
    }),
  /Asset not found/
);
await updateLibraryItem('owner-a', {
  taskId: 'task-a',
  favorite: true,
  collectionId: collectionA.id,
  trashed: false,
});
metadata = (await getAssetLibrary('owner-a')).items[0];
assert.equal(metadata.trashed, false);
assert.equal(metadata.kind, 'product');
assert.equal(metadata.collectionId, collectionA.id);
const taskCount = await client.execute(
  "SELECT count(*) AS total FROM ai_task WHERE id='task-a'"
);
assert.equal(
  taskCount.rows[0].total,
  1,
  'soft trash cannot delete generation or credit history'
);
client.close();
console.log(
  'Asset library: owner isolation, cross-owner rejection, duplicate-free favorites, classification, reversible trash, and history preservation passed.'
);
