import { CATEGORIES_BY_KEY, QUEST_CATEGORIES } from '@/features/quests/quest-config';

/**
 * Weekly challenges: three per ISO week, one from each slot, chosen deterministically from the
 * week key. Generated once per week and stored, so they never change mid-week.
 */

const CHALLENGE_ITEM_KEY = 'weekly-sigil';

/** Progress metrics, computed from the week's active quest completions (see activity facts). */
export const CHALLENGE_METRICS = {
  quests_completed: (week) => week.completions,
  quest_xp: (week) => week.questXp,
  category_completed: (week, category) => week.byCategory[category] ?? 0,
  active_days: (week) => week.activeDays,
  hard_quests: (week) => week.hardQuests,
  weekly_quests: (week) => week.weeklyQuests,
};

const VOLUME_SLOT = [
  { metric: 'quests_completed', target: 15, xpReward: 150, title: 'Quest Grinder', describe: (target) => `Clear ${target} quests this week.` },
  { metric: 'quest_xp', target: 800, xpReward: 150, title: 'XP Surge', describe: (target) => `Earn ${target} XP from quests this week.` },
];

const CONSISTENCY_SLOT = [
  { metric: 'active_days', target: 5, xpReward: 150, title: 'Unbroken Week', describe: (target) => `Clear at least one quest on ${target} different days.` },
  { metric: 'hard_quests', target: 3, xpReward: 150, title: 'Trial by Fire', describe: (target) => `Clear ${target} Hard or Elite quests.` },
  { metric: 'weekly_quests', target: 2, xpReward: 120, title: 'The Long Game', describe: (target) => `Clear ${target} weekly quests.` },
];

const FOCUS_TARGET = 5;
const FOCUS_XP = 120;

/** Small stable string hash (FNV-1a) for deterministic selection. */
export function hashString(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

function pick(options, seed) {
  return options[seed % options.length];
}

/**
 * The three challenges for a week.
 * @param {string} weekKey e.g. "2026-W48"
 * @param {string[]} availableCategories categories of the player's active quests (focus challenges
 *   only target a category the player can actually make progress in)
 */
export function generateWeeklyChallenges(weekKey, availableCategories) {
  const seed = hashString(weekKey);
  const categories = availableCategories.length > 0
    ? QUEST_CATEGORIES.map((category) => category.key).filter((key) => availableCategories.includes(key))
    : QUEST_CATEGORIES.map((category) => category.key);

  const volume = pick(VOLUME_SLOT, seed);
  const focusCategory = pick(categories, seed >>> 3);
  const consistency = pick(CONSISTENCY_SLOT, seed >>> 7);

  return [
    {
      challengeId: volume.metric,
      slot: 0,
      metric: volume.metric,
      category: null,
      target: volume.target,
      xpReward: volume.xpReward,
      itemKey: CHALLENGE_ITEM_KEY,
      title: volume.title,
      description: volume.describe(volume.target),
    },
    {
      challengeId: `category_completed:${focusCategory}`,
      slot: 1,
      metric: 'category_completed',
      category: focusCategory,
      target: FOCUS_TARGET,
      xpReward: FOCUS_XP,
      itemKey: CHALLENGE_ITEM_KEY,
      title: `${CATEGORIES_BY_KEY[focusCategory].label} Focus`,
      description: `Clear ${FOCUS_TARGET} ${CATEGORIES_BY_KEY[focusCategory].label} quests this week.`,
    },
    {
      challengeId: consistency.metric,
      slot: 2,
      metric: consistency.metric,
      category: null,
      target: consistency.target,
      xpReward: consistency.xpReward,
      itemKey: CHALLENGE_ITEM_KEY,
      title: consistency.title,
      description: consistency.describe(consistency.target),
    },
  ];
}

export function getChallengeProgress(challenge, weekFacts) {
  const current = CHALLENGE_METRICS[challenge.metric](weekFacts, challenge.category);
  return { current, target: challenge.target };
}

export function getChallengeSourceKey(weekKey, challengeId) {
  return `challenge:${weekKey}:${challengeId}`;
}
