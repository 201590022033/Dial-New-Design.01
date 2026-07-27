import type {
  ManufacturingEvidenceClassification,
  ManufacturingProcessId,
  ManufacturingTraceCode
} from '@/domain/manufacturing/ruleLibrary';

export interface ScaleAssetDefinition {
  id: string;
  family: 'classical-slide-rule' | 'aviation' | 'chronograph';
  label: string;
  scaleKind: string;
  projectionKind: string;
  formatterKind: string;
  typography: {
    family: string;
    scale: number;
  };
  tickHierarchy: {
    primary: number;
    secondary: number;
    tertiary?: number;
  };
  tickLengthsMm: {
    primary: number;
    secondary: number;
    tertiary?: number;
  };
  labelPriorities: string[];
  numeralPositioning: 'inside' | 'outside' | 'mixed';
  ringWidthRecommendationMm: {
    min: number;
    preferred: number;
    max: number;
  };
  manufacturingRecommendations: string[];
  chapterRingCompatibility: string[];
  markerCompatibility: string[];
}

export interface ChapterRingAssetDefinition {
  id: string;
  family: 'printed' | 'engraved' | 'applied' | 'floating' | 'recessed' | 'sandwich' | 'stepped' | 'multi-level' | 'railroad' | 'coin-edge' | 'fluted' | 'pilot' | 'dive' | 'dress' | 'military';
  profileGeometry: 'flat' | 'stepped' | 'beveled' | 'recessed';
  heightMm: number;
  bevelMm: number;
  chamferMm: number;
  finish: string;
  printableAreaMm: {
    radial: number;
    arcGapMin: number;
  };
  markerAttachment: string[];
  scaleAttachment: string[];
  typographyAttachment: string[];
  manufacturingMetadata: {
    defaultProcess: ManufacturingProcessId;
    minLineWidthMm: number;
    minTextHeightMm: number;
  };
}

export interface MarkerAssetDefinition {
  id: string;
  family: 'pilot' | 'dress' | 'military' | 'dive';
  style: string;
  finishOptions: Array<'polished' | 'brushed' | 'painted'>;
  lumeSupport: boolean;
  bevelSupport: boolean;
  defaultHeightMm: number;
  defaultThicknessMm: number;
  applied: boolean;
  recessed: boolean;
  compatibleChapterRings: string[];
}

export interface HandAssetDefinition {
  id: string;
  family: 'pilot' | 'dress' | 'military' | 'sport';
  style: string;
  hubGeometry: 'flat' | 'domed' | 'stepped';
  hasCounterweight: boolean;
  taper: 'none' | 'light' | 'medium' | 'aggressive';
  lumeSupport: boolean;
  skeletonSupport: boolean;
  finishOptions: Array<'polished' | 'brushed' | 'painted'>;
  hasSecondsTail: boolean;
  hasCentreCap: boolean;
  manufacturingProfile: {
    preferredProcess: ManufacturingProcessId;
    minThicknessMm: number;
  };
}

export interface MaterialAssetDefinition {
  id: string;
  category: 'dial-finish' | 'metal-finish' | 'crystal';
  label: string;
  renderingBehavior: {
    reflectivity: number;
    roughness: number;
    textureBias: string;
  };
  manufacturingCompatibility: ManufacturingProcessId[];
  printingCompatibility: {
    padPrint: boolean;
    uvPrint: boolean;
  };
  engravingCompatibility: {
    supported: boolean;
    minimumWidthMm: number;
  };
  appliedMarkerCompatibility: boolean;
}

export interface TypographyAssetDefinition {
  id: string;
  family: 'pilot' | 'military' | 'dive' | 'dress' | 'bauhaus' | 'din' | 'railroad' | 'vintage' | 'chronograph';
  kerning: number;
  radialSpacingMm: number;
  baselineCorrectionMm: number;
  minimumPrintableSizeMm: number;
  recommendedArcSpacingMm: number;
}

export interface ManufacturingRuleDataDefinition {
  id: string;
  code: ManufacturingTraceCode;
  description: string;
  sourceClassification: ManufacturingEvidenceClassification;
  supportingSupplierCategory: string;
  applicableProcesses: ManufacturingProcessId[];
  confidenceLevel: 'high' | 'medium' | 'low';
  configurableThresholds: Record<string, number>;
  revision: string;
  version: string;
  sourceLabel: string;
  sourceNote: string;
  rationale: string;
  defaultRecommendation: string;
}

export interface SupplierProfileDataDefinition {
  id: string;
  displayName: string;
  region: string;
  supportedManufacturingMethods: ManufacturingProcessId[];
  supportedMaterials: string[];
  finishingCapabilities: string[];
  dimensionalTolerancesMm: {
    standard: number;
    premium: number;
  };
  minimumLineWidths: Partial<Record<ManufacturingProcessId, number>>;
  minimumFontSizesMm: Partial<Record<ManufacturingProcessId, number>>;
  multilayerCapability: 'single-level' | 'stepped' | 'multi-level';
  appliedIndexCapability: 'not-offered' | 'supported' | 'specialist';
  recommendedProductionVolume: 'prototype' | 'small-batch' | 'serial';
  notes: string[];
  references: string[];
  evidenceClassification: ManufacturingEvidenceClassification;
  colorLimitations: string;
}
