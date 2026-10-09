#!/usr/bin/env node
/**
 * Idempotently creates the two tables required by the referral feature.
 *
 * This is intentionally narrower than `db:push`: it never compares or mutates
 * unrelated tables. Vercel runs it before building so a code deployment cannot
 * publish the referral UI without its database prerequisites.
 */
import { sql } from 'drizzle-orm';

import { db } from '../src/core/db';

const provider = (process.env.DATABASE_PROVIDER || 'sqlite').toLowerCase();

const postgresStatements = [
  `CREATE TABLE IF NOT EXISTS "referral_code" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "code" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "referral_code_user_id_unique"
    ON "referral_code" ("user_id")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "referral_code_code_unique"
    ON "referral_code" ("code")`,
  `CREATE INDEX IF NOT EXISTS "idx_referral_code_code"
    ON "referral_code" ("code")`,
  `CREATE TABLE IF NOT EXISTS "referral" (
    "id" text PRIMARY KEY NOT NULL,
    "referrer_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "referred_user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "source_hash" text DEFAULT '' NOT NULL,
    "reward_credits" integer DEFAULT 10 NOT NULL,
    "status" text DEFAULT 'pending' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "rewarded_at" timestamp
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "referral_referred_user_id_unique"
    ON "referral" ("referred_user_id")`,
  `CREATE INDEX IF NOT EXISTS "idx_referral_referrer"
    ON "referral" ("referrer_id")`,
  `CREATE INDEX IF NOT EXISTS "idx_referral_source"
    ON "referral" ("source_hash")`,
];

const sqliteStatements = [
  `CREATE TABLE IF NOT EXISTS "referral_code" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "code" text NOT NULL,
    "created_at" integer DEFAULT (unixepoch() * 1000) NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "referral_code_user_id_unique"
    ON "referral_code" ("user_id")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "referral_code_code_unique"
    ON "referral_code" ("code")`,
  `CREATE INDEX IF NOT EXISTS "idx_referral_code_code"
    ON "referral_code" ("code")`,
  `CREATE TABLE IF NOT EXISTS "referral" (
    "id" text PRIMARY KEY NOT NULL,
    "referrer_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "referred_user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "source_hash" text DEFAULT '' NOT NULL,
    "reward_credits" integer DEFAULT 10 NOT NULL,
    "status" text DEFAULT 'pending' NOT NULL,
    "created_at" integer DEFAULT (unixepoch() * 1000) NOT NULL,
    "rewarded_at" integer
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "referral_referred_user_id_unique"
    ON "referral" ("referred_user_id")`,
  `CREATE INDEX IF NOT EXISTS "idx_referral_referrer"
    ON "referral" ("referrer_id")`,
  `CREATE INDEX IF NOT EXISTS "idx_referral_source"
    ON "referral" ("source_hash")`,
];

const mysqlStatements = [
  `CREATE TABLE IF NOT EXISTS \`referral_code\` (
    \`id\` varchar(191) PRIMARY KEY NOT NULL,
    \`user_id\` varchar(191) NOT NULL,
    \`code\` varchar(191) NOT NULL,
    \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY \`referral_code_user_id_unique\` (\`user_id\`),
    UNIQUE KEY \`referral_code_code_unique\` (\`code\`),
    KEY \`idx_referral_code_code\` (\`code\`),
    CONSTRAINT \`referral_code_user_id_user_id_fk\`
      FOREIGN KEY (\`user_id\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS \`referral\` (
    \`id\` varchar(191) PRIMARY KEY NOT NULL,
    \`referrer_id\` varchar(191) NOT NULL,
    \`referred_user_id\` varchar(191) NOT NULL,
    \`source_hash\` varchar(191) DEFAULT '' NOT NULL,
    \`reward_credits\` int DEFAULT 10 NOT NULL,
    \`status\` varchar(32) DEFAULT 'pending' NOT NULL,
    \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    \`rewarded_at\` timestamp NULL,
    UNIQUE KEY \`referral_referred_user_id_unique\` (\`referred_user_id\`),
    KEY \`idx_referral_referrer\` (\`referrer_id\`),
    KEY \`idx_referral_source\` (\`source_hash\`),
    CONSTRAINT \`referral_referrer_id_user_id_fk\`
      FOREIGN KEY (\`referrer_id\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE,
    CONSTRAINT \`referral_referred_user_id_user_id_fk\`
      FOREIGN KEY (\`referred_user_id\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE
  )`,
];

function statementsForProvider() {
  if (provider === 'postgres' || provider === 'postgresql') {
    return postgresStatements;
  }
  if (provider === 'mysql') return mysqlStatements;
  if (provider === 'sqlite' || provider === 'turso') return sqliteStatements;
  throw new Error(
    `Referral schema repair does not support DATABASE_PROVIDER=${provider}`
  );
}

async function main() {
  console.log(`[referrals] Ensuring schema for ${provider}`);
  const database = db();
  const execute = (statement: string) => {
    const query = sql.raw(statement);
    if (provider === 'sqlite' || provider === 'turso') {
      return database.run(query);
    }
    return database.execute(query);
  };
  for (const statement of statementsForProvider()) {
    await execute(statement);
  }

  await execute('SELECT 1 FROM referral_code LIMIT 1');
  await execute('SELECT 1 FROM referral LIMIT 1');
  console.log('[referrals] Schema is ready');
}

main().catch((error) => {
  console.error(
    '[referrals] Schema setup failed:',
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
