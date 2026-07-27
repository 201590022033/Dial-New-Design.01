import { manufacturingRuleAssets } from '@/domain/asset-library';

export type ManufacturingProcessId =
  | 'laser'
  | 'pad-print'
  | 'uv-print'
  | 'cnc'
  | 'engraving'
  | 'etching'
  | 'photochemical';

export type ManufacturingEvidenceClassification =
  | 'verified-manufacturer-capability'
  | 'industry-best-practice'
  | 'engineering-assumption';

export type ManufacturingTraceCode =
  | 'MIN_LINE_WIDTH'
  | 'TICK_SPACING'
  | 'TEXT_LEGIBILITY'
  | 'TEXT_TOO_SMALL'
  | 'HOLE_SPACING'
  | 'TOLERANCE'
  | 'LASER_KERF'
  | 'MIN_UV_PRINT'
  | 'LINES_TOO_THIN'
  | 'UV_LIMIT'
  | 'OVERLAP'
  | 'INVALID_CONCENTRIC'
  | 'SCALE_OVERLAP'
  | 'MARKER_OVERLAP'
  | 'SUBDIAL_OVERLAP'
  | 'DATE_COLLISION'
  | 'OUTSIDE_PRINTABLE_AREA'
  | 'UNSUPPORTED_MATERIAL'
  | 'INVALID_TOLERANCE'
  | 'MARKER_SPACING'
  | 'CHAPTER_RING_CLEARANCE'
  | 'APPLIED_INDEX_CLEARANCE'
  | 'LOGO_COMPLEXITY'
  | 'ENGRAVING_DEPTH'
  | 'PROCESS_COMPATIBILITY'
  | 'MULTILAYER_DIAL';

export interface ManufacturingRuleDescriptor {
  id: string;
  code: ManufacturingTraceCode;
  title: string;
  description: string;
  classification: ManufacturingEvidenceClassification;
  sourceLabel: string;
  sourceNote: string;
  supportingSupplierCategory: string;
  applicableProcesses: ManufacturingProcessId[];
  confidenceLevel: 'high' | 'medium' | 'low';
  configurableThresholds: Record<string, number>;
  revision: string;
  version: string;
  rationale: string;
  defaultRecommendation: string;
}

export const manufacturingRuleLibrary: ManufacturingRuleDescriptor[] = manufacturingRuleAssets.map((rule) => ({
  id: rule.id,
  code: rule.code,
  title: rule.description,
  description: rule.description,
  classification: rule.sourceClassification,
  sourceLabel: rule.sourceLabel,
  sourceNote: rule.sourceNote,
  supportingSupplierCategory: rule.supportingSupplierCategory,
  applicableProcesses: rule.applicableProcesses,
  confidenceLevel: rule.confidenceLevel,
  configurableThresholds: rule.configurableThresholds,
  revision: rule.revision,
  version: rule.version,
  rationale: rule.rationale,
  defaultRecommendation: rule.defaultRecommendation
}));

export const getManufacturingRule = (
  code: ManufacturingTraceCode
): ManufacturingRuleDescriptor | null => {
  return manufacturingRuleLibrary.find((rule) => rule.code === code) ?? null;
};

export const getManufacturingRuleThreshold = (
  code: ManufacturingTraceCode,
  key: string,
  fallback: number
): number => {
  const rule = getManufacturingRule(code);
  if (!rule) {
    return fallback;
  }

  return rule.configurableThresholds[key] ?? fallback;
};