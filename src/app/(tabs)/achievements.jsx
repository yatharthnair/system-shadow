import { Medal, Trophy } from 'lucide-react-native';

import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenHeader } from '@/components/common/screen-header';
import { LockedModulePanel } from '@/components/system/locked-module-panel';

export default function AchievementsScreen() {
  return (
    <ScreenContainer>
      <ScreenHeader
        systemCode="Module · 05"
        title="Feats"
        subtitle="Milestones and titles earned along the way."
      />
      <LockedModulePanel
        entranceIndex={0}
        Icon={Trophy}
        title="Achievements"
        description="Unlock feats by reaching milestones in quests, trials and levels."
      />
      <LockedModulePanel
        entranceIndex={1}
        Icon={Medal}
        title="Titles"
        description="Earn titles that appear on your player profile."
      />
    </ScreenContainer>
  );
}
