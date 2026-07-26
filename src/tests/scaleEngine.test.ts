import { describe, expect, it } from 'vitest';
import { runScalePlugin } from '@/services/scaleEngineService';

describe('scale engine', () => {
  it('runs engineering linear plugin with manufacturing metadata', () => {
    const result = runScalePlugin(
      'linear',
      {
        startValue: 0,
        endValue: 100,
        majorStep: 10,
        minorStep: 2,
        direction: 'clockwise',
        radiusMm: 18,
        majorTickLengthMm: 2,
        minorTickLengthMm: 1,
        majorTickWidthMm: 0.22,
        minorTickWidthMm: 0.12,
        tickDirection: 'outside',
        tickStyle: 'line',
        labelFrequency: 1,
        labelOrientation: 'radial',
        labelPlacement: 'outside',
        labelRotationOffsetDeg: 0,
        rotationOffsetDeg: 0,
        color: '#FFFFFF',
        fontFamily: '"IBM Plex Mono", monospace',
        previewEnabled: true,
        bandInnerRadiusMm: 16,
        bandOuterRadiusMm: 20,
        minimumLineWidthMm: 0.1
      },
      { startAngleDeg: -120, endAngleDeg: 120 }
    );

    expect(result).not.toBeNull();
    expect(result?.manufacturingMetadata).toBeDefined();
    expect(result?.manufacturingMetadata?.minimumStrokeWidthMm).toBeGreaterThan(0);
    expect(result?.validation.structuredWarnings).toBeDefined();
  });

  it('runs a built-in tachymeter plugin', () => {
    const result = runScalePlugin(
      'tachymeter',
      {
        startValue: 60,
        endValue: 500,
        majorStep: 20,
        minorStep: 10,
        direction: 'clockwise',
        radiusMm: 18,
        majorTickLengthMm: 1.8,
        minorTickLengthMm: 1,
        majorTickWidthMm: 0.2,
        minorTickWidthMm: 0.12,
        tickDirection: 'outside',
        tickStyle: 'line',
        labelFrequency: 1,
        labelOrientation: 'radial',
        labelPlacement: 'outside',
        labelRotationOffsetDeg: 0,
        rotationOffsetDeg: 0,
        color: '#FFFFFF',
        fontFamily: '"IBM Plex Mono", monospace',
        previewEnabled: true,
        bandInnerRadiusMm: 16,
        bandOuterRadiusMm: 20,
        minimumLineWidthMm: 0.1
      },
      { startAngleDeg: -120, endAngleDeg: 120 }
    );

    expect(result).not.toBeNull();
    expect(result?.ticks.length).toBeGreaterThan(0);
    expect(result?.geometry.ticks.length).toBe(result?.ticks.length);
  });

  it('runs engineering circular logarithmic plugin', () => {
    const result = runScalePlugin(
      'logarithmic',
      {
        startValue: 1,
        endValue: 10,
        majorStep: 1,
        minorStep: 0.1,
        direction: 'clockwise',
        radiusMm: 18,
        majorTickLengthMm: 2,
        minorTickLengthMm: 1,
        majorTickWidthMm: 0.2,
        minorTickWidthMm: 0.12,
        tickDirection: 'outside',
        tickStyle: 'line',
        labelFrequency: 1,
        labelOrientation: 'radial',
        labelPlacement: 'outside',
        labelRotationOffsetDeg: 0,
        rotationOffsetDeg: 0,
        color: '#FFFFFF',
        fontFamily: '"IBM Plex Mono", monospace',
        previewEnabled: true,
        bandInnerRadiusMm: 16,
        bandOuterRadiusMm: 20,
        minimumLineWidthMm: 0.1,
        logarithmicBase: 10,
        tickDensityProfile: 'balanced',
        includeMinorLabels: false,
        engineeringPreset: 'precision'
      },
      { startAngleDeg: -120, endAngleDeg: 120 }
    );

    expect(result).not.toBeNull();
    expect(result?.pluginName).toBe('Circular Logarithmic Scale');
    expect(result?.ticks.length).toBeGreaterThan(0);
    expect(result?.validation.structuredWarnings).toBeDefined();
  });

  it('runs general circular slide-rule plugin', () => {
    const result = runScalePlugin(
      'slide-rule',
      {
        startValue: 1,
        endValue: 10,
        majorStep: 1,
        minorStep: 0.1,
        direction: 'clockwise',
        radiusMm: 18,
        majorTickLengthMm: 2,
        minorTickLengthMm: 1,
        majorTickWidthMm: 0.2,
        minorTickWidthMm: 0.12,
        tickDirection: 'outside',
        tickStyle: 'line',
        labelFrequency: 1,
        labelOrientation: 'radial',
        labelPlacement: 'outside',
        labelRotationOffsetDeg: 0,
        rotationOffsetDeg: 0,
        color: '#FFFFFF',
        fontFamily: '"IBM Plex Mono", monospace',
        previewEnabled: true,
        bandInnerRadiusMm: 14,
        bandOuterRadiusMm: 21,
        minimumLineWidthMm: 0.1,
        logarithmicBase: 10,
        tickDensityProfile: 'balanced',
        includeMinorLabels: true,
        engineeringPreset: 'circular-calculator',
        outerRadiusMm: 18.7,
        innerRadiusMm: 16.9,
        outerRotationOffsetDeg: 0,
        innerRotationOffsetDeg: 12,
        ringSyncMode: 'independent',
        lockRingMovement: false,
        ringCouplingEnabled: true,
        referenceIndexDeg: 0,
        cursorType: 'transparent',
        calculationMode: 'multiplication',
        validationVisibility: true
      },
      { startAngleDeg: -120, endAngleDeg: 120 }
    );

    expect(result).not.toBeNull();
    expect(result?.pluginName).toBe('General Circular Slide Rule');
    expect(result?.ticks.length).toBeGreaterThan(0);
  });
});
