import { describe, expect, it } from 'vitest';
import { createBand } from '@/domain/bands/bandRegistry';
import { chainConcentricBands, defaultGeometryParameters } from '@/domain/geometry/geometryEngine';

describe('geometry engine', () => {
  it('partitions the physical assembly independently of drawing order', () => {
    const bands = [
      { ...createBand('chapter', 'chapter-ring', { innerRadius: 10, outerRadius: 12 }), zIndex: 90 },
      { ...createBand('dial', 'dial-face', { innerRadius: 0, outerRadius: 10 }), zIndex: 100 },
      { ...createBand('outer', 'outer-bezel', { innerRadius: 12, outerRadius: 13 }), zIndex: 10 },
      createBand('hands', 'hands', { innerRadius: 0, outerRadius: 9 })
    ];

    const result = chainConcentricBands(bands, defaultGeometryParameters);
    const dial = result.bands.find((band) => band.id === 'dial');
    const chapter = result.bands.find((band) => band.id === 'chapter');
    const outer = result.bands.find((band) => band.id === 'outer');
    const hands = result.bands.find((band) => band.id === 'hands');

    expect(outer?.geometry.outerRadius).toBeCloseTo(20.8);
    expect(chapter?.geometry.outerRadius).toBeCloseTo(19.15);
    expect(dial?.geometry.outerRadius).toBeCloseTo(17.4);
    expect(dial?.geometry.outerRadius).toBeLessThan(chapter?.geometry.innerRadius ?? 0);
    expect(chapter?.geometry.outerRadius).toBeLessThan(outer?.geometry.innerRadius ?? 0);
    expect(hands?.geometry).toEqual({ innerRadius: 0, outerRadius: 9 });
    expect(result.bands.map((band) => band.id)).toEqual(['chapter', 'dial', 'outer', 'hands']);
  });

  it('closes the radial partition when an intermediate ring is disabled', () => {
    const innerBezel = createBand('inner', 'inner-bezel', { innerRadius: 12, outerRadius: 13 });
    innerBezel.visible = false;
    const result = chainConcentricBands(
      [
        createBand('dial', 'dial-face', { innerRadius: 0, outerRadius: 10 }),
        createBand('chapter', 'chapter-ring', { innerRadius: 10, outerRadius: 12 }),
        innerBezel,
        createBand('outer', 'outer-bezel', { innerRadius: 13, outerRadius: 14 })
      ],
      defaultGeometryParameters
    );
    const chapter = result.bands.find((band) => band.id === 'chapter');
    const outer = result.bands.find((band) => band.id === 'outer');

    expect(chapter?.geometry.outerRadius).toBeCloseTo((outer?.geometry.innerRadius ?? 0) - 0.15);
  });
});
