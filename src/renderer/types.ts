import type { BandEntity } from '@/domain/bands/types';

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
}

export interface RendererAdapter {
  mount: (container: HTMLElement) => void;
  unmount: () => void;
  renderBands: (bands: BandEntity[], context: RenderContext, options: RendererOptions) => void;
  hitTest: (screenX: number, screenY: number) => string | null;
}
