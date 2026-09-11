import type { BandEntity } from '@/domain/bands/types';
import { resolvePhysicalAssembly } from '@/domain/assembly/physicalAssembly';

/**
 * Legacy hit testing adapter based on concentric annular bands.
 * Preserved for internal backward-compatibility; superseded by canvasHitResolver.
 */
export const hitTestBand = (
  bands: BandEntity[],
  centerDistanceMm: number,
  preferredOrderDesc: boolean = true
): string | null => {
  // Use resolved physical assembly bounds where possible
  const physicalAssembly = resolvePhysicalAssembly(bands);
  for (const [kind, region] of Object.entries(physicalAssembly.regions)) {
    if (centerDistanceMm >= region.innerRadiusMm && centerDistanceMm <= region.outerRadiusMm) {
      const match = bands.find((b) => b.kind === kind && b.visible);
      if (match) return match.id;
    }
  }

  const ordered = [...bands].sort((a, b) =>
    preferredOrderDesc ? b.zIndex - a.zIndex : a.zIndex - b.zIndex
  );
  const hit = ordered.find(
    (band) =>
      band.visible &&
      centerDistanceMm >= band.geometry.innerRadius &&
      centerDistanceMm <= band.geometry.outerRadius
  );
  return hit?.id ?? null;
};

