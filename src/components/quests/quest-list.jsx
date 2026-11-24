import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SectionLabel } from '@/components/common/section-label';
import { Spacing } from '@/constants/theme';
import { QUEST_CADENCE_GROUPS } from '@/features/quests/quest-config';
import { useQuestStore } from '@/store/quest-store';

import { QuestCard } from './quest-card';
import { showSystemError } from '@/components/common/show-system-error';

/**
 * Renders board items grouped into Daily / Weekly / Custom sections (or a flat list when a single
 * group is selected). Wires card actions to the quest store.
 */
export function QuestList({ items, now, grouped = true }) {
  const pendingQuestIds = useQuestStore((state) => state.pendingQuestIds);
  const completeQuest = useQuestStore((state) => state.completeQuest);
  const undoCompletion = useQuestStore((state) => state.undoCompletion);

  const renderCard = (item, index) => (
    <QuestCard
      key={item.quest.id}
      item={item}
      now={now}
      entranceIndex={index}
      isPending={Boolean(pendingQuestIds[item.quest.id])}
      onComplete={() => completeQuest(item.quest.id).catch(showSystemError)}
      onUndo={() => undoCompletion(item.quest.id, item.completion.id).catch(showSystemError)}
      onOpen={() => router.push({ pathname: '/quest/[questId]', params: { questId: item.quest.id } })}
    />
  );

  if (!grouped) return <View style={styles.list}>{items.map(renderCard)}</View>;

  let cardIndex = 0;
  return (
    <View style={styles.sections}>
      {QUEST_CADENCE_GROUPS.map((group) => {
        const groupItems = items.filter((item) => item.group === group.key);
        if (groupItems.length === 0) return null;
        const completed = groupItems.filter((item) => item.status === 'completed').length;
        return (
          <View key={group.key} style={styles.list}>
            <SectionLabel>{`${group.label}  ${completed}/${groupItems.length}`}</SectionLabel>
            {groupItems.map((item) => renderCard(item, cardIndex++))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sections: { gap: Spacing.xl },
  list: { gap: Spacing.md },
});
