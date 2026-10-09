#!/usr/bin/env node
/**
 * Idempotently adds the content-safety audit fields and account state table.
 * This script is intentionally additive: it never drops or rewrites data.
 */
import { sql } from 'drizzle-orm';

import { db } from '../src/core/db';

const provider = (process.env.DATABASE_PROVIDER || 'sqlite').toLowerCase();

const columns = [
  ['safety_status', "text DEFAULT 'unchecked' NOT NULL"],
  ['safety_category', "text DEFAULT '' NOT NULL"],
  ['safety_severity', "text DEFAULT '' NOT NULL"],
  ['safety_source', "text DEFAULT '' NOT NULL"],
  ['safety_confidence', 'integer DEFAULT 0 NOT NULL'],
  ['safety_review_status', "text DEFAULT 'not_required' NOT NULL"],
  ['safety_action', "text DEFAULT '' NOT NULL"],
] as const;

const postgresStatements = [
  `CREATE TABLE IF NOT EXISTS "user_safety_state" (
    "user_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "status" text DEFAULT 'active' NOT NULL,
    "strike_points" integer DEFAULT 0 NOT NULL,
    "warning_count" integer DEFAULT 0 NOT NULL,
    "restricted_until" timestamp,
    "last_violation_at" timestamp,
    "last_category" text DEFAULT '' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`,
  ...columns.map(
    ([name, definition]) =>
      `ALTER TABLE "ai_task" ADD COLUMN IF NOT EXISTS "${name}" ${definition}`
  ),
  `CREATE INDEX IF NOT EXISTS "idx_user_safety_status"
    ON "user_safety_state" ("status")`,
  `CREATE INDEX IF NOT EXISTS "idx_ai_task_safety_status_created"
    ON "ai_task" ("safety_status", "created_at")`,
];

const mysqlStatements = [
  `CREATE TABLE IF NOT EXISTS \`user_safety_state\` (
    \`user_id\` varchar(191) PRIMARY KEY NOT NULL,
    \`status\` varchar(32) DEFAULT 'active' NOT NULL,
    \`strike_points\` int DEFAULT 0 NOT NULL,
    \`warning_count\` int DEFAULT 0 NOT NULL,
    \`restricted_until\` timestamp NULL,
    \`last_violation_at\` timestamp NULL,
    \`last_category\` varchar(191) DEFAULT '' NOT NULL,
    \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    KEY \`idx_user_safety_status\` (\`status\`),
    CONSTRAINT \`user_safety_state_user_id_user_id_fk\`
      FOREIGN KEY (\`user_id\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE
  )`,
  ...columns.map(
    ([name, definition]) =>
      `ALTER TABLE \`ai_task\` ADD COLUMN IF NOT EXISTS \`${name}\` ${definition}`
  ),
  `CREATE INDEX IF NOT EXISTS \`idx_ai_task_safety_status_created\`
    ON \`ai_task\` (\`safety_status\`, \`created_at\`)`,
];

const sqliteTableStatements = [
  `CREATE TABLE IF NOT EXISTS "user_safety_state" (
    "user_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "status" text DEFAULT 'active' NOT NULL,
    "strike_points" integer DEFAULT 0 NOT NULL,
    "warning_count" integer DEFAULT 0 NOT NULL,
    "restricted_until" integer,
    "last_violation_at" integer,
    "last_category" text DEFAULT '' NOT NULL,
    "created_at" integer DEFAULT (unixepoch() * 1000) NOT NULL,
    "updated_at" integer DEFAULT (unixepoch() * 1000) NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "idx_user_safety_status"
    ON "user_safety_state" ("status")`,
  `CREATE INDEX IF NOT EXISTS "idx_ai_task_safety_status_created"
    ON "ai_task" ("safety_status", "created_at")`,
];

async function main() {
  const database = db();
  const execute = (statement: string) => {
    const query = sql.raw(statement);
    if (provider === 'sqlite' || provider === 'turso') {
      return database.run(query);
    }
    return database.execute(query);
  };

  console.log(`[content-safety] Ensuring schema for ${provider}`);
  if (provider === 'postgres' || provider === 'postgresql') {
    for (const statement of postgresStatements) await execute(statement);
  } else if (provider === 'mysql') {
    for (const statement of mysqlStatements) await execute(statement);
  } else if (provider === 'sqlite' || provider === 'turso') {
    for (const [name, definition] of columns) {
      try {
        await execute(
          `ALTER TABLE "ai_task" ADD COLUMN "${name}" ${definition}`
        );
      } catch (error) {
        const messages: string[] = [];
        let current: unknown = error;
        while (current && typeof current === 'object') {
          if ('message' in current) messages.push(String(current.message));
          current = 'cause' in current ? current.cause : null;
        }
        if (!/duplicate column|already exists/i.test(messages.join(' '))) {
          throw error;
        }
      }
    }
    for (const statement of sqliteTableStatements) await execute(statement);
  } else {
    throw new Error(
      `Content-safety schema setup does not support DATABASE_PROVIDER=${provider}`
    );
  }

  await execute(
    'SELECT safety_status, safety_review_status FROM ai_task LIMIT 1'
  );
  await execute('SELECT user_id, status FROM user_safety_state LIMIT 1');
  console.log('[content-safety] Schema is ready');
}

main().catch((error) => {
  console.error(
    '[content-safety] Schema setup failed:',
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
