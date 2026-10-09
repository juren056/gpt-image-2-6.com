import { db } from '@/core/db';
import { config, user } from '@/config/db/schema';
import { isSecretConfigKey } from '@/modules/config/service';
import { hasPermission } from '@/modules/rbac/service';
import { decryptSecret, isEncryptedSecret } from '@/lib/crypto';

async function main() {
  if (process.env.DATABASE_PROVIDER !== 'postgres') {
    throw new Error(
      'This check must run with the production Postgres environment.'
    );
  }

  const configRows = await db().select().from(config);
  type ConfigRow = typeof config.$inferSelect;
  const secretRows = configRows.filter(
    (row: ConfigRow) => row.value && isSecretConfigKey(row.name)
  );
  const encryptedRows = secretRows.filter((row: ConfigRow) =>
    isEncryptedSecret(row.value || '')
  );
  const plaintextNames = secretRows
    .filter((row: ConfigRow) => !isEncryptedSecret(row.value || ''))
    .map((row: ConfigRow) => row.name)
    .sort();

  let decryptableCount = 0;
  for (const row of encryptedRows) {
    if ((await decryptSecret(row.value || '')) !== null) decryptableCount += 1;
  }

  const users = await db().select({ id: user.id }).from(user).limit(100);
  let adminUserFound = false;
  let ordinaryUserFound = false;
  let ordinaryUserDenied = false;

  for (const row of users) {
    const allowed = await hasPermission(row.id, 'admin.users.read');
    if (allowed) {
      adminUserFound = true;
    } else {
      ordinaryUserFound = true;
      ordinaryUserDenied = true;
    }
  }

  console.log(
    JSON.stringify(
      {
        encryptionKeyConfigured: Boolean(process.env.CONFIG_ENCRYPTION_KEY),
        storedSecretCount: secretRows.length,
        encryptedSecretCount: encryptedRows.length,
        decryptableSecretCount: decryptableCount,
        plaintextSecretNames: plaintextNames,
        adminUserFound,
        ordinaryUserFound,
        ordinaryUserDenied,
      },
      null,
      2
    )
  );

  if (
    !process.env.CONFIG_ENCRYPTION_KEY ||
    plaintextNames.length > 0 ||
    decryptableCount !== encryptedRows.length ||
    !adminUserFound ||
    !ordinaryUserFound ||
    !ordinaryUserDenied
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : 'Security check failed'
  );
  process.exitCode = 1;
});
