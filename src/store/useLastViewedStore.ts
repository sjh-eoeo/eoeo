import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Last Viewed Store
 * 
 * 사용자가 마지막으로 본 항목의 시간을 저장하여
 * 이후 업데이트를 추적합니다.
 */

interface LastViewedState {
  lastViewed: Record<string, string>; // { [itemId]: timestamp }
  markAsViewed: (itemId: string) => void;
  getLastViewed: (itemId: string) => string | undefined;
  clearLastViewed: (itemId: string) => void;
  clearAll: () => void;
}

export const useLastViewedStore = create<LastViewedState>()(
  persist(
    (set, get) => ({
      lastViewed: {},

      markAsViewed: (itemId: string) =>
        set((state) => ({
          lastViewed: {
            ...state.lastViewed,
            [itemId]: new Date().toISOString(),
          },
        })),

      getLastViewed: (itemId: string) => {
        return get().lastViewed[itemId];
      },

      clearLastViewed: (itemId: string) =>
        set((state) => {
          const { [itemId]: _, ...rest } = state.lastViewed;
          return { lastViewed: rest };
        }),

      clearAll: () => set({ lastViewed: {} }),
    }),
    {
      name: 'last-viewed-storage',
    }
  )
);
