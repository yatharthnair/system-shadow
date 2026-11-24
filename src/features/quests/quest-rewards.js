import { allocateXpByWeights } from '@/features/progression/attributes';

import { CADENCES_BY_KEY, CATEGORIES_BY_KEY, DIFFICULTIES_BY_KEY } from './quest-config';

/** Player XP for completing `quest`: difficulty base × cadence multiplier. */
export function calculateQuestXp({ difficulty, cadence }) {
  return DIFFICULTIES_BY_KEY[difficulty].baseXp * CADENCES_BY_KEY[cadence].xpMultiplier;
}

export function getDefaultAttributeWeights(category) {
  return { ...CATEGORIES_BY_KEY[category].defaultAttributeWeights };
}

/** Player XP and the exact per-attribute split, for previews and rewards. */
export function previewQuestReward(quest) {
  const xp = calculateQuestXp(quest);
  return { xp, attributeXp: allocateXpByWeights(xp, quest.attributeWeights) };
}

/** The XP ledger id for a completion. One completion ↔ one award. */
export function getQuestXpTransactionId(completionId) {
  return `quest:${completionId}`;
}

/** Reward input for the progression engine (validated there by `createXpReward`). */
export function buildQuestRewardInput(quest, completionId) {
  return {
    id: getQuestXpTransactionId(completionId),
    source: 'quest',
    xp: calculateQuestXp(quest),
    attributeWeights: quest.attributeWeights,
  };
}
