import { CalendarClock, ScrollText } from 'lucide-react-native';

import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenHeader } from '@/components/common/screen-header';
import { LockedModulePanel } from '@/components/system/locked-module-panel';

export default function QuestsScreen() {
  return (
    <ScreenContainer>
      <ScreenHeader
        systemCode="Module · 02"
        title="Quests"
        subtitle="Daily objectives that build your attributes."
      />
      <LockedModulePanel
        entranceIndex={0}
        Icon={ScrollText}
        title="Daily Quest Board"
        description="Complete daily quests to earn experience. Failing them carries a penalty."
      />
      <LockedModulePanel
        entranceIndex={1}
        Icon={CalendarClock}
        title="Quest History"
        description="A record of every quest you have cleared."
      />
    </ScreenContainer>
  );
}
