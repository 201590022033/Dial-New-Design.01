import type { BandEntity } from '@/domain/bands/types';
import type { ScaleKind, ScaleMathContext, ScalePluginConfig } from '@/domain/scales/types';

export type ScaleProgram = 'diver' | 'chrono' | 'aviation';

export interface ScaleProgramSelection {
  kind: ScaleKind;
  config: Partial<ScalePluginConfig>;
  context: ScaleMathContext;
  bezel: { type: 'dive' | 'fixed' | 'slide-rule'; rotating: boolean };
}

export const getScaleProgram = (program: ScaleProgram, bands: BandEntity[]): ScaleProgramSelection => {
  const outer = bands.find((band) => band.kind === 'outer-bezel')?.geometry;
  const chapter = bands.find((band) => band.kind === 'chapter-ring')?.geometry;
  if (program === 'diver') return {
    kind: 'circular',
    config: {
      startValue: 0, endValue: 60, majorStep: 5, minorStep: 1,
      radiusMm: outer?.innerRadius ?? 18.5, majorTickLengthMm: 0.7,
      minorTickLengthMm: 0.35, tickDirection: 'outside', labelPlacement: 'outside'
    },
    context: { startAngleDeg: 0, endAngleDeg: 360 },
    bezel: { type: 'dive', rotating: true }
  };
  if (program === 'chrono') return {
    kind: 'tachymeter',
    config: {
      startValue: 60, endValue: 500, majorStep: 20, minorStep: 10,
      radiusMm: outer ? (outer.innerRadius + outer.outerRadius) / 2 : 18.7
    },
    // A 60–500 tachymeter is an open reciprocal-time arc, not a closed dial.
    context: { startAngleDeg: -140, endAngleDeg: 140 },
    bezel: { type: 'fixed', rotating: false }
  };
  return {
    kind: 'slide-rule',
    config: {
      engineeringPreset: 'aviation-slide-rule', startValue: 10, endValue: 100,
      outerRadiusMm: outer ? outer.innerRadius + 0.5 : 18.7,
      innerRadiusMm: chapter ? chapter.innerRadius + 1.2 : 16.3,
      outerRotationOffsetDeg: 0, innerRotationOffsetDeg: 0,
      ringSyncMode: 'independent', tickDensityProfile: 'sparse',
      includeMinorLabels: false, calculationMode: 'division', direction: 'clockwise'
    },
    context: { startAngleDeg: 0, endAngleDeg: 360 },
    bezel: { type: 'slide-rule', rotating: true }
  };
};
