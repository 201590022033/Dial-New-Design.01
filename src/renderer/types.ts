import type { BandEntity } from '@/domain/bands/types';
import type { PolarMarker, PolarText } from '@/domain/generators/types';
import type { ScaleRunResult } from '@/services/scaleEngineService';

export interface DialFaceOverlay {
  fill: string;
  stroke: string;
  opacity: number;
  borderWidthMm: number;
  centreHoleMm: number;
}

export interface MarkerOverlay {
  marker: PolarMarker;
  kind: 'baton' | 'round' | 'triangle' | 'rectangle' | 'arabic-numeral' | 'roman-numeral' | 'railroad-track';
  lumed: boolean;
}

export interface DesignOverlay {
  dialFace: DialFaceOverlay;
  markers: MarkerOverlay[];
  typography: PolarText[];
  chapterRingMarkers: PolarMarker[];
  chapterRingTypography: PolarText[];
}

export interface RenderContext {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  zoom: number;
  panX: number;
  panY: number;
}

export interface RendererOptions {
  showGuides: boolean;
  showSnapping: boolean;
  scalePreview: ScaleRunResult | null;
  designOverlay: DesignOverlay | null;
  highlightedBandIds: string[];
}

export interface RendererAdapter {
  mount: (container: HTMLElement) => void;
  unmount: () => void;
  renderBands: (bands: BandEntity[], context: RenderContext, options: RendererOptions) => void;
  hitTest: (screenX: number, screenY: number) => string | null;
}
