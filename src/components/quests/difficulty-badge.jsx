import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { BorderWidth, DifficultyColors, Radius, Spacing, withAlpha } from '@/constants/theme';
import { DIFFICULTIES_BY_KEY } from '@/features/quests/quest-config';

/** Small colored tag naming a quest's difficulty. */
export function DifficultyBadge({ difficulty }) {
  const color = DifficultyColors[difficulty];
  return (
    <View style={[styles.badge, { borderColor: withAlpha(color, 0.5), backgroundColor: withAlpha(color, 0.1) }]}>
      <AppText variant="label" style={[styles.text, { color }]}>
        {DIFFICULTIES_BY_KEY[difficulty].label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: Radius.xs,
    borderWidth: BorderWidth.thin,
  },
  text: { fontSize: 10, lineHeight: 13, letterSpacing: 1.4 },
});
