import { getAttributeDefinition } from './attributes';

/**
 * Turns engine events into system notices for the UI: at most one level-up notice
 * (which carries any rank-up) and one grouped attribute-growth notice per reward.
 */
export function buildNoticesFromEvents(events) {
  const notices = [];

  const levelUp = events.find((event) => event.type === 'player-level-up');
  const rankUp = events.find((event) => event.type === 'rank-up');
  if (levelUp) {
    notices.push({
      kind: 'level-up',
      fromLevel: levelUp.fromLevel,
      toLevel: levelUp.toLevel,
      levelsGained: levelUp.levelsGained,
      rankUp: rankUp ? { fromRank: rankUp.fromRank, toRank: rankUp.toRank } : null,
    });
  }

  const attributeLevelUps = events.filter((event) => event.type === 'attribute-level-up');
  if (attributeLevelUps.length > 0) {
    notices.push({
      kind: 'attribute-growth',
      attributes: attributeLevelUps.map((event) => ({
        key: event.attributeKey,
        shortLabel: getAttributeDefinition(event.attributeKey).shortLabel,
        label: getAttributeDefinition(event.attributeKey).label,
        fromLevel: event.fromLevel,
        toLevel: event.toLevel,
      })),
    });
  }

  return notices;
}
