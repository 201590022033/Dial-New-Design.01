import { generateCitizenReferenceArtwork, CITIZEN_REFERENCE_ID, type CitizenArtworkOptions } from '@/domain/scales/citizenReferenceArtwork';
import { generateNavitimerReferenceArtwork, NAVITIMER_REFERENCE_ID } from '@/domain/scales/navitimerReferenceArtwork';
import type { ScalePluginConfig, ScaleMathContext, ScaleLabel } from '@/domain/scales/types';
import { resolvedScaleSvg, scaleLabelBoxSize, scaleLabelRotation } from '@/domain/scales/resolvedScaleArtwork';
import type { ScaleRunResult } from './scaleEngineService';

/** Reference proportions adapted to the selected printable annuli, never supplier factory mm. */
export const referenceScaleDefaults = (design: 'citizen' | 'navitimer', config: ScalePluginConfig): Partial<ScalePluginConfig> => {
  const oi = config.bandInnerRadiusMm, oo = config.bandOuterRadiusMm;
  const ii = config.fixedBandInnerRadiusMm ?? oi, io = config.fixedBandOuterRadiusMm ?? oo;
  const navitimer = design === 'navitimer';
  const unit = Math.max(0.0001, Math.min(oo - oi - 0.2, io - ii - 0.2) / (navitimer ? 60 : 115));
  // Arial cap height is about 0.73em; the packet measures ink caps, not em size.
  // Browser glyph bounds below are authoritative; this is a disclosed fallback.
  const font = unit * (navitimer ? 14 : 28) / 0.73;
  return {
    referenceDesign: design, referenceColourMode: 'original', referenceColourOverrides: {},
    referenceDistanceVisible: true, referenceLineFactor: 1, referenceTickFactor: 1,
    referencePixelMm: unit, scaleFontSizeMm: font, fontFamily: 'Arial, sans-serif',
    referenceOuterTickRadiusMm: oi + 0.1 + unit * 4,
    referenceOuterNumeralRadiusMm: oi + 0.1 + unit * (navitimer ? 34 : 57),
    referenceInnerTickRadiusMm: io - 0.1 - unit * 4,
    referenceInnerNumeralRadiusMm: io - 0.1 - unit * (navitimer ? 38 : 59.75),
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

/** Conservative rotated ink-box check; warnings do not alter calibrated positions. */
export const referenceCaptionCollisionWarnings = (labels: ScaleLabel[], fontSizeMm: number): string[] => {
  const box = (label: ScaleLabel) => {
    const size = scaleLabelBoxSize(label, fontSizeMm);
    const angle = label.angleDeg * Math.PI / 180;
    const rotation = scaleLabelRotation(label) * Math.PI / 180;
    const cx = label.radiusMm * Math.sin(angle), cy = -label.radiusMm * Math.cos(angle);
    return ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as const).map(([x, y]) => {
      const px = x * size.width / 2, py = y * size.height / 2;
      return [cx + px * Math.cos(rotation) - py * Math.sin(rotation), cy + px * Math.sin(rotation) + py * Math.cos(rotation)] as const;
    });
  };
  const overlap = (a: ScaleLabel, b: ScaleLabel) => {
    const ap = box(a), bp = box(b);
    for (const polygon of [ap, bp]) for (let i = 0; i < 2; i++) {
      const p = polygon[i]!, q = polygon[i + 1]!;
      const axis = [q[1] - p[1], p[0] - q[0]];
      const av = ap.map(v => v[0] * axis[0]! + v[1] * axis[1]!);
      const bv = bp.map(v => v[0] * axis[0]! + v[1] * axis[1]!);
      if (Math.max(...av) <= Math.min(...bv) || Math.max(...bv) <= Math.min(...av)) return false;
    }
    return true;
  };
  return labels.filter(label => !label.id?.includes('.number.')).flatMap(caption =>
    labels.filter(label => label.id?.includes('.number.') && label.ringId === caption.ringId && overlap(caption, label))
      .map(number => `${caption.ringId} caption ${caption.text} may overlap numeral ${number.text}; inspect 1:1 and adjust the printable ring or caption layout before manufacture.`));
};

export const runReferenceScale = (config: ScalePluginConfig, _context: ScaleMathContext): ScaleRunResult | null => {
  void _context;
  if (config.referenceDesign !== 'citizen' && config.referenceDesign !== 'navitimer') return null;
  const navitimer = config.referenceDesign === 'navitimer';
  const designName = navitimer ? 'Classic Navitimer training disc' : 'Citizen Skyhawk JY8078-01L';
  const defaults = referenceScaleDefaults(config.referenceDesign, config);
  const value = (key: keyof ScalePluginConfig) => (config[key] ?? defaults[key]) as number;
  const font = value('scaleFontSizeMm'), unit = value('referencePixelMm');
  const fixedInner = config.fixedBandInnerRadiusMm ?? config.bandInnerRadiusMm;
  const fixedOuter = config.fixedBandOuterRadiusMm ?? config.bandOuterRadiusMm;
  const fontFamily = config.fontFamily || 'Arial, sans-serif';
  const options: CitizenArtworkOptions = {
    outer: { innerRadiusMm: config.bandInnerRadiusMm, outerRadiusMm: config.bandOuterRadiusMm,
      tickRadiusMm: value('referenceOuterTickRadiusMm'), numeralRadiusMm: value('referenceOuterNumeralRadiusMm'), sourcePixelMm: unit, fontSizeMm: font },
    inner: { innerRadiusMm: fixedInner, outerRadiusMm: fixedOuter,
      tickRadiusMm: value('referenceInnerTickRadiusMm'), numeralRadiusMm: value('referenceInnerNumeralRadiusMm'), sourcePixelMm: unit, fontSizeMm: font * (navitimer ? 0.85 : 18.5 / 28) },
    outerRotationDeg: config.outerRotationOffsetDeg ?? 0,
    colourMode: config.referenceColourMode ?? 'original', colourOverrides: config.referenceColourOverrides,
    outerVisible: config.outerScaleVisible, innerVisible: config.innerScaleVisible,
    distanceVisible: config.referenceDistanceVisible, tickFactor: config.referenceTickFactor,
    lineFactor: config.referenceLineFactor, hoverPaddingMm: config.hoverPaddingMm,
    measureText: fontMeasurer(fontFamily)
  };
  const artwork = navitimer ? generateNavitimerReferenceArtwork(options) : generateCitizenReferenceArtwork(options);
  const palette: Readonly<Record<string, string>> = artwork.palette;
  const ink = (role: string): string => {
    const colour = palette[role];
    if (!colour) throw new Error(`Missing ${designName} colour role: ${role}`);
    return colour;
  };
  const envelope = (innerRadiusMm: number, outerRadiusMm: number) => ({ innerRadiusMm, outerRadiusMm, contentOuterRadiusMm: outerRadiusMm - 0.08, safetyMarginMm: 0.08 });
  const issues = [...artwork.validation.issues];
  // Both physical targets are required; fallback envelopes are preview-only, never export approval.
  if (!config.fixedPlacementTargetBandId || config.fixedBandOuterRadiusMm === undefined)
    issues.push(`${designName} requires an independently bound fixed calculation ring.`);
  const labels = artwork.labels.filter((label) => !label.id.includes('.number.') ||
    (label.ringId === 'inner' ? config.innerNumeralsVisible !== false : config.outerNumeralsVisible !== false));
  const readabilityWarnings: string[] = [];
  // Adapt caption radius only when real glyph boxes collide. Logarithmic angular
  // anchors, calibrated values, numerals and graduations remain untouched.
  for (let index = 0; index < labels.length; index++) {
    const caption = labels[index]!;
    if (caption.id?.includes('.number.') || !referenceCaptionCollisionWarnings([caption, ...labels.filter(label => label.id?.includes('.number.'))], font).length) continue;
    const inner = caption.ringId === 'inner' ? fixedInner : config.bandInnerRadiusMm;
    const outer = caption.ringId === 'inner' ? fixedOuter : config.bandOuterRadiusMm;
    const fits = (candidate: ScaleLabel) => {
      const size = scaleLabelBoxSize(candidate, font), angle = candidate.angleDeg * Math.PI / 180;
      const rotation = scaleLabelRotation(candidate) * Math.PI / 180;
      const cx = candidate.radiusMm * Math.sin(angle), cy = -candidate.radiusMm * Math.cos(angle);
      const localX = cx * Math.cos(rotation) + cy * Math.sin(rotation);
      const localY = -cx * Math.sin(rotation) + cy * Math.cos(rotation);
      const nearestRadius = Math.hypot(Math.max(0, Math.abs(localX) - size.width / 2), Math.max(0, Math.abs(localY) - size.height / 2));
      return nearestRadius >= inner + .08 && ([-1, 1] as const).every(sx => ([-1, 1] as const).every(sy => {
        const x = sx * size.width / 2, y = sy * size.height / 2;
        const r = Math.hypot(cx + x * Math.cos(rotation) - y * Math.sin(rotation), cy + x * Math.sin(rotation) + y * Math.cos(rotation));
        return r >= inner + .08 && r <= outer - .08;
      })) && !referenceCaptionCollisionWarnings([candidate, ...labels.filter(label => label.id?.includes('.number.'))], font).length;
    };
    let adapted: typeof caption | undefined;
    for (let step = 1; step <= Math.ceil((outer - inner) / .05) && !adapted; step++)
      for (const direction of [-1, 1]) {
        const candidate = { ...caption, radiusMm: caption.radiusMm + direction * step * .05 };
        if (fits(candidate)) { adapted = candidate; break; }
      }
    if (adapted) {
      labels[index] = adapted;
      readabilityWarnings.push(`${caption.text} caption moved radially ${(adapted.radiusMm - caption.radiusMm).toFixed(2)} mm to avoid ink collision; its calibrated angular anchor is unchanged.`);
    } else issues.push(`${caption.text} caption cannot avoid numeral collision within its physical annulus; choose wider hardware or a simpler design before exporting.`);
  }
  const minimumFont = labels.length ? Math.min(...labels.map((label) => label.fontSizeMm)) : Infinity;
  // A fit-only adaptation can shrink all artwork into an invisible surface.
  // This is a practical production safeguard, not an original-font fidelity gate.
  if (minimumFont < .1) issues.push(`Scale text is microscopic (${minimumFont.toFixed(3)} mm font size, below the 0.10 mm safety floor). Use a wider printable ring or a simpler design; export is refused.`);
  const profileTextSize = Math.max(.1, (config.minimumLineWidthMm ?? .1) * 3);
  if (minimumFont >= .1 && minimumFont < profileTextSize)
    readabilityWarnings.push(`Scale text is ${minimumFont.toFixed(3)} mm; the selected minimum-line profile suggests at least ${profileTextSize.toFixed(2)} mm font size (three times its line feature). Verify readability and material/laser tests at 1:1.`);
  readabilityWarnings.push(...referenceCaptionCollisionWarnings(labels, font));
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
  const allWarnings = [...structuredWarnings, ...readabilityWarnings.map((description) => ({ severity: 'warning' as const, description, affectedObject: 'reference-scale', suggestedFix: 'Check 1:1 readability and make a material/laser test, or choose a wider physical ring.' }))];
  const stripInner = Math.max(fixedInner, options.inner.tickRadiusMm - 30 * unit * (config.referenceTickFactor ?? 1) - unit * 2);
  const result: ScaleRunResult = {
    kind: 'slide-rule', pluginName: `${designName} (${navitimer ? NAVITIMER_REFERENCE_ID : CITIZEN_REFERENCE_ID}; photographic reconstruction)`,
    fontSizeMm: font, fontFamily, color: ink(navitimer ? 'black-ink' : 'outer-light-ink'),
    ticks: artwork.ticks, labels, pointers: artwork.pointers,
    substrates: navitimer ? [
      ...(config.outerScaleVisible !== false ? [{ ringId: 'outer' as const, innerRadiusMm: config.bandInnerRadiusMm, outerRadiusMm: config.bandOuterRadiusMm, color: ink('outer-light-substrate') }] : []),
      ...(config.innerScaleVisible !== false ? [{ ringId: 'inner' as const, innerRadiusMm: fixedInner, outerRadiusMm: fixedOuter, color: ink('fixed-light-substrate') }] : [])
    ] : [
      ...(config.outerScaleVisible !== false ? [{ ringId: 'outer' as const, innerRadiusMm: config.bandInnerRadiusMm, outerRadiusMm: config.bandOuterRadiusMm, color: ink('outer-navy-substrate') }] : []),
      ...(config.innerScaleVisible !== false ? [
        { ringId: 'inner' as const, innerRadiusMm: fixedInner, outerRadiusMm: stripInner, color: ink('fixed-blue-numeral-substrate') },
        { ringId: 'inner' as const, innerRadiusMm: stripInner, outerRadiusMm: fixedOuter, color: ink('fixed-light-substrate') }
      ] : [])
    ],
    geometry: { ticks: artwork.ticks, labels },
    validation: { valid: !issues.length, warnings: [...issues, ...readabilityWarnings], structuredWarnings: allWarnings }, svg: '', preview: '',
    placementTargetBandId: config.placementTargetBandId, fixedPlacementTargetBandId: config.fixedPlacementTargetBandId,
    physicalTargetsResolved: config.physicalTargetsResolved,
    placementEnvelope: envelope(config.bandInnerRadiusMm, config.bandOuterRadiusMm),
    fixedPlacementEnvelope: envelope(fixedInner, fixedOuter)
  };
  result.svg = resolvedScaleSvg(result, config.bandOuterRadiusMm * 2);
  return result;
};
