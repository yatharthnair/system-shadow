import { getDatabase } from '@/database/database';

import { ATTRIBUTE_KEYS } from './attributes';
import {
  applyXpReward,
  areProgressionStatesEqual,
  DEFAULT_PROGRESSION_RULES,
} from './progression-engine';
import {
  ensureAttributeRows,
  hasXpTransaction,
  insertXpTransaction,
  readLedgerTotals,
  readProgressionState,
  writeProgressionState,
} from './progression-repository';
import { createXpReward } from './xp-reward';

/**
 * Persistence-aware entry point to the progression engine.
 *
 * Guarantees:
 * - **Exactly-once rewards.** Each reward id is recorded in the `xp_transactions` ledger in the
 *   same exclusive SQLite transaction as the totals it changes. A repeated id is reported as a
 *   duplicate and changes nothing — including across app restarts.
 * - **Atomic updates.** Ledger row, player XP and attribute XP commit together or not at all.
 * - **No lost updates.** Writes run one at a time through a queue, and each reads the latest
 *   committed state inside its transaction (never stale in-memory state).
 * - **Self-healing on launch.** `loadProgression` checks stored totals against the ledger and
 *   repairs them from the ledger if they ever disagree.
 */

let writeQueue = Promise.resolve();

/** Runs `task` after every previously queued task settles. */
function enqueueWrite(task) {
  const run = writeQueue.then(task, task);
  writeQueue = run.catch(() => {});
  return run;
}

/** Runs `task(txn)` inside a queued exclusive transaction and returns its result. */
async function runExclusive(task) {
  const db = await getDatabase();
  return enqueueWrite(async () => {
    let result;
    await db.withExclusiveTransactionAsync(async (txn) => {
      result = await task(txn);
    });
    return result;
  });
}

/**
 * Loads progression for app start, verifying it against the ledger.
 * @returns {Promise<{ state: object, repaired: boolean }>}
 */
export function loadProgression(rules = DEFAULT_PROGRESSION_RULES) {
  return runExclusive(async (txn) => {
    await ensureAttributeRows(txn, ATTRIBUTE_KEYS);
    const storedState = await readProgressionState(txn, ATTRIBUTE_KEYS);
    const ledgerState = await readLedgerTotals(txn, ATTRIBUTE_KEYS);

    if (areProgressionStatesEqual(storedState, ledgerState)) {
      return { state: storedState, repaired: false };
    }

    console.warn('[progression] Stored totals disagreed with the XP ledger; repaired from ledger.');
    await writeProgressionState(txn, ledgerState, rules.player.getLevelState(ledgerState.totalXp));
    return { state: ledgerState, repaired: true };
  });
}

/**
 * Awards XP exactly once per reward id.
 *
 * @param {Parameters<typeof createXpReward>[0]} rewardInput
 * @returns {Promise<
 *   | { status: 'applied', transactionId: string, state: object, events: object[] }
 *   | { status: 'duplicate', transactionId: string, state: object, events: [] }
 * >}
 * @throws {import('./progression-errors').ProgressionError} for invalid input (before touching the database).
 */
export async function awardXp(rewardInput, rules = DEFAULT_PROGRESSION_RULES) {
  const reward = createXpReward(rewardInput);

  return runExclusive(async (txn) => {
    if (await hasXpTransaction(txn, reward.id)) {
      const currentState = await readProgressionState(txn, ATTRIBUTE_KEYS);
      return { status: 'duplicate', transactionId: reward.id, state: currentState, events: [] };
    }

    const currentState = await readProgressionState(txn, ATTRIBUTE_KEYS);
    const { state, events } = applyXpReward(currentState, reward, rules);

    await insertXpTransaction(txn, reward);
    await writeProgressionState(txn, state, rules.player.getLevelState(state.totalXp));

    return { status: 'applied', transactionId: reward.id, state, events };
  });
}
