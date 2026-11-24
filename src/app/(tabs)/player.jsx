import { router } from 'expo-router';
import { Backpack, ChevronRight } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { IconButton } from '@/components/common/icon-button';
import { ScalePressable } from '@/components/common/scale-pressable';
import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenHeader } from '@/components/common/screen-header';
import { SectionLabel } from '@/components/common/section-label';
import { AttributeList } from '@/components/player/attribute-list';
import { PlayerStatusPanel } from '@/components/player/player-status-panel';
import { RankLadder } from '@/components/player/rank-ladder';
import { RankProgressPanel } from '@/components/player/rank-progress-panel';
import { TITLE_ICON } from '@/constants/reward-visuals';
import { Colors, Spacing } from '@/constants/theme';
import { usePlayerStore } from '@/store/player-store';
import { useRewardStore } from '@/store/reward-store';

function TitlePanel({ entranceIndex }) {
  const title = usePlayerStore((state) => state.title);
  const ownedCount = useRewardStore((state) => state.overview?.titles.filter((candidate) => candidate.isOwned).length ?? 1);
  return (
    <GlowPanel entranceIndex={entranceIndex}>
      <ScalePressable
        onPress={() => router.push({ pathname: '/inventory', params: { tab: 'titles' } })}
        haptic="none"
        style={styles.titleRow}
        accessibilityRole="button"
        accessibilityLabel={`Title: ${title}. ${ownedCount} earned. Change title.`}>
        <TITLE_ICON size={20} color={Colors.highlight} strokeWidth={1.75} />
        <AppText variant="heading" style={styles.titleText}>
          {title}
        </AppText>
        <AppText variant="caption" color="textMuted">
          {ownedCount} earned
        </AppText>
        <ChevronRight size={18} color={Colors.textMuted} />
      </ScalePressable>
    </GlowPanel>
  );
}

export default function PlayerScreen() {
  return (
    <ScreenContainer>
      <ScreenHeader
        systemCode="Module · 03"
        title="Player"
        accessory={<IconButton Icon={Backpack} accessibilityLabel="Inventory" onPress={() => router.push('/inventory')} />}
      />
      <PlayerStatusPanel entranceIndex={0} />
      <TitlePanel entranceIndex={1} />
      <RankProgressPanel entranceIndex={2} />
      <SectionLabel>Ranks</SectionLabel>
      <RankLadder entranceIndex={3} />
      <SectionLabel>Attributes</SectionLabel>
      <AttributeList entranceIndex={4} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  titleText: { flex: 1 },
});
