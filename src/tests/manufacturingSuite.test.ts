import { describe, expect, it } from 'vitest';
import { createBand } from '@/domain/bands/bandRegistry';
import { createWatchComponentEntities } from '@/domain/watch-components/factory';
import {
  generateManufacturingReport,
  manufacturingProfiles,
  verifyNativeSvg,
  vendorCalibrationProfiles
} from '@/services/manufacturingSuiteService';

describe('manufacturing suite service', () => {
  it('verifies native SVG payloads and reports geometry metrics', () => {
    const verification = verifyNativeSvg('<svg xmlns="http://www.w3.org/2000/svg"><g><circle cx="0" cy="0" r="10"/></g></svg>');

    expect(verification.valid).toBe(true);
    expect(verification.metrics.groupCount).toBeGreaterThan(0);
    expect(verification.metrics.circleCount).toBeGreaterThan(0);
  });

  it('builds manufacturing report with profile and finding synthesis', () => {
    const bands = [createBand('band-dial', 'dial-face', { innerRadius: 0, outerRadius: 14 })];
    const watchComponents = createWatchComponentEntities();

    const report = generateManufacturingReport({
      svgMarkup: '<svg xmlns="http://www.w3.org/2000/svg"><g><line x1="0" y1="0" x2="10" y2="10"/></g></svg>',
      bands,
      watchComponents
    });

    expect(report.processProfiles.length).toBe(manufacturingProfiles.length);
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
  });

  it('provides vendor calibration profiles for process tuning', () => {
    expect(vendorCalibrationProfiles.length).toBeGreaterThan(0);
    expect(vendorCalibrationProfiles.some((profile) => profile.process === 'laser')).toBe(true);
  });
});
