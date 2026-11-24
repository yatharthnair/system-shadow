import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenHeader } from '@/components/common/screen-header';
import { SectionLabel } from '@/components/common/section-label';
import { AttributeList } from '@/components/player/attribute-list';
import { PlayerStatusPanel } from '@/components/player/player-status-panel';
import { RankProgressPanel } from '@/components/player/rank-progress-panel';

export default function PlayerScreen() {
  return (
    <ScreenContainer>
      <ScreenHeader systemCode="Module · 03" title="Player" />
      <PlayerStatusPanel entranceIndex={0} />
      <RankProgressPanel entranceIndex={1} />
      <SectionLabel>Attributes</SectionLabel>
      <AttributeList entranceIndex={2} />
    </ScreenContainer>
  );
}
