import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { CompatibilityCheckResult } from '@/domain/compatibility/compatibilityTypes';

export type ConfiguratorWorkMode =
  | 'build'
  | 'parts'
  | 'style'
  | 'research'
  | 'bom'
  | 'manufacture'
  | 'advanced'
  | 'review';

export type TrayTab = 'options' | 'style' | 'suppliers' | 'details' | 'manufacture';

export type PracticalSensitivityKind =
  | 'price-sensitive'
  | 'availability-sensitive'
  | 'local-sourcing-sensitive'
  | 'supplier-count-sensitive'
  | 'lead-time-sensitive'
  | 'custom-manufacturing-sensitive';

export interface PracticalSensitivity {
  kind: PracticalSensitivityKind;
  label: string;
  explanation: string;
  suppressed: boolean;
  score: number; // positive weight
}

export interface CommittedDecisionRecord {
  id: string;
  timestampIso: string;
  partInstanceId: string;
  previousCatalogueItemId?: string;
  newCatalogueItemId: string;
  costDelta: number;
  supplierDelta: number;
  leadTimeDeltaDays: number;
  isCustomPart: boolean;
  isLocalSource: boolean;
  summary: string;
}

export interface SavedDesignVersion {
  id: string;
  name: string;
  timestampIso: string;
  assembly: WatchAssembly;
  sourcingPlan: Record<string, string | null>;
  isAutomaticCheckpoint?: boolean;
  checkpointReason?: string;
  isPinned?: boolean;
  totalCost: number;
  supplierCount: number;
  customPartCount: number;
  readinessLabel: string;
}

export interface BomCostLine {
  id: string;
  partInstanceIds: string[];
  name: string;
  component: string;
  priceZar: number | null;
  shippingZar: number | null;
  listingId?: string;
  supplierName?: string;
  supplierSku?: string | null;
  productUrl?: string | null;
  alternativePriceNote?: string;
  lastCheckedIso?: string;
  nativePrice?: number | null;
  currency?: string;
  status: 'selected' | 'estimate' | 'unpriced';
  visible: boolean;
  included?: boolean;
  choiceGroup?: string;
  fitWarning?: string;
  catalogueItemId?: string;
}

export interface CostBreakdown {
  lineItems: BomCostLine[];
  partsTotal: number;
  shippingEstimate: number;
  shippingUnknownCount: number;
  dutiesAndTaxesEstimate: number;
  customFabricationEstimate: number;
  grandTotal: number;
}

export interface BuildReadiness {
  sourcedCount: number;
  customCount: number;
  unresolvedCount: number;
  readinessLabel: string;
  issues: CompatibilityCheckResult[];
}
