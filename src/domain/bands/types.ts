import type { DonutGeometry } from '@/types/geometry';

export type BandId = string;

export type BandKind =
  | 'dial-face'
  | 'chapter-ring'
  | 'inner-bezel'
  | 'outer-bezel'
  | 'movement-template'
  | 'scale-generator';

export interface BandStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

export interface BandEntity {
  id: BandId;
  kind: BandKind;
  name: string;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  geometry: DonutGeometry;
  style: BandStyle;
}
