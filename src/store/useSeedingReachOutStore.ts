import { create } from 'zustand';
import type { ReachOut } from '../types/seeding';
import {
  getCurrentTimestamp,
  updateById,
  deleteById,
  exists,
} from '../lib/utils/storeHelpers';

interface SeedingReachOutState {
  reachOuts: ReachOut[];
  setReachOuts: (reachOuts: ReachOut[]) => void;
  addReachOut: (reachOut: ReachOut) => void;
  updateReachOut: (id: string, updates: Partial<ReachOut>) => void;
  deleteReachOut: (id: string) => void;
  getReachOutById: (id: string) => ReachOut | undefined;
  getReachOutsByProject: (projectId: string) => ReachOut[];
  getReachOutsByStatus: (status: ReachOut['status']) => ReachOut[];
  setResponseStatus: (id: string, status: ReachOut['status']) => void;
}

export const useSeedingReachOutStore = create<SeedingReachOutState>((set, get) => ({
  reachOuts: [],

  setReachOuts: (reachOuts) => set({ reachOuts }),

  addReachOut: (reachOut) =>
    set((state) => {
      // 중복 체크 - 같은 프로젝트의 같은 크리에이터에게 중복 연락 방지
      const duplicate = state.reachOuts.find(
        (r) => r.projectId === reachOut.projectId && r.creatorId === reachOut.creatorId
      );
      if (duplicate) {
        console.warn(`ReachOut already exists for project ${reachOut.projectId} and creator ${reachOut.creatorId}`);
        return state;
      }
      if (exists(state.reachOuts, reachOut.id)) {
        console.warn(`ReachOut ${reachOut.id} already exists`);
        return state;
      }
      return {
        reachOuts: [...state.reachOuts, { ...reachOut, createdAt: getCurrentTimestamp(), updatedAt: getCurrentTimestamp() }],
      };
    }),

  updateReachOut: (id, updates) =>
    set((state) => {
      if (!exists(state.reachOuts, id)) {
        console.warn(`ReachOut ${id} not found`);
        return state;
      }
      return {
        reachOuts: updateById(state.reachOuts, id, updates),
      };
    }),

  deleteReachOut: (id) =>
    set((state) => ({
      reachOuts: deleteById(state.reachOuts, id),
    })),

  getReachOutById: (id) => {
    return get().reachOuts.find((reachOut) => reachOut.id === id);
  },

  getReachOutsByProject: (projectId) => {
    return get().reachOuts.filter((reachOut) => reachOut.projectId === projectId);
  },

  getReachOutsByStatus: (status) => {
    return get().reachOuts.filter((reachOut) => reachOut.status === status);
  },

  setResponseStatus: (id, status) =>
    set((state) => {
      if (!exists(state.reachOuts, id)) {
        console.warn(`ReachOut ${id} not found`);
        return state;
      }
      return {
        reachOuts: state.reachOuts.map((reachOut) =>
          reachOut.id === id
            ? {
                ...reachOut,
                status,
                responseDate: status !== 'pending' ? getCurrentTimestamp() : undefined,
                updatedAt: getCurrentTimestamp(),
              }
            : reachOut
        ),
      };
    }),
}));
