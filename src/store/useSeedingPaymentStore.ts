import { create } from 'zustand';
import type { Payment } from '../types/seeding';
import {
  getCurrentTimestamp,
  updateById,
  deleteById,
  exists,
} from '../lib/utils/storeHelpers';

interface SeedingPaymentState {
  payments: Payment[];
  setPayments: (payments: Payment[]) => void;
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  getPaymentById: (id: string) => Payment | undefined;
  getPaymentsByProject: (projectId: string) => Payment[];
  getPaymentsByStatus: (status: Payment['status']) => Payment[];
  getPendingPayments: () => Payment[];
  
  // Payment processing
  processPayment: (paymentId: string, paidAmount: number, receiptUrl: string) => void;
  completePayment: (paymentId: string) => void;
  failPayment: (paymentId: string) => void;
  
  // Finance approval
  approveByFinance: (paymentId: string, financeUserId: string) => void;
}

export const useSeedingPaymentStore = create<SeedingPaymentState>((set, get) => ({
  payments: [],

  setPayments: (payments) => set({ payments }),

  addPayment: (payment) =>
    set((state) => {
      // 중복 체크 - negotiationId 기준으로도 체크
      if (exists(state.payments, payment.id)) {
        console.warn(`Payment ${payment.id} already exists`);
        return state;
      }
      // 같은 협상에 대한 중복 결제 방지
      const existingPayment = state.payments.find((p) => p.negotiationId === payment.negotiationId);
      if (existingPayment) {
        console.warn(`Payment for negotiation ${payment.negotiationId} already exists`);
        return state;
      }
      return {
        payments: [...state.payments, { ...payment, createdAt: getCurrentTimestamp() }],
      };
    }),

  updatePayment: (id, updates) =>
    set((state) => {
      if (!exists(state.payments, id)) {
        console.warn(`Payment ${id} not found`);
        return state;
      }
      return {
        payments: state.payments.map((payment) =>
          payment.id === id
            ? { ...payment, ...updates }
            : payment
        ),
      };
    }),

  deletePayment: (id) =>
    set((state) => ({
      payments: deleteById(state.payments, id),
    })),

  getPaymentById: (id) => {
    return get().payments.find((payment) => payment.id === id);
  },

  getPaymentsByProject: (projectId) => {
    return get().payments.filter((payment) => payment.projectId === projectId);
  },

  getPaymentsByStatus: (status) => {
    return get().payments.filter((payment) => payment.status === status);
  },

  getPendingPayments: () => {
    return get().payments.filter((payment) => payment.status === 'pending' || payment.status === 'processing');
  },

  processPayment: (paymentId, paidAmount, receiptUrl) =>
    set((state) => {
      const payment = state.payments.find((p) => p.id === paymentId);
      if (!payment) {
        console.warn(`Payment ${paymentId} not found`);
        return state;
      }
      // 이미 처리된 결제는 다시 처리 불가
      if (payment.status !== 'pending') {
        console.warn(`Payment ${paymentId} already processed with status: ${payment.status}`);
        return state;
      }
      return {
        payments: state.payments.map((p) =>
          p.id === paymentId
            ? {
                ...p,
                paidAmount,
                paidDate: getCurrentTimestamp(),
                receiptUrl,
                status: 'processing' as const,
                processedAt: getCurrentTimestamp(),
              }
            : p
        ),
      };
    }),

  completePayment: (paymentId) =>
    set((state) => {
      const payment = state.payments.find((p) => p.id === paymentId);
      if (!payment) {
        console.warn(`Payment ${paymentId} not found`);
        return state;
      }
      // processing 상태에서만 완료 가능
      if (payment.status !== 'processing') {
        console.warn(`Payment ${paymentId} must be in processing status, current: ${payment.status}`);
        return state;
      }
      return {
        payments: state.payments.map((p) =>
          p.id === paymentId
            ? {
                ...p,
                status: 'completed' as const,
                completedAt: getCurrentTimestamp(),
              }
            : p
        ),
      };
    }),

  failPayment: (paymentId) =>
    set((state) => {
      if (!exists(state.payments, paymentId)) {
        console.warn(`Payment ${paymentId} not found`);
        return state;
      }
      return {
        payments: state.payments.map((payment) =>
          payment.id === paymentId
            ? {
                ...payment,
                status: 'failed' as const,
              }
            : payment
        ),
      };
    }),

  approveByFinance: (paymentId, financeUserId) =>
    set((state) => {
      const payment = state.payments.find((p) => p.id === paymentId);
      if (!payment) {
        console.warn(`Payment ${paymentId} not found`);
        return state;
      }
      // 이미 재무팀 승인됨
      if (payment.financeApprovedBy) {
        console.warn(`Payment ${paymentId} already approved by finance`);
        return state;
      }
      return {
        payments: state.payments.map((p) =>
          p.id === paymentId
            ? {
                ...p,
                financeApprovedBy: financeUserId,
                financeApprovedAt: getCurrentTimestamp(),
                status: 'completed' as const,
                completedAt: getCurrentTimestamp(),
              }
            : p
        ),
      };
    }),
}));
