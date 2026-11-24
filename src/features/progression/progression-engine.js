import { ATTRIBUTE_KEYS } from './attributes';
import { ATTRIBUTE_LEVEL_CURVE, PLAYER_LEVEL_CURVE, RANKS } from './progression-config';
import { getNextRank, getRankForLevel, validateRankTable } from './ranks';
import { createXpCurve } from './xp-curve';

/**
 * The progression engine. Pure functions over a minimal persisted state:
 *
 *   { totalXp: number, attributeXp: { [attributeKey]: number } }
 *
 * Levels, ranks and progress bars are always *derived* from these lifetime totals, so the
 * same state can never disagree with itself, and replaying the XP ledger reproduces it exactly.
 */

/** Builds a rule set. Pass custom configs to tune or test progression. */
export function createProgressionRules({
  playerCurve = PLAYER_LEVEL_CURVE,
  attributeCurve = ATTRIBUTE_LEVEL_CURVE,
  ranks = RANKS,
} = {}) {
  return {
    player: createXpCurve(playerCurve),
    attribute: createXpCurve(attributeCurve),
    ranks: validateRankTable(ranks),
  };
}

export const DEFAULT_PROGRESSION_RULES = createProgressionRules();

export function createInitialProgressionState() {
  return {
    totalXp: 0,
    attributeXp: Object.fromEntries(ATTRIBUTE_KEYS.map((key) => [key, 0])),
  };
}

/**
 * Applies a reward (from `createXpReward`) and reports what changed.
 * Never mutates `state`.
 *
 * @returns {{ state: object, events: Array<
 *   | { type: 'player-level-up', fromLevel: number, toLevel: number, levelsGained: number }
 *   | { type: 'rank-up', fromRank: string, toRank: string }
 *   | { type: 'attribute-level-up', attributeKey: string, fromLevel: number, toLevel: number, levelsGained: number }
 * > }}
 */
export function applyXpReward(state, reward, rules = DEFAULT_PROGRESSION_RULES) {
  const events = [];

  const nextTotalXp = state.totalXp + reward.xp;
  const fromLevel = rules.player.getLevelState(state.totalXp).level;
  const toLevel = rules.player.getLevelState(nextTotalXp).level;

  if (toLevel > fromLevel) {
    events.push({ type: 'player-level-up', fromLevel, toLevel, levelsGained: toLevel - fromLevel });

    const fromRank = getRankForLevel(fromLevel, rules.ranks).id;
    const toRank = getRankForLevel(toLevel, rules.ranks).id;
    if (fromRank !== toRank) events.push({ type: 'rank-up', fromRank, toRank });
  }

  const nextAttributeXp = { ...state.attributeXp };
  for (const key of ATTRIBUTE_KEYS) {
    const gained = reward.attributeXp[key] ?? 0;
    if (gained === 0) continue;

    const previousTotal = state.attributeXp[key] ?? 0;
    nextAttributeXp[key] = previousTotal + gained;

    const fromAttributeLevel = rules.attribute.getLevelState(previousTotal).level;
    const toAttributeLevel = rules.attribute.getLevelState(nextAttributeXp[key]).level;
    if (toAttributeLevel > fromAttributeLevel) {
      events.push({
        type: 'attribute-level-up',
        attributeKey: key,
        fromLevel: fromAttributeLevel,
        toLevel: toAttributeLevel,
        levelsGained: toAttributeLevel - fromAttributeLevel,
      });
    }
  }

  return { state: { totalXp: nextTotalXp, attributeXp: nextAttributeXp }, events };
}

/** Rebuilds state from scratch by applying rewards in order. Used to verify and repair stored state. */
export function replayXpRewards(rewards, rules = DEFAULT_PROGRESSION_RULES) {
  return rewards.reduce(
    (state, reward) => applyXpReward(state, reward, rules).state,
    createInitialProgressionState(),
  );
}

export function areProgressionStatesEqual(a, b) {
  return (
    a.totalXp === b.totalXp &&
    ATTRIBUTE_KEYS.every((key) => (a.attributeXp[key] ?? 0) === (b.attributeXp[key] ?? 0))
  );
}

/** Everything the UI shows about progression, derived from state. */
export function buildProgressionSnapshot(state, rules = DEFAULT_PROGRESSION_RULES) {
  const playerLevel = rules.player.getLevelState(state.totalXp);
  const nextRank = getNextRank(playerLevel.level, rules.ranks);

  const attributes = {};
  for (const key of ATTRIBUTE_KEYS) {
    attributes[key] = rules.attribute.getLevelState(state.attributeXp[key] ?? 0);
  }

  return {
    ...playerLevel,
    rank: getRankForLevel(playerLevel.level, rules.ranks).id,
    nextRank: nextRank
      ? { id: nextRank.id, minimumLevel: nextRank.minimumLevel, levelsRemaining: nextRank.minimumLevel - playerLevel.level }
      : null,
    attributes,
  };
}
