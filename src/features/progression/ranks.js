import { ProgressionError } from './progression-errors';

/** Validates a rank table: non-empty, starts at level 1, strictly increasing thresholds, unique ids. */
export function validateRankTable(ranks) {
  if (!Array.isArray(ranks) || ranks.length === 0 || ranks[0].minimumLevel !== 1) {
    throw new ProgressionError('INVALID_RANKS', 'Rank table must start with a rank at minimumLevel 1');
  }
  const seenIds = new Set();
  ranks.forEach((rank, index) => {
    if (seenIds.has(rank.id)) throw new ProgressionError('INVALID_RANKS', `Duplicate rank ${rank.id}`);
    seenIds.add(rank.id);
    if (index > 0 && rank.minimumLevel <= ranks[index - 1].minimumLevel) {
      throw new ProgressionError('INVALID_RANKS', `Rank ${rank.id} must start above ${ranks[index - 1].id}`);
    }
  });
  return ranks;
}

function findRankIndex(level, ranks) {
  let index = 0;
  while (index + 1 < ranks.length && level >= ranks[index + 1].minimumLevel) index += 1;
  return index;
}

export function getRankForLevel(level, ranks) {
  return ranks[findRankIndex(level, ranks)];
}

/** The next rank above the player's current one, or null at the top. */
export function getNextRank(level, ranks) {
  return ranks[findRankIndex(level, ranks) + 1] ?? null;
}
