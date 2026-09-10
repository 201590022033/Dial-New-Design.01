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

/**
 * ComponentCatalogueItem
 * Reusable definition of a physical watch component.
 * Exists independently of any one watch design or assembly project.
 */
export interface ComponentCatalogueItem {
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
  exportEnabled: boolean;
}

/**
 * SupplierListing
 * Commercial offer for a component.
 * Multiple listings can point to the same ComponentCatalogueItem.
 * Sourcing/supplier changes must never mutate engineering geometry or compatibility.
 */
export interface SupplierListing {
  id: string; // e.g. "supp-nh35-case-01"
  catalogueItemId: string; // References ComponentCatalogueItem.id
  supplierName: string; // e.g. "NamokiMODS", "AliExpress Seller A"
  sku: string;
  productUrl?: string;
  unitPrice: number;
  currency: string;
  inStock: boolean;
  leadTimeDays?: number;
  verifiedByStaff: boolean;
  directOrderCapability?: boolean;
  notes?: string;
}
