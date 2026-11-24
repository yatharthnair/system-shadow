import { ProgressionError } from './progression-errors';

/** The six player attributes, in display order. Each levels independently. */
export const ATTRIBUTES = [
  { key: 'strength', label: 'Strength', shortLabel: 'STR', description: 'Physical power and training.' },
  { key: 'agility', label: 'Agility', shortLabel: 'AGI', description: 'Speed, cardio and mobility.' },
  { key: 'vitality', label: 'Vitality', shortLabel: 'VIT', description: 'Sleep, nutrition and recovery.' },
  { key: 'intelligence', label: 'Intelligence', shortLabel: 'INT', description: 'Learning and study.' },
  { key: 'discipline', label: 'Discipline', shortLabel: 'DIS', description: 'Focus, habits and consistency.' },
  { key: 'charisma', label: 'Charisma', shortLabel: 'CHA', description: 'Relationships and communication.' },
];

export const ATTRIBUTE_KEYS = ATTRIBUTES.map((attribute) => attribute.key);

const ATTRIBUTES_BY_KEY = Object.fromEntries(ATTRIBUTES.map((attribute) => [attribute.key, attribute]));

export function isAttributeKey(key) {
  return Object.hasOwn(ATTRIBUTES_BY_KEY, key);
}

export function getAttributeDefinition(key) {
  return ATTRIBUTES_BY_KEY[key];
}

/**
 * Splits `totalXp` across attributes in proportion to `weights`, in whole XP.
 * Uses the largest-remainder method so the parts always sum exactly to `totalXp`;
 * ties go to the attribute listed first in ATTRIBUTES, so the result is deterministic.
 *
 * @example allocateXpByWeights(10, { strength: 2, vitality: 1 }) → { strength: 7, vitality: 3 }
 */
export function allocateXpByWeights(totalXp, weights) {
  if (!Number.isInteger(totalXp) || totalXp < 0) {
    throw new ProgressionError('INVALID_XP', `XP to allocate must be a non-negative integer, got ${totalXp}`);
  }

  const entries = Object.entries(weights ?? {});
  for (const [key, weight] of entries) {
    if (!isAttributeKey(key)) throw new ProgressionError('UNKNOWN_ATTRIBUTE', `Unknown attribute "${key}"`);
    if (!Number.isFinite(weight) || weight < 0) {
      throw new ProgressionError('INVALID_WEIGHT', `Weight for ${key} must be a non-negative number`);
    }
  }

  const weightSum = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (weightSum <= 0) throw new ProgressionError('INVALID_WEIGHT', 'At least one weight must be > 0');

  const shares = ATTRIBUTE_KEYS.filter((key) => (weights[key] ?? 0) > 0).map((key, order) => {
    const exactShare = (totalXp * weights[key]) / weightSum;
    return { key, order, xp: Math.floor(exactShare), remainder: exactShare - Math.floor(exactShare) };
  });

  let undistributed = totalXp - shares.reduce((sum, share) => sum + share.xp, 0);
  const byRemainder = [...shares].sort((a, b) => b.remainder - a.remainder || a.order - b.order);
  for (let index = 0; undistributed > 0; index += 1, undistributed -= 1) {
    byRemainder[index % byRemainder.length].xp += 1;
  }

  const allocation = {};
  for (const share of shares) {
    if (share.xp > 0) allocation[share.key] = share.xp;
  }
  return allocation;
}
