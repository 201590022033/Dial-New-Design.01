import type { PolarMarker } from '@/domain/generators/types';

export type MarkerKind =
  | 'baton'
  | 'round'
  | 'triangle'
  | 'rectangle'
  | 'arabic-numeral'
  | 'roman-numeral'
  | 'railroad-track';

export interface MarkerStyleConfig {
  applied: boolean;
  printed: boolean;
  lumed: boolean;
  metallic: boolean;
  outline: boolean;
  filled: boolean;
}

export interface MarkerEngineConfig {
  kind: MarkerKind;
  count: number;
  startAngleDeg: number;
  radiusInnerMm: number;
  radiusOuterMm: number;
  widthMm: number;
  style: MarkerStyleConfig;
}

export const defaultMarkerConfig: MarkerEngineConfig = {
  kind: 'baton',
  count: 12,
  startAngleDeg: -90,
  radiusInnerMm: 14.8,
  radiusOuterMm: 17.2,
  widthMm: 0.45,
  style: {
    applied: false,
    printed: true,
    lumed: false,
    metallic: false,
    outline: false,
    filled: true
  }
};

const romanNumerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

export const generateMarkers = (config: MarkerEngineConfig): PolarMarker[] => {
  const count = Math.max(1, Math.floor(config.count));
  const step = 360 / count;

  return Array.from({ length: count }, (_, index) => {
    const angleDeg = config.startAngleDeg + step * index;
    const isArabic = config.kind === 'arabic-numeral';
    const isRoman = config.kind === 'roman-numeral';

    const text = isArabic
      ? String(index === 0 ? 12 : index)
      : isRoman
        ? romanNumerals[index % romanNumerals.length]
        : undefined;

    return {
      id: `marker-${index}`,
      angleDeg,
      innerRadiusMm: config.radiusInnerMm,
      outerRadiusMm: config.radiusOuterMm,
      widthMm: config.widthMm,
      text
    };
  });
};
