import type { PolarMarker, PolarText } from '@/domain/generators/types';
import type { ScaleRunResult } from '@/services/scaleEngineService';

export type CollisionCode =
  | 'TEXT_TEXT'
  | 'TEXT_MARKER'
  | 'MARKER_MARKER'
  | 'MARKER_TICK'
  | 'TICK_TICK'
  | 'DATE_COLLISION'
  | 'SUBDIAL_OVERLAP'
  | 'HANDS_COLLISION'
  | 'CHAPTER_BEZEL_OVERLAP'
  | 'OUTSIDE_PRINTABLE_AREA';

export interface CollisionWarning {
  code: CollisionCode;
  severity: 'warning' | 'error';
  message: string;
  ids: string[];
}

export interface CollisionInput {
  typography: PolarText[];
  markers: PolarMarker[];
  chapterRingMarkers: PolarMarker[];
  scalePreview: ScaleRunResult | null;
  caseRadiusMm: number;
  chapterOuterRadiusMm: number;
  bezelInnerRadiusMm: number;
  includeDateWindow: boolean;
  includeSubdial: boolean;
}

const normalizeDeg = (deg: number): number => {
  const normalized = deg % 360;
  return normalized < 0 ? normalized + 360 : normalized;
};

const angularDistance = (a: number, b: number): number => {
  const delta = Math.abs(normalizeDeg(a) - normalizeDeg(b));
  return Math.min(delta, 360 - delta);
};

const radialOverlap = (
  innerA: number,
  outerA: number,
  innerB: number,
  outerB: number
): boolean => {
  return Math.max(innerA, innerB) <= Math.min(outerA, outerB);
};

const checkTextText = (typography: PolarText[]): CollisionWarning[] => {
  const warnings: CollisionWarning[] = [];
  for (let index = 0; index < typography.length; index += 1) {
    const current = typography[index];
    if (!current) {
      continue;
    }

    for (let nextIndex = index + 1; nextIndex < typography.length; nextIndex += 1) {
      const next = typography[nextIndex];
      if (!next) {
        continue;
      }

      const angleGap = angularDistance(current.angleDeg, next.angleDeg);
      const radiusGap = Math.abs(current.radiusMm - next.radiusMm);
      if (angleGap < 4 && radiusGap < 0.9) {
        warnings.push({
          code: 'TEXT_TEXT',
          severity: 'warning',
          message: `Typography overlap risk between ${current.id} and ${next.id}.`,
          ids: [current.id, next.id]
        });
      }
    }
  }

  return warnings;
};

const checkTextMarker = (typography: PolarText[], markers: PolarMarker[]): CollisionWarning[] => {
  const warnings: CollisionWarning[] = [];
  typography.forEach((text) => {
    markers.forEach((marker) => {
      const angleGap = angularDistance(text.angleDeg, marker.angleDeg);
      const intersectsRadius = text.radiusMm >= marker.innerRadiusMm - 0.8 && text.radiusMm <= marker.outerRadiusMm + 0.8;
      if (angleGap < 3.5 && intersectsRadius) {
        warnings.push({
          code: 'TEXT_MARKER',
          severity: 'warning',
          message: `Typography ${text.id} may overlap marker ${marker.id}.`,
          ids: [text.id, marker.id]
        });
      }
    });
  });

  return warnings;
};

const checkMarkerMarker = (markers: PolarMarker[]): CollisionWarning[] => {
  const warnings: CollisionWarning[] = [];
  for (let index = 0; index < markers.length; index += 1) {
    const left = markers[index];
    if (!left) {
      continue;
    }

    for (let rightIndex = index + 1; rightIndex < markers.length; rightIndex += 1) {
      const right = markers[rightIndex];
      if (!right) {
        continue;
      }

      const angleGap = angularDistance(left.angleDeg, right.angleDeg);
      const widthGap = Math.max(left.widthMm, right.widthMm) * 2;
      if (angleGap < widthGap && radialOverlap(left.innerRadiusMm, left.outerRadiusMm, right.innerRadiusMm, right.outerRadiusMm)) {
        warnings.push({
          code: 'MARKER_MARKER',
          severity: 'error',
          message: `Marker overlap between ${left.id} and ${right.id}.`,
          ids: [left.id, right.id]
        });
      }
    }
  }

  return warnings;
};

const checkMarkerTick = (markers: PolarMarker[], scalePreview: ScaleRunResult | null): CollisionWarning[] => {
  if (!scalePreview) {
    return [];
  }

  const warnings: CollisionWarning[] = [];
  markers.forEach((marker) => {
    scalePreview.ticks.forEach((tick, index) => {
      const angleGap = angularDistance(marker.angleDeg, tick.angleDeg);
      const markerMid = (marker.innerRadiusMm + marker.outerRadiusMm) / 2;
      const tickInner = tick.radiusMm;
      const tickOuter = tick.direction === 'inside' ? tick.radiusMm - tick.lengthMm : tick.radiusMm + tick.lengthMm;
      const low = Math.min(tickInner, tickOuter);
      const high = Math.max(tickInner, tickOuter);
      if (angleGap < 2.5 && markerMid >= low - 0.5 && markerMid <= high + 0.5) {
        warnings.push({
          code: 'MARKER_TICK',
          severity: 'warning',
          message: `Marker ${marker.id} intersects scale tick ${index}.`,
          ids: [marker.id, `tick-${index}`]
        });
      }
    });
  });

  return warnings;
};

const checkTickTick = (scalePreview: ScaleRunResult | null): CollisionWarning[] => {
  if (!scalePreview) {
    return [];
  }

  const warnings: CollisionWarning[] = [];
  for (let index = 1; index < scalePreview.ticks.length; index += 1) {
    const left = scalePreview.ticks[index - 1];
    const right = scalePreview.ticks[index];
    if (!left || !right) {
      continue;
    }

    const angleGap = angularDistance(left.angleDeg, right.angleDeg);
    if (angleGap < 0.2) {
      warnings.push({
        code: 'TICK_TICK',
        severity: 'warning',
        message: `Scale ticks ${index - 1} and ${index} are overlapping.`,
        ids: [`tick-${index - 1}`, `tick-${index}`]
      });
    }
  }

  return warnings;
};

export const evaluateCollisions = (input: CollisionInput): CollisionWarning[] => {
  const warnings: CollisionWarning[] = [];

  warnings.push(...checkTextText(input.typography));
  warnings.push(...checkTextMarker(input.typography, [...input.markers, ...input.chapterRingMarkers]));
  warnings.push(...checkMarkerMarker(input.markers));
  warnings.push(...checkMarkerTick(input.markers, input.scalePreview));
  warnings.push(...checkTickTick(input.scalePreview));

  if (input.includeDateWindow && input.typography.some((text) => angularDistance(text.angleDeg, 90) < 12)) {
    warnings.push({
      code: 'DATE_COLLISION',
      severity: 'warning',
      message: 'Typography may collide with date-window area near 3 o clock.',
      ids: ['date-window']
    });
  }

  if (input.includeSubdial && input.markers.some((marker) => angularDistance(marker.angleDeg, 180) < 20)) {
    warnings.push({
      code: 'SUBDIAL_OVERLAP',
      severity: 'warning',
      message: 'Marker pattern may overlap subdial zone near 6 o clock.',
      ids: ['subdial-zone']
    });
  }

  if (input.markers.some((marker) => marker.innerRadiusMm < 1.8)) {
    warnings.push({
      code: 'HANDS_COLLISION',
      severity: 'warning',
      message: 'Markers may interfere with hands stack sweep near center.',
      ids: ['hands-stack']
    });
  }

  if (input.chapterOuterRadiusMm > input.bezelInnerRadiusMm) {
    warnings.push({
      code: 'CHAPTER_BEZEL_OVERLAP',
      severity: 'error',
      message: 'Chapter ring exceeds inner bezel boundary.',
      ids: ['chapter-ring', 'bezel']
    });
  }

  if (input.typography.some((text) => text.radiusMm > input.caseRadiusMm + 0.1)) {
    warnings.push({
      code: 'OUTSIDE_PRINTABLE_AREA',
      severity: 'error',
      message: 'Typography falls outside printable case area.',
      ids: ['printable-area']
    });
  }

  return warnings;
};
