import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenHeader } from '@/components/common/screen-header';
import { SectionLabel } from '@/components/common/section-label';
import { BossBattleCard } from '@/components/bosses/boss-battle-card';
import { BossRoster } from '@/components/bosses/boss-roster';
import { WeeklyChallengesPanel } from '@/components/challenges/weekly-challenges-panel';
import { QuestEmptyState } from '@/components/quests/quest-empty-state';
import { Colors } from '@/constants/theme';
import { useMinuteClock } from '@/hooks/use-minute-clock';
import { useRewardStore } from '@/store/reward-store';

export default function TrialsScreen() {
  const overview = useRewardStore((state) => state.overview);
  const now = useMinuteClock();

  if (!overview) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.highlight} />
      </View>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader systemCode="Module · 04" title="Trials" subtitle="Weekly challenges and boss gates." />
      <WeeklyChallengesPanel challenges={overview.challenges} now={now} entranceIndex={0} />

      <SectionLabel>{`Boss Battle · ${overview.bossesDefeated}/${overview.bosses.length} cleared`}</SectionLabel>
      {overview.activeBoss ? (
        <BossBattleCard boss={overview.activeBoss} entranceIndex={1} />
      ) : (
        <QuestEmptyState title="Every gate is cleared" message="You defeated every boss. The Shadow bows to you." />
      )}

      <SectionLabel>Gates</SectionLabel>
      <BossRoster bosses={overview.bosses} entranceIndex={2} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
});
