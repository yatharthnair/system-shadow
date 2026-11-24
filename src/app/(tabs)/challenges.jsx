import { Flame, Swords } from 'lucide-react-native';

import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenHeader } from '@/components/common/screen-header';
import { LockedModulePanel } from '@/components/system/locked-module-panel';

export default function ChallengesScreen() {
  return (
    <ScreenContainer>
      <ScreenHeader
        systemCode="Module · 04"
        title="Trials"
        subtitle="Multi-day challenges with greater rewards."
      />
      <LockedModulePanel
        entranceIndex={0}
        Icon={Swords}
        title="Trial Gates"
        description="Take on long-form challenges that test consistency over days or weeks."
      />
      <LockedModulePanel
        entranceIndex={1}
        Icon={Flame}
        title="Streaks"
        description="Track unbroken chains of completed quests."
      />
    </ScreenContainer>
  );
}
