/**
 * Player titles. Earned through achievements, boss defeats and level milestones; one can be
 * equipped and shows on the player profile. Ids are permanent (stored as `equipped_title_id`).
 */
export const DEFAULT_TITLE_ID = 'unawakened';

export const TITLES = [
  { id: 'unawakened', label: 'Unawakened', description: 'Every hunter starts here.' },
  { id: 'awakened', label: 'The Awakened', description: 'Cleared your first quest.' },
  { id: 'relentless', label: 'The Relentless', description: 'Kept a 7-day quest streak.' },
  { id: 'iron-will', label: 'Iron Will', description: 'Kept a 30-day quest streak.' },
  { id: 'centurion', label: 'Centurion', description: 'Cleared 100 quests.' },
  { id: 'legend-of-the-board', label: 'Legend of the Board', description: 'Cleared 500 quests.' },
  { id: 'night-stalker', label: 'Night Stalker', description: 'Cleared a quest between midnight and 4 AM.' },
  { id: 'dawnbreaker', label: 'Dawnbreaker', description: 'Cleared a quest between 4 and 7 AM.' },
  { id: 'iron-body', label: 'Iron Body', description: 'Mastered Fitness.' },
  { id: 'clean-fuel', label: 'Clean Fuel', description: 'Mastered Nutrition.' },
  { id: 'hearthkeeper', label: 'Hearthkeeper', description: 'Mastered Family.' },
  { id: 'silver-tongue', label: 'Silver Tongue', description: 'Mastered Social.' },
  { id: 'strategist', label: 'The Strategist', description: 'Mastered Career.' },
  { id: 'tactician', label: 'The Tactician', description: 'Mastered Gaming.' },
  { id: 'voice-of-the-stream', label: 'Voice of the Stream', description: 'Mastered Livestreaming.' },
  { id: 'phoenix', label: 'The Phoenix', description: 'Mastered Recovery.' },
  { id: 'challenger', label: 'Challenger', description: 'Completed 10 weekly challenges.' },
  { id: 'flawless', label: 'Flawless', description: 'Completed every challenge in a week.' },
  { id: 'bossbreaker', label: 'Bossbreaker', description: 'Defeated your first boss.' },
  { id: 'shadow-ascendant', label: 'Shadow Ascendant', description: 'Defeated every boss.' },
  { id: 'balanced-soul', label: 'Balanced Soul', description: 'Raised all six attributes to level 5.' },
  { id: 'rank-d', label: 'D-Rank Hunter', description: 'Reached D rank.' },
  { id: 'rank-c', label: 'C-Rank Hunter', description: 'Reached C rank.' },
  { id: 'rank-b', label: 'B-Rank Hunter', description: 'Reached B rank.' },
  { id: 'rank-a', label: 'A-Rank Hunter', description: 'Reached A rank.' },
  { id: 'rank-s', label: 'S-Rank Hunter', description: 'Reached S rank.' },
  { id: 'veteran', label: 'Veteran', description: 'Reached level 25.' },
  { id: 'ascendant', label: 'Ascendant', description: 'Reached level 100.' },
];

export const TITLES_BY_ID = Object.fromEntries(TITLES.map((title) => [title.id, title]));

export function getTitleLabel(titleId) {
  return (TITLES_BY_ID[titleId] ?? TITLES_BY_ID[DEFAULT_TITLE_ID]).label;
}
