import { create } from 'zustand';
import {
  createDefaultSourcingPlan,
  setPartSupplierInPlan,
  type WatchSourcingPlan
} from '@/domain/sourcing';

export interface SourcingStoreState {
  sourcingPlan: WatchSourcingPlan;
  dirty: boolean;
  setSupplierSelection: (partInstanceId: string, supplierListingId: string | null) => void;
  clearSupplierSelection: (partInstanceId: string) => void;
  resetSourcingPlan: (assemblyId?: string) => void;
  loadSourcingPlan: (plan: WatchSourcingPlan) => void;
}

export const useSourcingStore = create<SourcingStoreState>((set) => ({
  sourcingPlan: createDefaultSourcingPlan(),
  dirty: false,

  setSupplierSelection: (partInstanceId, supplierListingId) => {
    set((state) => ({
      sourcingPlan: setPartSupplierInPlan(state.sourcingPlan, partInstanceId, supplierListingId),
      dirty: true
    }));
  },

  clearSupplierSelection: (partInstanceId) => {
    set((state) => ({
      sourcingPlan: setPartSupplierInPlan(state.sourcingPlan, partInstanceId, null),
      dirty: true
    }));
  },

  resetSourcingPlan: (assemblyId = 'assembly-default') => {
    set({
      sourcingPlan: createDefaultSourcingPlan(assemblyId),
      dirty: false
    });
  },

  loadSourcingPlan: (plan) => {
    set({
      sourcingPlan: plan,
      dirty: false
    });
  }
}));
