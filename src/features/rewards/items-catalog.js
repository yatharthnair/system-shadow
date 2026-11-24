/**
 * Collectible items. Granted by rewards and kept in the inventory. Duplicate keys stack.
 * Keys are permanent (stored in `inventory_items.item_key`).
 *
 * type: 'trophy' (boss defeats) · 'shard' (boss milestones) · 'sigil' (weekly challenges) ·
 *       'relic' (level milestones) · 'emblem' (achievements)
 * rarity: 'common' | 'rare' | 'epic' | 'legendary'
 */
export const ITEM_RARITIES = ['common', 'rare', 'epic', 'legendary'];

export const ITEMS = [
  { key: 'weekly-sigil', name: 'Weekly Sigil', type: 'sigil', rarity: 'common', description: 'Proof of a weekly challenge conquered.' },

  { key: 'shard-slothwarden', name: 'Shard of Stillness', type: 'shard', rarity: 'rare', description: 'Splintered from the Slothwarden’s armor.' },
  { key: 'shard-glutton-wyrm', name: 'Wyrm Scale', type: 'shard', rarity: 'rare', description: 'A scale shed by the Glutton Wyrm.' },
  { key: 'shard-doomscroll-hydra', name: 'Severed Feed', type: 'shard', rarity: 'rare', description: 'One of the Hydra’s endless heads, finally silent.' },
  { key: 'shard-insomnia-wraith', name: 'Dreamglass', type: 'shard', rarity: 'rare', description: 'Crystallized sleep, stolen back from the Wraith.' },
  { key: 'shard-isolation-golem', name: 'Hollow Stone', type: 'shard', rarity: 'rare', description: 'A fragment of the Golem’s empty shell.' },
  { key: 'shard-burnout-titan', name: 'Cinder Core', type: 'shard', rarity: 'epic', description: 'Still warm. Handle with rest.' },
  { key: 'shard-shadow-self', name: 'Mirror Fragment', type: 'shard', rarity: 'epic', description: 'It shows who you were.' },

  { key: 'trophy-slothwarden', name: 'Slothwarden’s Chain', type: 'trophy', rarity: 'epic', description: 'The chain that held you still. Broken.' },
  { key: 'trophy-glutton-wyrm', name: 'Wyrm Fang', type: 'trophy', rarity: 'epic', description: 'Taken from the beast that fed on excess.' },
  { key: 'trophy-doomscroll-hydra', name: 'Hydra Crown', type: 'trophy', rarity: 'epic', description: 'Every head cut. Every hour reclaimed.' },
  { key: 'trophy-insomnia-wraith', name: 'Wraith Lantern', type: 'trophy', rarity: 'epic', description: 'Its light no longer keeps you awake.' },
  { key: 'trophy-isolation-golem', name: 'Golem Heart', type: 'trophy', rarity: 'epic', description: 'Stone that learned to beat again.' },
  { key: 'trophy-burnout-titan', name: 'Titan’s Ember', type: 'trophy', rarity: 'legendary', description: 'Endurance without the burn.' },
  { key: 'trophy-shadow-self', name: 'Crown of the Shadow', type: 'trophy', rarity: 'legendary', description: 'You faced yourself and won.' },

  { key: 'relic-initiate-band', name: 'Initiate’s Band', type: 'relic', rarity: 'common', description: 'Awarded at level 5.' },
  { key: 'relic-hunters-mark', name: 'Hunter’s Mark', type: 'relic', rarity: 'rare', description: 'Awarded at level 10.' },
  { key: 'relic-veterans-cloak', name: 'Veteran’s Cloak', type: 'relic', rarity: 'rare', description: 'Awarded at level 20.' },
  { key: 'relic-blade-of-resolve', name: 'Blade of Resolve', type: 'relic', rarity: 'epic', description: 'Awarded at level 30.' },
  { key: 'relic-aegis', name: 'Aegis of Habit', type: 'relic', rarity: 'epic', description: 'Awarded at level 40.' },
  { key: 'relic-sovereign-seal', name: 'Sovereign Seal', type: 'relic', rarity: 'legendary', description: 'Awarded at level 50.' },
  { key: 'relic-starforged-crown', name: 'Starforged Crown', type: 'relic', rarity: 'legendary', description: 'Awarded at level 75.' },
  { key: 'relic-eternal-flame', name: 'Eternal Flame', type: 'relic', rarity: 'legendary', description: 'Awarded at level 100.' },

  { key: 'emblem-streak', name: 'Ember Emblem', type: 'emblem', rarity: 'rare', description: 'A flame kept alive for seven days.' },
  { key: 'emblem-iron-will', name: 'Iron Emblem', type: 'emblem', rarity: 'legendary', description: 'Thirty days without breaking.' },
  { key: 'emblem-century', name: 'Century Emblem', type: 'emblem', rarity: 'epic', description: 'One hundred quests cleared.' },
];

export const ITEMS_BY_KEY = Object.fromEntries(ITEMS.map((item) => [item.key, item]));
