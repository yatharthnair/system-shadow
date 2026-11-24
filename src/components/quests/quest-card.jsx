import { CalendarDays, Clock, Repeat, Undo2 } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { AppText } from '@/components/common/app-text';
import { ScalePressable } from '@/components/common/scale-pressable';
import { BorderWidth, Colors, ComponentTokens, Glow, Gradients, Motion, Radius, Spacing, withAlpha } from '@/constants/theme';
import { getAttributeDefinition } from '@/features/progression/attributes';
import { formatTimeUntil, formatWeekdayShort } from '@/utils/format';

import { CategoryIconTile } from './category-icon-tile';
import { CompleteButton } from './complete-button';
import { DifficultyBadge } from './difficulty-badge';
import { XpGainBurst } from './xp-gain-burst';

function ScheduleLabel({ item, now }) {
  let Icon = Clock;
  let text;
  if (item.status === 'resting') {
    Icon = CalendarDays;
    text = item.nextScheduledAt ? `Next: ${formatWeekdayShort(item.nextScheduledAt)}` : 'Not scheduled';
  } else if (item.quest.cadence === 'once') {
    Icon = Repeat;
    text = 'One-time';
  } else {
    text = `Resets in ${formatTimeUntil(item.resetsAt, now)}`;
  }
  return (
    <View style={styles.metaItem}>
      <Icon size={12} color={Colors.textMuted} strokeWidth={2} />
      <AppText variant="caption" color="textMuted">
        {text}
      </AppText>
    </View>
  );
}

/**
 * One quest on the board: category, title, difficulty, reward, schedule, and a complete/undo
 * control. Plays a "+XP" burst when it becomes completed. Tap the card body to edit.
 *
 * @param {{ item: object, now: Date, isPending: boolean, entranceIndex?: number,
 *   onComplete: () => void, onUndo: () => void, onOpen: () => void }} props
 */
export function QuestCard({ item, now, isPending, entranceIndex = 0, onComplete, onUndo, onOpen }) {
  const { quest, status } = item;
  const isCompleted = status === 'completed';
  const isResting = status === 'resting';

  // Play the XP burst only on a live transition to completed, not when first rendered completed.
  // (Adjusting state during render is React's recommended way to react to a prop change.)
  const [previousStatus, setPreviousStatus] = useState(status);
  const [burstCount, setBurstCount] = useState(0);
  if (status !== previousStatus) {
    setPreviousStatus(status);
    if (status === 'completed') setBurstCount((count) => count + 1);
  }

  const attributeSummary = Object.entries(item.attributeXp)
    .map(([key, xp]) => `${getAttributeDefinition(key).shortLabel} +${xp}`)
    .join('  ·  ');

  return (
    <Animated.View
      entering={FadeInDown.duration(Motion.duration.slow).delay(Math.min(entranceIndex, 8) * Motion.staggerStep)}
      layout={LinearTransition.springify().damping(Motion.spring.gentle.damping)}
      style={[styles.card, isCompleted && styles.cardCompleted, isResting && styles.cardResting]}>
      <ScalePressable
        onPress={onOpen}
        haptic="none"
        style={styles.body}
        accessibilityRole="button"
        accessibilityLabel={`${quest.title}. ${item.xpReward} XP. ${isCompleted ? 'Completed' : isResting ? 'Not scheduled today' : 'Available'}.`}
        accessibilityHint="Opens the quest editor">
        <CategoryIconTile category={quest.category} />
        <View style={styles.text}>
          <AppText
            variant="heading"
            numberOfLines={2}
            style={isCompleted && styles.titleCompleted}
            color={isCompleted ? 'textSecondary' : 'textPrimary'}>
            {quest.title}
          </AppText>
          <View style={styles.metaRow}>
            <DifficultyBadge difficulty={quest.difficulty} />
            <AppText variant="stat" color={isCompleted ? 'success' : 'highlightLight'} style={styles.xp}>
              {item.xpReward} XP
            </AppText>
            <ScheduleLabel item={item} now={now} />
          </View>
          {attributeSummary ? (
            <AppText variant="caption" color="textMuted" numberOfLines={1}>
              {attributeSummary}
            </AppText>
          ) : null}
        </View>
      </ScalePressable>

      <View style={styles.actions}>
        {!isResting ? (
          <CompleteButton
            isCompleted={isCompleted}
            isPending={isPending && !isCompleted}
            onPress={onComplete}
            accessibilityLabel={`Complete ${quest.title}`}
          />
        ) : null}
        {isCompleted && item.canUndo ? (
          <ScalePressable
            onPress={onUndo}
            disabled={isPending}
            accessibilityRole="button"
            accessibilityLabel={`Undo ${quest.title}`}
            accessibilityHint={`Removes the completion and its ${item.xpReward} XP`}
            hitSlop={8}
            style={styles.undo}>
            <Undo2 size={14} color={Colors.textSecondary} strokeWidth={2} />
            <AppText variant="label" color="textSecondary" style={styles.undoLabel}>
              Undo
            </AppText>
          </ScalePressable>
        ) : null}
        {burstCount > 0 ? <XpGainBurst key={burstCount} amount={item.xpReward} /> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: ComponentTokens.panel.padding - 2,
    borderRadius: ComponentTokens.panel.radius,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    backgroundImage: Gradients.panel,
    boxShadow: Glow.subtle,
  },
  cardCompleted: {
    borderColor: withAlpha(Colors.success, 0.45),
    boxShadow: `0 0 14px 0 ${withAlpha(Colors.success, 0.18)}`,
  },
  cardResting: { opacity: 0.55 },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  text: { flex: 1, gap: Spacing.xs },
  titleCompleted: { textDecorationLine: 'line-through', textDecorationColor: Colors.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: Spacing.sm, rowGap: Spacing.xs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xxs },
  xp: { fontSize: 14, lineHeight: 16 },
  actions: { alignItems: 'center', gap: Spacing.sm, minWidth: 48 },
  undo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radius.xs,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
  },
  undoLabel: { fontSize: 10, letterSpacing: 1.2 },
});
