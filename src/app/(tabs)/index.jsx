import { router } from 'expo-router';
import { Settings2 } from 'lucide-react-native';

import { BossMiniPanel } from '@/components/bosses/boss-mini-panel';
import { IconButton } from '@/components/common/icon-button';
import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenHeader } from '@/components/common/screen-header';
import { SectionLabel } from '@/components/common/section-label';
import { AttributeOverview } from '@/components/player/attribute-overview';
import { PlayerStatusPanel } from '@/components/player/player-status-panel';
import { TodayQuestsPanel } from '@/components/quests/today-quests-panel';
import { DevExperiencePanel } from '@/components/system/dev-experience-panel';

export default function DashboardScreen() {
  return (
    <ScreenContainer>
      <ScreenHeader
        systemCode="System · Online"
        title="Status"
        accessory={
          <IconButton
            Icon={Settings2}
            accessibilityLabel="Settings"
            onPress={() => router.push('/settings')}
          />
        }
      />
      <PlayerStatusPanel entranceIndex={0} />

      <SectionLabel>Attributes</SectionLabel>
      <AttributeOverview entranceIndex={1} />

      <SectionLabel>Today</SectionLabel>
      <TodayQuestsPanel entranceIndex={2} />
      <BossMiniPanel entranceIndex={3} />
      <DevExperiencePanel entranceIndex={4} />
    </ScreenContainer>
  );
}
