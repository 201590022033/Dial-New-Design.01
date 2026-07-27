import { describe, expect, it } from 'vitest';
import { defaultChapterRingConfig } from '@/domain/generators/chapterRingGenerator';
import { defaultDialFaceConfig } from '@/domain/generators/dialFaceGenerator';
import { defaultMarkerConfig } from '@/domain/generators/markerEngine';
import { defaultTypographyConfig } from '@/domain/generators/typographyEngine';
import type { ManufacturingWarning } from '@/domain/manufacturing/validationEngine';
import { buildDesignAdvisorReport } from '@/services/designAdvisorService';

describe('design advisor service', () => {
  it('recommends the instrument-print specialist for dense scale layouts', () => {
    const report = buildDesignAdvisorReport({
      dialFaceConfig: defaultDialFaceConfig,
      markerConfig: {
        ...defaultMarkerConfig,
        count: 72
      },
      typographyConfig: defaultTypographyConfig,
      chapterRingConfig: defaultChapterRingConfig,
      selectedScaleKind: 'slide-rule',
      manufacturingWarnings: []
    });

    expect(report.supplierProfile.id).toBe('instrument-print-specialist');
  });

  it('produces actionable recovery guidance for text-size manufacturing warnings', () => {
    const warnings: ManufacturingWarning[] = [
      {
        level: 'warning',
        code: 'TEXT_TOO_SMALL',
        message: 'Configured text height is below recommended minimum.'
      }
    ];

    const report = buildDesignAdvisorReport({
      dialFaceConfig: defaultDialFaceConfig,
      markerConfig: defaultMarkerConfig,
      typographyConfig: defaultTypographyConfig,
      chapterRingConfig: defaultChapterRingConfig,
      selectedScaleKind: 'circular',
      manufacturingWarnings: warnings
    });

    expect(report.recommendations.some((recommendation) => recommendation.id === 'text-height-recovery')).toBe(true);
  });
});