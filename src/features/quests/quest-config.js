/**
 * Quest rules. XP is derived from difficulty × cadence so rewards stay balanced and predictable.
 */

export const QUEST_CATEGORIES = [
  { key: 'fitness', label: 'Fitness', defaultAttributeWeights: { strength: 2, agility: 1 } },
  { key: 'nutrition', label: 'Nutrition', defaultAttributeWeights: { vitality: 2, discipline: 1 } },
  { key: 'family', label: 'Family', defaultAttributeWeights: { charisma: 2, discipline: 1 } },
  { key: 'social', label: 'Social', defaultAttributeWeights: { charisma: 1 } },
  { key: 'career', label: 'Career', defaultAttributeWeights: { intelligence: 2, discipline: 1 } },
  { key: 'gaming', label: 'Gaming', defaultAttributeWeights: { agility: 1, intelligence: 1 } },
  { key: 'livestreaming', label: 'Livestreaming', defaultAttributeWeights: { charisma: 2, discipline: 1 } },
  { key: 'recovery', label: 'Recovery', defaultAttributeWeights: { vitality: 2, discipline: 1 } },
];

export const QUEST_DIFFICULTIES = [
  { key: 'easy', label: 'Easy', baseXp: 20 },
  { key: 'normal', label: 'Normal', baseXp: 40 },
  { key: 'hard', label: 'Hard', baseXp: 80 },
  { key: 'elite', label: 'Elite', baseXp: 150 },
];

/**
 * How often a quest recurs. `daily`/`weekly` reset at local midnight / Monday 00:00;
 * `weekdays` recurs on chosen days of the week; `once` never resets.
 * The UI groups `weekdays` and `once` as "Custom".
 */
export const QUEST_CADENCES = [
  { key: 'daily', label: 'Daily', group: 'daily', xpMultiplier: 1 },
  { key: 'weekly', label: 'Weekly', group: 'weekly', xpMultiplier: 3 },
  { key: 'weekdays', label: 'Specific days', group: 'custom', xpMultiplier: 1 },
  { key: 'once', label: 'One-time', group: 'custom', xpMultiplier: 2 },
];

export const QUEST_CADENCE_GROUPS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'custom', label: 'Custom' },
];

/** ISO weekday numbers: 1 = Monday … 7 = Sunday. */
export const WEEKDAYS = [
  { value: 1, shortLabel: 'M', label: 'Monday' },
  { value: 2, shortLabel: 'T', label: 'Tuesday' },
  { value: 3, shortLabel: 'W', label: 'Wednesday' },
  { value: 4, shortLabel: 'T', label: 'Thursday' },
  { value: 5, shortLabel: 'F', label: 'Friday' },
  { value: 6, shortLabel: 'S', label: 'Saturday' },
  { value: 7, shortLabel: 'S', label: 'Sunday' },
];

export const QUEST_LIMITS = {
  titleMaxLength: 60,
  descriptionMaxLength: 240,
  maxAttributeWeight: 3,
};

const byKey = (items) => Object.fromEntries(items.map((item) => [item.key, item]));
export const CATEGORIES_BY_KEY = byKey(QUEST_CATEGORIES);
export const DIFFICULTIES_BY_KEY = byKey(QUEST_DIFFICULTIES);
export const CADENCES_BY_KEY = byKey(QUEST_CADENCES);
