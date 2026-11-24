import { getDatabase } from './database';

/**
 * Every database write in the app goes through this queue.
 *
 * expo-sqlite's exclusive transactions make other concurrent writes fail with "database is locked",
 * so writes are serialized here: each task runs only after the previous one settles, inside its own
 * exclusive transaction, and reads the latest committed data. Features can compose several steps
 * (e.g. record a quest completion + award its XP) into one atomic task.
 */
let writeQueue = Promise.resolve();

function enqueue(task) {
  const run = writeQueue.then(task, task);
  writeQueue = run.catch(() => {});
  return run;
}

/**
 * Runs `task(txn)` in a queued exclusive transaction. Commits if it resolves, rolls back if it throws.
 * All queries inside must use `txn`. Never call `runExclusiveWrite` from inside a task (it would deadlock).
 */
export async function runExclusiveWrite(task) {
  const db = await getDatabase();
  return enqueue(async () => {
    let result;
    await db.withExclusiveTransactionAsync(async (txn) => {
      result = await task(txn);
    });
    return result;
  });
}
