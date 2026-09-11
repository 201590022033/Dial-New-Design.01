import type { BandEntity } from '@/domain/bands/types';
import type { PolarMarker, PolarText } from '@/domain/generators/types';
import type { ScaleRunResult } from '@/services/scaleEngineService';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';

export type InteractionRole =
  | 'physical-part'
  | 'design-element'
  | 'content-group'
  | 'transparent-overlay'
  | 'background'
  | 'non-interactive';

export interface CanvasHitResult {
  partInstanceId: string;
  catalogueItemId?: string;
  category: string;
  interactionRole: InteractionRole;
  subElementId?: string;
  subElementKind?: string;
  zLayer: number;
  bandId?: string | null;
  label?: string;
}

export interface CanvasHitOptions {
  crystalSelectionMode?: boolean;
}

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
  assembly?: WatchAssembly;
  selectedHit?: CanvasHitResult | null;
  hoveredHit?: CanvasHitResult | null;
  crystalSelectionMode?: boolean;
}

export interface RendererAdapter {
  mount: (container: HTMLElement) => void;
  unmount: () => void;
  renderBands: (bands: BandEntity[], context: RenderContext, options: RendererOptions) => void;
  hitTest: (screenX: number, screenY: number) => string | null;
  hitTestSemantic?: (
    screenX: number,
    screenY: number,
    options?: CanvasHitOptions
  ) => CanvasHitResult | null;
}

