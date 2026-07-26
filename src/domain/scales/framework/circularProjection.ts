import type { ScalePluginConfig } from '@/domain/scales/types';
import { polarToCartesian } from '@/domain/scales/math';

export interface CircularProjectionContext {
  startAngleDeg: number;
  endAngleDeg: number;
  direction: ScalePluginConfig['direction'];
  rotationOffsetDeg?: number;
}

export interface CircularRingRadii {
  innerRadiusMm?: number;
  outerRadiusMm?: number;
  tickRadiusMm?: number;
  labelRadiusMm?: number;
  textRadiusMm?: number;
}

export interface ProjectedCoordinate {
  radiusMm: number;
  angleDeg: number;
  x: number;
  y: number;
}

export interface CircularProjectionResult {
  normalized: number;
  angleDeg: number;
  coordinate: ProjectedCoordinate;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const normalizeAngularPosition = (normalized: number, context: CircularProjectionContext): number => {
  const clamped = clamp01(normalized);
  const rawSpan = context.endAngleDeg - context.startAngleDeg;
  const signedSpan = context.direction === 'clockwise' ? rawSpan : -rawSpan;
  const angle = context.startAngleDeg + clamped * signedSpan;
  return angle + (context.rotationOffsetDeg ?? 0);
};

export const projectNormalizedToRadius = (
  normalized: number,
  radiusMm: number,
  context: CircularProjectionContext
): CircularProjectionResult => {
  const angleDeg = normalizeAngularPosition(normalized, context);
  const point = polarToCartesian({ radiusMm, angleDeg });

  return {
    normalized: clamp01(normalized),
    angleDeg,
    coordinate: {
      radiusMm,
      angleDeg,
      x: point.x,
      y: point.y
    }
  };
};

export const projectNormalizedAcrossRings = (
  normalized: number,
  context: CircularProjectionContext,
  radii: CircularRingRadii
): Record<string, ProjectedCoordinate> => {
  const result: Record<string, ProjectedCoordinate> = {};

  const keys: Array<keyof CircularRingRadii> = [
    'innerRadiusMm',
    'outerRadiusMm',
    'tickRadiusMm',
    'labelRadiusMm',
    'textRadiusMm'
  ];

  keys.forEach((key) => {
    const radius = radii[key];
    if (typeof radius !== 'number') {
      return;
    }
    result[key] = projectNormalizedToRadius(normalized, radius, context).coordinate;
  });

  return result;
};
