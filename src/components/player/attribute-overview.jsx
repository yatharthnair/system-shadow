import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { ProgressBar } from '@/components/common/progress-bar';
import { BorderWidth, Colors, Radius, Spacing } from '@/constants/theme';
import { ATTRIBUTES } from '@/features/progression/attributes';
import { selectAttributeProgress } from '@/store/player-selectors';
import { usePlayerStore } from '@/store/player-store';

function AttributeTile({ attribute }) {
  const attributeProgress = usePlayerStore(selectAttributeProgress(attribute.key));
  return (
    <View
      style={styles.tile}
      accessible
      accessibilityLabel={`${attribute.label}, level ${attributeProgress.level}`}>
      <AppText variant="label" color="textMuted">
        {attribute.shortLabel}
      </AppText>
      <AppText variant="stat">{attributeProgress.level}</AppText>
      <View style={styles.bar}>
        <ProgressBar progress={attributeProgress.progress} />
      </View>
    </View>
  );
}

/** Compact 3×2 grid of the six attributes with level and progress. Used on the Dashboard. */
export function AttributeOverview({ entranceIndex }) {
  return (
    <GlowPanel entranceIndex={entranceIndex} style={styles.panel}>
      {ATTRIBUTES.map((attribute) => (
        <AttributeTile key={attribute.key} attribute={attribute} />
      ))}
    </GlowPanel>
  );
}

const styles = StyleSheet.create({
  panel: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: {
    flexGrow: 1,
    flexBasis: '30%',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundElevated,
  },
  bar: { alignSelf: 'stretch' },
});
