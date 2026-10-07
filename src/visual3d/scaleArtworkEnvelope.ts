import type { ScaleRunResult } from '@/services/scaleEngineService';
import type { VisualWatchModel } from './watchAssemblyToVisualModel';
import { estimateLabelRadialHalfExtentMm, tickOuterExtentMm } from '@/domain/scales/placementEnvelope';

export type ScaleArtworkRing = 'outer' | 'inner';

export const scaleArtworkClipEnvelope = (
  preview: ScaleRunResult,
  model: VisualWatchModel,
  ring: ScaleArtworkRing
) => {
  const target = preview.placementEnvelope;
  if (preview.physicalTargetsResolved) return ring === 'inner' ? preview.fixedPlacementEnvelope ?? target : target;
  if (ring === 'inner' && preview.kind === 'slide-rule') {
    if (preview.fixedPlacementEnvelope) return preview.fixedPlacementEnvelope;
    return {
      innerRadiusMm: Math.max(model.chapterRingEnvelope.innerRadiusMm, model.assets['chapter-ring'].scaleArtworkInnerRadiusMm ?? 0),
      outerRadiusMm: Math.min(model.chapterRingEnvelope.outerRadiusMm, model.assets['chapter-ring'].scaleArtworkOuterRadiusMm ?? Number.POSITIVE_INFINITY)
    };
  }
  if (ring === 'outer' && preview.placementTargetBandId === 'band-outer-bezel') {
    const markingSurfaceRadiusMm = model.assets.bezel.scaleArtworkOuterRadiusMm ??
      (model.assets.bezel.assetType === 'procedural' ? model.previewEnvelope.bezelOuterRadius - 0.7 : model.bezelEnvelope.outerRadiusMm);
    return {
      innerRadiusMm: Math.max(target.innerRadiusMm, model.bezelEnvelope.innerRadiusMm, model.assets.bezel.scaleArtworkInnerRadiusMm ?? 0),
      outerRadiusMm: Math.min(target.outerRadiusMm, model.bezelEnvelope.outerRadiusMm, markingSurfaceRadiusMm)
    };
  }
  return { innerRadiusMm: target.innerRadiusMm, outerRadiusMm: target.outerRadiusMm };
};

export const scaleArtworkRadialShiftMm = (
  preview: ScaleRunResult,
  model: VisualWatchModel,
  ring: ScaleArtworkRing
): number => {
  if (preview.physicalTargetsResolved || preview.fixedPlacementEnvelope) return 0;
  if (preview.kind === 'slide-rule') {
    const ticks = preview.ticks.filter((tick) => tick.ringId === ring);
    const clip = scaleArtworkClipEnvelope(preview, model, ring);
    if (ring === 'inner') {
      // Recover saved previews produced by the old bezel-to-inner-ring sync.
      return ticks.length ? Math.max(...ticks.map((tick) => tick.radiusMm)) - (clip.outerRadiusMm - 0.25) : 0;
    }
    const extents = [
      ...ticks.map(tickOuterExtentMm),
      ...preview.labels.filter((label) => label.ringId === ring).map((label) => label.radiusMm + estimateLabelRadialHalfExtentMm(label, preview.fontSizeMm))
    ];
    return extents.length ? Math.max(...extents) - (clip.outerRadiusMm - 0.08) : 0;
  }
  return ring === 'outer' && preview.placementTargetBandId === 'band-outer-bezel'
    ? Math.max(0, preview.placementEnvelope.outerRadiusMm - scaleArtworkClipEnvelope(preview, model, ring).outerRadiusMm)
    : 0;
};

export const scaleArtworkSurfaceZ = (model: VisualWatchModel, ring: ScaleArtworkRing, preview?: ScaleRunResult): number => {
  const envelope = model.previewEnvelope;
  const target = ring === 'inner' ? preview?.fixedPlacementTargetBandId : preview?.placementTargetBandId;
  if (target === 'band-dial-face') return envelope.dialZ + model.dial.thicknessMm / 2 + 0.008;
  if (target === 'band-chapter-ring') return envelope.chapterZ + 0.708;
  if (ring === 'inner' && !target) return envelope.chapterZ + 0.7 + 0.008;
  // Authored inserts and raised pip/scale details extend above the carrier.
  // The procedural insert also sits 0.08 mm above its carrier top.
  const faceOffset = model.assets.bezel.scaleArtworkFaceOffsetMm ?? envelope.bezelHeight / 2 + 0.08;
  return envelope.bezelZ + faceOffset + 0.06;
};
