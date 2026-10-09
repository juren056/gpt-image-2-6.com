#!/usr/bin/env node
/**
 * Idempotently adds account access state and immutable status audit tables.
 * Additive only: existing users, sessions, credits and safety history remain.
 */
import { sql } from 'drizzle-orm';

import { db } from '../src/core/db';

const provider = (process.env.DATABASE_PROVIDER || 'sqlite').toLowerCase();

const postgresStatements = [
  `CREATE TABLE IF NOT EXISTS "user_account_state" (
    "user_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "status" text DEFAULT 'active' NOT NULL,
    "reason_code" text DEFAULT '' NOT NULL,
    "reason" text DEFAULT '' NOT NULL,
    "suspended_until" timestamp,
    "changed_by" text,
    "version" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "idx_user_account_status"
    ON "user_account_state" ("status")`,
  `CREATE TABLE IF NOT EXISTS "user_status_audit" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "actor_user_id" text NOT NULL,
    "scope" text NOT NULL,
    "previous_status" text NOT NULL,
    "next_status" text NOT NULL,
    "reason_code" text NOT NULL,
    "reason" text NOT NULL,
    "effective_until" timestamp,
    "request_id" text DEFAULT '' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "idx_user_status_audit_user_created"
    ON "user_status_audit" ("user_id", "created_at")`,
  `CREATE INDEX IF NOT EXISTS "idx_user_status_audit_actor_created"
    ON "user_status_audit" ("actor_user_id", "created_at")`,
];

const mysqlStatements = [
  `CREATE TABLE IF NOT EXISTS \`user_account_state\` (
    \`user_id\` varchar(191) PRIMARY KEY NOT NULL,
    \`status\` varchar(32) DEFAULT 'active' NOT NULL,
    \`reason_code\` varchar(80) DEFAULT '' NOT NULL,
    \`reason\` text NOT NULL,
    \`suspended_until\` timestamp NULL,
    \`changed_by\` varchar(191) NULL,
    \`version\` int DEFAULT 0 NOT NULL,
    \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    KEY \`idx_user_account_status\` (\`status\`),
    CONSTRAINT \`user_account_state_user_id_user_id_fk\`
      FOREIGN KEY (\`user_id\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS \`user_status_audit\` (
    \`id\` varchar(191) PRIMARY KEY NOT NULL,
    \`user_id\` varchar(191) NOT NULL,
    \`actor_user_id\` varchar(191) NOT NULL,
    \`scope\` varchar(32) NOT NULL,
    \`previous_status\` varchar(32) NOT NULL,
    \`next_status\` varchar(32) NOT NULL,
    \`reason_code\` varchar(80) NOT NULL,
    \`reason\` text NOT NULL,
    \`effective_until\` timestamp NULL,
    \`request_id\` varchar(191) DEFAULT '' NOT NULL,
    \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    KEY \`idx_user_status_audit_user_created\` (\`user_id\`, \`created_at\`),
    KEY \`idx_user_status_audit_actor_created\` (\`actor_user_id\`, \`created_at\`),
    CONSTRAINT \`user_status_audit_user_id_user_id_fk\`
      FOREIGN KEY (\`user_id\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE
  )`,
];

const sqliteStatements = [
  `CREATE TABLE IF NOT EXISTS "user_account_state" (
    "user_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "status" text DEFAULT 'active' NOT NULL,
    "reason_code" text DEFAULT '' NOT NULL,
    "reason" text DEFAULT '' NOT NULL,
    "suspended_until" integer,
    "changed_by" text,
    "version" integer DEFAULT 0 NOT NULL,
    "created_at" integer DEFAULT (unixepoch() * 1000) NOT NULL,
    "updated_at" integer DEFAULT (unixepoch() * 1000) NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "idx_user_account_status"
    ON "user_account_state" ("status")`,
  `CREATE TABLE IF NOT EXISTS "user_status_audit" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "actor_user_id" text NOT NULL,
    "scope" text NOT NULL,
    "previous_status" text NOT NULL,
    "next_status" text NOT NULL,
    "reason_code" text NOT NULL,
    "reason" text NOT NULL,
    "effective_until" integer,
    "request_id" text DEFAULT '' NOT NULL,
    "created_at" integer DEFAULT (unixepoch() * 1000) NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "idx_user_status_audit_user_created"
    ON "user_status_audit" ("user_id", "created_at")`,
  `CREATE INDEX IF NOT EXISTS "idx_user_status_audit_actor_created"
    ON "user_status_audit" ("actor_user_id", "created_at")`,
];

async function main() {
  const database = db();
  const execute = (statement: string) => {
    const query = sql.raw(statement);
    if (['sqlite', 'turso', 'd1'].includes(provider)) {
      return database.run(query);
    }
    return database.execute(query);
  };

  console.log(`[account-status] Ensuring schema for ${provider}`);
  const statements =
    provider === 'postgres' || provider === 'postgresql'
      ? postgresStatements
      : provider === 'mysql'
        ? mysqlStatements
        : ['sqlite', 'turso', 'd1'].includes(provider)
          ? sqliteStatements
          : null;
  if (!statements) {
    throw new Error(
      `Account-status schema does not support DATABASE_PROVIDER=${provider}`
    );
  }
  for (const statement of statements) await execute(statement);
  await execute('SELECT user_id, status FROM user_account_state LIMIT 1');
  await execute('SELECT user_id, scope FROM user_status_audit LIMIT 1');
  console.log('[account-status] Schema is ready');
}

main().catch((error) => {
  console.error(
    '[account-status] Schema setup failed:',
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
