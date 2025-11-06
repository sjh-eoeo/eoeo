import { create } from 'zustand';
import type { Profile } from '../types';

interface ProfileState {
  profiles: Profile[];
  setProfiles: (profiles: Profile[]) => void;
  addProfile: (profile: Profile) => void;
  updateProfile: (tiktokId: string, updates: Partial<Profile>) => void;
  removeProfile: (tiktokId: string) => void;
  removeProfiles: (tiktokIds: string[]) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profiles: [],
  
  setProfiles: (profiles) => set({ profiles }),
  
  addProfile: (profile) =>
    set((state) => ({
      profiles: [...state.profiles, profile],
    })),
  
  updateProfile: (tiktokId, updates) =>
    set((state) => ({
      profiles: state.profiles.map((p) =>
        p.tiktokId === tiktokId ? { ...p, ...updates } : p
      ),
    })),
  
  removeProfile: (tiktokId) =>
    set((state) => ({
      profiles: state.profiles.filter((p) => p.tiktokId !== tiktokId),
    })),
  
  removeProfiles: (tiktokIds) =>
    set((state) => ({
      profiles: state.profiles.filter((p) => !tiktokIds.includes(p.tiktokId)),
    })),
}));
