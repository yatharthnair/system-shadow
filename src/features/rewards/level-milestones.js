/**
 * Special rewards for reaching player levels. Like achievements, they're derived from the
 * player's actual level and reconciled automatically.
 */
export const LEVEL_MILESTONES = [
  { level: 5, xp: 100, itemKey: 'relic-initiate-band' },
  { level: 10, xp: 250, itemKey: 'relic-hunters-mark' },
  { level: 20, xp: 500, itemKey: 'relic-veterans-cloak' },
  { level: 30, xp: 800, itemKey: 'relic-blade-of-resolve' },
  { level: 40, xp: 1200, itemKey: 'relic-aegis' },
  { level: 50, xp: 2000, itemKey: 'relic-sovereign-seal' },
  { level: 75, xp: 4000, itemKey: 'relic-starforged-crown' },
  { level: 100, xp: 8000, itemKey: 'relic-eternal-flame' },
];

export function getLevelMilestoneSourceKey(level) {
  return `level:${level}`;
}
