import type { BandEntity } from '@/domain/bands/types';
import type { CollisionWarning } from '@/domain/geometry/collisionEngine';
import type { GlobalGeometryParameters } from '@/domain/geometry/types';
import type { MaterialDefinition } from '@/domain/materials/materialLibrary';
import {
  getManufacturingRule,
  getManufacturingRuleThreshold,
  type ManufacturingEvidenceClassification,
  type ManufacturingProcessId,
  type ManufacturingTraceCode
} from '@/domain/manufacturing/ruleLibrary';
import {
  defaultSupplierProfile,
  type SupplierProfile
} from '@/domain/manufacturing/supplierProfiles';

export interface ManufacturingWarning {
  level: 'warning' | 'error';
  code:
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
    | 'PROCESS_COMPATIBILITY'
    | 'MULTILAYER_DIAL';
  message: string;
  bandId?: string;
  ruleId?: string;
  classification?: ManufacturingEvidenceClassification;
  source?: string;
  recommendation?: string;
  processIds?: ManufacturingProcessId[];
  supplierProfileId?: string;
}

export interface ManufacturingValidationResult {
  valid: boolean;
  warnings: ManufacturingWarning[];
}

export const validateManufacturing = (
  bands: BandEntity[],
  params: GlobalGeometryParameters,
  options?: {
    minimumUvPrintWidthMm?: number;
    minimumTextHeightMm?: number;
    printableAreaDiameterMm?: number;
    selectedMaterial?: MaterialDefinition | null;
    collisions?: CollisionWarning[];
    activeSupplierProfile?: SupplierProfile | null;
  }
): ManufacturingValidationResult => {
  const warnings: ManufacturingWarning[] = [];
  const supplierProfile = options?.activeSupplierProfile ?? defaultSupplierProfile;
  const minimumUvPrintWidth =
    options?.minimumUvPrintWidthMm ?? getManufacturingRuleThreshold('MIN_UV_PRINT', 'minimumUvStrokeMm', 0.12);
  const minimumTextHeight = options?.minimumTextHeightMm ?? params.minimumTextHeightMm;
  const printableAreaDiameter = options?.printableAreaDiameterMm ?? params.dialDiameterMm;
  const preferredPadTextHeight =
    supplierProfile.capabilities.minimumTextHeights['pad-print'] ??
    getManufacturingRuleThreshold('TEXT_TOO_SMALL', 'minimumTextHeightMm', 1.2);
  const preferredPadGap =
    supplierProfile.capabilities.minimumGaps['pad-print'] ??
    getManufacturingRuleThreshold('CHAPTER_RING_CLEARANCE', 'minimumClearanceMm', 0.12);
  const preferredUvWidth = supplierProfile.capabilities.minimumLineWidths['uv-print'] ?? minimumUvPrintWidth;

  const pushRuleWarning = (
    warning: ManufacturingWarning,
    traceCode: ManufacturingTraceCode,
    recommendation?: string
  ) => {
    const rule = getManufacturingRule(traceCode);

    warnings.push({
      ...warning,
      ruleId: rule?.id,
      classification: rule?.classification,
      source: rule ? `${rule.sourceLabel}: ${rule.sourceNote}` : undefined,
      recommendation: recommendation ?? rule?.defaultRecommendation,
      processIds: rule?.applicableProcesses,
      supplierProfileId: supplierProfile.id
    });
  };

  bands.forEach((band, index) => {
    if (band.calculatedWidthMm < params.minimumLineWidthMm) {
      pushRuleWarning({
        level: 'error',
        code: 'MIN_LINE_WIDTH',
        message: `${band.displayName} width is below minimum line width (${params.minimumLineWidthMm}mm).`,
        bandId: band.id
      }, 'MIN_LINE_WIDTH');

      pushRuleWarning({
        level: 'warning',
        code: 'LINES_TOO_THIN',
        message: `${band.displayName} contains lines below recommended manufacturing thickness.`,
        bandId: band.id
      }, 'MIN_LINE_WIDTH');
    }

    if (band.style.strokeWidth < preferredUvWidth * 10) {
      pushRuleWarning({
        level: 'warning',
        code: 'MIN_UV_PRINT',
        message: `${band.displayName} stroke may be below the ${supplierProfile.displayName} UV print minimum (${preferredUvWidth}mm equivalent).`,
        bandId: band.id
      }, 'MIN_UV_PRINT');
    }

    if (band.innerDiameterMm > band.outerDiameterMm) {
      pushRuleWarning({
        level: 'error',
        code: 'INVALID_CONCENTRIC',
        message: `${band.displayName} has invalid concentric geometry.`,
        bandId: band.id
      }, 'CHAPTER_RING_CLEARANCE');
    }

    if (index > 0) {
      const previous = bands[index - 1];
      if (previous && band.innerDiameterMm < previous.outerDiameterMm) {
        pushRuleWarning({
          level: 'error',
          code: 'OVERLAP',
          message: `${band.displayName} overlaps ${previous.displayName}.`,
          bandId: band.id
        }, 'CHAPTER_RING_CLEARANCE');
      }
    }
  });

  if (params.bandGapMm < preferredPadGap) {
    pushRuleWarning({
      level: 'warning',
      code: 'OVERLAP',
      message: `Band clearance (${params.bandGapMm}mm) is below the ${supplierProfile.displayName} preferred printed clearance (${preferredPadGap}mm).`
    }, 'CHAPTER_RING_CLEARANCE', 'Increase band gap or chapter-ring width to improve print registration and assembly tolerance.');
  }

  if (params.minimumTextHeightMm < preferredPadTextHeight) {
    pushRuleWarning({
      level: 'warning',
      code: 'TEXT_LEGIBILITY',
      message: `Text legibility risk: minimum text height is below the ${supplierProfile.displayName} recommended pad-print floor (${preferredPadTextHeight}mm).`
    }, 'TEXT_TOO_SMALL');
  }

  if (minimumTextHeight < preferredPadTextHeight) {
    pushRuleWarning({
      level: 'warning',
      code: 'TEXT_TOO_SMALL',
      message: `Configured text height (${minimumTextHeight}mm) is below the ${supplierProfile.displayName} recommended production minimum.`
    }, 'TEXT_TOO_SMALL');
  }

  if (params.laserKerfMm > params.minimumLineWidthMm) {
    pushRuleWarning({
      level: 'warning',
      code: 'LASER_KERF',
      message: 'Laser kerf exceeds minimum line width; narrow details may collapse.'
    }, 'LASER_KERF');
  }

  if (params.manufacturingToleranceMm > 0.15) {
    pushRuleWarning({
      level: 'warning',
      code: 'TOLERANCE',
      message: 'Manufacturing tolerance is high and may impact concentric alignment.'
    }, 'TOLERANCE');
  }

  if (params.manufacturingToleranceMm < 0 || params.manufacturingToleranceMm > 0.2) {
    pushRuleWarning({
      level: 'error',
      code: 'INVALID_TOLERANCE',
      message: 'Manufacturing tolerance value is outside supported range (0 - 0.2mm).'
    }, 'TOLERANCE');
  }

  if (options?.selectedMaterial && !options.selectedMaterial.uvSuitable && bands.some((band) => band.material === options.selectedMaterial?.id)) {
    pushRuleWarning({
      level: 'warning',
      code: 'UNSUPPORTED_MATERIAL',
      message: `${options.selectedMaterial.name} has limited UV suitability for current process assumptions.`
    }, 'PROCESS_COMPATIBILITY');
  }

  if (
    options?.selectedMaterial &&
    !supplierProfile.capabilities.supportedMaterials.includes(options.selectedMaterial.id)
  ) {
    pushRuleWarning({
      level: 'warning',
      code: 'PROCESS_COMPATIBILITY',
      message: `${supplierProfile.displayName} does not list ${options.selectedMaterial.name} among its supported dial substrates.`
    }, 'PROCESS_COMPATIBILITY');
  }

  if (
    options?.selectedMaterial &&
    params.manufacturingToleranceMm > options.selectedMaterial.recommendedToleranceMm
  ) {
    pushRuleWarning({
      level: 'warning',
      code: 'TOLERANCE',
      message: `Configured tolerance (${params.manufacturingToleranceMm}mm) exceeds the ${options.selectedMaterial.name} recommendation (${options.selectedMaterial.recommendedToleranceMm}mm).`
    }, 'TOLERANCE');
  }

  if (bands.length >= 5 && supplierProfile.capabilities.multilayerDialCapability === 'single-level') {
    pushRuleWarning({
      level: 'warning',
      code: 'MULTILAYER_DIAL',
      message: `${supplierProfile.displayName} is tuned for single-level dials; the current watch stack may require stepped or multi-level assembly.`
    }, 'MULTILAYER_DIAL');
  }

  if (bands.some((band) => band.outerDiameterMm > printableAreaDiameter)) {
    pushRuleWarning({
      level: 'error',
      code: 'OUTSIDE_PRINTABLE_AREA',
      message: 'One or more bands exceed printable area limits.'
    }, 'PROCESS_COMPATIBILITY');
  }

  options?.collisions?.forEach((collision) => {
    const collisionMap: Partial<Record<CollisionWarning['code'], ManufacturingWarning['code']>> = {
      TICK_TICK: 'SCALE_OVERLAP',
      MARKER_MARKER: 'MARKER_OVERLAP',
      SUBDIAL_OVERLAP: 'SUBDIAL_OVERLAP',
      DATE_COLLISION: 'DATE_COLLISION',
      OUTSIDE_PRINTABLE_AREA: 'OUTSIDE_PRINTABLE_AREA'
    };

    const mapped = collisionMap[collision.code];
    if (!mapped) {
      return;
    }

    pushRuleWarning({
      level: collision.severity === 'error' ? 'error' : 'warning',
      code: mapped,
      message:
        collision.code === 'MARKER_MARKER'
          ? 'Marker spacing is below the recommended minimum for pad printing based on published manufacturer guidance.'
          : collision.message
    }, collision.code === 'MARKER_MARKER' ? 'MARKER_SPACING' : 'CHAPTER_RING_CLEARANCE');
  });

  return {
    valid: !warnings.some((warning) => warning.level === 'error'),
    warnings
  };
};
