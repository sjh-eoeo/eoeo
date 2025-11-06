import { create } from 'zustand';
import type { VideoRecord } from '../types';

interface VideoState {
  videos: VideoRecord[];
  setVideos: (videos: VideoRecord[]) => void;
  addVideo: (video: VideoRecord) => void;
  updateVideo: (id: string, updates: Partial<VideoRecord>) => void;
  removeVideo: (id: string) => void;
  removeVideos: (ids: string[]) => void;
}

export const useVideoStore = create<VideoState>((set) => ({
  videos: [],
  
  setVideos: (videos) => set({ videos }),
  
  addVideo: (video) =>
    set((state) => ({
      videos: [...state.videos, video],
    })),
  
  updateVideo: (id, updates) =>
    set((state) => ({
      videos: state.videos.map((v) =>
        v.id === id ? { ...v, ...updates } : v
      ),
    })),
  
  removeVideo: (id) =>
    set((state) => ({
      videos: state.videos.filter((v) => v.id !== id),
    })),
  
  removeVideos: (ids) =>
    set((state) => ({
      videos: state.videos.filter((v) => !ids.includes(v.id)),
    })),
}));
