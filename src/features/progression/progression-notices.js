import { getAttributeDefinition } from './attributes';

/**
 * Turns engine events into system notices for the UI. One action can produce several XP changes
 * (quest XP, then achievement XP…), so consecutive level-ups merge into a single notice
 * (first level → final level), as do rank-ups and per-attribute growth. Level-downs (from undo)
 * produce no notice.
 */
export function buildNoticesFromEvents(events) {
  const notices = [];

  const levelUps = events.filter((event) => event.type === 'player-level-up');
  const rankUps = events.filter((event) => event.type === 'rank-up');
  if (levelUps.length > 0) {
    const fromLevel = levelUps[0].fromLevel;
    const toLevel = levelUps.at(-1).toLevel;
    const fromRank = rankUps[0]?.fromRank;
    const toRank = rankUps.at(-1)?.toRank;
    notices.push({
      kind: 'level-up',
      fromLevel,
      toLevel,
      levelsGained: toLevel - fromLevel,
      rankUp: rankUps.length > 0 && fromRank !== toRank ? { fromRank, toRank } : null,
    });
  }

  const growthByAttribute = new Map();
  for (const event of events) {
    if (event.type !== 'attribute-level-up') continue;
    const existing = growthByAttribute.get(event.attributeKey);
    growthByAttribute.set(event.attributeKey, {
      fromLevel: existing?.fromLevel ?? event.fromLevel,
      toLevel: event.toLevel,
    });
  }
  if (growthByAttribute.size > 0) {
    notices.push({
      kind: 'attribute-growth',
      attributes: [...growthByAttribute].map(([key, growth]) => ({
        key,
        shortLabel: getAttributeDefinition(key).shortLabel,
        label: getAttributeDefinition(key).label,
        ...growth,
      })),
    });
  }

  return notices;
}
