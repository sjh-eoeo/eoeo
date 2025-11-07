import { create } from 'zustand';
import type { Creator } from '../types/seeding';
import {
  getCurrentTimestamp,
  updateById,
  deleteById,
  exists,
  removeDuplicatesById,
} from '../lib/utils/storeHelpers';

interface SeedingCreatorState {
  creators: Creator[];
  addCreator: (creator: Creator) => void;
  addCreators: (creators: Creator[]) => void;
  updateCreator: (id: string, updates: Partial<Creator>) => void;
  deleteCreator: (id: string) => void;
  getCreatorById: (id: string) => Creator | undefined;
}

export const useSeedingCreatorStore = create<SeedingCreatorState>((set, get) => ({
  creators: [],

  addCreator: (creator) =>
    set((state) => {
      // 중복 체크 (ID 또는 userId로)
      if (exists(state.creators, creator.id)) {
        console.warn(`Creator ${creator.id} already exists`);
        return state;
      }
      if (state.creators.some((c) => c.userId === creator.userId)) {
        console.warn(`Creator with userId ${creator.userId} already exists`);
        return state;
      }
      return {
        creators: [...state.creators, { ...creator, createdAt: getCurrentTimestamp(), updatedAt: getCurrentTimestamp() }],
      };
    }),

  addCreators: (creators) =>
    set((state) => {
      // 중복 제거 후 추가
      const existingIds = new Set(state.creators.map((c) => c.id));
      const existingUserIds = new Set(state.creators.map((c) => c.userId));
      
      const newCreators = creators.filter(
        (c) => !existingIds.has(c.id) && !existingUserIds.has(c.userId)
      );
      
      if (newCreators.length < creators.length) {
        console.warn(`Filtered out ${creators.length - newCreators.length} duplicate creators`);
      }
      
      return {
        creators: [...state.creators, ...newCreators.map(c => ({ 
          ...c, 
          createdAt: c.createdAt || getCurrentTimestamp(), 
          updatedAt: getCurrentTimestamp() 
        }))],
      };
    }),

  updateCreator: (id, updates) =>
    set((state) => {
      if (!exists(state.creators, id)) {
        console.warn(`Creator ${id} not found`);
        return state;
      }
      return {
        creators: updateById(state.creators, id, updates),
      };
    }),

  deleteCreator: (id) =>
    set((state) => ({
      creators: deleteById(state.creators, id),
    })),

  getCreatorById: (id) => {
    return get().creators.find((creator) => creator.id === id);
  },
}));
