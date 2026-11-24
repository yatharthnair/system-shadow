import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { ScalePressable } from '@/components/common/scale-pressable';
import { BorderWidth, Colors, DifficultyColors, Radius, Spacing, withAlpha } from '@/constants/theme';
import { QUEST_DIFFICULTIES } from '@/features/quests/quest-config';
import { calculateQuestXp } from '@/features/quests/quest-rewards';

/** Four difficulty options, each showing the XP it's worth for the chosen cadence. */
export function DifficultyPicker({ value, cadence, onChange }) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {QUEST_DIFFICULTIES.map((difficulty) => {
        const color = DifficultyColors[difficulty.key];
        const isSelected = difficulty.key === value;
        const xp = calculateQuestXp({ difficulty: difficulty.key, cadence });
        return (
          <ScalePressable
            key={difficulty.key}
            onPress={() => onChange(difficulty.key)}
            haptic="selection"
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={`${difficulty.label}, ${xp} XP`}
            style={[styles.option, isSelected && { borderColor: color, backgroundColor: withAlpha(color, 0.12) }]}>
            <AppText variant="label" style={[styles.label, { color: isSelected ? color : Colors.textMuted }]}>
              {difficulty.label}
            </AppText>
            <AppText variant="stat" color={isSelected ? 'textPrimary' : 'textSecondary'} style={styles.xp}>
              {xp}
            </AppText>
          </ScalePressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xxs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  label: { fontSize: 10, letterSpacing: 1.2 },
  xp: { fontSize: 16 },
});
