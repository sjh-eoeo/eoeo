import { create } from 'zustand';
import type { Creator } from '../types/negotiation';

interface CreatorState {
  creators: Creator[];
  loading: boolean;
  error: string | null;
  setCreators: (creators: Creator[]) => void;
  addCreator: (creator: Creator) => void;
  updateCreator: (id: string, updates: Partial<Creator>) => void;
  deleteCreator: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCreatorStore = create<CreatorState>((set) => ({
  creators: [],
  loading: false,
  error: null,
  
  setCreators: (creators) => set({ creators }),
  
  addCreator: (creator) =>
    set((state) => ({
      creators: [...state.creators, creator],
    })),
  
  updateCreator: (id, updates) =>
    set((state) => ({
      creators: state.creators.map((creator) =>
        creator.id === id ? { ...creator, ...updates, updatedAt: new Date().toISOString() } : creator
      ),
    })),
  
  deleteCreator: (id) =>
    set((state) => ({
      creators: state.creators.filter((creator) => creator.id !== id),
    })),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
