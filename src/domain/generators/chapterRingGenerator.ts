import type { ScaleKind } from '@/domain/scales/types';

export interface ChapterRingConfiguration {
  majorTickStep: number;
  minorTickStep: number;
  textOrientation: 'radial' | 'horizontal' | 'curved';
  includeLumeMarkers: boolean;
  includeAppliedMarkers: boolean;
  includePrintedMarkers: boolean;
  mode: 'standard' | 'slide-rule' | 'tachymeter' | 'compass' | 'countdown';
}

export interface ChapterRingPlan {
  config: ChapterRingConfiguration;
  scaleAttachment: ScaleKind;
}

export const createChapterRingPlan = (
  mode: ChapterRingConfiguration['mode'] = 'standard'
): ChapterRingPlan => {
  const scaleByMode: Record<ChapterRingConfiguration['mode'], ScaleKind> = {
    standard: 'circular',
    'slide-rule': 'slide-rule',
    tachymeter: 'tachymeter',
    compass: 'compass',
    countdown: 'countdown'
  };

  return {
    config: {
      majorTickStep: 5,
      minorTickStep: 1,
      textOrientation: 'radial',
      includeLumeMarkers: true,
      includeAppliedMarkers: false,
      includePrintedMarkers: true,
      mode
    },
    scaleAttachment: scaleByMode[mode]
  };
};
