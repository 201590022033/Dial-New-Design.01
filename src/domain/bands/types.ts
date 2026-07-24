import type { DonutGeometry } from '@/types/geometry';

export type BandId = string;

export type BandKind =
  | 'dial-face'
  | 'chapter-ring'
  | 'inner-bezel'
  | 'outer-bezel'
  | 'movement-template'
  | 'scale-generator'
  | 'hands'
  | 'indices'
  | 'text'
  | 'logo'
  | 'complications';

export interface BandSnapTarget {
  id: string;
  angleDeg: number;
  radiusMm: number;
}

export interface BandRelationship {
  relation: 'concentric' | 'inherits-scale' | 'derived-from';
  targetBandId: BandId;
}

export interface BandValidationState {
  valid: boolean;
  warnings: string[];
}

export interface BandStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

export interface BandEntity {
  id: BandId;
  kind: BandKind;
  displayName: string;
  name: string;
  parentBandId: BandId | null;
  childBandIds: BandId[];
  outerDiameterMm: number;
  innerDiameterMm: number;
  calculatedWidthMm: number;
  thicknessMm: number;
  color: string;
  material: string;
  visible: boolean;
  locked: boolean;
  exportEnabled: boolean;
  zIndex: number;
  svgGroupId: string;
  snapTargets: BandSnapTarget[];
  relationships: BandRelationship[];
  validationState: BandValidationState;
  manufacturingWarnings: string[];
  geometry: DonutGeometry;
  style: BandStyle;
}
