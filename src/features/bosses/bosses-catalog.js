/**
 * The boss campaign: bosses are fought in order. Quest XP deals damage to the current boss;
 * quests in the boss's weakness category deal bonus damage. Overflow damage carries to the next boss.
 * Ids are permanent (used in reward source keys).
 */
export const WEAKNESS_DAMAGE_MULTIPLIER = 1.5;

/** Milestones (percent of HP dealt) that grant rewards. 100 = defeat. */
export const BOSS_MILESTONES = [25, 50, 75, 100];

export const BOSSES = [
  {
    id: 'slothwarden',
    name: 'The Slothwarden',
    epithet: 'Keeper of the Couch',
    lore: 'It grows heavier every day you stay still.',
    hp: 600,
    weakness: 'fitness',
    titleId: 'bossbreaker',
  },
  {
    id: 'glutton-wyrm',
    name: 'Glutton Wyrm',
    epithet: 'Devourer of Discipline',
    lore: 'It feeds on every skipped meal plan.',
    hp: 1200,
    weakness: 'nutrition',
  },
  {
    id: 'doomscroll-hydra',
    name: 'Doomscroll Hydra',
    epithet: 'The Endless Feed',
    lore: 'Cut one head and two more refresh.',
    hp: 2000,
    weakness: 'career',
  },
  {
    id: 'insomnia-wraith',
    name: 'Insomnia Wraith',
    epithet: 'Thief of Rest',
    lore: 'It whispers “one more episode” at 2 AM.',
    hp: 3000,
    weakness: 'recovery',
  },
  {
    id: 'isolation-golem',
    name: 'Isolation Golem',
    epithet: 'The Silent Wall',
    lore: 'Built from every unanswered message.',
    hp: 4500,
    weakness: 'social',
  },
  {
    id: 'burnout-titan',
    name: 'Burnout Titan',
    epithet: 'The Flame That Consumes',
    lore: 'Strength without rest becomes its fuel.',
    hp: 6500,
    weakness: 'recovery',
  },
  {
    id: 'shadow-self',
    name: 'The Shadow Self',
    epithet: 'Who You Used to Be',
    lore: 'The final gate. It knows every excuse you ever made.',
    hp: 9000,
    weakness: null,
    titleId: 'shadow-ascendant',
  },
];

/** Bonus XP for reaching a milestone on a boss: a share of its HP. */
export function getBossMilestoneXp(boss, milestone) {
  const shareByMilestone = { 25: 0.05, 50: 0.08, 75: 0.1, 100: 0.25 };
  return Math.round(boss.hp * shareByMilestone[milestone]);
}
