import { create } from 'zustand';

let nextNoticeId = 1;

/**
 * Queue of system notices (level-ups, rank-ups, attribute growth) waiting to be shown.
 * `SystemNoticeHost` displays the first one, then dismisses it to reveal the next.
 */
export const useSystemNoticeStore = create((set) => ({
  queue: [],

  publishNotices: (notices) => {
    if (notices.length === 0) return;
    set((state) => ({
      queue: [...state.queue, ...notices.map((notice) => ({ ...notice, id: nextNoticeId++ }))],
    }));
  },

  dismissNotice: (noticeId) =>
    set((state) => ({ queue: state.queue.filter((notice) => notice.id !== noticeId) })),
}));
