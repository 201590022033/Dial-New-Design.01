import { create } from 'zustand';
import { createBand } from '@/domain/bands/bandRegistry';
import type { BandEntity, BandId, BandKind } from '@/domain/bands/types';
import { deriveGeometryContext, validateGeometryParameters } from '@/domain/geometry/geometryEngine';
import { evaluateGeometryConstraints } from '@/domain/geometry/constraints';
import { validateAllCategories } from '@/domain/geometry/validationEngine';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { resolveAssemblyGeometry } from '@/domain/geometry/boundaryResolver';
import type { CollisionWarning } from '@/domain/geometry/collisionEngine';
import type { GlobalGeometryParameters, StructuredValidationResult } from '@/domain/geometry/types';
import type { ManufacturingWarning } from '@/domain/manufacturing/validationEngine';
import { validateManufacturing } from '@/domain/manufacturing/validationEngine';
import type { MaterialDefinition } from '@/domain/materials/materialLibrary';
import type { DonutGeometry } from '@/types/geometry';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';

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
  addBand: (kind, geometry) => {
    useWatchAssemblyStore.getState().addBand(kind, geometry);
  },
  setBandsSnapshot: (bands) =>
    set(() => ({
      bands,
      warnings: [],
      validationResults: [],
      manufacturingWarnings: []
    })),
  updateBand: (id, updater) => {
    useWatchAssemblyStore.getState().updateBand(id, updater);
  },
  removeBand: (id) => {
    useWatchAssemblyStore.getState().removeBand(id);
  },
  reorderBands: (fromIndex, toIndex) => {
    useWatchAssemblyStore.getState().reorderBands(fromIndex, toIndex);
  },
  syncWithGeometryEngine: (params, options) =>
    set((state) => {
      const assembly = useWatchAssemblyStore.getState().assembly;
      // Validate the authoritative physical projection. The legacy geometry
      // engine chains widths from case-level defaults and must never resize
      // real dial/chapter/bezel parts merely as a side effect of validation.
      const canonicalBands = assemblyToBands(assembly);
      const bands = [...canonicalBands, ...state.bands.filter(band => !canonicalBands.some(canonical => canonical.id === band.id))];
      const physicalParams = { ...params,
        dialDiameterMm: assembly.parts['inst-dial-blank']?.dimensions.diameterMm ?? params.dialDiameterMm,
        chapterRingWidthMm: canonicalBands.find(band => band.kind === 'chapter-ring')?.calculatedWidthMm ?? params.chapterRingWidthMm,
        innerBezelWidthMm: canonicalBands.find(band => band.kind === 'inner-bezel')?.calculatedWidthMm ?? params.innerBezelWidthMm,
        outerBezelWidthMm: canonicalBands.find(band => band.kind === 'outer-bezel')?.calculatedWidthMm ?? params.outerBezelWidthMm
      };
      const constraints = evaluateGeometryConstraints(bands, physicalParams, deriveGeometryContext(physicalParams));
      const validationResults = validateAllCategories(bands, physicalParams, constraints);
      const manufacturing = validateManufacturing(bands, physicalParams, {
        selectedMaterial: options?.selectedMaterial ?? null,
        collisions: options?.collisions ?? [],
        printableAreaDiameterMm: physicalParams.dialDiameterMm,
        minimumTextHeightMm: params.minimumTextHeightMm
      });
      const warnings = [
        ...validateGeometryParameters(physicalParams).map((warning) => warning.message),
        ...constraints.map((violation) => violation.description),
        ...resolveAssemblyGeometry(assembly).diagnostics.map(diagnostic => diagnostic.message),
        ...manufacturing.warnings.map((warning) => warning.message)
      ];

      const warningsByBand = new Map<string, string[]>();
      validationResults.forEach((result) => {
        if (!result.affectedObject || !result.affectedObject.startsWith('band-')) {
          return;
        }
        const existing = warningsByBand.get(result.affectedObject) ?? [];
        existing.push(result.description);
        warningsByBand.set(result.affectedObject, existing);
      });

      return {
        bands: bands.map((band) => {
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
        validationResults
      };
    })
}));
