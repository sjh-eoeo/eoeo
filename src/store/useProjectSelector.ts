import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppProject = '10k' | 'negotiation';

interface ProjectSelectorState {
  currentProject: AppProject;
  setCurrentProject: (project: AppProject) => void;
}

export const useProjectSelector = create<ProjectSelectorState>()(
  persist(
    (set) => ({
      currentProject: '10k',
      setCurrentProject: (project) => set({ currentProject: project }),
    }),
    {
      name: 'project-selector-storage',
    }
  )
);
