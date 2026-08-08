import type { BandEntity } from '@/domain/bands/types';
import { updateBandGeometry } from '@/domain/bands/bandRegistry';
import { evaluateGeometryConstraints } from '@/domain/geometry/constraints';
import { buildDependencyGraph, markDirtyFromNode } from '@/domain/geometry/dependencyGraph';
import { calculateWidth, diameterToRadius } from '@/domain/geometry/dimensions';
import { geometryParameterDefinitions } from '@/domain/geometry/parameterCatalog';
import { validateAllCategories } from '@/domain/geometry/validationEngine';
import type {
  ConstraintViolation,
  DependencyGraph,
  DerivedGeometryContext,
  GeometryWarning,
  GlobalGeometryParameters,
  StructuredValidationResult
} from '@/domain/geometry/types';

export const defaultGeometryParameters: GlobalGeometryParameters = {
  caseDiameterMm: 42,
  dialDiameterMm: 38,
  movementDiameterMm: 30.5,
  movementCentreHoleMm: 1.5,
  bandClearanceMm: 0.2,
  bandGapMm: 0.15,
  chapterRingWidthMm: 1.6,
  innerBezelWidthMm: 1.2,
  outerBezelWidthMm: 1.5,
  manufacturingToleranceMm: 0.05,
  laserKerfMm: 0.08,
  minimumLineWidthMm: 0.1,
  minimumTextHeightMm: 1.4,
  defaultUnits: 'mm'
};

const geometryCache = new Map<string, GeometryEngineResult>();

const createCacheKey = (bands: BandEntity[], params: GlobalGeometryParameters): string => {
  const bandSignature = bands
    .map((band) => `${band.id}:${band.kind}:${band.zIndex}:${band.outerDiameterMm}:${band.innerDiameterMm}`)
    .join('|');

  return `${JSON.stringify(params)}::${bandSignature}`;
};

const clampByDefinition = (key: keyof GlobalGeometryParameters, value: number | string): number | string => {
  const definition = geometryParameterDefinitions.find((entry) => entry.key === key);
  if (!definition || typeof value !== 'number' || definition.min === null || definition.max === null) {
    return value;
  }

  return Math.max(definition.min, Math.min(definition.max, value));
};

export const normalizeGeometryParameters = (
  params: GlobalGeometryParameters
): GlobalGeometryParameters => {
  const normalized: GlobalGeometryParameters = {
    ...params,
    caseDiameterMm: Number(clampByDefinition('caseDiameterMm', params.caseDiameterMm)),
    dialDiameterMm: Number(clampByDefinition('dialDiameterMm', params.dialDiameterMm)),
    movementDiameterMm: Number(clampByDefinition('movementDiameterMm', params.movementDiameterMm)),
    movementCentreHoleMm: Number(
      clampByDefinition('movementCentreHoleMm', params.movementCentreHoleMm)
    ),
    bandClearanceMm: Number(clampByDefinition('bandClearanceMm', params.bandClearanceMm)),
    bandGapMm: Number(clampByDefinition('bandGapMm', params.bandGapMm)),
    chapterRingWidthMm: Number(clampByDefinition('chapterRingWidthMm', params.chapterRingWidthMm)),
    innerBezelWidthMm: Number(clampByDefinition('innerBezelWidthMm', params.innerBezelWidthMm)),
    outerBezelWidthMm: Number(clampByDefinition('outerBezelWidthMm', params.outerBezelWidthMm)),
    manufacturingToleranceMm: Number(
      clampByDefinition('manufacturingToleranceMm', params.manufacturingToleranceMm)
    ),
    laserKerfMm: Number(clampByDefinition('laserKerfMm', params.laserKerfMm)),
    minimumLineWidthMm: Number(clampByDefinition('minimumLineWidthMm', params.minimumLineWidthMm)),
    minimumTextHeightMm: Number(clampByDefinition('minimumTextHeightMm', params.minimumTextHeightMm)),
    defaultUnits: 'mm'
  };

  normalized.dialDiameterMm = Math.min(
    normalized.dialDiameterMm,
    normalized.caseDiameterMm - normalized.bandClearanceMm * 2
  );

  normalized.movementDiameterMm = Math.min(normalized.movementDiameterMm, normalized.dialDiameterMm);

  normalized.movementCentreHoleMm = Math.min(
    normalized.movementCentreHoleMm,
    Math.max(0.2, normalized.movementDiameterMm - 0.2)
  );

  return normalized;
};

export const deriveGeometryContext = (params: GlobalGeometryParameters): DerivedGeometryContext => {
  const normalized = normalizeGeometryParameters(params);
  const caseRadiusMm = diameterToRadius(normalized.caseDiameterMm).value;
  const dialRadiusMm = diameterToRadius(normalized.dialDiameterMm).value;
  const movementRadiusMm = diameterToRadius(normalized.movementDiameterMm).value;

  const outerBezelInnerDiameterMm = normalized.caseDiameterMm - normalized.outerBezelWidthMm * 2;
  const innerBezelInnerDiameterMm = outerBezelInnerDiameterMm - normalized.innerBezelWidthMm * 2;
  const chapterRingInnerDiameterMm = innerBezelInnerDiameterMm - normalized.chapterRingWidthMm * 2;
  const dialFaceInnerDiameterMm = Math.max(
    normalized.movementCentreHoleMm,
    chapterRingInnerDiameterMm - normalized.bandGapMm * 2
  );

  const usableBandRadiusMm = Math.max(0, caseRadiusMm - normalized.bandClearanceMm);

  return {
    caseRadiusMm,
    dialRadiusMm,
    movementRadiusMm,
    usableBandRadiusMm,
    outerBezelInnerDiameterMm,
    innerBezelInnerDiameterMm,
    chapterRingInnerDiameterMm,
    dialFaceInnerDiameterMm
  };
};

export const validateGeometryParameters = (params: GlobalGeometryParameters): GeometryWarning[] => {
  const normalized = normalizeGeometryParameters(params);
  const warnings: GeometryWarning[] = [];

  if (normalized.caseDiameterMm <= 0) {
    warnings.push({
      code: 'DIAMETER_OUT_OF_RANGE',
      message: 'Case diameter must be greater than zero.',
      severity: 'error'
    });
  }

  if (normalized.dialDiameterMm > normalized.caseDiameterMm) {
    warnings.push({
      code: 'DIAL_EXCEEDS_CASE',
      message: 'Dial diameter exceeds case diameter; dial was clamped.',
      severity: 'warning'
    });
  }

  if (normalized.movementDiameterMm > normalized.dialDiameterMm) {
    warnings.push({
      code: 'MOVEMENT_EXCEEDS_DIAL',
      message: 'Movement diameter exceeds dial diameter; movement was clamped.',
      severity: 'warning'
    });
  }

  if (normalized.minimumLineWidthMm <= 0) {
    warnings.push({
      code: 'LINE_WIDTH_UNDER_MIN',
      message: 'Minimum line width must be positive.',
      severity: 'error'
    });
  }

  if (normalized.minimumTextHeightMm < 1) {
    warnings.push({
      code: 'TEXT_SIZE_UNDER_MIN',
      message: 'Minimum text height below 1mm can become illegible in manufacturing outputs.',
      severity: 'warning'
    });
  }

  return warnings;
};

export interface ChainedBandsResult {
  bands: BandEntity[];
  warnings: GeometryWarning[];
}

export interface GeometryEngineResult {
  bands: BandEntity[];
  context: DerivedGeometryContext;
  warnings: GeometryWarning[];
  constraintViolations: ConstraintViolation[];
  validationResults: StructuredValidationResult[];
  dependencyGraph: DependencyGraph;
}

const widthByKind = (kind: BandEntity['kind'], params: GlobalGeometryParameters): number => {
  switch (kind) {
    case 'outer-bezel':
      return params.outerBezelWidthMm;
    case 'inner-bezel':
      return params.innerBezelWidthMm;
    case 'chapter-ring':
      return params.chapterRingWidthMm;
    default:
      return Math.max(0.2, params.chapterRingWidthMm * 0.75);
  }
};

const structuralBandOrder: BandEntity['kind'][] = [
  'outer-bezel',
  'inner-bezel',
  'chapter-ring'
];

const structuralBandKinds = new Set<BandEntity['kind']>([
  'dial-face',
  ...structuralBandOrder
]);

export const chainConcentricBands = (
  sourceBands: BandEntity[],
  params: GlobalGeometryParameters
): ChainedBandsResult => {
  const normalized = normalizeGeometryParameters(params);
  const context = deriveGeometryContext(normalized);
  const warnings = validateGeometryParameters(normalized);
  const geometryById = new Map<string, { innerRadius: number; outerRadius: number }>();
  let currentOuterRadiusMm = context.usableBandRadiusMm;

  structuralBandOrder.forEach((kind) => {
    const band = sourceBands.find((candidate) => candidate.kind === kind && candidate.visible);
    if (!band) {
      return;
    }

    const widthMm = Math.max(widthByKind(kind, normalized), normalized.minimumLineWidthMm);
    const innerRadius = Math.max(0, currentOuterRadiusMm - widthMm);
    geometryById.set(band.id, { innerRadius, outerRadius: currentOuterRadiusMm });
    currentOuterRadiusMm = Math.max(0, innerRadius - normalized.bandGapMm);
  });

  const dialFace = sourceBands.find((band) => band.kind === 'dial-face' && band.visible);
  if (dialFace) {
    geometryById.set(dialFace.id, { innerRadius: 0, outerRadius: currentOuterRadiusMm });
  }

  const bands = sourceBands.map((band) => {
    const geometry = geometryById.get(band.id);
    if (!geometry || !structuralBandKinds.has(band.kind)) {
      return band;
    }

    const innerDiameterMm = geometry.innerRadius * 2;
    const outerDiameterMm = geometry.outerRadius * 2;
    return updateBandGeometry(
      {
        ...band,
        innerDiameterMm,
        outerDiameterMm,
        calculatedWidthMm: calculateWidth(outerDiameterMm, innerDiameterMm).value,
        dirty: true,
        lastUpdatedIso: new Date().toISOString()
      },
      geometry
    );
  });

  return { bands, warnings };
};

export const runGeometryEngine = (
  sourceBands: BandEntity[],
  params: GlobalGeometryParameters
): GeometryEngineResult => {
  const normalized = normalizeGeometryParameters(params);
  const cacheKey = createCacheKey(sourceBands, normalized);
  const cached = geometryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const context = deriveGeometryContext(normalized);
  const chained = chainConcentricBands(sourceBands, normalized);
  const dependencyGraph = buildDependencyGraph(chained.bands);

  const dirtyGraph =
    chained.bands.length > 0
      ? markDirtyFromNode(dependencyGraph, chained.bands[0]?.id ?? '')
      : dependencyGraph;

  const bands = chained.bands.map((band) => {
    const node = dirtyGraph.nodes[band.id];
    return {
        ...band,
        dependencyIds: node?.dependencyIds ?? band.dependencyIds,
        affectedObjectIds: node?.affectedObjectIds ?? band.affectedObjectIds,
        dirty: node?.dirty ?? band.dirty,
        lastUpdatedIso: node?.lastUpdatedIso ?? band.lastUpdatedIso
    };
  });

  const constraintViolations = evaluateGeometryConstraints(bands, normalized, context);
  const validationResults = validateAllCategories(bands, normalized, constraintViolations);

  const result: GeometryEngineResult = {
    bands,
    context,
    warnings: chained.warnings,
    constraintViolations,
    validationResults,
    dependencyGraph: dirtyGraph
  };

  geometryCache.set(cacheKey, result);
  if (geometryCache.size > 25) {
    const firstKey = geometryCache.keys().next().value;
    if (firstKey) {
      geometryCache.delete(firstKey);
    }
  }

  return result;
};
