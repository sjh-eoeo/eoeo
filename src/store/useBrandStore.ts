import { create } from 'zustand';
import type { Brand } from '../types';

interface BrandState {
  brands: Brand[];
  selectedBrand: Brand | null;
  setBrands: (brands: Brand[]) => void;
  setSelectedBrand: (brand: Brand | null) => void;
  addBrand: (brand: Brand) => void;
  removeBrand: (brand: Brand) => void;
}

export const useBrandStore = create<BrandState>((set) => ({
  brands: [],
  selectedBrand: null,
  setBrands: (brands) => set({ brands }),
  setSelectedBrand: (brand) => set({ selectedBrand: brand }),
  addBrand: (brand) =>
    set((state) => ({
      brands: [...state.brands, brand],
    })),
  removeBrand: (brand) =>
    set((state) => ({
      brands: state.brands.filter((b) => b !== brand),
    })),
}));
