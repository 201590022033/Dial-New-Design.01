import type { MarkerKind } from '@/domain/generators/markerEngine';
import type { TextureEngineConfig } from '@/domain/generators/textureEngine';

export const PARAMETRIC_DIAL_V1 = 'parametric-dial/v1' as const;

export type DialWindowKind = 'date' | 'day' | 'day-date';
export type DialSubdialRole = 'small-seconds' | 'chronograph-seconds' | 'chronograph-minutes' | 'chronograph-hours' | 'custom';

export interface ParametricDialMarkerLayout {
  kind: MarkerKind;
  count: number;
  startAngleDeg: number;
  radiusInnerMm: number;
  radiusOuterMm: number;
  widthMm: number;
  applied: boolean;
  printed: boolean;
  lumed: boolean;
}

export interface ParametricDialWindowV1 {
  kind: DialWindowKind;
  angleDeg: number;
  widthMm: number;
  heightMm: number;
  cornerRadiusMm: number;
}

export interface ParametricDialSubdialV1 {
  role: DialSubdialRole;
  angleDeg: number;
  radiusMm: number;
  handRadiusMm: number;
  markerCount: number;
}

export interface ParametricDialV1 {
  schema: typeof PARAMETRIC_DIAL_V1;
  outerDiameterMm: number;
  thicknessMm: number;
  centreHoleDiameterMm: number;
  markerLayout: ParametricDialMarkerLayout;
  windows: ParametricDialWindowV1[];
  subdials: ParametricDialSubdialV1[];
  surface: {
    color: string;
    secondaryColor: string;
    finish: 'sunburst' | 'matte' | 'textured';
    texture: TextureEngineConfig;
  };
  provenance: { status: 'provisional' | 'specified'; source: string };
}
