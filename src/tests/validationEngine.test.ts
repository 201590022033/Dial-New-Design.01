import { describe, expect, it } from 'vitest';
import { createBand } from '@/domain/bands/bandRegistry';
import { defaultGeometryParameters } from '@/domain/geometry/geometryEngine';
import { evaluateGeometryConstraints } from '@/domain/geometry/constraints';
import { deriveGeometryContext } from '@/domain/geometry/geometryEngine';
import { validateAllCategories } from '@/domain/geometry/validationEngine';

describe('structured validation engine', () => {
  it('returns categorized validation results with suggested fixes', () => {
    const invalid = createBand('band-invalid', 'outer-bezel', { innerRadius: 10, outerRadius: 10.01 });
    const params = { ...defaultGeometryParameters, minimumLineWidthMm: 0.2 };
    const context = deriveGeometryContext(params);
    const constraints = evaluateGeometryConstraints([invalid], params, context);
    const results = validateAllCategories([invalid], params, constraints);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('category');
    expect(results[0]).toHaveProperty('suggestedFix');
  });
});
