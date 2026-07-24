import { create } from 'zustand';
import {
  defaultGeometryParameters,
  deriveGeometryContext,
  validateGeometryParameters
} from '@/domain/geometry/geometryEngine';
import type { GlobalGeometryParameters } from '@/domain/geometry/types';

export interface GlobalSettingsState {
  caseDiameterMm: number;
  caseThicknessMm: number;
  dialDiameterMm: number;
  movementDiameterMm: number;
  manufacturingToleranceMm: number;
  laserKerfMm: number;
  minimumLineWidthMm: number;
  minimumTextSizePt: number;
  bandSpacingMm: number;
  units: 'mm';
  setCaseDiameter: (diameterMm: number) => void;
  updateGeometryParams: (params: Partial<GlobalGeometryParameters>) => void;
  getGeometryParams: () => GlobalGeometryParameters;
  getGeometryWarnings: () => string[];
}

export const useGlobalSettingsStore = create<GlobalSettingsState>((set, get) => ({
  caseDiameterMm: defaultGeometryParameters.caseDiameterMm,
  caseThicknessMm: defaultGeometryParameters.caseThicknessMm,
  dialDiameterMm: defaultGeometryParameters.dialDiameterMm,
  movementDiameterMm: defaultGeometryParameters.movementDiameterMm,
  manufacturingToleranceMm: defaultGeometryParameters.manufacturingToleranceMm,
  laserKerfMm: defaultGeometryParameters.laserKerfMm,
  minimumLineWidthMm: defaultGeometryParameters.minimumLineWidthMm,
  minimumTextSizePt: defaultGeometryParameters.minimumTextSizePt,
  bandSpacingMm: defaultGeometryParameters.bandSpacingMm,
  units: 'mm',
  setCaseDiameter: (caseDiameterMm) => {
    const nextDiameter = Math.max(10, caseDiameterMm);
    set((state) => {
      const dialDiameterMm = Math.min(state.dialDiameterMm, nextDiameter - 1);
      const movementDiameterMm = Math.min(state.movementDiameterMm, dialDiameterMm - 0.5);
      return {
        caseDiameterMm: nextDiameter,
        dialDiameterMm,
        movementDiameterMm: Math.max(1, movementDiameterMm)
      };
    });
  },
  updateGeometryParams: (params) => {
    set((state) => {
      const merged: GlobalGeometryParameters = {
        caseDiameterMm: state.caseDiameterMm,
        caseThicknessMm: state.caseThicknessMm,
        dialDiameterMm: state.dialDiameterMm,
        movementDiameterMm: state.movementDiameterMm,
        manufacturingToleranceMm: state.manufacturingToleranceMm,
        laserKerfMm: state.laserKerfMm,
        minimumLineWidthMm: state.minimumLineWidthMm,
        minimumTextSizePt: state.minimumTextSizePt,
        bandSpacingMm: state.bandSpacingMm,
        ...params
      };

      const derived = deriveGeometryContext(merged);

      return {
        ...merged,
        dialDiameterMm: Math.min(merged.dialDiameterMm, derived.caseRadiusMm * 2),
        movementDiameterMm: Math.min(merged.movementDiameterMm, derived.dialRadiusMm * 2)
      };
    });
  },
  getGeometryParams: () => {
    const state = get();
    return {
      caseDiameterMm: state.caseDiameterMm,
      caseThicknessMm: state.caseThicknessMm,
      dialDiameterMm: state.dialDiameterMm,
      movementDiameterMm: state.movementDiameterMm,
      manufacturingToleranceMm: state.manufacturingToleranceMm,
      laserKerfMm: state.laserKerfMm,
      minimumLineWidthMm: state.minimumLineWidthMm,
      minimumTextSizePt: state.minimumTextSizePt,
      bandSpacingMm: state.bandSpacingMm
    };
  },
  getGeometryWarnings: () => {
    const params = get().getGeometryParams();
    return validateGeometryParameters(params).map((warning) => warning.message);
  }
}));
