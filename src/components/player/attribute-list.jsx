import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { ProgressBar } from '@/components/common/progress-bar';
import { Colors, Spacing } from '@/constants/theme';
import { ATTRIBUTES } from '@/features/progression/attributes';
import { selectAttributeProgress } from '@/store/player-selectors';
import { usePlayerStore } from '@/store/player-store';
import { formatNumber, padNumber } from '@/utils/format';

function AttributeRow({ attribute, isLast }) {
  const attributeProgress = usePlayerStore(selectAttributeProgress(attribute.key));
  return (
    <View style={[styles.row, !isLast && styles.divider]}>
      <View style={styles.header}>
        <AppText variant="label" color="highlight" style={styles.shortLabel}>
          {attribute.shortLabel}
        </AppText>
        <View style={styles.titleBlock}>
          <AppText variant="heading">{attribute.label}</AppText>
          <AppText variant="caption" color="textMuted">
            {attribute.description}
          </AppText>
        </View>
        <AppText variant="stat" accessibilityLabel={`Level ${attributeProgress.level}`}>
          Lv. {padNumber(attributeProgress.level)}
        </AppText>
      </View>
      <ProgressBar progress={attributeProgress.progress} accessibilityLabel={`${attribute.label} experience`} />
      <AppText variant="caption" color="textSecondary" style={styles.xp}>
        {attributeProgress.isMaxLevel
          ? 'MAX'
          : `${formatNumber(attributeProgress.xpIntoLevel)} / ${formatNumber(attributeProgress.xpForNextLevel)} XP`}
      </AppText>
    </View>
  );
}

/** Detailed list of all six attributes. Used on the Player screen. */
export function AttributeList({ entranceIndex }) {
  return (
    <GlowPanel entranceIndex={entranceIndex} style={styles.panel}>
      {ATTRIBUTES.map((attribute, index) => (
        <AttributeRow key={attribute.key} attribute={attribute} isLast={index === ATTRIBUTES.length - 1} />
      ))}
    </GlowPanel>
  );
}

const styles = StyleSheet.create({
  panel: { gap: Spacing.lg },
  row: { gap: Spacing.sm },
  divider: { paddingBottom: Spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  shortLabel: { width: 32 },
  titleBlock: { flex: 1, gap: Spacing.xxs },
  xp: { alignSelf: 'flex-end', fontVariant: ['tabular-nums'] },
});
