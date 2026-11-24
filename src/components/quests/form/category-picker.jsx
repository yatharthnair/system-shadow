import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { ScalePressable } from '@/components/common/scale-pressable';
import { CATEGORY_ICONS } from '@/constants/quest-visuals';
import { BorderWidth, CategoryColors, Colors, Radius, Spacing, withAlpha } from '@/constants/theme';
import { QUEST_CATEGORIES } from '@/features/quests/quest-config';

/** 4×2 grid of category tiles. */
export function CategoryPicker({ value, onChange }) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {QUEST_CATEGORIES.map((category) => {
        const Icon = CATEGORY_ICONS[category.key];
        const color = CategoryColors[category.key];
        const isSelected = category.key === value;
        return (
          <ScalePressable
            key={category.key}
            onPress={() => onChange(category.key)}
            haptic="selection"
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={category.label}
            style={[
              styles.tile,
              isSelected && { borderColor: color, backgroundColor: withAlpha(color, 0.14) },
            ]}>
            <Icon size={20} color={isSelected ? color : Colors.textMuted} strokeWidth={1.75} />
            <AppText
              variant="label"
              color={isSelected ? 'textPrimary' : 'textMuted'}
              style={styles.label}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {category.label}
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
    flexBasis: '22%',
    flexGrow: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  label: { fontSize: 9, letterSpacing: 1 },
});
