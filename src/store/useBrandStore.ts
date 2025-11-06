import { create } from 'zustand';
import type { Brand } from '../types';

interface BrandState {
  brands: Brand[];
  selectedBrand: Brand | null;
  setBrands: (brands: Brand[]) => void;
  setSelectedBrand: (brand: Brand | null) => void;
}

export const useBrandStore = create<BrandState>((set) => ({
  brands: [],
  selectedBrand: null,
  setBrands: (brands) => set({ brands }),
  setSelectedBrand: (brand) => set({ selectedBrand: brand }),
}));
