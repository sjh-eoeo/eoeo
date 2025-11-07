import { create } from 'zustand';
import type { Project, ProjectFilter } from '../types/negotiation';

interface NegotiationProjectState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  filter: ProjectFilter;
  
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  setFilter: (filter: ProjectFilter) => void;
  clearFilter: () => void;
  
  // 필터링된 프로젝트 가져오기
  getFilteredProjects: () => Project[];
  
  // 상태별 프로젝트 가져오기
  getProjectsByStatus: (status: Project['status'] | Project['status'][]) => Project[];
  
  // 알림 필요한 프로젝트
  getProjectsNeedingAttention: () => Project[];
  
  // 크리에이터별 프로젝트
  getProjectsByCreator: (creatorId: string) => Project[];
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useNegotiationProjectStore = create<NegotiationProjectState>((set, get) => ({
  projects: [],
  loading: false,
  error: null,
  filter: {},
  
  setProjects: (projects) => set({ projects }),
  
  addProject: (project) =>
    set((state) => ({
      projects: [...state.projects, project],
    })),
  
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === id 
          ? { ...project, ...updates, updatedAt: new Date().toISOString(), lastUpdatedAt: new Date().toISOString() } 
          : project
      ),
    })),
  
  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((project) => project.id !== id),
    })),
  
  setFilter: (filter) => set({ filter }),
  clearFilter: () => set({ filter: {} }),
  
  getFilteredProjects: () => {
    const { projects, filter } = get();
    
    return projects.filter((project) => {
      // 브랜드 필터
      if (filter.brand && filter.brand.length > 0) {
        if (!filter.brand.includes(project.category.brand)) return false;
      }
      
      // 프로젝트명 필터
      if (filter.projectName && filter.projectName.length > 0) {
        if (!filter.projectName.includes(project.category.projectName)) return false;
      }
      
      // 제품 필터
      if (filter.productLine && filter.productLine.length > 0 && project.category.productLine) {
        if (!filter.productLine.includes(project.category.productLine)) return false;
      }
      
      // 지역 필터
      if (filter.region && filter.region.length > 0 && project.category.region) {
        if (!filter.region.includes(project.category.region)) return false;
      }
      
      // 상태 필터
      if (filter.status && filter.status.length > 0) {
        if (!filter.status.includes(project.status)) return false;
      }
      
      // 담당자 필터
      if (filter.assignedTo && filter.assignedTo.length > 0) {
        if (!filter.assignedTo.includes(project.assignedTo)) return false;
      }
      
      // 팀 위치 필터
      if (filter.teamLocation && filter.teamLocation !== 'all') {
        if (project.teamLocation !== filter.teamLocation) return false;
      }
      
      // Drop/Reject 포함 여부
      if (!filter.includeDropped) {
        if (project.status === 'dropped-by-us' || project.status === 'rejected-by-creator') {
          return false;
        }
      }
      
      // 날짜 범위 필터
      if (filter.dateRange) {
        const projectDate = new Date(project.createdAt);
        const startDate = new Date(filter.dateRange.start);
        const endDate = new Date(filter.dateRange.end);
        if (projectDate < startDate || projectDate > endDate) return false;
      }
      
      // 검색어 필터
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const searchFields = [
          project.creatorName,
          project.creatorEmail,
          project.category.projectName,
          project.category.brand,
          project.category.productLine || '',
        ].join(' ').toLowerCase();
        
        if (!searchFields.includes(query)) return false;
      }
      
      return true;
    });
  },
  
  getProjectsByStatus: (status) => {
    const { projects } = get();
    const statuses = Array.isArray(status) ? status : [status];
    return projects.filter((project) => statuses.includes(project.status));
  },
  
  getProjectsNeedingAttention: () => {
    const { projects } = get();
    return projects.filter((project) => project.needsAttention);
  },
  
  getProjectsByCreator: (creatorId) => {
    const { projects } = get();
    return projects.filter((project) => project.creatorId === creatorId);
  },
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
