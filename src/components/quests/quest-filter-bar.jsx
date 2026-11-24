import { Eye, EyeOff } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { FilterChip } from '@/components/common/filter-chip';
import { SegmentedControl } from '@/components/common/segmented-control';
import { CATEGORY_ICONS } from '@/constants/quest-visuals';
import { CategoryColors, ComponentTokens, Spacing } from '@/constants/theme';
import { QUEST_CADENCE_GROUPS, QUEST_CATEGORIES } from '@/features/quests/quest-config';
import { useQuestStore } from '@/store/quest-store';

const GROUP_OPTIONS = [{ value: 'all', label: 'All' }, ...QUEST_CADENCE_GROUPS.map((group) => ({ value: group.key, label: group.label }))];

/** Cadence segments, category chips and a hide-completed toggle. */
export function QuestFilterBar() {
  const filters = useQuestStore((state) => state.filters);
  const setFilters = useQuestStore((state) => state.setFilters);

  return (
    <View style={styles.container}>
      <SegmentedControl
        options={GROUP_OPTIONS}
        value={filters.group}
        onChange={(group) => setFilters({ group })}
        accessibilityLabel="Quest type"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipScroller}>
        <FilterChip
          label={filters.hideCompleted ? 'Hidden' : 'Done'}
          Icon={filters.hideCompleted ? EyeOff : Eye}
          isSelected={filters.hideCompleted}
          onPress={() => setFilters({ hideCompleted: !filters.hideCompleted })}
        />
        {QUEST_CATEGORIES.map((category) => (
          <FilterChip
            key={category.key}
            label={category.label}
            Icon={CATEGORY_ICONS[category.key]}
            accentColor={CategoryColors[category.key]}
            isSelected={filters.category === category.key}
            onPress={() => setFilters({ category: filters.category === category.key ? null : category.key })}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  // Let chips scroll edge to edge, past the screen's horizontal padding.
  chipScroller: { marginHorizontal: -ComponentTokens.screen.horizontalPadding },
  chips: { gap: Spacing.sm, paddingHorizontal: ComponentTokens.screen.horizontalPadding },
});
