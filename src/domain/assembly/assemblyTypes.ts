import type { CatalogueItemCategory } from '@/domain/catalogue/types';
import type { MarkerEngineConfig } from '@/domain/generators/markerEngine';
import type { TypographyConfig } from '@/domain/generators/typographyEngine';
import type { TextureEngineConfig } from '@/domain/generators/textureEngine';
import type { DialFaceConfig } from '@/domain/generators/dialFaceGenerator';
import type { GlobalGeometryParameters } from '@/domain/geometry/types';

/**
 * WatchAssemblyPartInstance
 * A physical component placed and configured within the current watch design.
 * References a reusable ComponentCatalogueItem by catalogueItemId.
 * Multiple instances can share the same catalogue definition (e.g. subdial hands).
 *
 * NOTE: Supplier/procurement selections live strictly in WatchSourcingPlan
 * and are intentionally decoupled from this CAD engineering document.
 */
export interface WatchAssemblyPartInstance {
  instanceId: string;
  catalogueItemId: string; // Foreign key to ComponentCatalogueItem.id
  name: string;
  category: CatalogueItemCategory;
  visible: boolean;
  locked: boolean;
  layerIndex: number; // Bottom-to-top rendering and axial stacking order
  material: string;
  color: string;
  texture: string;
  dimensions: {
    diameterMm: number;
    widthMm: number;
    thicknessMm: number;
    offsetXmm: number;
    offsetYmm: number;
  };
  typography?: {
    content?: string;
    fontFamily?: string;
    fontSizeMm?: number;
    tracking?: number;
  };
  customProperties?: Record<string, unknown>;
}

export interface WatchAssemblyMetadata {
  id: string;
  name: string;
  revision: string;
  designer: string;
  material: string;
  movement: string;
  notes: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface WatchAssemblyGlobalDimensions {
  caseDiameterMm: number;
  totalThicknessMm: number;
  bandGapMm: number;
  manufacturingToleranceMm: number;
  laserKerfMm: number;
}

/**
 * WatchAssemblyDesignConfig
 * Preserves user-authored generator and layout parameters:
 * - Marker layout, tick spacing, numeral configurations
 * - Typography font size, tracking, lines
 * - Texture finish configurations
 * - Ring/dial geometry parameters
 */
export interface WatchAssemblyDesignConfig {
  markerConfig?: MarkerEngineConfig;
  typographyConfig?: TypographyConfig;
  textureConfig?: TextureEngineConfig;
  dialFaceConfig?: Partial<DialFaceConfig>;
  geometryParameters?: Partial<GlobalGeometryParameters>;
}

/**
 * WatchAssembly
 * Canonical design document for the active watch project.
 * Contains purely physical, structural, and aesthetic design data.
 * All transient UI states (zoom, pan, selection, hover, preview mode, open panels)
 * are strictly forbidden here and live in session stores.
 * Sourcing/vendor procurement choices live in WatchSourcingPlan.
 */
export interface WatchAssembly {
  version: string; // e.g. "2.0.0"
  metadata: WatchAssemblyMetadata;
  globalDimensions: WatchAssemblyGlobalDimensions;
  parts: Record<string, WatchAssemblyPartInstance>;
  partOrder: string[]; // Ordered list of instanceIds from bottom to top
  selectedColorPalette: {
    primary: string;
    secondary: string;
    accent: string;
  };
  templateId?: string;
  scaleBinding?: {
    scaleKind: string;
    assignedPartId?: string;
    config: Record<string, unknown>;
  };
  designConfig?: WatchAssemblyDesignConfig;
}
