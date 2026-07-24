import { describe, expect, it } from 'vitest';
import {
  calculateGap,
  calculateWidth,
  diameterToRadius,
  radiusToDiameter
} from '@/domain/geometry/dimensions';

describe('dimension calculations', () => {
  it('converts diameter and radius correctly', () => {
    expect(diameterToRadius(40).value).toBe(20);
    expect(radiusToDiameter(20).value).toBe(40);
  });

  it('calculates width and gaps safely', () => {
    expect(calculateWidth(40, 36).value).toBe(2);
    expect(calculateGap(36, 36.4).value).toBeCloseTo(0.2);
  });
});
