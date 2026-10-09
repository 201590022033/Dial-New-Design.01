import type { ScaleRunResult } from '@/services/scaleEngineService';
import { scaleArtworkLayers } from '@/domain/scales/resolvedScaleArtwork';

/** A retained but disabled row must never capture another layer's print surface. */
export const scaleArtworkBinding = (preview: ScaleRunResult | null, target: string): { layer: ScaleRunResult; ring: 'outer' | 'inner' } | null => {
  for (const layer of preview ? scaleArtworkLayers(preview) : []) {
    for (const ring of ['outer', 'inner'] as const) {
      const id = ring === 'outer' ? layer.placementTargetBandId : layer.fixedPlacementTargetBandId;
      if (id === target && (layer.ticks.some(tick => (tick.ringId ?? 'outer') === ring) ||
        layer.labels.some(label => (label.ringId ?? 'outer') === ring) || layer.pointers?.some(pointer => pointer.ringId === ring) ||
        layer.substrates?.some(substrate => substrate.ringId === ring))) return { layer, ring };
    }
  }
  return null;
};
