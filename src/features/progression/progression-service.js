import { runExclusiveWrite } from '@/database/exclusive-write';

import { ATTRIBUTE_KEYS } from './attributes';
import {
  applyXpReward,
  areProgressionStatesEqual,
  DEFAULT_PROGRESSION_RULES,
  reverseXpReward,
} from './progression-engine';
import { ProgressionError } from './progression-errors';
import {
  ensureAttributeRows,
  hasXpTransaction,
  insertXpReversal,
  insertXpTransaction,
  readLedgerTotals,
  readProgressionState,
  readXpTransaction,
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
 * - **Safe reversals.** Undoing appends a `reversal` entry for the original award (never deletes);
 *   an award can be reversed at most once, and reversing restores the exact previous totals.
 * - **Atomic updates.** Ledger rows, player XP and attribute XP commit together or not at all.
 * - **No lost updates.** All writes run one at a time (see `database/exclusive-write.js`), and
 *   each reads the latest committed state inside its transaction.
 * - **Self-healing on launch.** `loadProgression` checks stored totals against the ledger and
 *   repairs them from the ledger if they ever disagree.
 *
 * `*InTransaction` variants take an open `txn` so other features (quests) can combine their own
 * writes with an XP change atomically.
 */

/**
 * Loads progression for app start, verifying it against the ledger.
 * @returns {Promise<{ state: object, repaired: boolean }>}
 */
export function loadProgression(rules = DEFAULT_PROGRESSION_RULES) {
  return runExclusiveWrite(async (txn) => {
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
 * Applies a validated reward (from `createXpReward`) inside an open transaction.
 * @returns {Promise<
 *   | { status: 'applied', transactionId: string, state: object, events: object[] }
 *   | { status: 'duplicate', transactionId: string, state: object, events: [] }
 * >}
 */
export async function applyXpRewardInTransaction(txn, reward, rules = DEFAULT_PROGRESSION_RULES) {
  const currentState = await readProgressionState(txn, ATTRIBUTE_KEYS);

  if (await hasXpTransaction(txn, reward.id)) {
    return { status: 'duplicate', transactionId: reward.id, state: currentState, events: [] };
  }

  const { state, events } = applyXpReward(currentState, reward, rules);
  await insertXpTransaction(txn, reward);
  await writeProgressionState(txn, state, rules.player.getLevelState(state.totalXp));

  return { status: 'applied', transactionId: reward.id, state, events };
}

/**
 * Reverses a previously applied award inside an open transaction.
 * @returns {Promise<
 *   | { status: 'reversed', transactionId: string, reversalId: string, state: object, events: object[] }
 *   | { status: 'already-reversed', transactionId: string, reversalId: string, state: object, events: [] }
 * >}
 * @throws {ProgressionError} UNKNOWN_TRANSACTION or NOT_REVERSIBLE.
 */
export async function reverseXpTransactionInTransaction(txn, transactionId, rules = DEFAULT_PROGRESSION_RULES) {
  const award = await readXpTransaction(txn, transactionId);
  if (!award) {
    throw new ProgressionError('UNKNOWN_TRANSACTION', `No XP transaction "${transactionId}"`);
  }
  if (award.kind !== 'award') {
    throw new ProgressionError('NOT_REVERSIBLE', `Transaction "${transactionId}" is a ${award.kind}`);
  }

  const currentState = await readProgressionState(txn, ATTRIBUTE_KEYS);
  if (award.reversedByTransactionId) {
    return {
      status: 'already-reversed',
      transactionId,
      reversalId: award.reversedByTransactionId,
      state: currentState,
      events: [],
    };
  }

  const reversalId = `reversal:${transactionId}`;
  const { state, events } = reverseXpReward(currentState, award, rules);
  await insertXpReversal(txn, award, reversalId);
  await writeProgressionState(txn, state, rules.player.getLevelState(state.totalXp));

  return { status: 'reversed', transactionId, reversalId, state, events };
}

/**
 * Awards XP exactly once per reward id.
 * @param {Parameters<typeof createXpReward>[0]} rewardInput
 * @throws {ProgressionError} for invalid input (before touching the database).
 */
export async function awardXp(rewardInput, rules = DEFAULT_PROGRESSION_RULES) {
  const reward = createXpReward(rewardInput);
  return runExclusiveWrite((txn) => applyXpRewardInTransaction(txn, reward, rules));
}

/** Reverses a previously applied award, at most once. */
export function reverseXp(transactionId, rules = DEFAULT_PROGRESSION_RULES) {
  return runExclusiveWrite((txn) => reverseXpTransactionInTransaction(txn, transactionId, rules));
}
