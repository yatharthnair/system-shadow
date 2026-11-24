import { allocateXpByWeights, isAttributeKey } from './attributes';
import { MAX_XP_PER_TRANSACTION } from './progression-config';
import { ProgressionError } from './progression-errors';

const MAX_ID_LENGTH = 200;

function assertXpAmount(value, name) {
  if (!Number.isInteger(value) || value < 0 || value > MAX_XP_PER_TRANSACTION) {
    throw new ProgressionError(
      'INVALID_XP',
      `${name} must be an integer between 0 and ${MAX_XP_PER_TRANSACTION}, got ${value}`,
    );
  }
}

/**
 * Validates and normalizes an XP reward into the shape the engine and ledger store.
 *
 * @param {object} input
 * @param {string} input.id Idempotency key. The same id is only ever applied once, e.g. `quest:pushups-50:2026-11-25`.
 * @param {string} input.source What granted the XP, e.g. 'quest', 'challenge', 'achievement'.
 * @param {number} [input.xp=0] Player XP.
 * @param {Record<string, number>} [input.attributeXp] Exact XP per attribute.
 * @param {Record<string, number>} [input.attributeWeights] Alternatively, split `xp` across attributes by weight.
 * @returns {{ id: string, source: string, xp: number, attributeXp: Record<string, number> }}
 */
export function createXpReward({ id, source, xp = 0, attributeXp, attributeWeights }) {
  if (typeof id !== 'string' || id.trim().length === 0 || id.length > MAX_ID_LENGTH) {
    throw new ProgressionError('INVALID_TRANSACTION_ID', `Transaction id must be a non-empty string ≤ ${MAX_ID_LENGTH} chars`);
  }
  if (typeof source !== 'string' || source.trim().length === 0) {
    throw new ProgressionError('INVALID_SOURCE', 'Reward source must be a non-empty string');
  }
  if (attributeXp && attributeWeights) {
    throw new ProgressionError('CONFLICTING_ALLOCATION', 'Pass either attributeXp or attributeWeights, not both');
  }
  assertXpAmount(xp, 'xp');

  const requestedAttributeXp = attributeWeights ? allocateXpByWeights(xp, attributeWeights) : (attributeXp ?? {});
  const normalizedAttributeXp = {};
  for (const [key, amount] of Object.entries(requestedAttributeXp)) {
    if (!isAttributeKey(key)) throw new ProgressionError('UNKNOWN_ATTRIBUTE', `Unknown attribute "${key}"`);
    assertXpAmount(amount, `attributeXp.${key}`);
    if (amount > 0) normalizedAttributeXp[key] = amount;
  }

  if (xp === 0 && Object.keys(normalizedAttributeXp).length === 0) {
    throw new ProgressionError('EMPTY_REWARD', 'Reward grants no XP');
  }

  return Object.freeze({
    id: id.trim(),
    source: source.trim(),
    xp,
    attributeXp: Object.freeze(normalizedAttributeXp),
  });
}
