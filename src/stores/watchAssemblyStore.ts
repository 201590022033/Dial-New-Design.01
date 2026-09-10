import { create } from 'zustand';
import {
  createDefaultWatchAssembly,
  type WatchAssembly,
  type WatchAssemblyGlobalDimensions,
  type WatchAssemblyMetadata,
  type WatchAssemblyPartInstance
} from '@/domain/assembly';
import { deserializeWatchAssembly, serializeWatchAssembly } from '@/domain/assembly/assemblySerialization';

export interface WatchAssemblyStoreState {
  assembly: WatchAssembly;
  dirty: boolean;
  setAssembly: (assembly: WatchAssembly) => void;
  updateMetadata: (patch: Partial<WatchAssemblyMetadata>) => void;
  updateGlobalDimensions: (patch: Partial<WatchAssemblyGlobalDimensions>) => void;
  updatePart: (instanceId: string, patch: Partial<WatchAssemblyPartInstance>) => void;
  setPartVisibility: (instanceId: string, visible: boolean) => void;
  setPartLocked: (instanceId: string, locked: boolean) => void;
  setPartSupplier: (instanceId: string, supplierListingId: string | null) => void;
  addPart: (part: WatchAssemblyPartInstance) => void;
  removePart: (instanceId: string) => void;
  reorderParts: (newOrder: string[]) => void;
  resetAssembly: () => void;
  exportJson: () => string;
  importJson: (json: string) => void;
}

export const useWatchAssemblyStore = create<WatchAssemblyStoreState>((set, get) => ({
  assembly: createDefaultWatchAssembly(),
  dirty: false,

  setAssembly: (assembly) => {
    set({ assembly, dirty: false });
  },

  updateMetadata: (patch) => {
    set((state) => ({
      assembly: {
        ...state.assembly,
        metadata: {
          ...state.assembly.metadata,
          ...patch,
          updatedAtIso: new Date().toISOString()
        }
      },
      dirty: true
    }));
  },

  updateGlobalDimensions: (patch) => {
    set((state) => ({
      assembly: {
        ...state.assembly,
        globalDimensions: {
          ...state.assembly.globalDimensions,
          ...patch
        },
        metadata: {
          ...state.assembly.metadata,
          updatedAtIso: new Date().toISOString()
        }
      },
      dirty: true
    }));
  },

  updatePart: (instanceId, patch) => {
    set((state) => {
      const existing = state.assembly.parts[instanceId];
      if (!existing) return state;

      return {
        assembly: {
          ...state.assembly,
          parts: {
            ...state.assembly.parts,
            [instanceId]: {
              ...existing,
              ...patch,
              dimensions: patch.dimensions
                ? { ...existing.dimensions, ...patch.dimensions }
                : existing.dimensions,
              typography: patch.typography
                ? { ...existing.typography, ...patch.typography }
                : existing.typography
            }
          },
          metadata: {
            ...state.assembly.metadata,
            updatedAtIso: new Date().toISOString()
          }
        },
        dirty: true
      };
    });
  },

  setPartVisibility: (instanceId, visible) => {
    get().updatePart(instanceId, { visible });
  },

  setPartLocked: (instanceId, locked) => {
    get().updatePart(instanceId, { locked });
  },

  setPartSupplier: (instanceId, supplierListingId) => {
    get().updatePart(instanceId, { selectedSupplierListingId: supplierListingId });
  },

  addPart: (part) => {
    set((state) => ({
      assembly: {
        ...state.assembly,
        parts: {
          ...state.assembly.parts,
          [part.instanceId]: part
        },
        partOrder: state.assembly.partOrder.includes(part.instanceId)
          ? state.assembly.partOrder
          : [...state.assembly.partOrder, part.instanceId],
        metadata: {
          ...state.assembly.metadata,
          updatedAtIso: new Date().toISOString()
        }
      },
      dirty: true
    }));
  },

  removePart: (instanceId) => {
    set((state) => {
      const remainingParts = { ...state.assembly.parts };
      delete remainingParts[instanceId];
      return {
        assembly: {
          ...state.assembly,
          parts: remainingParts,
          partOrder: state.assembly.partOrder.filter((id) => id !== instanceId),
          metadata: {
            ...state.assembly.metadata,
            updatedAtIso: new Date().toISOString()
          }
        },
        dirty: true
      };
    });
  },

  reorderParts: (newOrder) => {
    set((state) => ({
      assembly: {
        ...state.assembly,
        partOrder: newOrder,
        metadata: {
          ...state.assembly.metadata,
          updatedAtIso: new Date().toISOString()
        }
      },
      dirty: true
    }));
  },

  resetAssembly: () => {
    set({
      assembly: createDefaultWatchAssembly(),
      dirty: false
    });
  },

  exportJson: () => {
    return serializeWatchAssembly(get().assembly);
  },

  importJson: (json) => {
    const deserialized = deserializeWatchAssembly(json);
    set({
      assembly: deserialized,
      dirty: false
    });
  }
}));
