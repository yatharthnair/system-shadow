import { router } from 'expo-router';
import { ScrollText, Settings2, Swords } from 'lucide-react-native';

import { IconButton } from '@/components/common/icon-button';
import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenHeader } from '@/components/common/screen-header';
import { SectionLabel } from '@/components/common/section-label';
import { AttributeOverview } from '@/components/player/attribute-overview';
import { PlayerStatusPanel } from '@/components/player/player-status-panel';
import { DevExperiencePanel } from '@/components/system/dev-experience-panel';
import { LockedModulePanel } from '@/components/system/locked-module-panel';

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
      <LockedModulePanel
        entranceIndex={2}
        Icon={ScrollText}
        title="Daily Quests"
        description="Your daily quest board will appear here once the quest engine comes online."
        status="Offline"
      />
      <LockedModulePanel
        entranceIndex={3}
        Icon={Swords}
        title="Active Trial"
        description="No trial in progress."
        status="Idle"
      />
      <DevExperiencePanel entranceIndex={4} />
    </ScreenContainer>
  );
}
