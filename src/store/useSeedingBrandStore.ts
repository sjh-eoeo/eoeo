import { create } from 'zustand';
import type { Brand } from '../types/seeding';

interface SeedingBrandState {
  brands: Brand[];
  addBrand: (brand: Brand) => void;
  updateBrand: (id: string, updates: Partial<Brand>) => void;
  deleteBrand: (id: string) => void;
  getBrandById: (id: string) => Brand | undefined;
}

export const useSeedingBrandStore = create<SeedingBrandState>((set, get) => ({
  brands: [],

  addBrand: (brand) =>
    set((state) => ({
      brands: [...state.brands, brand],
    })),

  updateBrand: (id, updates) =>
    set((state) => ({
      brands: state.brands.map((brand) =>
        brand.id === id ? { ...brand, ...updates } : brand
      ),
    })),

  deleteBrand: (id) =>
    set((state) => ({
      brands: state.brands.filter((brand) => brand.id !== id),
    })),

  getBrandById: (id) => {
    return get().brands.find((brand) => brand.id === id);
  },
}));
