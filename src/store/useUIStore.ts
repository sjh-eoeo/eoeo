import { create } from 'zustand';

interface UIState {
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
  modalTitle: string;
  modalSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  
  openModal: (
    content: React.ReactNode,
    title?: string,
    size?: UIState['modalSize']
  ) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isModalOpen: false,
  modalContent: null,
  modalTitle: '',
  modalSize: 'lg',
  
  openModal: (content, title = '', size = 'lg') =>
    set({
      isModalOpen: true,
      modalContent: content,
      modalTitle: title,
      modalSize: size,
    }),
  
  closeModal: () =>
    set({
      isModalOpen: false,
      modalContent: null,
      modalTitle: '',
      modalSize: 'lg',
    }),
}));
