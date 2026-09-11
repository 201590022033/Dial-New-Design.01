import { create } from 'zustand';
import { defaultGeometryParameters, validateGeometryParameters } from '@/domain/geometry/geometryEngine';
import type { GlobalGeometryParameters } from '@/domain/geometry/types';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';

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

export const useGlobalSettingsStore = create<GlobalSettingsState>((_set, get) => ({
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
    // Route directly to authoritative WatchAssembly write path
    useWatchAssemblyStore.getState().setCaseDiameter(caseDiameterMm);
  },
  updateGeometryParams: (params) => {
    // Route directly to authoritative WatchAssembly write path
    useWatchAssemblyStore.getState().updateGeometryParams(params);
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
