import { Check, Lock } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { ITEM_TYPE_ICONS } from '@/constants/reward-visuals';
import { BorderWidth, Colors, RarityColors, Spacing } from '@/constants/theme';
import { formatNumber } from '@/utils/format';

/** Vertical track of level milestone rewards: claimed, next up, and still locked. */
export function LevelMilestoneTrack({ milestones, currentLevel }) {
  const nextLevel = milestones.find((milestone) => !milestone.unlock)?.level;
  return (
    <GlowPanel style={styles.panel}>
      {milestones.map((milestone, index) => {
        const isClaimed = Boolean(milestone.unlock);
        const isNext = milestone.level === nextLevel;
        const ItemIcon = milestone.item ? ITEM_TYPE_ICONS[milestone.item.type] : null;
        return (
          <View key={milestone.level} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.node, isClaimed && styles.nodeClaimed, isNext && styles.nodeNext]}>
                {isClaimed ? <Check size={12} color={Colors.textOnAccent} strokeWidth={3} /> : <Lock size={10} color={Colors.textMuted} />}
              </View>
              {index < milestones.length - 1 ? <View style={[styles.line, isClaimed && styles.lineClaimed]} /> : null}
            </View>
            <View style={[styles.content, !isClaimed && !isNext && styles.dim]}>
              <AppText variant="heading" color={isNext ? 'highlightLight' : 'textPrimary'}>
                Level {milestone.level}
                {isNext ? (
                  <AppText variant="caption" color="textMuted">{`   ${milestone.level - currentLevel} to go`}</AppText>
                ) : null}
              </AppText>
              <View style={styles.rewards}>
                <AppText variant="caption" color="success">
                  +{formatNumber(milestone.xp)} XP
                </AppText>
                {milestone.item ? (
                  <View style={styles.item}>
                    <ItemIcon size={12} color={RarityColors[milestone.item.rarity]} />
                    <AppText variant="caption" style={{ color: RarityColors[milestone.item.rarity] }}>
                      {milestone.item.name}
                    </AppText>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        );
      })}
    </GlowPanel>
  );
}

const NODE = 22;

const styles = StyleSheet.create({
  panel: { gap: 0 },
  row: { flexDirection: 'row', gap: Spacing.md },
  rail: { alignItems: 'center', width: NODE },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceRaised,
  },
  nodeClaimed: { backgroundColor: Colors.success, borderColor: Colors.success },
  nodeNext: { borderColor: Colors.highlight, boxShadow: '0 0 10px 0 rgba(59, 227, 255, 0.4)' },
  line: { flex: 1, width: 2, minHeight: Spacing.lg, backgroundColor: Colors.border },
  lineClaimed: { backgroundColor: Colors.success },
  content: { flex: 1, gap: Spacing.xxs, paddingBottom: Spacing.lg },
  dim: { opacity: 0.6 },
  rewards: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xxs },
});
