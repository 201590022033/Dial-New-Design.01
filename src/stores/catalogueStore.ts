import { create } from 'zustand';
import {
  defaultCatalogueItems,
  defaultSupplierListings,
  type ComponentCatalogueItem,
  type SupplierListing,
  type CatalogueItemCategory,
  type CatalogueItemStatus
} from '@/domain/catalogue';

export interface CatalogueStoreState {
  items: ComponentCatalogueItem[];
  supplierListings: SupplierListing[];
  categoryFilter: CatalogueItemCategory | 'all';
  searchQuery: string;

  setCategoryFilter: (category: CatalogueItemCategory | 'all') => void;
  setSearchQuery: (query: string) => void;
  getItem: (id: string) => ComponentCatalogueItem | undefined;
  getItemByKind: (kind: string) => ComponentCatalogueItem | undefined;
  getListingsForComponent: (catalogueItemId: string) => SupplierListing[];
  addCatalogueItem: (item: ComponentCatalogueItem) => void;
  updateItemStatus: (id: string, status: CatalogueItemStatus) => void;
  addSupplierListing: (listing: SupplierListing) => void;
  updateSupplierListing: (id: string, patch: Partial<SupplierListing>) => void;
}

export const useCatalogueStore = create<CatalogueStoreState>((set, get) => ({
  items: [...defaultCatalogueItems],
  supplierListings: [...defaultSupplierListings],
  categoryFilter: 'all',
  searchQuery: '',

  setCategoryFilter: (category) => set({ categoryFilter: category }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  getItem: (id) => {
    return get().items.find((item) => item.id === id);
  },

  getItemByKind: (kind) => {
    return get().items.find((item) => item.kind === kind);
  },

  getListingsForComponent: (catalogueItemId) => {
    return get().supplierListings.filter((l) => l.catalogueItemId === catalogueItemId);
  },

  addCatalogueItem: (item) => {
    set((state) => ({
      items: state.items.some((i) => i.id === item.id)
        ? state.items.map((i) => (i.id === item.id ? item : i))
        : [...state.items, item]
    }));
  },

  updateItemStatus: (id, status) => {
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, status } : i))
    }));
  },

  addSupplierListing: (listing) => {
    set((state) => ({
      supplierListings: state.supplierListings.some((l) => l.id === listing.id)
        ? state.supplierListings.map((l) => (l.id === listing.id ? listing : l))
        : [...state.supplierListings, listing]
    }));
  },

  updateSupplierListing: (id, patch) => {
    set((state) => ({
      supplierListings: state.supplierListings.map((l) =>
        l.id === id ? { ...l, ...patch } : l
      )
    }));
  }
}));
