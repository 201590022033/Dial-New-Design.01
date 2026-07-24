import type { EngineResultBase, PolarMarker, PolarText } from '@/domain/generators/types';
import type { ScaleKind } from '@/domain/scales/types';
import { generateMarkers, type MarkerEngineConfig } from '@/domain/generators/markerEngine';
import { generateTypographyLayout, type TypographyConfig } from '@/domain/generators/typographyEngine';

export type ChapterRingStyle =
  | 'plain'
  | 'minute-track'
  | 'railroad-track'
  | 'slide-rule-ring'
  | 'tachymeter-ring'
  | 'compass-ring'
  | 'countdown-ring'
  | 'custom-scale-ring';

export type ChapterRingManufacturing = 'printed' | 'applied' | 'lumed' | 'engraved' | 'laser-cut';

export interface ChapterRingConfiguration {
  style: ChapterRingStyle;
  manufacturing: ChapterRingManufacturing;
  majorTickStep: number;
  minorTickStep: number;
  majorTickLengthMm: number;
  minorTickLengthMm: number;
  textOrientation: TypographyConfig['layout'];
  radiusInnerMm: number;
  radiusOuterMm: number;
  markerConfig: MarkerEngineConfig;
  scaleAttachment: ScaleKind;
  curvedText: string;
}

export interface ChapterRingResult extends EngineResultBase {
  style: ChapterRingStyle;
  manufacturing: ChapterRingManufacturing;
  scaleAttachment: ScaleKind;
  markers: PolarMarker[];
  typography: PolarText[];
  majorTickCount: number;
  minorTickCount: number;
}

const scaleByStyle: Record<ChapterRingStyle, ScaleKind> = {
  plain: 'circular',
  'minute-track': 'circular',
  'railroad-track': 'circular',
  'slide-rule-ring': 'slide-rule',
  'tachymeter-ring': 'tachymeter',
  'compass-ring': 'compass',
  'countdown-ring': 'countdown',
  'custom-scale-ring': 'custom'
};

export const defaultChapterRingConfig: ChapterRingConfiguration = {
  style: 'minute-track',
  manufacturing: 'printed',
  majorTickStep: 5,
  minorTickStep: 1,
  majorTickLengthMm: 1.4,
  minorTickLengthMm: 0.8,
  textOrientation: 'radial',
  radiusInnerMm: 15,
  radiusOuterMm: 17,
  markerConfig: {
    kind: 'railroad-track',
    count: 60,
    startAngleDeg: -90,
    radiusInnerMm: 15.5,
    radiusOuterMm: 16.8,
    widthMm: 0.2,
    style: {
      applied: false,
      printed: true,
      lumed: false,
      metallic: false,
      outline: true,
      filled: false
    }
  },
  scaleAttachment: 'circular',
  curvedText: 'CHAPTER RING'
};

const countTicks = (step: number): number => {
  if (step <= 0) {
    return 0;
  }
  return Math.floor(60 / step);
};

export const generateChapterRing = (input: ChapterRingConfiguration): ChapterRingResult => {
  const scaleAttachment = input.scaleAttachment || scaleByStyle[input.style];
  const markerConfig = {
    ...input.markerConfig,
    radiusInnerMm: input.radiusInnerMm,
    radiusOuterMm: input.radiusOuterMm
  };

  const markers = generateMarkers(markerConfig);
  const typography = generateTypographyLayout({
    content: input.curvedText,
    layout: input.textOrientation,
    fontCategory: 'railroad',
    radiusMm: input.radiusOuterMm + 0.6,
    angleStartDeg: -120,
    angleSpanDeg: 240,
    kerning: 0,
    letterSpacing: 0.08,
    wordSpacing: 0.12,
    rotationDeg: 0,
    alignment: 'center',
    curvature: 0.9,
    color: '#E2E8F0',
    fontSizeMm: 1.2
  });

  const warnings: string[] = [];
  if (input.radiusOuterMm <= input.radiusInnerMm) {
    warnings.push('Chapter ring outer radius must exceed inner radius.');
  }

  if (input.minorTickStep > input.majorTickStep) {
    warnings.push('Minor tick step should not be greater than major tick step.');
  }

  return {
    id: 'chapter-ring-engine',
    style: input.style,
    manufacturing: input.manufacturing,
    scaleAttachment,
    markers,
    typography,
    majorTickCount: countTicks(input.majorTickStep),
    minorTickCount: countTicks(input.minorTickStep),
    warnings,
    layers: [
      {
        id: 'chapter-ring-layer',
        name: 'Chapter Ring Surface',
        order: 20,
        visible: true,
        style: {
          fill: '#0F172A',
          stroke: '#CBD5E1',
          strokeWidthMm: 0.12,
          opacity: 0.95
        },
        metadata: {
          style: input.style,
          manufacturing: input.manufacturing,
          scaleAttachment
        }
      }
    ],
    futureEffects: ['micro-engraving', 'ceramic-inlay', 'relief-numerals']
  };
};

export const createChapterRingPlan = (
  style: ChapterRingStyle = 'minute-track'
): ChapterRingResult => {
  return generateChapterRing({
    ...defaultChapterRingConfig,
    style,
    scaleAttachment: scaleByStyle[style]
  });
};
