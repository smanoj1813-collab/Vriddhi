import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runInBatches, IMPORT_BATCH_SIZE, IMPORT_BATCH_TIMEOUT_MS } from './batchedImport';

const rows = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

test('runInBatches: splits the upload into batches of the configured size', async () => {
  const seen: number[][] = [];
  await runInBatches({
    items: rows(60),
    batchSize: 25,
    run: async (batch) => {
      seen.push(batch);
      return batch.length;
    },
  });

  assert.equal(seen.length, 3);
  assert.deepEqual(seen[0], Array.from({ length: 25 }, (_, k) => k + 1));
  assert.deepEqual(seen[1], Array.from({ length: 25 }, (_, k) => k + 26));
  assert.deepEqual(seen[2], Array.from({ length: 10 }, (_, k) => k + 51));
});

test('runInBatches: an empty upload makes no calls', async () => {
  let calls = 0;
  const outcome = await runInBatches({
    items: [] as number[],
    run: async () => {
      calls++;
      return 1;
    },
  });
  assert.equal(calls, 0);
  assert.deepEqual(outcome.results, []);
  assert.deepEqual(outcome.failures, []);
});

test('runInBatches: a failing batch is recorded by row range and does not lose earlier results', async () => {
  const outcome = await runInBatches<number, string>({
    items: rows(50),
    batchSize: 25,
    run: async (batch) => {
      if (batch[0] === 26) throw new Error('deadline-exceeded');
      return `ok-${batch[0]}`;
    },
  });

  assert.deepEqual(outcome.results, ['ok-1']);
  assert.equal(outcome.failures.length, 1);
  // Row numbers are 1-based and relative to the whole upload, not the batch.
  assert.equal(outcome.failures[0].fromRow, 26);
  assert.equal(outcome.failures[0].toRow, 50);
  assert.match(outcome.failures[0].message, /deadline-exceeded/);
});

test('runInBatches: a single failure is retried by continuing to the next batch', async () => {
  const attempted: number[] = [];
  await runInBatches({
    items: rows(75),
    batchSize: 25,
    run: async (batch) => {
      attempted.push(batch[0]);
      if (batch[0] === 26) throw new Error('transient');
      return batch.length;
    },
  });
  // Batch 2 blew up but batch 3 still ran — one bad batch must not cost the
  // rows after it.
  assert.deepEqual(attempted, [1, 26, 51]);
});

test('runInBatches: two consecutive failures abort the remaining batches', async () => {
  const attempted: number[] = [];
  await runInBatches({
    items: rows(100),
    batchSize: 25,
    run: async (batch) => {
      attempted.push(batch[0]);
      throw new Error('systemic');
    },
  });
  // Back-to-back failures mean something is wrong for everyone, so stop
  // instead of burning through the upload.
  assert.deepEqual(attempted, [1, 26]);
});

test('runInBatches: a fatal error is thrown straight back to the caller', async () => {
  const fatal = Object.assign(new Error('stale deployment'), { fatal: true });
  await assert.rejects(
    () =>
      runInBatches({
        items: rows(100),
        batchSize: 25,
        isFatal: (err: any) => err?.fatal === true,
        run: async () => {
          throw fatal;
        },
      }),
    /stale deployment/
  );
});

test('runInBatches: reports progress before each batch and once at the end', async () => {
  const progress: Array<[number, number, number, number]> = [];
  await runInBatches({
    items: rows(50),
    batchSize: 25,
    onProgress: (p) => progress.push([p.processed, p.total, p.batch, p.batchCount]),
    run: async (batch) => batch.length,
  });

  assert.deepEqual(progress, [
    [0, 50, 1, 2],   // about to run batch 1
    [25, 50, 2, 2],  // about to run batch 2
    [50, 50, 2, 2],  // finished
  ]);
});

test('batch constants: a batch finishes well inside the client deadline', () => {
  // The bug this module exists to fix: the Firebase JS SDK abandons a callable
  // after 70 s by default, and nothing in the app ever overrode it.
  assert.equal(IMPORT_BATCH_TIMEOUT_MS, 120_000);
  assert.ok(IMPORT_BATCH_TIMEOUT_MS > 70_000, 'must exceed the SDK default deadline');
  // Server-side provisioning is sequential, so keep batches small enough that
  // ~1 s/row stays far below the per-call deadline.
  assert.ok(IMPORT_BATCH_SIZE <= 50, 'batch must stay small enough to finish quickly');
});
