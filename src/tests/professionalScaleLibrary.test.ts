import { describe, expect, it } from 'vitest';
import { runScalePlugin } from '@/services/scaleEngineService';
import type { ScaleMathContext, ScalePluginConfig } from '@/domain/scales/types';

const context: ScaleMathContext = {
  startAngleDeg: -130,
  endAngleDeg: 130
};

const baseConfig: ScalePluginConfig = {
  startValue: 0,
  endValue: 100,
  majorStep: 10,
  minorStep: 2,
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
  tickDensityProfile: 'engineering'
};

describe('professional scale library', () => {
  it('runs professional tachymeter plugin', () => {
    const result = runScalePlugin('tachymeter', { ...baseConfig, startValue: 60, endValue: 500, majorStep: 20, minorStep: 10 }, context);
    expect(result?.pluginName).toBe('Professional Tachymeter');
    expect(result?.ticks.length).toBeGreaterThan(0);
  });

  it('runs professional telemeter plugin', () => {
    const result = runScalePlugin('telemeter', { ...baseConfig, startValue: 1, endValue: 20, majorStep: 1, minorStep: 0.5 }, context);
    expect(result?.pluginName).toBe('Professional Telemeter');
    expect(result?.labels.length).toBeGreaterThan(0);
  });

  it('supports telemeter unit switching', () => {
    const km = runScalePlugin(
      'telemeter',
      { ...baseConfig, startValue: 1, endValue: 20, majorStep: 1, minorStep: 0.5, telemeterUnit: 'km' },
      context
    );
    const mi = runScalePlugin(
      'telemeter',
      { ...baseConfig, startValue: 1, endValue: 20, majorStep: 1, minorStep: 0.5, telemeterUnit: 'mi' },
      context
    );

    expect(km?.labels[0]?.text.includes('km')).toBe(true);
    expect(mi?.labels[0]?.text.includes('mi')).toBe(true);
  });

  it('runs professional pulsometer plugin', () => {
    const result = runScalePlugin('pulsometer', { ...baseConfig, startValue: 40, endValue: 220, majorStep: 10, minorStep: 5 }, context);
    expect(result?.pluginName).toBe('Professional Pulsometer');
    expect(result?.validation.healthReport?.overallEngineeringScore).toBeGreaterThan(0);
  });

  it('supports pulsometer calibration configuration', () => {
    const result = runScalePlugin(
      'pulsometer',
      {
        ...baseConfig,
        startValue: 40,
        endValue: 220,
        majorStep: 10,
        minorStep: 5,
        pulsometerBeats: 15,
        pulsometerCalibrationSeconds: 30
      },
      context
    );

    expect(result?.ticks.length).toBeGreaterThan(0);
    expect(result?.validation.valid).toBe(true);
  });

  it('runs professional compass and countdown plugins', () => {
    const compass = runScalePlugin('compass', { ...baseConfig, startValue: 0, endValue: 360, majorStep: 30, minorStep: 10 }, context);
    const countdown = runScalePlugin('countdown', { ...baseConfig, startValue: 0, endValue: 60, majorStep: 5, minorStep: 1 }, context);

    expect(compass?.pluginName).toBe('Professional Compass Ring');
    expect(countdown?.pluginName).toBe('Professional Countdown Ring');
  });

  it('runs professional GMT and conversion plugins', () => {
    const gmt = runScalePlugin('gmt', { ...baseConfig, startValue: 0, endValue: 24, majorStep: 1, minorStep: 0.5 }, context);
    const conversion = runScalePlugin('conversion', { ...baseConfig, startValue: 10, endValue: 200, majorStep: 10, minorStep: 5 }, context);

    expect(gmt?.pluginName).toBe('Professional GMT Ring');
    expect(conversion?.pluginName).toBe('Engineering Conversion Ring');
    expect(conversion?.manufacturingMetadata?.ringDensityWarnings).toBeDefined();
  });

  it('supports multiple GMT label formats', () => {
    const utc = runScalePlugin(
      'gmt',
      { ...baseConfig, startValue: 0, endValue: 24, majorStep: 1, minorStep: 0.5, gmtLabelFormat: '24h-utc' },
      context
    );
    const twelveHour = runScalePlugin(
      'gmt',
      { ...baseConfig, startValue: 0, endValue: 24, majorStep: 1, minorStep: 0.5, gmtLabelFormat: '12h' },
      context
    );

    expect(utc?.labels.some((label) => label.text.endsWith('Z'))).toBe(true);
    expect(twelveHour?.labels.some((label) => /[AP]$/.test(label.text))).toBe(true);
  });

  it('supports custom conversion mappings', () => {
    const custom = runScalePlugin(
      'conversion',
      {
        ...baseConfig,
        startValue: 10,
        endValue: 200,
        majorStep: 10,
        minorStep: 5,
        conversionMode: 'custom',
        conversionCustomSourceUnit: 'kg',
        conversionCustomTargetUnit: 'lb',
        conversionCustomFactor: 2.20462
      },
      context
    );

    expect(custom?.labels.some((label) => label.text.includes('kg|'))).toBe(true);
    expect(custom?.labels.some((label) => label.text.includes('lb'))).toBe(true);
  });
});
