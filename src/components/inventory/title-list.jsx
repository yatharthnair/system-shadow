import { Check, Lock } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { ScalePressable } from '@/components/common/scale-pressable';
import { showSystemError } from '@/components/common/show-system-error';
import { TITLE_ICON } from '@/constants/reward-visuals';
import { BorderWidth, Colors, Radius, Spacing } from '@/constants/theme';
import { useRewardStore } from '@/store/reward-store';

function TitleRow({ title, isLast }) {
  const equipTitle = useRewardStore((state) => state.equipTitle);
  return (
    <View style={[styles.row, !isLast && styles.divider, !title.isOwned && styles.locked]}>
      {title.isOwned ? <TITLE_ICON size={18} color={Colors.highlight} strokeWidth={1.75} /> : <Lock size={16} color={Colors.textMuted} />}
      <View style={styles.text}>
        <AppText variant="bodyStrong" color={title.isOwned ? 'textPrimary' : 'textMuted'}>
          {title.label}
        </AppText>
        <AppText variant="caption" color="textMuted">
          {title.description}
        </AppText>
      </View>
      {title.isEquipped ? (
        <View style={styles.equipped}>
          <Check size={14} color={Colors.success} strokeWidth={3} />
          <AppText variant="label" color="success" style={styles.buttonLabel}>
            Equipped
          </AppText>
        </View>
      ) : title.isOwned ? (
        <ScalePressable
          onPress={() => equipTitle(title.id).catch(showSystemError)}
          haptic="selection"
          accessibilityRole="button"
          accessibilityLabel={`Equip title ${title.label}`}
          style={styles.equip}>
          <AppText variant="label" color="highlightLight" style={styles.buttonLabel}>
            Equip
          </AppText>
        </ScalePressable>
      ) : null}
    </View>
  );
}

/** Earned titles (equippable) followed by titles still to earn. */
export function TitleList({ titles }) {
  const ordered = [...titles.filter((title) => title.isOwned), ...titles.filter((title) => !title.isOwned)];
  return (
    <GlowPanel style={styles.panel}>
      {ordered.map((title, index) => (
        <TitleRow key={title.id} title={title} isLast={index === ordered.length - 1} />
      ))}
    </GlowPanel>
  );
}

const styles = StyleSheet.create({
  panel: { gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  divider: { paddingBottom: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  locked: { opacity: 0.55 },
  text: { flex: 1, gap: Spacing.xxs },
  equip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.borderGlow,
    backgroundColor: Colors.highlightSoft,
  },
  equipped: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xxs },
  buttonLabel: { fontSize: 10 },
});
