import assert from 'node:assert/strict';

import {
  calculateExpirationBalanceSnapshots,
  consume,
  CreditStatus,
  CreditTransactionType,
  grant,
  revoke,
} from '../src/modules/credits/service';

type Grant = {
  id: string;
  transactionNo: string;
  remainingCredits: number;
};

function createCreditTransaction(grants: Grant[]) {
  const inserted: Record<string, unknown>[] = [];
  let updateIndex = 0;

  const tx = {
    select(fields?: Record<string, unknown>) {
      return {
        from() {
          return {
            where() {
              if (fields?.total) {
                return Promise.resolve([
                  {
                    total: String(
                      grants.reduce(
                        (total, item) => total + item.remainingCredits,
                        0
                      )
                    ),
                  },
                ]);
              }

              let limited = false;
              const query = {
                orderBy() {
                  return query;
                },
                limit() {
                  limited = true;
                  return query;
                },
                for() {
                  return Promise.resolve(
                    limited
                      ? grants.filter((item) => item.remainingCredits > 0)
                      : []
                  );
                },
              };
              return query;
            },
          };
        },
      };
    },
    update() {
      return {
        set(values: { remainingCredits?: number }) {
          return {
            where() {
              if (typeof values.remainingCredits === 'number') {
                grants[updateIndex].remainingCredits = values.remainingCredits;
                updateIndex += 1;
              }
              return Promise.resolve();
            },
          };
        },
      };
    },
    insert() {
      return {
        values(value: Record<string, unknown>) {
          inserted.push(value);
          return Promise.resolve();
        },
      };
    },
  };

  return { tx, inserted };
}

async function verifySingleGrantBalanceSnapshot() {
  const fixture = createCreditTransaction([
    { id: 'grant-1', transactionNo: 'grant-no-1', remainingCredits: 20 },
  ]);

  const result = await consume({
    userId: 'user-1',
    credits: 4,
    scene: 'ai_task',
    tx: fixture.tx,
  });

  assert.equal(result.success, true);
  assert.equal(fixture.inserted.length, 1);
  assert.equal(fixture.inserted[0].credits, -4);
  assert.equal(fixture.inserted[0].remainingCredits, 16);
  assert.equal(fixture.inserted[0].balanceBefore, 20);
  assert.equal(fixture.inserted[0].balanceAfter, 16);
}

async function verifyMultipleGrantBalanceSnapshot() {
  const fixture = createCreditTransaction([
    { id: 'grant-1', transactionNo: 'grant-no-1', remainingCredits: 3 },
    { id: 'grant-2', transactionNo: 'grant-no-2', remainingCredits: 10 },
  ]);

  const result = await consume({
    userId: 'user-2',
    credits: 5,
    scene: 'ai_task',
    tx: fixture.tx,
  });

  assert.equal(result.success, true);
  assert.equal(fixture.inserted.length, 1);
  assert.equal(fixture.inserted[0].remainingCredits, 8);
  assert.equal(fixture.inserted[0].balanceBefore, 13);
  assert.equal(fixture.inserted[0].balanceAfter, 8);
}

async function verifyGrantBalanceSnapshot() {
  const fixture = createCreditTransaction([
    { id: 'grant-1', transactionNo: 'grant-no-1', remainingCredits: 16 },
  ]);

  await grant({
    userId: 'user-3',
    credits: 20,
    scene: 'gift',
    tx: fixture.tx,
  });

  assert.equal(fixture.inserted.length, 1);
  assert.equal(fixture.inserted[0].credits, 20);
  assert.equal(fixture.inserted[0].remainingCredits, 20);
  assert.equal(fixture.inserted[0].balanceBefore, 16);
  assert.equal(fixture.inserted[0].balanceAfter, 36);
}

function createRevokeTransaction() {
  const consumeRecord = {
    id: 'consume-1',
    userId: 'user-4',
    userEmail: 'user@example.com',
    transactionNo: 'consume-no-1',
    transactionType: CreditTransactionType.CONSUME,
    credits: -5,
    status: CreditStatus.ACTIVE,
    consumedDetail: JSON.stringify([
      { creditId: 'source-1', creditsConsumed: 5 },
    ]),
  };
  const source = {
    id: 'source-1',
    userId: 'user-4',
    userEmail: 'user@example.com',
    orderNo: '',
    subscriptionNo: '',
    transactionNo: 'source-no-1',
    transactionScene: 'signup',
    remainingCredits: 15,
    expiresAt: null,
  };
  const inserted: Record<string, any>[] = [];
  let selectedRecord = 0;

  const tx = {
    select(fields?: Record<string, unknown>) {
      return {
        from() {
          return {
            where() {
              if (fields?.total) {
                const restored = inserted.reduce(
                  (total, item) =>
                    item.transactionType === CreditTransactionType.GRANT
                      ? total + Number(item.remainingCredits || 0)
                      : total,
                  0
                );
                return Promise.resolve([{ total: String(15 + restored) }]);
              }

              const query: any = {
                limit() {
                  return query;
                },
                for() {
                  if (fields?.id) return Promise.resolve([{ id: 'user-4' }]);
                  if (consumeRecord.status !== CreditStatus.ACTIVE) {
                    return Promise.resolve([]);
                  }
                  selectedRecord += 1;
                  if (selectedRecord === 1) {
                    return Promise.resolve(
                      consumeRecord.status === CreditStatus.ACTIVE
                        ? [consumeRecord]
                        : []
                    );
                  }
                  return Promise.resolve([source]);
                },
              };
              return query;
            },
          };
        },
      };
    },
    insert() {
      return {
        values(value: Record<string, any>) {
          inserted.push(value);
          return Promise.resolve();
        },
      };
    },
    update() {
      return {
        set(values: { status?: CreditStatus }) {
          return {
            where() {
              if (values.status) consumeRecord.status = values.status;
              return Promise.resolve();
            },
          };
        },
      };
    },
  };

  return { tx, inserted, consumeRecord };
}

async function verifyFailedTaskRestoration() {
  const fixture = createRevokeTransaction();
  const result = await revoke('consume-1', fixture.tx);

  assert.equal(result.restored, 5);
  assert.equal(fixture.inserted.length, 1);
  assert.equal(fixture.inserted[0].credits, 5);
  assert.equal(fixture.inserted[0].remainingCredits, 5);
  assert.equal(fixture.inserted[0].balanceBefore, 15);
  assert.equal(fixture.inserted[0].balanceAfter, 20);
  assert.equal(fixture.consumeRecord.status, CreditStatus.REVERSED);

  const repeated = await revoke('consume-1', fixture.tx);
  assert.equal(repeated.restored, 0);
  assert.equal(fixture.inserted.length, 1);
}

function verifyExpirationSnapshots() {
  const snapshots = calculateExpirationBalanceSnapshots(12, [5, 3]);
  assert.deepEqual(snapshots, [
    { amount: 5, balanceBefore: 20, balanceAfter: 15 },
    { amount: 3, balanceBefore: 15, balanceAfter: 12 },
  ]);
}

await verifySingleGrantBalanceSnapshot();
await verifyMultipleGrantBalanceSnapshot();
await verifyGrantBalanceSnapshot();
await verifyFailedTaskRestoration();
verifyExpirationSnapshots();

console.log('Credit ledger verification passed.');
