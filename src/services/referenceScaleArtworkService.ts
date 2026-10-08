import { generateCitizenReferenceArtwork, CITIZEN_REFERENCE_ID, type CitizenArtworkOptions } from '@/domain/scales/citizenReferenceArtwork';
import type { ScalePluginConfig, ScaleMathContext } from '@/domain/scales/types';
import { resolvedScaleSvg } from '@/domain/scales/resolvedScaleArtwork';
import type { ScaleRunResult } from './scaleEngineService';

/** Reference proportions adapted to the selected printable annuli, never supplier factory mm. */
export const referenceScaleDefaults = (design: 'citizen' | 'navitimer', config: ScalePluginConfig): Partial<ScalePluginConfig> => {
  const oi = config.bandInnerRadiusMm, oo = config.bandOuterRadiusMm;
  const ii = config.fixedBandInnerRadiusMm ?? oi, io = config.fixedBandOuterRadiusMm ?? oo;
  const unit = Math.max(0.0001, Math.min(oo - oi - 0.2, io - ii - 0.2) / 115);
  // Arial cap height is about 0.73em; the packet measures ink caps, not em size.
  // Browser glyph bounds below are authoritative; this is a disclosed fallback.
  const font = unit * 28 / 0.73;
  return {
    referenceDesign: design, referenceColourMode: 'original', referenceColourOverrides: {},
    referenceDistanceVisible: true, referenceLineFactor: 1, referenceTickFactor: 1,
    referencePixelMm: unit, scaleFontSizeMm: font, fontFamily: 'Arial, sans-serif',
    referenceOuterTickRadiusMm: oi + 0.1 + unit * 4,
    referenceOuterNumeralRadiusMm: oi + 0.1 + unit * 4 + unit * 53,
    referenceInnerTickRadiusMm: io - 0.1 - unit * 4,
    referenceInnerNumeralRadiusMm: io - 0.1 - unit * 4 - unit * 55.75,
    outerRotationOffsetDeg: 0, outerScaleVisible: true, innerScaleVisible: true,
    outerNumeralsVisible: true, innerNumeralsVisible: true, hoverPaddingMm: 0
  };
};

const fontMeasurer = (fontFamily: string) => {
  if (typeof document === 'undefined') return undefined;
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return undefined;
  return (text: string, size: number) => {
    ctx.font = `600 ${size * 100}px ${fontFamily}`;
    const m = ctx.measureText(text);
    return { width: Math.max(m.width, m.actualBoundingBoxLeft + m.actualBoundingBoxRight) / 100,
      height: ((m.actualBoundingBoxAscent ?? 0) + (m.actualBoundingBoxDescent ?? 0) || size * 100) / 100 };
  };
};

export const runReferenceScale = (config: ScalePluginConfig, _context: ScaleMathContext): ScaleRunResult | null => {
  void _context;
  if (config.referenceDesign !== 'citizen') return null;
  const defaults = referenceScaleDefaults('citizen', config);
  const value = (key: keyof ScalePluginConfig) => (config[key] ?? defaults[key]) as number;
  const font = value('scaleFontSizeMm'), unit = value('referencePixelMm');
  const fixedInner = config.fixedBandInnerRadiusMm ?? config.bandInnerRadiusMm;
  const fixedOuter = config.fixedBandOuterRadiusMm ?? config.bandOuterRadiusMm;
  const fontFamily = config.fontFamily || 'Arial, sans-serif';
  const options: CitizenArtworkOptions = {
    outer: { innerRadiusMm: config.bandInnerRadiusMm, outerRadiusMm: config.bandOuterRadiusMm,
      tickRadiusMm: value('referenceOuterTickRadiusMm'), numeralRadiusMm: value('referenceOuterNumeralRadiusMm'), sourcePixelMm: unit, fontSizeMm: font },
    inner: { innerRadiusMm: fixedInner, outerRadiusMm: fixedOuter,
      tickRadiusMm: value('referenceInnerTickRadiusMm'), numeralRadiusMm: value('referenceInnerNumeralRadiusMm'), sourcePixelMm: unit, fontSizeMm: font * (18.5 / 28) },
    outerRotationDeg: config.outerRotationOffsetDeg ?? 0,
    colourMode: config.referenceColourMode ?? 'original', colourOverrides: config.referenceColourOverrides,
    outerVisible: config.outerScaleVisible, innerVisible: config.innerScaleVisible,
    distanceVisible: config.referenceDistanceVisible, tickFactor: config.referenceTickFactor,
    lineFactor: config.referenceLineFactor, hoverPaddingMm: config.hoverPaddingMm,
    measureText: fontMeasurer(fontFamily)
  };
  const artwork = generateCitizenReferenceArtwork(options);
  const envelope = (innerRadiusMm: number, outerRadiusMm: number) => ({ innerRadiusMm, outerRadiusMm, contentOuterRadiusMm: outerRadiusMm - 0.08, safetyMarginMm: 0.08 });
  const issues = [...artwork.validation.issues];
  // Both physical targets are required; fallback envelopes are preview-only, never export approval.
  if (!config.fixedPlacementTargetBandId || config.fixedBandOuterRadiusMm === undefined)
    issues.push('Citizen requires an independently bound fixed calculation ring.');
  const labels = artwork.labels.filter((label) => !label.id.includes('.number.') ||
    (label.ringId === 'inner' ? config.innerNumeralsVisible !== false : config.outerNumeralsVisible !== false));
  // Do not auto-omit crowded writing. Diagnose it while preserving the calibrated inventory.
  const numbered = labels.filter((label) => label.id.includes('.number.'));
  for (const row of ['outer', 'inner'] as const) {
    const writing = numbered.filter((label) => label.ringId === row);
    for (let i = 0; i < writing.length; i++) {
      const a = writing[i]!, b = writing[(i + 1) % writing.length];
      if (!b || a === b) continue;
      const angle = Math.abs(((a.angleDeg - b.angleDeg + 540) % 360) - 180) * Math.PI / 180;
      if (angle * Math.min(a.radiusMm, b.radiusMm) < ((a.boundsMm?.width ?? 0) + (b.boundsMm?.width ?? 0)) / 2)
        issues.push(`${row} numerals ${a.text}/${b.text} overlap; reduce label size or select a wider printable ring.`);
    }
  }
  const structuredWarnings = issues.map((description) => ({ severity: 'error' as const, description, affectedObject: 'reference-scale', suggestedFix: 'Adjust artwork dimensions within the physical target; mathematical positions are fixed.' }));
  const stripInner = Math.max(fixedInner, options.inner.tickRadiusMm - 30 * unit * (config.referenceTickFactor ?? 1) - unit * 2);
  const result: ScaleRunResult = {
    kind: 'slide-rule', pluginName: `Citizen Skyhawk JY8078-01L (${CITIZEN_REFERENCE_ID}; photographic reconstruction)`,
    fontSizeMm: font, fontFamily, color: artwork.palette['outer-light-ink'],
    ticks: artwork.ticks, labels, pointers: artwork.pointers,
    substrates: [
      ...(config.outerScaleVisible !== false ? [{ ringId: 'outer' as const, innerRadiusMm: config.bandInnerRadiusMm, outerRadiusMm: config.bandOuterRadiusMm, color: artwork.palette['outer-navy-substrate'] }] : []),
      ...(config.innerScaleVisible !== false ? [
        { ringId: 'inner' as const, innerRadiusMm: fixedInner, outerRadiusMm: stripInner, color: artwork.palette['fixed-blue-numeral-substrate'] },
        { ringId: 'inner' as const, innerRadiusMm: stripInner, outerRadiusMm: fixedOuter, color: artwork.palette['fixed-light-substrate'] }
      ] : [])
    ],
    geometry: { ticks: artwork.ticks, labels },
    validation: { valid: !issues.length, warnings: issues, structuredWarnings }, svg: '', preview: '',
    placementTargetBandId: config.placementTargetBandId, fixedPlacementTargetBandId: config.fixedPlacementTargetBandId,
    physicalTargetsResolved: config.physicalTargetsResolved,
    placementEnvelope: envelope(config.bandInnerRadiusMm, config.bandOuterRadiusMm),
    fixedPlacementEnvelope: envelope(fixedInner, fixedOuter)
  };
  result.svg = resolvedScaleSvg(result, config.bandOuterRadiusMm * 2);
  return result;
};
