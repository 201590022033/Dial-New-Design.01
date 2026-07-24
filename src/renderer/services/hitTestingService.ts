import type { BandEntity } from '@/domain/bands/types';

export const hitTestBand = (
  bands: BandEntity[],
  centerDistanceMm: number,
  preferredOrderDesc: boolean = true
): string | null => {
  const ordered = [...bands].sort((a, b) =>
    preferredOrderDesc ? b.zIndex - a.zIndex : a.zIndex - b.zIndex
  );
  const hit = ordered.find(
    (band) =>
      centerDistanceMm >= band.geometry.innerRadius && centerDistanceMm <= band.geometry.outerRadius
  );
  return hit?.id ?? null;
};
