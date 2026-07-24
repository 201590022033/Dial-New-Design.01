import { describe, expect, it } from 'vitest';
import { evaluateCollisions } from '@/domain/geometry/collisionEngine';

describe('collision engine', () => {
  it('detects text and marker overlap risks', () => {
    const warnings = evaluateCollisions({
      typography: [
        {
          id: 'text-1',
          text: 'A',
          angleDeg: 0,
          radiusMm: 16,
          rotationDeg: 0,
          orientation: 'radial',
          fontFamily: 'mono',
          fontSizeMm: 1.2,
          color: '#fff',
          letterSpacing: 0,
          wordSpacing: 0
        },
        {
          id: 'text-2',
          text: 'B',
          angleDeg: 2,
          radiusMm: 16.2,
          rotationDeg: 0,
          orientation: 'radial',
          fontFamily: 'mono',
          fontSizeMm: 1.2,
          color: '#fff',
          letterSpacing: 0,
          wordSpacing: 0
        }
      ],
      markers: [
        {
          id: 'marker-1',
          angleDeg: 1,
          innerRadiusMm: 15.8,
          outerRadiusMm: 16.5,
          widthMm: 0.3
        }
      ],
      chapterRingMarkers: [],
      scalePreview: null,
      caseRadiusMm: 20,
      chapterOuterRadiusMm: 17,
      bezelInnerRadiusMm: 18,
      includeDateWindow: false,
      includeSubdial: false
    });

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((warning) => warning.code === 'TEXT_TEXT' || warning.code === 'TEXT_MARKER')).toBe(true);
  });
});
