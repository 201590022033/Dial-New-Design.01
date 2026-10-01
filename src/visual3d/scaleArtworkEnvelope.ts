import type { ScaleRunResult } from '@/services/scaleEngineService';
import type { VisualWatchModel } from './watchAssemblyToVisualModel';

export type ScaleArtworkRing = 'outer' | 'inner';

export const scaleArtworkClipEnvelope = (
  preview: ScaleRunResult,
  model: VisualWatchModel,
  ring: ScaleArtworkRing
) => {
  const target = preview.placementEnvelope;
  if (ring === 'outer' && preview.placementTargetBandId === 'band-outer-bezel') {
    return {
      innerRadiusMm: Math.max(target.innerRadiusMm, model.bezelEnvelope.innerRadiusMm),
      outerRadiusMm: Math.min(target.outerRadiusMm, model.bezelEnvelope.outerRadiusMm)
    };
  }
  return { innerRadiusMm: target.innerRadiusMm, outerRadiusMm: target.outerRadiusMm };
};
