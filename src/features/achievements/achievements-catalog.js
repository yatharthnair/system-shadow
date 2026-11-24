import { QUEST_CATEGORIES } from '@/features/quests/quest-config';

/**
 * Achievements. Each has a `progress(facts)` that returns `{ current, target }` from real activity;
 * it unlocks automatically when current ≥ target and is revoked if an undo takes it back below.
 * Ids are permanent (used in reward source keys).
 *
 * group: 'quests' | 'streaks' | 'growth' | 'mastery' | 'bosses' | 'challenges' | 'secret'
 * tier: see features/rewards/reward-tiers.js
 * secret: description is hidden until unlocked.
 */

const count = (current, target) => ({ current: Math.min(current, target), target });

const questCount = (id, target, tier, title, extra = {}) => ({
  id,
  group: 'quests',
  tier,
  title,
  description: `Clear ${target} quests.`,
  progress: (facts) => count(facts.totalCompletions, target),
  ...extra,
});

const MASTERY_TITLES = {
  fitness: 'iron-body',
  nutrition: 'clean-fuel',
  family: 'hearthkeeper',
  social: 'silver-tongue',
  career: 'strategist',
  gaming: 'tactician',
  livestreaming: 'voice-of-the-stream',
  recovery: 'phoenix',
};
const MASTERY_TARGET = 25;

const RANK_ACHIEVEMENTS = [
  { rank: 'D', tier: 'bronze' },
  { rank: 'C', tier: 'silver' },
  { rank: 'B', tier: 'silver' },
  { rank: 'A', tier: 'gold' },
  { rank: 'S', tier: 'platinum' },
];

export const ACHIEVEMENTS = [
  questCount('first-steps', 1, 'bronze', 'First Steps', { description: 'Clear your first quest.', titleId: 'awakened' }),
  questCount('quests-10', 10, 'bronze', 'Getting Started'),
  questCount('quests-50', 50, 'silver', 'Quest Hunter'),
  questCount('quests-100', 100, 'gold', 'Centurion', { titleId: 'centurion', itemKey: 'emblem-century' }),
  questCount('quests-250', 250, 'gold', 'Unstoppable'),
  questCount('quests-500', 500, 'platinum', 'Legend of the Board', { titleId: 'legend-of-the-board' }),

  {
    id: 'streak-3', group: 'streaks', tier: 'bronze', title: 'Momentum',
    description: 'Clear quests 3 days in a row.',
    progress: (facts) => count(facts.longestStreak, 3),
  },
  {
    id: 'streak-7', group: 'streaks', tier: 'silver', title: 'The Relentless',
    description: 'Clear quests 7 days in a row.', titleId: 'relentless', itemKey: 'emblem-streak',
    progress: (facts) => count(facts.longestStreak, 7),
  },
  {
    id: 'streak-30', group: 'streaks', tier: 'platinum', title: 'Iron Will',
    description: 'Clear quests 30 days in a row.', titleId: 'iron-will', itemKey: 'emblem-iron-will',
    progress: (facts) => count(facts.longestStreak, 30),
  },

  {
    id: 'level-10', group: 'growth', tier: 'bronze', title: 'Rising Hunter',
    description: 'Reach level 10.',
    progress: (facts) => count(facts.level, 10),
  },
  {
    id: 'level-25', group: 'growth', tier: 'silver', title: 'Veteran',
    description: 'Reach level 25.', titleId: 'veteran',
    progress: (facts) => count(facts.level, 25),
  },
  {
    id: 'level-100', group: 'growth', tier: 'platinum', title: 'Ascendant',
    description: 'Reach level 100.', titleId: 'ascendant',
    progress: (facts) => count(facts.level, 100),
  },
  ...RANK_ACHIEVEMENTS.map(({ rank, tier }) => ({
    id: `rank-${rank.toLowerCase()}`, group: 'growth', tier, title: `${rank}-Rank Hunter`,
    description: `Reach ${rank} rank.`, titleId: `rank-${rank.toLowerCase()}`,
    progress: (facts) => count(facts.rankIndex >= facts.rankIndexById[rank] ? 1 : 0, 1),
  })),
  {
    id: 'attribute-10', group: 'growth', tier: 'silver', title: 'Specialist',
    description: 'Raise any attribute to level 10.',
    progress: (facts) => count(Math.max(...Object.values(facts.attributeLevels)), 10),
  },
  {
    id: 'balanced-soul', group: 'growth', tier: 'gold', title: 'Balanced Soul',
    description: 'Raise all six attributes to level 5.', titleId: 'balanced-soul',
    progress: (facts) => count(Math.min(...Object.values(facts.attributeLevels)), 5),
  },

  ...QUEST_CATEGORIES.map((category) => ({
    id: `mastery-${category.key}`, group: 'mastery', tier: 'gold', title: `${category.label} Mastery`,
    description: `Clear ${MASTERY_TARGET} ${category.label} quests.`, titleId: MASTERY_TITLES[category.key],
    progress: (facts) => count(facts.byCategory[category.key] ?? 0, MASTERY_TARGET),
  })),
  {
    id: 'elite-10', group: 'mastery', tier: 'gold', title: 'Elite Operator',
    description: 'Clear 10 Elite quests.',
    progress: (facts) => count(facts.byDifficulty.elite ?? 0, 10),
  },
  {
    id: 'architect', group: 'mastery', tier: 'bronze', title: 'Architect',
    description: 'Create your own quest.',
    progress: (facts) => count(facts.customQuestsCreated, 1),
  },

  {
    id: 'first-boss', group: 'bosses', tier: 'silver', title: 'Bossbreaker',
    description: 'Defeat your first boss.',
    progress: (facts) => count(facts.bossCampaign.defeatedCount, 1),
  },
  {
    id: 'bosses-3', group: 'bosses', tier: 'gold', title: 'Gatecrasher',
    description: 'Defeat 3 bosses.',
    progress: (facts) => count(facts.bossCampaign.defeatedCount, 3),
  },
  {
    id: 'all-bosses', group: 'bosses', tier: 'platinum', title: 'Shadow Ascendant',
    description: 'Defeat every boss.',
    progress: (facts) => count(facts.bossCampaign.defeatedCount, facts.bossCampaign.bosses.length),
  },

  {
    id: 'first-challenge', group: 'challenges', tier: 'bronze', title: 'Challenger Approaches',
    description: 'Complete a weekly challenge.',
    progress: (facts) => count(facts.challengesCompleted, 1),
  },
  {
    id: 'challenges-10', group: 'challenges', tier: 'gold', title: 'Challenger',
    description: 'Complete 10 weekly challenges.', titleId: 'challenger',
    progress: (facts) => count(facts.challengesCompleted, 10),
  },
  {
    id: 'clean-sweep', group: 'challenges', tier: 'gold', title: 'Flawless',
    description: 'Complete all three challenges in one week.', titleId: 'flawless',
    progress: (facts) => count(facts.sweptWeeks, 1),
  },

  {
    id: 'night-owl', group: 'secret', tier: 'bronze', title: 'Night Stalker', secret: true,
    description: 'Clear a quest between midnight and 4 AM.', titleId: 'night-stalker',
    progress: (facts) => count(facts.hasNightCompletion ? 1 : 0, 1),
  },
  {
    id: 'early-riser', group: 'secret', tier: 'bronze', title: 'Dawnbreaker', secret: true,
    description: 'Clear a quest between 4 and 7 AM.', titleId: 'dawnbreaker',
    progress: (facts) => count(facts.hasDawnCompletion ? 1 : 0, 1),
  },
];

export const ACHIEVEMENT_GROUPS = [
  { key: 'quests', label: 'Quests' },
  { key: 'streaks', label: 'Streaks' },
  { key: 'growth', label: 'Growth' },
  { key: 'mastery', label: 'Mastery' },
  { key: 'bosses', label: 'Bosses' },
  { key: 'challenges', label: 'Challenges' },
  { key: 'secret', label: 'Secret' },
];

export function getAchievementSourceKey(achievementId) {
  return `achievement:${achievementId}`;
}
