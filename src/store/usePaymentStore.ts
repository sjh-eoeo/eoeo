import { create } from 'zustand';
import type { Payment } from '../types';

interface PaymentState {
  payments: Payment[];
  setPayments: (payments: Payment[]) => void;
  addPayment: (payment: Payment) => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  payments: [],
  
  setPayments: (payments) => set({ payments }),
  
  addPayment: (payment) =>
    set((state) => ({
      payments: [...state.payments, payment],
    })),
}));
