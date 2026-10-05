import type { ComponentEngineeringSpecs } from '@/domain/compatibility/compatibilityTypes';
import type { ComponentCategory } from '@/domain/geometry/parametric';
import type { TextureKind } from '@/domain/generators/textureEngine';

export type CatalogueItemCategory =
  | 'hands'
  | 'indices'
  | 'typography'
  | 'complications'
  | 'rings'
  | 'case'
  | 'dial'
  | 'external';

export type CatalogueItemStatus =
  | 'draft'
  | 'ai-extracted'
  | 'reviewed'
  | 'verified'
  | 'published';

export type ManufacturingProcessProfile =
  | 'laser'
  | 'pad-print'
  | 'uv-print'
  | 'cnc'
  | 'engraving'
  | 'etching'
  | 'photochemical';

export interface CatalogueManufacturingMetadata {
  processProfile: ManufacturingProcessProfile;
  minimumFeatureMm: number;
  minimumGapMm: number;
  minimumStrokeWidthMm: number;
  recommendations: string[];
}

export interface CatalogueNominalDimensions {
  diameterMm: number;
  widthMm: number;
  thicknessMm: number;
  offsetXmm?: number;
  offsetYmm?: number;
}

export interface CatalogueVisualMetadata {
  category: ComponentCategory;
  /** Stable registry ID. Procedural IDs are valid and deliberately avoid a GLB explosion. */
  assetId: string;
  representation: 'glb' | 'procedural';
  status: 'available' | 'provisional' | 'planned';
  handStyle?: 'baton' | 'mercedes' | 'needle' | 'sword' | 'dauphine' | 'syringe' | 'cathedral' | 'pencil' | 'broad-arrow' | 'skeleton';
  bezelProfile?: 'smooth' | 'coin-edge' | 'knurled' | 'scalloped';
  dialFinish?: TextureKind;
  /** Presentation dimensions only; not supplier bore/clearance verification. */
  handLengthsMm?: { hour: number; minute: number; second: number };
  dialColor?: string;
  caseFinish?: 'steel' | 'rose-gold' | 'black-pvd';
  /** Schematic angle, degrees from 3h; never a verified stem interface. */
  crownAngleDeg?: number;
  note?: string;
}

/**
 * ComponentCatalogueItem
 * Reusable definition of a physical watch component.
 * Exists independently of any one watch design or assembly project.
 */
export interface ComponentCatalogueItem {
  /** Discovery record with incomplete dimensions or no supported assembly slot. */
  researchOnly?: boolean;
  id: string; // e.g. "cat-hour-hand"
  kind: string; // e.g. "hour-hand"
  displayName: string;
  category: CatalogueItemCategory;
  defaultMaterial: string;
  defaultTexture: string;
  linkedBandKind: string | null;
  nominalDimensions: CatalogueNominalDimensions;
  manufacturing: CatalogueManufacturingMetadata;
  softStyles: string[]; // Non-blocking descriptive metadata e.g. ["diver", "pilot", "vintage"]
  status: CatalogueItemStatus;
  metadata: {
    tags: string[];
    revision: string;
    notes: string;
  };
  engineeringSpecs?: ComponentEngineeringSpecs;
  visual?: CatalogueVisualMetadata;
  exportEnabled: boolean;
}

export type SupplierListingVerificationStatus = 'unverified' | 'verified' | 'disputed';
export type SupplierListingStatus = 'active' | 'stale' | 'discontinued';
export type StockStatus = 'in-stock' | 'out-of-stock' | 'backorder' | 'unknown';
export type SupplierSourceType = 'demo-fixture' | 'manual-entry' | 'supplier-api' | 'web-scrape';

export type EngineeringEvidenceLevel = 'headline-only' | 'partial-dimensions' | 'dimensioned-drawing';
export type GlbReadiness = 'blocked' | 'provisional-only' | 'visual-glb-ready' | 'supplier-exact-ready';

export interface SupplierEngineeringEvidence {
  level: EngineeringEvidenceLevel;
  glbReadiness: GlbReadiness;
  checkedAtIso: string;
  drawingUrl?: string | null;
  notes: string;
}

export interface SupplierListingProvenance {
  dataSource: string;
  sourceType: SupplierSourceType;
  isDemonstrationFixture: boolean;
  retrievedAtIso?: string | null;
}

/**
 * SupplierListing
 * Commercial offer for a component.
 * Multiple listings can point to the same ComponentCatalogueItem.
 * Sourcing/supplier changes must never mutate engineering geometry or compatibility.
 * Supports partial, unverified, or stale data without fabricating prices or stock.
 */
export interface SupplierListing {
  id: string; // e.g. "supp-nh35-case-01"
  catalogueItemId: string; // References ComponentCatalogueItem.id
  supplierName: string; // e.g. "NamokiMODS", "AliExpress Seller A"
  sku?: string | null;
  productUrl?: string | null;
  unitPrice: number | null; // Nullable: never invent prices if unverified
  caseFinish?: 'steel' | 'rose-gold' | 'black-pvd';
  alternativePriceNote?: string; // Budget candidate, not an exact geometry/fit match.
  movementCalibre?: string; // Prices the calibre-only BOM row when no physical movement part exists.
  manualSelectionOnly?: boolean; // A different style/geometry must never silently price a preview.
  replacementCatalogueItemId?: string; // Explicit physical alternative used only by BOM Apply.
  handsFinish?: 'auto' | 'rose-gold';
  handsColor?: string;
  purchaseUnit?: 'component' | 'central-hand-set';
  currency: string;
  shippingPrice?: number | null;
  shippingCurrency?: string | null;
  shippingDestination?: string | null;
  stockStatus: StockStatus;
  status: SupplierListingStatus;
  verificationStatus: SupplierListingVerificationStatus;
  leadTimeDays?: number | null;
  lastCheckedIso?: string | null;
  provenance: SupplierListingProvenance;
  directOrderCapability?: boolean;
  engineeringEvidence?: SupplierEngineeringEvidence;
  notes?: string;
}
