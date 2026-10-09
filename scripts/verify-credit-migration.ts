import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createClient } from '@libsql/client';

const client = createClient({ url: ':memory:' });

await client.execute(`
  CREATE TABLE credit (
    id text PRIMARY KEY,
    transaction_type text NOT NULL,
    credits integer NOT NULL,
    remaining_credits integer NOT NULL DEFAULT 0
  )
`);
await client.batch(
  [
    {
      sql: `INSERT INTO credit
        (id, transaction_type, credits, remaining_credits)
        VALUES (?, ?, ?, ?)`,
      args: ['consume-1', 'consume', -5, 15],
    },
    {
      sql: `INSERT INTO credit
        (id, transaction_type, credits, remaining_credits)
        VALUES (?, ?, ?, ?)`,
      args: ['grant-1', 'grant', 20, 15],
    },
  ],
  'write'
);

const migration = readFileSync(
  new URL('../drizzle/0002_credit_balance_snapshots.sql', import.meta.url),
  'utf8'
);
for (const statement of migration
  .split('--> statement-breakpoint')
  .map((value) => value.trim())
  .filter(Boolean)) {
  await client.execute(statement);
}

const result = await client.execute(`
  SELECT id, balance_before, balance_after
  FROM credit
  ORDER BY id
`);
const consume = result.rows.find((row) => row.id === 'consume-1');
const grant = result.rows.find((row) => row.id === 'grant-1');

assert.equal(consume?.balance_before, 20);
assert.equal(consume?.balance_after, 15);
assert.equal(grant?.balance_before, null);
assert.equal(grant?.balance_after, null);

client.close();
console.log('Credit balance migration verification passed.');
