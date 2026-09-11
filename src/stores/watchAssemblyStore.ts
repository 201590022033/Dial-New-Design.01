import { create } from 'zustand';
import {
  createDefaultWatchAssembly,
  type WatchAssembly,
  type WatchAssemblyGlobalDimensions,
  type WatchAssemblyMetadata,
  type WatchAssemblyPartInstance
} from '@/domain/assembly';
import { deserializeWatchAssembly, serializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import type { GlobalGeometryParameters } from '@/domain/geometry/types';
import type { MarkerEngineConfig } from '@/domain/generators/markerEngine';
import type { TypographyConfig } from '@/domain/generators/typographyEngine';
import type { DialFaceConfig } from '@/domain/generators/dialFaceGenerator';
import type { TextureEngineConfig } from '@/domain/generators/textureEngine';
import { getTemplateById, type TemplateId } from '@/domain/generators/templateLibrary';
import type { BandEntity, BandId, BandKind } from '@/domain/bands/types';
import type { DonutGeometry } from '@/types/geometry';
import { createBand } from '@/domain/bands/bandRegistry';
import { resolveAssemblyGeometry, type ResolvedAssemblyGeometry } from '@/domain/geometry/boundaryResolver';

export interface WatchAssemblyStoreState {
  assembly: WatchAssembly;
  dirty: boolean;

  // Authoritative 2.5D geometry resolution
  getResolvedGeometry: () => ResolvedAssemblyGeometry;

  // Assembly-level authoritative actions
  setAssembly: (assembly: WatchAssembly) => void;
  updateMetadata: (patch: Partial<WatchAssemblyMetadata>) => void;
  updateGlobalDimensions: (patch: Partial<WatchAssemblyGlobalDimensions>) => void;
  resetAssembly: () => void;
  exportJson: () => string;
  importJson: (json: string) => void;

  // Part-level authoritative engineering actions
  updatePart: (instanceId: string, patch: Partial<WatchAssemblyPartInstance>) => void;
  setPartVisibility: (idOrKind: string, visible: boolean) => void;
  setPartLocked: (idOrKind: string, locked: boolean) => void;
  updatePartMaterialAndTexture: (idOrKind: string, material: string, texture: string) => void;
  addPart: (part: WatchAssemblyPartInstance) => void;
  removePart: (instanceId: string) => void;
  reorderParts: (newOrder: string[]) => void;

  // Geometry authoritative write paths
  setCaseDiameter: (diameterMm: number) => void;
  updateGeometryParams: (params: Partial<GlobalGeometryParameters>) => void;

  // Generator/design authoritative write paths
  updateMarkerConfig: (patch: Partial<MarkerEngineConfig>) => void;
  updateTypographyConfig: (patch: Partial<TypographyConfig>) => void;
  updateDialFaceConfig: (patch: Partial<DialFaceConfig>) => void;
  updateTextureConfig: (patch: Partial<TextureEngineConfig>) => void;
  applyTemplate: (templateId: TemplateId, colors?: { primary: string; secondary: string; accent: string }) => void;

  // Band authoritative write paths
  addBand: (kind: BandKind, geometry: DonutGeometry) => void;
  updateBand: (id: BandId, updater: (band: BandEntity) => BandEntity) => void;
  removeBand: (id: BandId) => void;
  reorderBands: (fromIndex: number, toIndex: number) => void;
}

const resolvePartInstanceId = (
  parts: Record<string, WatchAssemblyPartInstance>,
  idOrKind: string
): string | null => {
  if (parts[idOrKind]) return idOrKind;
  const stripped = idOrKind.replace(/^watch-component-/, '').replace(/^inst-/, '');
  for (const [key, part] of Object.entries(parts)) {
    if (
      key === `inst-${stripped}` ||
      part.catalogueItemId === `cat-${stripped}` ||
      key === stripped
    ) {
      return key;
    }
  }
  return null;
};

export const useWatchAssemblyStore = create<WatchAssemblyStoreState>((set, get) => ({
  assembly: createDefaultWatchAssembly(),
  dirty: false,

  getResolvedGeometry: () => resolveAssemblyGeometry(get().assembly),

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

  setPartVisibility: (idOrKind, visible) => {
    const resolvedId = resolvePartInstanceId(get().assembly.parts, idOrKind);
    if (resolvedId) {
      get().updatePart(resolvedId, { visible });
    }
  },

  setPartLocked: (idOrKind, locked) => {
    const resolvedId = resolvePartInstanceId(get().assembly.parts, idOrKind);
    if (resolvedId) {
      get().updatePart(resolvedId, { locked });
    }
  },

  updatePartMaterialAndTexture: (idOrKind, material, texture) => {
    const resolvedId = resolvePartInstanceId(get().assembly.parts, idOrKind);
    if (resolvedId) {
      get().updatePart(resolvedId, { material, texture });
    }
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

  setCaseDiameter: (diameterMm) => {
    const nextDiameter = Math.max(20, diameterMm);
    set((state) => ({
      assembly: {
        ...state.assembly,
        globalDimensions: {
          ...state.assembly.globalDimensions,
          caseDiameterMm: nextDiameter
        },
        designConfig: {
          ...state.assembly.designConfig,
          geometryParameters: {
            ...state.assembly.designConfig?.geometryParameters,
            caseDiameterMm: nextDiameter
          }
        },
        metadata: {
          ...state.assembly.metadata,
          updatedAtIso: new Date().toISOString()
        }
      },
      dirty: true
    }));
  },

  updateGeometryParams: (params) => {
    set((state) => ({
      assembly: {
        ...state.assembly,
        globalDimensions: {
          ...state.assembly.globalDimensions,
          ...(params.caseDiameterMm ? { caseDiameterMm: params.caseDiameterMm } : {}),
          ...(params.bandGapMm !== undefined ? { bandGapMm: params.bandGapMm } : {}),
          ...(params.manufacturingToleranceMm !== undefined
            ? { manufacturingToleranceMm: params.manufacturingToleranceMm }
            : {}),
          ...(params.laserKerfMm !== undefined ? { laserKerfMm: params.laserKerfMm } : {})
        },
        designConfig: {
          ...state.assembly.designConfig,
          geometryParameters: {
            ...state.assembly.designConfig?.geometryParameters,
            ...params
          }
        },
        metadata: {
          ...state.assembly.metadata,
          updatedAtIso: new Date().toISOString()
        }
      },
      dirty: true
    }));
  },

  updateMarkerConfig: (patch) => {
    set((state) => {
      const current = state.assembly.designConfig?.markerConfig;
      return {
        assembly: {
          ...state.assembly,
          designConfig: {
            ...state.assembly.designConfig,
            markerConfig: current ? { ...current, ...patch } : (patch as MarkerEngineConfig)
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

  updateTypographyConfig: (patch) => {
    set((state) => {
      const current = state.assembly.designConfig?.typographyConfig;
      return {
        assembly: {
          ...state.assembly,
          designConfig: {
            ...state.assembly.designConfig,
            typographyConfig: current ? { ...current, ...patch } : (patch as TypographyConfig)
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

  updateDialFaceConfig: (patch) => {
    set((state) => {
      const current = state.assembly.designConfig?.dialFaceConfig;
      return {
        assembly: {
          ...state.assembly,
          designConfig: {
            ...state.assembly.designConfig,
            dialFaceConfig: current ? { ...current, ...patch } : patch,
            textureConfig: patch.texture
              ? patch.texture
              : state.assembly.designConfig?.textureConfig
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

  updateTextureConfig: (patch) => {
    set((state) => {
      const current = state.assembly.designConfig?.textureConfig;
      return {
        assembly: {
          ...state.assembly,
          designConfig: {
            ...state.assembly.designConfig,
            textureConfig: current ? { ...current, ...patch } : (patch as TextureEngineConfig)
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

  applyTemplate: (templateId, colors) => {
    const template = getTemplateById(templateId);
    set((state) => ({
      assembly: {
        ...state.assembly,
        templateId,
        selectedColorPalette: colors ?? (template ? { ...template.palette } : state.assembly.selectedColorPalette),
        metadata: {
          ...state.assembly.metadata,
          updatedAtIso: new Date().toISOString()
        }
      },
      dirty: true
    }));
  },

  addBand: (kind: BandKind, geometry: DonutGeometry) => {
    // Adding a band reflects into assembly parts
    const instanceId = `inst-band-${kind}-${Date.now().toString(36)}`;
    const newPart: WatchAssemblyPartInstance = {
      instanceId,
      catalogueItemId: `cat-${kind}`,
      name: `${kind} band`,
      category: 'rings',
      visible: true,
      locked: false,
      layerIndex: 25,
      material: '316L Stainless Steel',
      color: '#E2E8F0',
      texture: 'brushed-circular',
      dimensions: {
        diameterMm: geometry.outerRadius * 2,
        widthMm: Math.max(0.1, geometry.outerRadius - geometry.innerRadius),
        thicknessMm: 0.5,
        offsetXmm: 0,
        offsetYmm: 0
      }
    };
    get().addPart(newPart);
  },

  updateBand: (id, updater) => {
    set((state) => {
      // Find which part instance corresponds to this band
      const dialPart = state.assembly.parts['inst-dial-blank'];
      const chapterPart = state.assembly.parts['inst-chapter-ring'];
      const innerBezelPart = state.assembly.parts['inst-inner-bezel'];
      const outerBezelPart = state.assembly.parts['inst-rotating-bezel'];

      // Construct a mock band to evaluate updater
      let targetPartId: string | null = null;
      let currentOuterRadius = 14;
      let currentInnerRadius = 0;

      if (id === 'band-dial-face' && dialPart) {
        targetPartId = 'inst-dial-blank';
        currentOuterRadius = dialPart.dimensions.diameterMm / 2;
        currentInnerRadius = 0;
      } else if (id === 'band-chapter-ring' && chapterPart) {
        targetPartId = 'inst-chapter-ring';
        currentOuterRadius = chapterPart.dimensions.diameterMm / 2;
        currentInnerRadius = currentOuterRadius - chapterPart.dimensions.widthMm;
      } else if (id === 'band-inner-bezel' && innerBezelPart) {
        targetPartId = 'inst-inner-bezel';
        currentOuterRadius = (dialPart ? dialPart.dimensions.diameterMm / 2 : 14) + 4;
        currentInnerRadius = currentOuterRadius - innerBezelPart.dimensions.widthMm;
      } else if (id === 'band-outer-bezel' && outerBezelPart) {
        targetPartId = 'inst-rotating-bezel';
        currentOuterRadius = state.assembly.globalDimensions.caseDiameterMm / 2;
        currentInnerRadius = currentOuterRadius - outerBezelPart.dimensions.widthMm;
      }

      if (!targetPartId) return state;

      const mockBand: BandEntity = createBand(
        id,
        id.replace('band-', '') as BandKind,
        { innerRadius: currentInnerRadius, outerRadius: currentOuterRadius }
      );

      const updated = updater(mockBand);
      const existingPart = state.assembly.parts[targetPartId];
      if (!existingPart) return state;

      return {
        assembly: {
          ...state.assembly,
          parts: {
            ...state.assembly.parts,
            [targetPartId]: {
              ...existingPart,
              dimensions: {
                ...existingPart.dimensions,
                diameterMm: updated.geometry.outerRadius * 2,
                widthMm: Math.max(0.1, updated.geometry.outerRadius - updated.geometry.innerRadius)
              }
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

  removeBand: (id) => {
    // Map band id to instance
    const bandMap: Record<string, string> = {
      'band-dial-face': 'inst-dial-blank',
      'band-chapter-ring': 'inst-chapter-ring',
      'band-inner-bezel': 'inst-inner-bezel',
      'band-outer-bezel': 'inst-rotating-bezel'
    };
    const partId = bandMap[id];
    if (partId) {
      get().setPartVisibility(partId, false);
    }
  },

  reorderBands: (fromIndex, toIndex) => {
    set((state) => {
      const order = [...state.assembly.partOrder];
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= order.length || toIndex >= order.length) {
        return state;
      }
      const [moved] = order.splice(fromIndex, 1);
      if (moved) {
        order.splice(toIndex, 0, moved);
      }
      return {
        assembly: {
          ...state.assembly,
          partOrder: order,
          metadata: {
            ...state.assembly.metadata,
            updatedAtIso: new Date().toISOString()
          }
        },
        dirty: true
      };
    });
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
