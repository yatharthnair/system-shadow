import { useCallback } from 'react';

import { useSystemNoticeStore } from '@/store/system-notice-store';

import { AchievementCinematic } from './achievement-cinematic';
import { AttributeGrowthBanner } from './attribute-growth-banner';
import { BossDefeatCinematic } from './boss-defeat-cinematic';
import { LevelUpOverlay } from './level-up-overlay';
import { RewardBanner } from './reward-banner';

const NOTICE_COMPONENTS = {
  'level-up': LevelUpOverlay,
  'boss-defeated': BossDefeatCinematic,
  'achievement-unlocked': AchievementCinematic,
  'reward-banner': RewardBanner,
  'attribute-growth': AttributeGrowthBanner,
};

/** Shows queued system notices one at a time. Mount once, above navigation, in the root layout. */
export function SystemNoticeHost() {
  const currentNotice = useSystemNoticeStore((state) => state.queue[0]);
  const dismissNotice = useSystemNoticeStore((state) => state.dismissNotice);
  const noticeId = currentNotice?.id;

  const handleDismiss = useCallback(() => dismissNotice(noticeId), [dismissNotice, noticeId]);

  if (!currentNotice) return null;

  const NoticeComponent = NOTICE_COMPONENTS[currentNotice.kind];
  if (!NoticeComponent) return null;

  // `key` remounts the component per notice so its entrance animation replays.
  return <NoticeComponent key={currentNotice.id} notice={currentNotice} onDismiss={handleDismiss} />;
}
