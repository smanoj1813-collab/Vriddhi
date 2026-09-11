/**
 * Batched callable runner for bulk provisioning.
 *
 * WHY THIS EXISTS
 *
 * Firebase Authentication has no batch-create, so the provisioning callables
 * walk their rows one at a time (`for (let i = 0; i < students.length; i++)`).
 * A few hundred rows therefore takes minutes of wall-clock time.
 *
 * The server allows it: `bulkCreateStudentAccounts` and `bulkProvisionStaff`
 * are both deployed with `timeoutSeconds: 540`. The client does not. The
 * Firebase JS SDK's `HttpsCallableOptions.timeout` defaults to **70 000 ms**,
 * and its watchdog rejects with `FunctionsError('deadline-exceeded', ...)`.
 * Nothing in this repository ever passed a `timeout`, so any import large
 * enough to outlast 70 s failed with `FirebaseError: deadline-exceeded`.
 *
 * The dangerous part of that failure is what happens next: abandoning the HTTP
 * request does **not** cancel the Cloud Function. It keeps running to
 * completion server-side, so the accounts really are created — while the
 * response, which is the only place the generated one-time passwords ever
 * exist, is discarded. The operator sees an error, assumes nothing happened,
 * and is left with provisioned students whose credentials nobody knows.
 *
 * Sending the rows in batches small enough for each call to finish well inside
 * the deadline fixes all of that at once:
 *
 *   - every request completes in seconds, so the watchdog never fires
 *   - progress is observable instead of a five-minute blank stare
 *   - a failure in one batch no longer destroys the work already done,
 *     including the credentials already minted
 *   - the server's 500-row-per-call cap stops being a ceiling on the upload
 */

/**
 * Rows per request.
 *
 * Deliberately small. Each row costs roughly three Firebase Auth round-trips
 * (create, set claims, read back to verify) plus two Firestore writes, and
 * every Auth call is wrapped in `withAuthQuotaRetry` — up to 4 attempts with
 * exponential backoff (400/800/1600 ms + jitter) whenever the project is
 * throttled. A throttled row can therefore take ~10 s, so a large batch is
 * exactly what makes a request overrun its deadline. Ten rows keeps the worst
 * case near 100 s, a third of the budget below.
 */
export const IMPORT_BATCH_SIZE = 10;

/**
 * Per-call client deadline, in milliseconds. Explicitly set on every
 * `httpsCallable` so the 70 s SDK default can never apply. Large enough to
 * absorb a badly throttled batch, still comfortably inside the callables' own
 * 540 s server limit — so a genuinely wedged batch fails here, with a usable
 * error, rather than being killed server-side.
 */
export const IMPORT_BATCH_TIMEOUT_MS = 300_000;

export interface BatchProgress {
  /** Rows the backend has already finished, excluding the in-flight batch. */
  processed: number;
  total: number;
  /** 1-based index of the batch being reported. */
  batch: number;
  batchCount: number;
}

/** A batch that threw. Row numbers are 1-based and relative to the whole upload. */
export interface BatchFailure {
  fromRow: number;
  toRow: number;
  message: string;
}

export interface BatchMeta {
  /** 0-based index of the first row of this batch within the full upload. */
  offset: number;
  /** 0-based batch index. */
  index: number;
  batchCount: number;
}

export interface BatchedOutcome<TResult> {
  results: TResult[];
  failures: BatchFailure[];
}

export interface RunInBatchesOptions<TItem, TResult> {
  items: TItem[];
  run: (batch: TItem[], meta: BatchMeta) => Promise<TResult>;
  onProgress?: (progress: BatchProgress) => void;
  batchSize?: number;
  /**
   * Give up immediately instead of recording the failure and moving on.
   * Two batches failing back to back almost always means something systemic —
   * an expired token, a revoked permission, a stale deployment, an exhausted
   * quota — rather than twenty-five bad rows.
   */
  maxConsecutiveFailures?: number;
  /** Errors that make continuing pointless. Thrown straight back to the caller. */
  isFatal?: (error: unknown) => boolean;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function runInBatches<TItem, TResult>(
  options: RunInBatchesOptions<TItem, TResult>
): Promise<BatchedOutcome<TResult>> {
  const {
    items,
    run,
    onProgress,
    batchSize = IMPORT_BATCH_SIZE,
    maxConsecutiveFailures = 2,
    isFatal,
  } = options;

  const results: TResult[] = [];
  const failures: BatchFailure[] = [];
  if (items.length === 0) return { results, failures };

  const batches = chunk(items, batchSize);
  const batchCount = batches.length;
  let consecutiveFailures = 0;

  for (let index = 0; index < batchCount; index++) {
    const batch = batches[index];
    const offset = index * batchSize;

    onProgress?.({ processed: offset, total: items.length, batch: index + 1, batchCount });

    try {
      results.push(await run(batch, { offset, index, batchCount }));
      consecutiveFailures = 0;
    } catch (error: any) {
      if (isFatal?.(error)) throw error;
      consecutiveFailures += 1;
      failures.push({
        fromRow: offset + 1,
        toRow: offset + batch.length,
        message: error?.message || String(error),
      });
      if (consecutiveFailures >= maxConsecutiveFailures) break;
    }
  }

  onProgress?.({ processed: items.length, total: items.length, batch: batchCount, batchCount });

  return { results, failures };
}
