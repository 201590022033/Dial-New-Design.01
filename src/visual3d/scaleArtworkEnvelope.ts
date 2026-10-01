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
    const markingSurfaceRadiusMm = model.assets.bezel.scaleArtworkOuterRadiusMm ??
      (model.assets.bezel.assetType === 'procedural' ? model.previewEnvelope.bezelOuterRadius - 0.7 : model.bezelEnvelope.outerRadiusMm);
    return {
      innerRadiusMm: Math.max(target.innerRadiusMm, model.bezelEnvelope.innerRadiusMm),
      outerRadiusMm: Math.min(target.outerRadiusMm, model.bezelEnvelope.outerRadiusMm, markingSurfaceRadiusMm)
    };
  }
  return { innerRadiusMm: target.innerRadiusMm, outerRadiusMm: target.outerRadiusMm };
};

export const scaleArtworkRadialShiftMm = (
  preview: ScaleRunResult,
  model: VisualWatchModel,
  ring: ScaleArtworkRing
): number => ring === 'outer' && preview.placementTargetBandId === 'band-outer-bezel'
  ? Math.max(0, preview.placementEnvelope.outerRadiusMm - scaleArtworkClipEnvelope(preview, model, ring).outerRadiusMm)
  : 0;

export const scaleArtworkSurfaceZ = (model: VisualWatchModel, ring: ScaleArtworkRing): number => {
  const envelope = model.previewEnvelope;
  if (ring === 'inner') return envelope.crystalZ + envelope.crystalThickness / 2 + 0.025;
  // Authored inserts and raised pip/scale details extend above the carrier.
  // The procedural insert also sits 0.08 mm above its carrier top.
  const faceOffset = model.assets.bezel.scaleArtworkFaceOffsetMm ?? envelope.bezelHeight / 2 + 0.08;
  return envelope.bezelZ + faceOffset + 0.06;
};
