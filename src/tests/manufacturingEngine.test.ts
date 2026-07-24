import { describe, expect, it } from 'vitest';
import { createBand } from '@/domain/bands/bandRegistry';
import { validateManufacturing } from '@/domain/manufacturing/validationEngine';
import { defaultGeometryParameters } from '@/domain/geometry/geometryEngine';

describe('manufacturing validation', () => {
  it('reports line-width violations', () => {
    const narrowBand = createBand('narrow', 'chapter-ring', { innerRadius: 10, outerRadius: 10.02 });
    const result = validateManufacturing([narrowBand], {
      ...defaultGeometryParameters,
      minimumLineWidthMm: 0.1
    });

    expect(result.warnings.some((warning) => warning.code === 'MIN_LINE_WIDTH')).toBe(true);
  });
});
