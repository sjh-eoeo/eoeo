import { create } from 'zustand';
import type { Draft, ReviewComment } from '../types/seeding';
import {
  getCurrentTimestamp,
  updateById,
  deleteById,
  exists,
} from '../lib/utils/storeHelpers';

interface SeedingDraftState {
  drafts: Draft[];
  setDrafts: (drafts: Draft[]) => void;
  addDraft: (draft: Draft) => void;
  updateDraft: (id: string, updates: Partial<Draft>) => void;
  deleteDraft: (id: string) => void;
  getDraftById: (id: string) => Draft | undefined;
  getDraftsByNegotiation: (negotiationId: string) => Draft[];
  getDraftsByProject: (projectId: string) => Draft[];
  getDraftsByStatus: (status: Draft['status']) => Draft[];
  
  // Comment management
  addComment: (draftId: string, comment: ReviewComment) => void;
  
  // Status management
  approveDraft: (draftId: string, approvedBy: string) => void;
  requestRevision: (draftId: string) => void;
}

export const useSeedingDraftStore = create<SeedingDraftState>((set, get) => ({
  drafts: [],

  setDrafts: (drafts) => set({ drafts }),

  addDraft: (draft) =>
    set((state) => {
      if (exists(state.drafts, draft.id)) {
        console.warn(`Draft ${draft.id} already exists`);
        return state;
      }
      return {
        drafts: [...state.drafts, { ...draft, createdAt: getCurrentTimestamp(), updatedAt: getCurrentTimestamp() }],
      };
    }),

  updateDraft: (id, updates) =>
    set((state) => {
      if (!exists(state.drafts, id)) {
        console.warn(`Draft ${id} not found`);
        return state;
      }
      return {
        drafts: updateById(state.drafts, id, updates),
      };
    }),

  deleteDraft: (id) =>
    set((state) => ({
      drafts: deleteById(state.drafts, id),
    })),

  getDraftById: (id) => {
    return get().drafts.find((draft) => draft.id === id);
  },

  getDraftsByNegotiation: (negotiationId) => {
    return get().drafts.filter((draft) => draft.negotiationId === negotiationId);
  },

  getDraftsByProject: (projectId) => {
    return get().drafts.filter((draft) => draft.projectId === projectId);
  },

  getDraftsByStatus: (status) => {
    return get().drafts.filter((draft) => draft.status === status);
  },

  addComment: (draftId, comment) =>
    set((state) => {
      const draft = state.drafts.find((d) => d.id === draftId);
      if (!draft) {
        console.warn(`Draft ${draftId} not found`);
        return state;
      }
      // 댓글 중복 체크
      if (draft.comments.some((c) => c.timestamp === comment.timestamp && c.userId === comment.userId)) {
        console.warn('Duplicate comment detected');
        return state;
      }
      return {
        drafts: state.drafts.map((d) =>
          d.id === draftId
            ? {
                ...d,
                comments: [...d.comments, comment],
                status: 'under-review' as const,
                updatedAt: getCurrentTimestamp(),
              }
            : d
        ),
      };
    }),

  approveDraft: (draftId, approvedBy) =>
    set((state) => {
      if (!exists(state.drafts, draftId)) {
        console.warn(`Draft ${draftId} not found`);
        return state;
      }
      return {
        drafts: state.drafts.map((draft) =>
          draft.id === draftId
            ? {
                ...draft,
                status: 'approved' as const,
                approvedBy,
                approvedAt: getCurrentTimestamp(),
                updatedAt: getCurrentTimestamp(),
              }
            : draft
        ),
      };
    }),

  requestRevision: (draftId) =>
    set((state) => {
      if (!exists(state.drafts, draftId)) {
        console.warn(`Draft ${draftId} not found`);
        return state;
      }
      return {
        drafts: state.drafts.map((draft) =>
          draft.id === draftId
            ? {
                ...draft,
                status: 'revision-requested' as const,
                updatedAt: getCurrentTimestamp(),
              }
            : draft
        ),
      };
    }),
}));
