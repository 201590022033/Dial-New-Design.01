import { create } from 'zustand';
import { defaultGeometryParameters, normalizeGeometryParameters, validateGeometryParameters } from '@/domain/geometry/geometryEngine';
import type { GlobalGeometryParameters } from '@/domain/geometry/types';

export interface GlobalSettingsState {
  caseDiameterMm: number;
  dialDiameterMm: number;
  movementDiameterMm: number;
  movementCentreHoleMm: number;
  bandClearanceMm: number;
  bandGapMm: number;
  chapterRingWidthMm: number;
  innerBezelWidthMm: number;
  outerBezelWidthMm: number;
  manufacturingToleranceMm: number;
  laserKerfMm: number;
  minimumLineWidthMm: number;
  minimumTextHeightMm: number;
  units: 'mm';
  setCaseDiameter: (diameterMm: number) => void;
  updateGeometryParams: (params: Partial<GlobalGeometryParameters>) => void;
  getGeometryParams: () => GlobalGeometryParameters;
  getGeometryWarnings: () => string[];
}

export const useGlobalSettingsStore = create<GlobalSettingsState>((set, get) => ({
  caseDiameterMm: defaultGeometryParameters.caseDiameterMm,
  dialDiameterMm: defaultGeometryParameters.dialDiameterMm,
  movementDiameterMm: defaultGeometryParameters.movementDiameterMm,
  movementCentreHoleMm: defaultGeometryParameters.movementCentreHoleMm,
  bandClearanceMm: defaultGeometryParameters.bandClearanceMm,
  bandGapMm: defaultGeometryParameters.bandGapMm,
  chapterRingWidthMm: defaultGeometryParameters.chapterRingWidthMm,
  innerBezelWidthMm: defaultGeometryParameters.innerBezelWidthMm,
  outerBezelWidthMm: defaultGeometryParameters.outerBezelWidthMm,
  manufacturingToleranceMm: defaultGeometryParameters.manufacturingToleranceMm,
  laserKerfMm: defaultGeometryParameters.laserKerfMm,
  minimumLineWidthMm: defaultGeometryParameters.minimumLineWidthMm,
  minimumTextHeightMm: defaultGeometryParameters.minimumTextHeightMm,
  units: 'mm',
  setCaseDiameter: (caseDiameterMm) => {
    const nextDiameter = Math.max(20, caseDiameterMm);
    set((state) => {
      const dialDiameterMm = Math.min(state.dialDiameterMm, nextDiameter - state.bandClearanceMm * 2);
      const movementDiameterMm = Math.min(state.movementDiameterMm, dialDiameterMm);
      return {
        caseDiameterMm: nextDiameter,
        dialDiameterMm,
        movementDiameterMm: Math.max(1, movementDiameterMm)
      };
    });
  },
  updateGeometryParams: (params) => {
    set((state) => {
      const merged = normalizeGeometryParameters({
        caseDiameterMm: state.caseDiameterMm,
        dialDiameterMm: state.dialDiameterMm,
        movementDiameterMm: state.movementDiameterMm,
        movementCentreHoleMm: state.movementCentreHoleMm,
        bandClearanceMm: state.bandClearanceMm,
        bandGapMm: state.bandGapMm,
        chapterRingWidthMm: state.chapterRingWidthMm,
        innerBezelWidthMm: state.innerBezelWidthMm,
        outerBezelWidthMm: state.outerBezelWidthMm,
        manufacturingToleranceMm: state.manufacturingToleranceMm,
        laserKerfMm: state.laserKerfMm,
        minimumLineWidthMm: state.minimumLineWidthMm,
        minimumTextHeightMm: state.minimumTextHeightMm,
        defaultUnits: 'mm',
        ...params
      });

      return {
        ...merged,
        units: merged.defaultUnits
      };
    });
  },
  getGeometryParams: () => {
    const state = get();
    return {
      caseDiameterMm: state.caseDiameterMm,
      dialDiameterMm: state.dialDiameterMm,
      movementDiameterMm: state.movementDiameterMm,
      movementCentreHoleMm: state.movementCentreHoleMm,
      bandClearanceMm: state.bandClearanceMm,
      bandGapMm: state.bandGapMm,
      chapterRingWidthMm: state.chapterRingWidthMm,
      innerBezelWidthMm: state.innerBezelWidthMm,
      outerBezelWidthMm: state.outerBezelWidthMm,
      manufacturingToleranceMm: state.manufacturingToleranceMm,
      laserKerfMm: state.laserKerfMm,
      minimumLineWidthMm: state.minimumLineWidthMm,
      minimumTextHeightMm: state.minimumTextHeightMm,
      defaultUnits: state.units
    };
  },
  getGeometryWarnings: () => {
    const params = get().getGeometryParams();
    return validateGeometryParameters(params).map((warning) => warning.message);
  }
}));
