import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { ProgressRing } from '@/components/common/progress-ring';
import { ScalePressable } from '@/components/common/scale-pressable';
import { Colors, Spacing } from '@/constants/theme';
import { sortQuestBoard } from '@/features/quests/quest-board';
import { useQuestStore } from '@/store/quest-store';
import { formatNumber } from '@/utils/format';

import { CategoryIconTile } from './category-icon-tile';
import { CompleteButton } from './complete-button';
import { showSystemError } from '@/components/common/show-system-error';

const PREVIEW_COUNT = 3;

/** Dashboard summary: today's progress and the next few available quests, completable in place. */
export function TodayQuestsPanel({ entranceIndex }) {
  const board = useQuestStore((state) => state.board);
  const summary = useQuestStore((state) => state.summary);
  const pendingQuestIds = useQuestStore((state) => state.pendingQuestIds);
  const completeQuest = useQuestStore((state) => state.completeQuest);

  const nextUp = sortQuestBoard(board)
    .filter((item) => item.status === 'available')
    .slice(0, PREVIEW_COUNT);

  return (
    <GlowPanel entranceIndex={entranceIndex} style={styles.panel}>
      <ScalePressable
        onPress={() => router.navigate('/quests')}
        haptic="none"
        style={styles.header}
        accessibilityRole="button"
        accessibilityLabel={`Quests: ${summary.overall.completed} of ${summary.overall.total} cleared. Open quests.`}>
        <ProgressRing progress={summary.overall.progress} size={56} strokeWidth={5}>
          <AppText variant="stat" style={styles.ringValue}>
            {summary.overall.completed}
          </AppText>
        </ProgressRing>
        <View style={styles.headerText}>
          <AppText variant="heading">
            {summary.overall.completed}/{summary.overall.total} quests cleared
          </AppText>
          <AppText variant="caption" color="textMuted">
            +{formatNumber(summary.xpEarned)} XP earned · {formatNumber(summary.xpAvailable)} XP available
          </AppText>
        </View>
        <ChevronRight size={20} color={Colors.textMuted} />
      </ScalePressable>

      {nextUp.length > 0 ? (
        <View style={styles.list}>
          {nextUp.map((item) => (
            <View key={item.quest.id} style={styles.row}>
              <CategoryIconTile category={item.quest.category} size={32} />
              <AppText variant="bodyStrong" numberOfLines={1} style={styles.rowTitle}>
                {item.quest.title}
              </AppText>
              <AppText variant="stat" color="highlightLight" style={styles.rowXp}>
                {item.xpReward}
              </AppText>
              <CompleteButton
                isCompleted={false}
                isPending={Boolean(pendingQuestIds[item.quest.id])}
                onPress={() => completeQuest(item.quest.id).catch(showSystemError)}
                accessibilityLabel={`Complete ${item.quest.title}`}
              />
            </View>
          ))}
        </View>
      ) : summary.overall.total === 0 ? (
        <AppText variant="body" color="textMuted">
          No quests scheduled today. Add one from the Quests tab.
        </AppText>
      ) : (
        <AppText variant="body" color="success">
          All available quests cleared.
        </AppText>
      )}
    </GlowPanel>
  );
}

const styles = StyleSheet.create({
  panel: { gap: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  ringValue: { fontSize: 18 },
  headerText: { flex: 1, gap: Spacing.xxs },
  list: { gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rowTitle: { flex: 1 },
  rowXp: { fontSize: 14 },
});
