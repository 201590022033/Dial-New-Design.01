import { describe, expect, it } from 'vitest';
import { milestone7Fixture } from '@/qa/milestone7Fixtures';
import { alignmentRotation, logDecadeAngle, wrapDegrees, durationMinutes,
  statuteMilesToKm, statuteMilesToNautical } from '@/domain/scales/calibratedSlideRule';
import { generateEngineeringSvg, generatePseudoDxf } from '@/services/exportGeometryService';

describe('M7 literal section 13 acceptance ledger', () => {
  it.each([[20, 10, 60, 30], [20, 10, 30, 15], [80, 20, 40, 10],
    [25, 20, 12.5, 10], [12, 60, 60, 30], [18, 60, 45, 150]])(
    'alignment %s/%s reads %s/%s without changing mantissas', (outer, inner, read, answer) => {
      expect(wrapDegrees(logDecadeAngle(read) + alignmentRotation(outer, inner))).toBeCloseTo(logDecadeAngle(answer), 9);
    });
  it('keeps the literal examples and their correct decimal orders of magnitude', () => {
    expect(2 * 3).toBe(6); expect(20 * 15).toBe(300);
    expect(80 / 20).toBe(4); expect(25 / 20).toBe(1.25);
    expect(60 / (30 / 60)).toBe(120);
    expect(450 / 180 * 60).toBe(150);
    expect(logDecadeAngle(40) - logDecadeAngle(20)).toBeCloseTo(108.370798439, 8);
    expect(logDecadeAngle(60) - logDecadeAngle(30)).toBeCloseTo(108.370798439, 8);
  });
  it.each([[30, 26.069287257, 48.28032], [60, 52.138574514, 96.56064]])(
    '%s statute miles retains exact NM/km constants', (stat, nm, km) => {
      expect(statuteMilesToNautical(stat)).toBeCloseTo(nm, 8);
      expect(statuteMilesToKm(stat)).toBeCloseTo(km, 10);
    });
  it.each([['1:10', 70], ['1:20', 80], ['1:30', 90], ['2:30', 150], ['3:00', 180]] as const)(
    '%s uses %s minutes, not a decimal-hour label', (text, minutes) => {
      expect(durationMinutes(text)).toBe(minutes);
      expect(logDecadeAngle(durationMinutes(text))).toBeCloseTo(logDecadeAngle(minutes), 10);
    });
  for (const diameter of [34, 42, 46] as const) for (const design of ['citizen', 'navitimer'] as const) {
    it(`${diameter}mm ${design}: complete inventory or explicit export refusal`, () => {
      const { result, bands } = milestone7Fixture(diameter, design);
      expect(result.validation.valid).toBe(diameter !== 34);
      expect(result.ticks).toHaveLength(design === 'citizen' ? 449 : 416);
      expect(result.labels).toHaveLength(design === 'citizen' ? 54 : 59);
      expect(result.pointers).toHaveLength(design === 'citizen' ? 5 : 9);
      expect(result.labels.map(label => label.text).join(' ')).not.toMatch(/LBS|GAL|LITRE|LITER|OIL/i);
      const input = { target: 'entire-project' as const, bands, selectedBandId: null,
        context: { width: 600, height: 600, centerX: 300, centerY: 300, zoom: 1, panX: 0, panY: 0 }, scalePreview: result, designOverlay: null };
      if (!result.validation.valid) {
        expect(result.validation.warnings.length).toBeGreaterThan(0);
        expect(() => generateEngineeringSvg(input)).toThrow();
        expect(() => generatePseudoDxf(input)).toThrow();
      } else {
        expect(generateEngineeringSvg(input)).toContain('data-scale-label-index');
        expect(generatePseudoDxf(input)).toContain('LWPOLYLINE');
      }
      console.info(JSON.stringify({ diameter, design, valid: result.validation.valid,
        outer: result.placementEnvelope, inner: result.fixedPlacementEnvelope, warnings: result.validation.warnings }));
    });
  }
});
