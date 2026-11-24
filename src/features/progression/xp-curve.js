import { ProgressionError } from './progression-errors';

function assertPositiveInteger(value, name) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ProgressionError('INVALID_CURVE', `${name} must be a positive integer, got ${value}`);
  }
}

function validateCurveConfig({ maxLevel, formula, overrides = {} }) {
  if (!Number.isInteger(maxLevel) || maxLevel < 2) {
    throw new ProgressionError('INVALID_CURVE', `maxLevel must be an integer ≥ 2, got ${maxLevel}`);
  }
  if (!(formula?.base > 0) || !(formula?.exponent > 0)) {
    throw new ProgressionError('INVALID_CURVE', 'formula.base and formula.exponent must be > 0');
  }
  for (const [levelKey, xpRequired] of Object.entries(overrides)) {
    const level = Number(levelKey);
    if (!Number.isInteger(level) || level < 1 || level >= maxLevel) {
      throw new ProgressionError('INVALID_CURVE', `override level ${levelKey} is outside 1–${maxLevel - 1}`);
    }
    assertPositiveInteger(xpRequired, `override for level ${levelKey}`);
  }
}

/**
 * Builds an XP curve from config. Levels start at 1. Progress is derived entirely from a
 * lifetime XP total, so the same total always yields the same level.
 */
export function createXpCurve(config) {
  validateCurveConfig(config);
  const { maxLevel, formula, overrides = {} } = config;

  /** XP to advance from `level` to `level + 1`. */
  function getXpRequiredForLevel(level) {
    if (!Number.isInteger(level) || level < 1 || level >= maxLevel) {
      throw new ProgressionError('INVALID_LEVEL', `No XP requirement for level ${level} (max ${maxLevel})`);
    }
    return overrides[level] ?? Math.max(1, Math.round(formula.base * Math.pow(level, formula.exponent)));
  }

  // cumulativeXp[i] = lifetime XP needed to reach level i + 1.
  const cumulativeXp = [0];
  for (let level = 1; level < maxLevel; level += 1) {
    cumulativeXp.push(cumulativeXp[level - 1] + getXpRequiredForLevel(level));
  }

  /** Lifetime XP at which `level` is reached. */
  function getTotalXpForLevel(level) {
    if (!Number.isInteger(level) || level < 1 || level > maxLevel) {
      throw new ProgressionError('INVALID_LEVEL', `Level ${level} is outside 1–${maxLevel}`);
    }
    return cumulativeXp[level - 1];
  }

  /** Level, XP into that level and progress toward the next, for a lifetime XP total. */
  function getLevelState(totalXp) {
    if (!Number.isInteger(totalXp) || totalXp < 0) {
      throw new ProgressionError('INVALID_XP', `Total XP must be a non-negative integer, got ${totalXp}`);
    }

    // Binary search for the highest level whose threshold has been reached.
    let low = 0;
    let high = cumulativeXp.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (cumulativeXp[middle] <= totalXp) low = middle;
      else high = middle - 1;
    }

    const level = low + 1;
    const xpIntoLevel = totalXp - cumulativeXp[low];
    const isMaxLevel = level === maxLevel;
    const xpForNextLevel = isMaxLevel ? null : getXpRequiredForLevel(level);

    return {
      level,
      totalXp,
      xpIntoLevel,
      xpForNextLevel,
      xpToNextLevel: isMaxLevel ? 0 : xpForNextLevel - xpIntoLevel,
      progress: isMaxLevel ? 1 : xpIntoLevel / xpForNextLevel,
      isMaxLevel,
    };
  }

  return { maxLevel, getXpRequiredForLevel, getTotalXpForLevel, getLevelState };
}
