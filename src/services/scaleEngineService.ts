import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { styleScaleTicks } from '@/domain/scales/markingStyle';
import { constrainScaleToPlacementEnvelope } from '@/domain/scales/placementEnvelope';
import { isForbiddenConversionCaption, logDecadeAngle } from '@/domain/scales/calibratedSlideRule';
import { pointerHalfExtentMm } from '@/domain/scales/pointerGeometry';
import { resolvedScaleSvg } from '@/domain/scales/resolvedScaleArtwork';
import { runReferenceScale } from './referenceScaleArtworkService';
import type {
  ScaleGeometryOutput,
  ScaleKind,
  ScaleLabel,
  ScaleMathContext,
  ScaleManufacturingMetadata,
  ScalePluginConfig,
  ScalePointer,
  ScaleTick,
  ScaleValidationResult
} from '@/domain/scales/types';

export interface ScaleRunResult {
  kind: ScaleKind;
  pluginName: string;
  fontSizeMm: number;
  fontFamily: string;
  color: string;
  ticks: ScaleTick[];
  labels: ScaleLabel[];
  pointers?: ScalePointer[];
  substrates?: import('@/domain/scales/types').ScaleSubstrate[];
  /** Independent active physical layers, not additional overlaid designs on one band. */
  layers?: ScaleRunResult[];
  geometry: ScaleGeometryOutput;
  validation: ScaleValidationResult;
  svg: string;
  preview: string;
  manufacturingMetadata?: ScaleManufacturingMetadata;
  placementTargetBandId?: string;
  fixedPlacementTargetBandId?: string;
  physicalTargetsResolved?: boolean;
  fixedPlacementEnvelope?: ScaleRunResult['placementEnvelope'];
  placementEnvelope: {
    innerRadiusMm: number;
    outerRadiusMm: number;
    contentOuterRadiusMm: number;
    safetyMarginMm: number;
  };
}

const resultCache = new Map<string, ScaleRunResult>();

const validateResolvedAviation = (ticks: ScaleTick[], labels: ScaleLabel[]): ScaleValidationResult => {
  const structuredWarnings: ScaleValidationResult['structuredWarnings'] = [];
  for (const ring of ['outer', 'inner']) {
    const row = ticks.filter((tick) => tick.ringId === ring);
    if (!row.length || row.some((tick) => !Number.isFinite(tick.angleDeg) || !Number.isFinite(tick.radiusMm) || tick.widthMm <= 0)) {
      structuredWarnings.push({ severity: 'error', description: `Invalid ${ring} calculation row.`, affectedObject: `scale-${ring}`, suggestedFix: 'Restore the Simplified baseline.' });
    }
    const values = row.map((tick) => tick.value);
    if (new Set(values).size !== values.length) structuredWarnings.push({ severity: 'error', description: `Duplicate ${ring} calculation graduations.`, affectedObject: `scale-${ring}`, suggestedFix: 'Keep one graduation at the shared 100/10 seam.' });
    const writing = labels.filter((label) => label.ringId === ring);
    for (let index = 0; index < writing.length; index++) {
      const a = writing[index]!;
      const b = writing[(index + 1) % writing.length];
      if (!b || a === b) continue;
      const gap = Math.abs(((a.angleDeg - b.angleDeg + 540) % 360) - 180) * Math.PI / 180 * Math.min(a.radiusMm, b.radiusMm);
      if (gap < ((a.boundsMm?.width ?? a.text.length * 0.5) + (b.boundsMm?.width ?? b.text.length * 0.5)) / 2) {
        structuredWarnings.push({ severity: 'warning', description: `${ring} labels ${a.text} and ${b.text} may overlap.`, affectedObject: `scale-${ring}`, suggestedFix: 'Reduce label size or use Simplified writing controls.' });
      }
    }
  }
  return { valid: !structuredWarnings.some((warning) => warning.severity === 'error'), warnings: structuredWarnings.map((warning) => warning.description), structuredWarnings };
};

const createCacheKey = (kind: ScaleKind, config: ScalePluginConfig, context: ScaleMathContext): string => {
  return `${kind}:${JSON.stringify(config)}:${JSON.stringify(context)}`;
};

export const runScalePlugin = (
  kind: ScaleKind,
  config: ScalePluginConfig,
  context: ScaleMathContext
): ScaleRunResult | null => {
  if (kind === 'slide-rule' && config.referenceDesign && config.referenceDesign !== 'simplified') return runReferenceScale(config, context);
  const cacheKey = createCacheKey(kind, config, context);
  const cached = resultCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const plugin = getScalePlugin(kind);
  if (!plugin) {
    return null;
  }

  const retained = (mark: ScaleTick | ScaleLabel) => kind !== 'slide-rule' || ((!mark.dedicatedConversion || mark.dedicatedConversion === 'distance') &&
    !('text' in mark && isForbiddenConversionCaption(mark.text)));
  const visible = (ring?: string) => ring === 'inner' ? config.innerScaleVisible !== false : config.outerScaleVisible !== false;
  const generatedTicks = styleScaleTicks(plugin.tickGenerator(config, context), config).filter(retained).map((tick, index) => {
    const id = tick.id ?? `${kind}:${tick.ringId ?? 'outer'}:tick:${tick.value ?? index}`;
    return { ...tick, id, hoverPaddingMm: config.hoverPaddingMm, color: config.markColorOverrides?.[id] ?? tick.color ?? config.color };
  });
  const generatedLabels = plugin.labelGenerator(generatedTicks, config).filter(retained).map((label, index) => {
    const id = label.id ?? `${kind}:${label.ringId ?? 'outer'}:label:${label.value ?? index}`;
    let boundsMm = label.boundsMm;
    if (!boundsMm && typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.font = `600 ${(config.scaleFontSizeMm ?? 0.8) * 100}px ${config.fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const measured = ctx.measureText(label.text);
          boundsMm = { width: Math.max(measured.width, 2*Math.abs(measured.actualBoundingBoxLeft), 2*Math.abs(measured.actualBoundingBoxRight)) / 100,
            height: Math.max(2*Math.abs(measured.actualBoundingBoxAscent), 2*Math.abs(measured.actualBoundingBoxDescent)) / 100 || (config.scaleFontSizeMm ?? 0.8) };
        }
      } catch { /* DOM-free exports use the explicitly approximate conservative fallback. */ }
    }
    const measured = boundsMm && Number.isFinite(boundsMm.width) && Number.isFinite(boundsMm.height);
    return { ...label, id, boundsMm: measured ? boundsMm : { width: Math.max(1, label.text.length) * (config.scaleFontSizeMm ?? 0.8) * 0.58, height: config.scaleFontSizeMm ?? 0.8 },
      boundsEvidence: measured ? 'browser-measured' as const : 'estimated' as const,
      hoverPaddingMm: config.hoverPaddingMm, color: config.markColorOverrides?.[id] ?? label.color ?? config.color };
  });
  const constrained = constrainScaleToPlacementEnvelope(generatedTicks, generatedLabels, config);
  const pointers = (config.pointers ?? []).filter((pointer) =>
    visible(pointer.ringId) && (!pointer.dedicatedConversion || pointer.dedicatedConversion === 'distance')).map((pointer) => {
    const envelope = pointer.ringId === 'inner' && config.fixedBandOuterRadiusMm !== undefined
      ? { innerRadiusMm: config.fixedBandInnerRadiusMm ?? 0, contentOuterRadiusMm: config.fixedBandOuterRadiusMm - constrained.envelope.safetyMarginMm }
      : constrained.envelope;
    const resolved = { ...pointer, hoverPaddingMm: pointer.hoverPaddingMm ?? config.hoverPaddingMm,
      color: config.markColorOverrides?.[pointer.id] ?? pointer.color,
      angleDeg: logDecadeAngle(pointer.value, config.rotationOffsetDeg, config.direction === 'clockwise' ? 1 : -1) +
        (pointer.ringId === 'outer' ? config.outerRotationOffsetDeg ?? 0 : config.innerRotationOffsetDeg ?? 0) };
    const half = pointerHalfExtentMm(resolved);
    const min = envelope.innerRadiusMm + constrained.envelope.safetyMarginMm + half;
    const max = envelope.contentOuterRadiusMm - half;
    if (![resolved.value, resolved.radiusMm, half].every(Number.isFinite) || resolved.value <= 0 ||
      resolved.widthMm <= 0 || resolved.heightMm <= 0 || resolved.strokeWidthMm < 0 || min > max) {
      constrained.issues.push(`Pointer ${pointer.id} cannot fit its printable annulus.`);
    }
    return { ...resolved, radiusMm: min <= max ? Math.max(min, Math.min(resolved.radiusMm, max)) : Math.max(0, max) };
  });
  const ticks = constrained.ticks.filter((tick) => visible(tick.ringId));
  const labels = constrained.labels.filter((label) => visible(label.ringId) &&
    (label.ringId === 'inner' ? config.innerNumeralsVisible !== false : config.outerNumeralsVisible !== false));
  const geometry = plugin.geometryGenerator(ticks, labels);
  // Independent concentric rows share angles intentionally. The old generic
  // validator incorrectly treated these as colliding ticks on one circle.
  const validation = kind === 'slide-rule' && config.engineeringPreset === 'aviation-slide-rule'
    ? validateResolvedAviation(constrained.ticks, constrained.labels)
    : plugin.validate(config, constrained.ticks, constrained.labels);
  if (constrained.issues.length) {
    validation.valid = false;
    validation.warnings.push(...constrained.issues);
    validation.structuredWarnings.push(...constrained.issues.map((description) => ({ severity: 'error' as const, description, affectedObject: 'scale-envelope', suggestedFix: 'Use a wider printable surface or smaller text/strokes; do not move calibration angles.' })));
  }

  const result: ScaleRunResult = {
    kind,
    pluginName: plugin.metadata.name,
    fontSizeMm: config.scaleFontSizeMm ?? 0.8,
    fontFamily: config.fontFamily,
    color: config.color,
    ticks,
    labels,
    pointers,
    geometry,
    validation,
    svg: plugin.svgOutput(ticks, labels),
    preview: plugin.previewGenerator(config, context),
    manufacturingMetadata: plugin.manufacturingMetadata?.(ticks, labels, config),
    placementTargetBandId: config.placementTargetBandId,
    fixedPlacementTargetBandId: config.fixedPlacementTargetBandId,
    physicalTargetsResolved: config.physicalTargetsResolved,
    fixedPlacementEnvelope: config.fixedBandOuterRadiusMm !== undefined ? {
      innerRadiusMm: config.fixedBandInnerRadiusMm ?? 0, outerRadiusMm: config.fixedBandOuterRadiusMm,
      contentOuterRadiusMm: config.fixedBandOuterRadiusMm - constrained.envelope.safetyMarginMm,
      safetyMarginMm: constrained.envelope.safetyMarginMm
    } : undefined,
    placementEnvelope: constrained.envelope
  };
  result.svg = resolvedScaleSvg(result, Math.max(1, config.bandOuterRadiusMm * 2));

  resultCache.set(cacheKey, result);
  if (resultCache.size > 50) {
    const firstKey = resultCache.keys().next().value;
    if (firstKey) {
      resultCache.delete(firstKey);
    }
  }

  return result;
};

export const clearScaleEngineCache = (): void => {
  resultCache.clear();
};
