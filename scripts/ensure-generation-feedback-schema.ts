#!/usr/bin/env node
/**
 * Additive, idempotent schema setup for first-generation feedback.
 * Existing support tickets and credit records are preserved.
 */
import { sql } from 'drizzle-orm';

import { db } from '../src/core/db';

const provider = (process.env.DATABASE_PROVIDER || 'sqlite').toLowerCase();

const postgresStatements = [
  `ALTER TABLE "ticket" ADD COLUMN IF NOT EXISTS "category" text DEFAULT 'support' NOT NULL`,
  `ALTER TABLE "ticket" ADD COLUMN IF NOT EXISTS "metadata" text DEFAULT '{}' NOT NULL`,
  `CREATE TABLE IF NOT EXISTS "generation_feedback" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "task_id" text NOT NULL REFERENCES "ai_task"("id") ON DELETE CASCADE,
    "ticket_id" text,
    "status" text DEFAULT 'shown' NOT NULL,
    "usage_scene" text DEFAULT '' NOT NULL,
    "feedback_option" text DEFAULT '' NOT NULL,
    "custom_text" text DEFAULT '' NOT NULL,
    "model_id" text DEFAULT '' NOT NULL,
    "page_path" text DEFAULT '' NOT NULL,
    "locale" text DEFAULT 'en' NOT NULL,
    "reward_credits" integer DEFAULT 10 NOT NULL,
    "reward_transaction_no" text DEFAULT '' NOT NULL,
    "shown_at" timestamp,
    "submitted_at" timestamp,
    "rewarded_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "deleted_at" timestamp
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "uq_generation_feedback_user" ON "generation_feedback" ("user_id")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "uq_generation_feedback_task" ON "generation_feedback" ("task_id")`,
  `CREATE INDEX IF NOT EXISTS "idx_generation_feedback_status" ON "generation_feedback" ("status")`,
];

const mysqlStatements = [
  `ALTER TABLE \`ticket\` ADD COLUMN IF NOT EXISTS \`category\` varchar(50) DEFAULT 'support' NOT NULL`,
  `ALTER TABLE \`ticket\` ADD COLUMN IF NOT EXISTS \`metadata\` longtext NULL`,
  `UPDATE \`ticket\` SET \`metadata\` = '{}' WHERE \`metadata\` IS NULL`,
  `ALTER TABLE \`ticket\` MODIFY \`metadata\` longtext NOT NULL`,
  `CREATE TABLE IF NOT EXISTS \`generation_feedback\` (
    \`id\` varchar(191) PRIMARY KEY NOT NULL,
    \`user_id\` varchar(191) NOT NULL,
    \`task_id\` varchar(191) NOT NULL,
    \`ticket_id\` varchar(191) NULL,
    \`status\` varchar(32) DEFAULT 'shown' NOT NULL,
    \`usage_scene\` varchar(64) DEFAULT '' NOT NULL,
    \`feedback_option\` varchar(64) DEFAULT '' NOT NULL,
    \`custom_text\` longtext NOT NULL,
    \`model_id\` varchar(191) DEFAULT '' NOT NULL,
    \`page_path\` varchar(500) DEFAULT '' NOT NULL,
    \`locale\` varchar(20) DEFAULT 'en' NOT NULL,
    \`reward_credits\` int DEFAULT 10 NOT NULL,
    \`reward_transaction_no\` varchar(191) DEFAULT '' NOT NULL,
    \`shown_at\` timestamp NULL,
    \`submitted_at\` timestamp NULL,
    \`rewarded_at\` timestamp NULL,
    \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    \`deleted_at\` timestamp NULL,
    UNIQUE KEY \`uq_generation_feedback_user\` (\`user_id\`),
    UNIQUE KEY \`uq_generation_feedback_task\` (\`task_id\`),
    KEY \`idx_generation_feedback_status\` (\`status\`),
    CONSTRAINT \`generation_feedback_user_id_user_id_fk\`
      FOREIGN KEY (\`user_id\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE,
    CONSTRAINT \`generation_feedback_task_id_ai_task_id_fk\`
      FOREIGN KEY (\`task_id\`) REFERENCES \`ai_task\` (\`id\`) ON DELETE CASCADE
  )`,
];

const sqliteCreateStatements = [
  `CREATE TABLE IF NOT EXISTS "generation_feedback" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "task_id" text NOT NULL REFERENCES "ai_task"("id") ON DELETE CASCADE,
    "ticket_id" text,
    "status" text DEFAULT 'shown' NOT NULL,
    "usage_scene" text DEFAULT '' NOT NULL,
    "feedback_option" text DEFAULT '' NOT NULL,
    "custom_text" text DEFAULT '' NOT NULL,
    "model_id" text DEFAULT '' NOT NULL,
    "page_path" text DEFAULT '' NOT NULL,
    "locale" text DEFAULT 'en' NOT NULL,
    "reward_credits" integer DEFAULT 10 NOT NULL,
    "reward_transaction_no" text DEFAULT '' NOT NULL,
    "shown_at" integer,
    "submitted_at" integer,
    "rewarded_at" integer,
    "created_at" integer DEFAULT (unixepoch() * 1000) NOT NULL,
    "updated_at" integer DEFAULT (unixepoch() * 1000) NOT NULL,
    "deleted_at" integer
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "uq_generation_feedback_user" ON "generation_feedback" ("user_id")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "uq_generation_feedback_task" ON "generation_feedback" ("task_id")`,
  `CREATE INDEX IF NOT EXISTS "idx_generation_feedback_status" ON "generation_feedback" ("status")`,
];

function errorText(error: unknown) {
  const messages: string[] = [];
  let current: unknown = error;
  while (current && typeof current === 'object') {
    if ('message' in current) messages.push(String(current.message));
    current = 'cause' in current ? current.cause : null;
  }
  return messages.join(' ');
}

async function main() {
  const database = db();
  const execute = (statement: string) => {
    const query = sql.raw(statement);
    return ['sqlite', 'turso', 'd1'].includes(provider)
      ? database.run(query)
      : database.execute(query);
  };

  console.log(`[generation-feedback] Ensuring schema for ${provider}`);
  if (provider === 'postgres' || provider === 'postgresql') {
    for (const statement of postgresStatements) await execute(statement);
  } else if (provider === 'mysql') {
    for (const statement of mysqlStatements) await execute(statement);
  } else if (['sqlite', 'turso', 'd1'].includes(provider)) {
    for (const statement of [
      `ALTER TABLE "ticket" ADD COLUMN "category" text DEFAULT 'support' NOT NULL`,
      `ALTER TABLE "ticket" ADD COLUMN "metadata" text DEFAULT '{}' NOT NULL`,
    ]) {
      try {
        await execute(statement);
      } catch (error) {
        if (!/duplicate column|already exists/i.test(errorText(error))) {
          throw error;
        }
      }
    }
    for (const statement of sqliteCreateStatements) await execute(statement);
  } else {
    throw new Error(
      `Generation-feedback schema does not support DATABASE_PROVIDER=${provider}`
    );
  }

  await execute(
    'SELECT user_id, task_id, status FROM generation_feedback LIMIT 1'
  );
  await execute('SELECT category, metadata FROM ticket LIMIT 1');
  console.log('[generation-feedback] Schema is ready');
}

main().catch((error) => {
  console.error(
    '[generation-feedback] Schema setup failed:',
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
