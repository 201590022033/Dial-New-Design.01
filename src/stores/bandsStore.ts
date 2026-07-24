import { create } from 'zustand';
import { createBand } from '@/domain/bands/bandRegistry';
import type { BandEntity, BandId, BandKind } from '@/domain/bands/types';
import { runGeometryEngine } from '@/domain/geometry/geometryEngine';
import type { CollisionWarning } from '@/domain/geometry/collisionEngine';
import type { GlobalGeometryParameters, StructuredValidationResult } from '@/domain/geometry/types';
import type { ManufacturingWarning } from '@/domain/manufacturing/validationEngine';
import { validateManufacturing } from '@/domain/manufacturing/validationEngine';
import type { MaterialDefinition } from '@/domain/materials/materialLibrary';
import type { DonutGeometry } from '@/types/geometry';

interface BandsState {
  bands: BandEntity[];
  warnings: string[];
  manufacturingWarnings: ManufacturingWarning[];
  validationResults: StructuredValidationResult[];
  addBand: (kind: BandKind, geometry: DonutGeometry) => void;
  setBandsSnapshot: (bands: BandEntity[]) => void;
  updateBand: (id: BandId, updater: (band: BandEntity) => BandEntity) => void;
  removeBand: (id: BandId) => void;
  reorderBands: (fromIndex: number, toIndex: number) => void;
  syncWithGeometryEngine: (
    params: GlobalGeometryParameters,
    options?: {
      collisions?: CollisionWarning[];
      selectedMaterial?: MaterialDefinition | null;
    }
  ) => void;
}

const initialBands: BandEntity[] = [
  createBand('band-dial-face', 'dial-face', { innerRadius: 0, outerRadius: 14 }),
  createBand('band-chapter-ring', 'chapter-ring', { innerRadius: 14, outerRadius: 17 }),
  createBand('band-inner-bezel', 'inner-bezel', { innerRadius: 17, outerRadius: 18.5 }),
  createBand('band-outer-bezel', 'outer-bezel', { innerRadius: 18.5, outerRadius: 20 })
];

export const useBandsStore = create<BandsState>((set) => ({
  bands: initialBands,
  warnings: [],
  manufacturingWarnings: [],
  validationResults: [],
  addBand: (kind, geometry) =>
    set((state) => ({
      bands: [
        ...state.bands,
        createBand(`band-${kind}-${crypto.randomUUID().slice(0, 8)}`, kind, geometry)
      ]
    })),
  setBandsSnapshot: (bands) =>
    set(() => ({
      bands,
      warnings: [],
      validationResults: [],
      manufacturingWarnings: []
    })),
  updateBand: (id, updater) =>
    set((state) => ({
      bands: state.bands.map((band) => (band.id === id ? updater(band) : band))
    })),
  removeBand: (id) => set((state) => ({ bands: state.bands.filter((band) => band.id !== id) })),
  reorderBands: (fromIndex, toIndex) =>
    set((state) => {
      if (fromIndex === toIndex) {
        return state;
      }
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= state.bands.length || toIndex >= state.bands.length) {
        return state;
      }

      const next = [...state.bands];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) {
        return state;
      }
      next.splice(toIndex, 0, moved);

      return {
        bands: next.map((band, index) => ({
          ...band,
          zIndex: (index + 1) * 10
        }))
      };
    }),
  syncWithGeometryEngine: (params, options) =>
    set((state) => {
      const engine = runGeometryEngine(state.bands, params);
      const manufacturing = validateManufacturing(engine.bands, params, {
        selectedMaterial: options?.selectedMaterial ?? null,
        collisions: options?.collisions ?? [],
        printableAreaDiameterMm: params.dialDiameterMm,
        minimumTextHeightMm: params.minimumTextHeightMm
      });
      const warnings = [
        ...engine.warnings.map((warning) => warning.message),
        ...engine.constraintViolations.map((violation) => violation.description),
        ...manufacturing.warnings.map((warning) => warning.message)
      ];

      const warningsByBand = new Map<string, string[]>();
      engine.validationResults.forEach((result) => {
        if (!result.affectedObject || !result.affectedObject.startsWith('band-')) {
          return;
        }
        const existing = warningsByBand.get(result.affectedObject) ?? [];
        existing.push(result.description);
        warningsByBand.set(result.affectedObject, existing);
      });

      return {
        bands: engine.bands.map((band) => {
          const bandWarnings = warningsByBand.get(band.id) ?? [];
          return {
            ...band,
            validationState: {
              valid: bandWarnings.length === 0,
              warnings: bandWarnings
            },
            manufacturingWarnings: bandWarnings
          };
        }),
        warnings,
        manufacturingWarnings: manufacturing.warnings,
        validationResults: engine.validationResults
      };
    })
}));
