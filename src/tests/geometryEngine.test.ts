import { describe, expect, it } from 'vitest';
import { createBand } from '@/domain/bands/bandRegistry';
import { chainConcentricBands, defaultGeometryParameters } from '@/domain/geometry/geometryEngine';

describe('geometry engine', () => {
  it('chains bands concentrically without overlap', () => {
    const bands = [
      createBand('a', 'dial-face', { innerRadius: 0, outerRadius: 10 }),
      createBand('b', 'chapter-ring', { innerRadius: 10, outerRadius: 12 }),
      createBand('c', 'inner-bezel', { innerRadius: 12, outerRadius: 13 })
    ];

    const result = chainConcentricBands(bands, defaultGeometryParameters);
    expect(result.bands[1]?.innerDiameterMm).toBeGreaterThanOrEqual(result.bands[0]?.outerDiameterMm ?? 0);
    expect(result.bands[2]?.innerDiameterMm).toBeGreaterThanOrEqual(result.bands[1]?.outerDiameterMm ?? 0);
  });
});
