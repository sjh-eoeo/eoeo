import { create } from 'zustand';
import type { Negotiation, ChatMessage, NegotiationTerms } from '../types/seeding';
import {
  getCurrentTimestamp,
  updateById,
  deleteById,
  exists,
  addUniqueItem,
} from '../lib/utils/storeHelpers';

interface SeedingNegotiationState {
  negotiations: Negotiation[];
  setNegotiations: (negotiations: Negotiation[]) => void;
  addNegotiation: (negotiation: Negotiation) => void;
  updateNegotiation: (id: string, updates: Partial<Negotiation>) => void;
  deleteNegotiation: (id: string) => void;
  getNegotiationById: (id: string) => Negotiation | undefined;
  getNegotiationsByProject: (projectId: string) => Negotiation[];
  getNegotiationsByStatus: (status: Negotiation['status']) => Negotiation[];
  
  // Terms management
  updateTerms: (negotiationId: string, terms: NegotiationTerms) => void;
  
  // Tracking management
  setTrackingNumber: (negotiationId: string, trackingNumber: string) => void;
  
  // Chat management
  addMessage: (negotiationId: string, message: ChatMessage) => void;
  
  // Status management
  completeNegotiation: (negotiationId: string) => void;
  dropNegotiation: (negotiationId: string) => void;
}

export const useSeedingNegotiationStore = create<SeedingNegotiationState>((set, get) => ({
  negotiations: [],

  setNegotiations: (negotiations) => set({ negotiations }),

  addNegotiation: (negotiation) =>
    set((state) => {
      // 중복 체크
      if (exists(state.negotiations, negotiation.id)) {
        console.warn(`Negotiation ${negotiation.id} already exists`);
        return state;
      }
      return {
        negotiations: [...state.negotiations, { ...negotiation, createdAt: getCurrentTimestamp(), updatedAt: getCurrentTimestamp() }],
      };
    }),

  updateNegotiation: (id, updates) =>
    set((state) => {
      if (!exists(state.negotiations, id)) {
        console.warn(`Negotiation ${id} not found`);
        return state;
      }
      return {
        negotiations: updateById(state.negotiations, id, updates),
      };
    }),

  deleteNegotiation: (id) =>
    set((state) => ({
      negotiations: deleteById(state.negotiations, id),
    })),

  getNegotiationById: (id) => {
    return get().negotiations.find((negotiation) => negotiation.id === id);
  },

  getNegotiationsByProject: (projectId) => {
    return get().negotiations.filter((negotiation) => negotiation.projectId === projectId);
  },

  getNegotiationsByStatus: (status) => {
    return get().negotiations.filter((negotiation) => negotiation.status === status);
  },

  updateTerms: (negotiationId, terms) =>
    set((state) => {
      if (!exists(state.negotiations, negotiationId)) {
        console.warn(`Negotiation ${negotiationId} not found`);
        return state;
      }
      return {
        negotiations: state.negotiations.map((negotiation) =>
          negotiation.id === negotiationId
            ? { ...negotiation, terms, updatedAt: getCurrentTimestamp() }
            : negotiation
        ),
      };
    }),

  setTrackingNumber: (negotiationId, trackingNumber) =>
    set((state) => {
      if (!exists(state.negotiations, negotiationId)) {
        console.warn(`Negotiation ${negotiationId} not found`);
        return state;
      }
      return {
        negotiations: state.negotiations.map((negotiation) =>
          negotiation.id === negotiationId
            ? {
                ...negotiation,
                trackingNumber,
                trackingDate: getCurrentTimestamp(),
                updatedAt: getCurrentTimestamp(),
              }
            : negotiation
        ),
      };
    }),

  addMessage: (negotiationId, message) =>
    set((state) => {
      const negotiation = state.negotiations.find((n) => n.id === negotiationId);
      if (!negotiation) {
        console.warn(`Negotiation ${negotiationId} not found`);
        return state;
      }
      // 메시지 중복 체크 (같은 ID)
      if (negotiation.messages.some((m) => m.id === message.id)) {
        console.warn(`Message ${message.id} already exists`);
        return state;
      }
      return {
        negotiations: state.negotiations.map((n) =>
          n.id === negotiationId
            ? {
                ...n,
                messages: [...n.messages, message],
                updatedAt: getCurrentTimestamp(),
              }
            : n
        ),
      };
    }),

  completeNegotiation: (negotiationId) =>
    set((state) => {
      if (!exists(state.negotiations, negotiationId)) {
        console.warn(`Negotiation ${negotiationId} not found`);
        return state;
      }
      return {
        negotiations: state.negotiations.map((negotiation) =>
          negotiation.id === negotiationId
            ? {
                ...negotiation,
                status: 'completed' as const,
                completedAt: getCurrentTimestamp(),
                updatedAt: getCurrentTimestamp(),
              }
            : negotiation
        ),
      };
    }),

  dropNegotiation: (negotiationId) =>
    set((state) => {
      if (!exists(state.negotiations, negotiationId)) {
        console.warn(`Negotiation ${negotiationId} not found`);
        return state;
      }
      return {
        negotiations: state.negotiations.map((negotiation) =>
          negotiation.id === negotiationId
            ? {
                ...negotiation,
                status: 'dropped' as const,
                completedAt: getCurrentTimestamp(),
                updatedAt: getCurrentTimestamp(),
              }
            : negotiation
        ),
      };
    }),
}));
