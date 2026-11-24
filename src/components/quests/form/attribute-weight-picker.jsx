import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { ScalePressable } from '@/components/common/scale-pressable';
import { BorderWidth, Colors, Radius, Spacing } from '@/constants/theme';
import { ATTRIBUTES } from '@/features/progression/attributes';
import { QUEST_LIMITS } from '@/features/quests/quest-config';

const { maxAttributeWeight } = QUEST_LIMITS;

function WeightPips({ weight }) {
  return (
    <View style={styles.pips}>
      {Array.from({ length: maxAttributeWeight }, (_, index) => (
        <View key={index} style={[styles.pip, index < weight && styles.pipFilled]} />
      ))}
    </View>
  );
}

/**
 * Tap an attribute to cycle its weight 0 → 1 → 2 → 3 → 0. The quest's XP is split between
 * attributes in proportion to their weights; `attributeXp` shows the resulting split.
 */
export function AttributeWeightPicker({ weights, attributeXp, onChange }) {
  return (
    <View style={styles.grid}>
      {ATTRIBUTES.map((attribute) => {
        const weight = weights[attribute.key] ?? 0;
        const isActive = weight > 0;
        return (
          <ScalePressable
            key={attribute.key}
            onPress={() => onChange(attribute.key, (weight + 1) % (maxAttributeWeight + 1))}
            haptic="selection"
            accessibilityRole="adjustable"
            accessibilityLabel={`${attribute.label} weight`}
            accessibilityValue={{ min: 0, max: maxAttributeWeight, now: weight }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(event) => {
              const delta = event.nativeEvent.actionName === 'increment' ? 1 : -1;
              onChange(attribute.key, Math.min(maxAttributeWeight, Math.max(0, weight + delta)));
            }}
            style={[styles.tile, isActive && styles.tileActive]}>
            <AppText variant="label" color={isActive ? 'highlightLight' : 'textMuted'}>
              {attribute.shortLabel}
            </AppText>
            <WeightPips weight={weight} />
            <AppText variant="caption" color={isActive ? 'textSecondary' : 'textMuted'} style={styles.xp}>
              {isActive && attributeXp?.[attribute.key] != null ? `+${attributeXp[attribute.key]}` : '—'}
            </AppText>
          </ScalePressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: {
    flexBasis: '30%',
    flexGrow: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  tileActive: { borderColor: Colors.borderGlow, backgroundColor: Colors.highlightSoft },
  pips: { flexDirection: 'row', gap: 4 },
  pip: { width: 14, height: 3, borderRadius: 2, backgroundColor: Colors.surfacePressed },
  pipFilled: { backgroundColor: Colors.highlight },
  xp: { fontVariant: ['tabular-nums'] },
});
