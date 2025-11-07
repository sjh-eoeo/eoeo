import { create } from 'zustand';
import type { Project, EmailTemplate } from '../types/seeding';
import {
  addUniqueItem,
  removeItem,
  getCurrentTimestamp,
  updateById,
  deleteById,
  exists,
} from '../lib/utils/storeHelpers';

interface SeedingProjectState {
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProjectById: (id: string) => Project | undefined;
  getProjectsByBrand: (brandId: string) => Project[];
  getProjectsByStatus: (status: Project['status']) => Project[];
  addCreatorToProject: (projectId: string, creatorId: string) => void;
  removeCreatorFromProject: (projectId: string, creatorId: string) => void;
  addAssignee: (projectId: string, userEmail: string) => void;
  removeAssignee: (projectId: string, userEmail: string) => void;
  getProjectsByAssignee: (userEmail: string) => Project[];
  updateEmailTemplates: (projectId: string, templates: EmailTemplate[]) => void;
}

export const useSeedingProjectStore = create<SeedingProjectState>((set, get) => ({
  projects: [],

  addProject: (project) =>
    set((state) => {
      // 중복 체크
      if (exists(state.projects, project.id)) {
        console.warn(`Project ${project.id} already exists`);
        return state;
      }
      return {
        projects: [...state.projects, { ...project, createdAt: getCurrentTimestamp(), updatedAt: getCurrentTimestamp() }],
      };
    }),

  updateProject: (id, updates) =>
    set((state) => {
      // 존재 여부 체크
      if (!exists(state.projects, id)) {
        console.warn(`Project ${id} not found`);
        return state;
      }
      return {
        projects: updateById(state.projects, id, updates),
      };
    }),

  deleteProject: (id) =>
    set((state) => ({
      projects: deleteById(state.projects, id),
    })),

  getProjectById: (id) => {
    return get().projects.find((project) => project.id === id);
  },

  getProjectsByBrand: (brandId) => {
    return get().projects.filter((project) => project.brandId === brandId);
  },

  getProjectsByStatus: (status) => {
    return get().projects.filter((project) => project.status === status);
  },

  addCreatorToProject: (projectId, creatorId) =>
    set((state) => {
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) {
        console.warn(`Project ${projectId} not found`);
        return state;
      }
      // 중복 체크
      if (project.selectedCreators.includes(creatorId)) {
        console.warn(`Creator ${creatorId} already in project ${projectId}`);
        return state;
      }
      return {
        projects: state.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                selectedCreators: addUniqueItem(p.selectedCreators, creatorId),
                updatedAt: getCurrentTimestamp(),
              }
            : p
        ),
      };
    }),

  removeCreatorFromProject: (projectId, creatorId) =>
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              selectedCreators: removeItem(project.selectedCreators, creatorId),
              updatedAt: getCurrentTimestamp(),
            }
          : project
      ),
    })),

  addAssignee: (projectId, userEmail) =>
    set((state) => {
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) {
        console.warn(`Project ${projectId} not found`);
        return state;
      }
      const assignees = project.assignees || [];
      // 중복 체크
      if (assignees.includes(userEmail)) {
        console.warn(`Assignee ${userEmail} already in project ${projectId}`);
        return state;
      }
      return {
        projects: state.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                assignees: addUniqueItem(assignees, userEmail),
                updatedAt: getCurrentTimestamp(),
              }
            : p
        ),
      };
    }),

  removeAssignee: (projectId, userEmail) =>
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              assignees: removeItem(project.assignees || [], userEmail),
              updatedAt: getCurrentTimestamp(),
            }
          : project
      ),
    })),

  getProjectsByAssignee: (userEmail) => {
    return get().projects.filter((project) => 
      project.assignees?.includes(userEmail)
    );
  },

  updateEmailTemplates: (projectId, templates) =>
    set((state) => {
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) {
        console.warn(`Project ${projectId} not found`);
        return state;
      }
      // 최대 3개까지만 허용
      const limitedTemplates = templates.slice(0, 3);
      return {
        projects: state.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                emailTemplates: limitedTemplates,
                updatedAt: getCurrentTimestamp(),
              }
            : p
        ),
      };
    }),
}));
