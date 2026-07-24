import type { BandEntity } from '@/domain/bands/types';
import type { BandSnapTarget } from '@/domain/bands/types';

export const buildDefaultSnapTargets = (band: BandEntity): BandSnapTarget[] => {
  const outerRadius = band.outerDiameterMm / 2;
  const innerRadius = band.innerDiameterMm / 2;
  const middleRadius = innerRadius + (outerRadius - innerRadius) / 2;

  return [
    { id: `${band.id}-snap-centre`, type: 'centre', angleDeg: 0, radiusMm: 0 },
    { id: `${band.id}-snap-circle`, type: 'circle', angleDeg: 0, radiusMm: middleRadius },
    { id: `${band.id}-snap-band-edge-inner`, type: 'band-edge', angleDeg: 0, radiusMm: innerRadius },
    { id: `${band.id}-snap-band-edge-outer`, type: 'band-edge', angleDeg: 0, radiusMm: outerRadius },
    { id: `${band.id}-snap-guide`, type: 'guide', angleDeg: 90, radiusMm: middleRadius },
    { id: `${band.id}-snap-tick`, type: 'tick', angleDeg: 0, radiusMm: middleRadius },
    { id: `${band.id}-snap-text-baseline`, type: 'text-baseline', angleDeg: 0, radiusMm: middleRadius },
    { id: `${band.id}-snap-subdial-centre`, type: 'subdial-centre', angleDeg: 180, radiusMm: middleRadius / 2 },
    { id: `${band.id}-snap-date-window`, type: 'date-window', angleDeg: 90, radiusMm: middleRadius }
  ];
};
