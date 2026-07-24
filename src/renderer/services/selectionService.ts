import type { BandEntity } from '@/domain/bands/types';

export const selectTopmostBandAtDistance = (bands: BandEntity[], distanceMm: number): string | null => {
  const ordered = [...bands].sort((a, b) => b.zIndex - a.zIndex);
  const band = ordered.find(
    (entry) => distanceMm >= entry.geometry.innerRadius && distanceMm <= entry.geometry.outerRadius
  );
  return band?.id ?? null;
};
