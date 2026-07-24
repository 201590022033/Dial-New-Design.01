export type LayerOrder = number;

export interface EngineLayerStyle {
  fill: string;
  stroke: string;
  strokeWidthMm: number;
  opacity: number;
}

export interface EngineLayer {
  id: string;
  name: string;
  order: LayerOrder;
  visible: boolean;
  style: EngineLayerStyle;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface EngineBorder {
  enabled: boolean;
  color: string;
  widthMm: number;
  insetMm: number;
}

export interface EngineCentreHole {
  diameterMm: number;
  chamferMm: number;
}

export interface EngineMaterialDescriptor {
  materialId: string;
  finish: string;
  texture: string;
}

export interface EngineResultBase {
  id: string;
  warnings: string[];
  layers: EngineLayer[];
  futureEffects: string[];
}

export interface PolarMarker {
  id: string;
  angleDeg: number;
  innerRadiusMm: number;
  outerRadiusMm: number;
  widthMm: number;
  text?: string;
}

export interface PolarText {
  id: string;
  text: string;
  angleDeg: number;
  radiusMm: number;
  rotationDeg: number;
  orientation: 'radial' | 'horizontal' | 'vertical' | 'arc';
  fontFamily: string;
  fontSizeMm: number;
  color: string;
  letterSpacing: number;
  wordSpacing: number;
}
