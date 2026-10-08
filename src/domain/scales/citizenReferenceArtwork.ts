import { KM_PER_NAUTICAL_MILE, KM_PER_STATUTE_MILE, logDecadeAngle } from './calibratedSlideRule';
import type { ScaleLabel, ScalePointer, ScaleTick } from './types';

export const CITIZEN_REFERENCE_ID = 'citizen-jy8078-01l-2026-10-07';
export const CITIZEN_UNIT_ORIGIN_DEG = 360 - 360 * Math.log10(6);
/** Photographic medians, NOT factory ink specifications. Original colours stay immutable. */
export const CITIZEN_PALETTE = Object.freeze({
  'outer-light-ink': '#F9FBFE', 'outer-navy-substrate': '#111C2D',
  'fixed-black-tick': '#1C1C1B', 'inner-unit-yellow-box': '#DEBE34',
  'km-yellow-pointer': '#EEE044', 'naut-red-pointer': '#CA2128',
  'stat-red-pointer': '#D12128', 'fixed-blue-numeral-substrate': '#0D233C',
  'fixed-light-substrate': '#FEFFFE', 'inner-light-ink': '#F0F6FC',
  'outer-unit-dark-ink': '#070A0F', 'inner-unit-dark-ink': '#140E00'
});
type ColourRole = keyof typeof CITIZEN_PALETTE;
type Row = 'outer' | 'inner';
type TickClass = 'major' | 'minor' | 'intermediate' | 'reference' | 'reference-clearance';
const profiles = {
  'outer-long': [35.5, 8], 'outer-medium': [24.5, 4], 'outer-dense-short': [17, 3.5],
  'outer-reference-60': [31, 32], 'inner-long': [27.5, 7],
  'inner-half-unit-long': [27, 4], 'inner-intermediate': [18.5, 3], 'inner-short': [12, 2.5],
  'inner-unit-seam': [25.5, 7], 'inner-radio-shortened': [7, 2.5],
  'inner-radio-shortened-50': [9, 7], 'inner-radio-shortened-60': [9, 6.5]
} as const;
type Profile = keyof typeof profiles;
export interface CitizenGraduation {
  id: string; row: Row; value: number; angleDeg: number; printedText: string | null;
  tickClass: TickClass; profileId: Profile; colourRole: ColourRole;
  geometry: 'radial-line' | 'solid-inward-triangle' | 'shortened-square-or-rectangle';
  direction: 'outward' | 'inward';
}
export interface CitizenRowLayout {
  innerRadiusMm: number; outerRadiusMm: number;
  tickRadiusMm: number; numeralRadiusMm: number;
  /** Explicit photographic reconstruction scale; no source-to-factory-mm claim. */
  sourcePixelMm: number;
  fontSizeMm: number;
}
export interface CitizenArtworkOptions {
  outer: CitizenRowLayout; inner: CitizenRowLayout;
  outerRotationDeg?: number; colourMode?: 'original' | 'custom';
  colourOverrides?: Partial<Record<ColourRole, string>>;
  outerVisible?: boolean; innerVisible?: boolean; distanceVisible?: boolean;
  safetyMarginMm?: number;
  tickFactor?: number;
  lineFactor?: number;
  hoverPaddingMm?: number;
  /** Actual substitute-font bounds preferred; omission uses a conservative estimate. */
  measureText?: (text: string, fontSizeMm: number) => { width: number; height: number };
}
export interface CitizenArtworkLabel extends ScaleLabel {
  id: string; ringId: Row; fontSizeMm: number; colourRole: ColourRole;
  backgroundColour?: string; backgroundPaddingMm?: number;
}
export interface CitizenArtwork {
  referenceId: typeof CITIZEN_REFERENCE_ID;
  evidence: 'photographic-reconstruction-not-factory-exact';
  graduations: CitizenGraduation[];
  ticks: ScaleTick[]; labels: CitizenArtworkLabel[]; pointers: ScalePointer[];
  palette: Readonly<Record<ColourRole, string>>;
  validation: { valid: boolean; issues: string[]; boundsEvidence: 'browser-measured' | 'estimated' };
}

const values = (): number[] => ([[100, 150, 1], [150, 300, 2], [300, 600, 5], [600, 1000, 10]] as const)
  .flatMap(([start, end, step]) => Array.from({ length: (end - start) / step }, (_, i) => (start + i * step) / 10));
const numbered = (v: number) => Number.isInteger(v) && (v <= 25 || [30, 35, 40, 45, 50, 55, 60, 70, 80, 90].includes(v));

const classify = (row: Row, v: number): [Profile, TickClass] => {
  if (row === 'outer') {
    if (v === 60) return ['outer-reference-60', 'reference'];
    if ((v < 15 && Number.isInteger(v * 2)) || (Number.isInteger(v) && (v <= 25 || v % 5 === 0))) return ['outer-long', 'major'];
    if (!Number.isInteger(v) && v >= 25) return ['outer-dense-short', 'minor'];
    return ['outer-medium', Number.isInteger(v) && v > 25 && v < 60 ? 'intermediate' : 'minor'];
  }
  if (v === 10) return ['inner-unit-seam', 'major'];
  if ([49, 49.5, 59, 59.5, 61].includes(v)) return ['inner-radio-shortened', 'reference-clearance'];
  if (v === 50 || v === 60) return [`inner-radio-shortened-${v}`, 'reference-clearance'];
  if (v < 15 && !Number.isInteger(v) && Number.isInteger(v * 2)) return ['inner-half-unit-long', 'intermediate'];
  if (Number.isInteger(v) && (v <= 25 || v % 5 === 0)) return ['inner-long', 'major'];
  if (Number.isInteger(v) && v < 60) return ['inner-intermediate', 'intermediate'];
  return ['inner-short', 'minor'];
};

/** Compact runtime inventory. Research JSON/images are intentionally not application dependencies. */
export const citizenGraduations = (outerRotationDeg = 0): CitizenGraduation[] => {
  if (!Number.isFinite(outerRotationDeg)) throw new Error('Citizen rotation must be finite.');
  return (['outer', 'inner'] as const).flatMap((row) => values().map((value) => {
    const [profileId, tickClass] = classify(row, value);
    return {
      id: `${CITIZEN_REFERENCE_ID}.${row}.tick.${value}`, row, value,
      angleDeg: logDecadeAngle(value, CITIZEN_UNIT_ORIGIN_DEG + (row === 'outer' ? outerRotationDeg : 0)),
      printedText: numbered(value) && !(row === 'inner' && value === 60) ? String(value) : null,
      tickClass, profileId, colourRole: row === 'outer' ? 'outer-light-ink' : 'fixed-black-tick',
      geometry: row === 'outer' && value === 60 ? 'solid-inward-triangle'
        : row === 'inner' && (value === 50 || value === 60) ? 'shortened-square-or-rectangle' : 'radial-line',
      direction: row === 'outer' && value !== 60 ? 'outward' : 'inward'
    };
  }));
};

/** Render-ready geometry stage only; preset/state/export adapters remain gated until acceptance. */
export const generateCitizenReferenceArtwork = (options: CitizenArtworkOptions): CitizenArtwork => {
  const margin = options.safetyMarginMm ?? 0.08;
  const tickFactor = options.tickFactor ?? 1, lineFactor = options.lineFactor ?? 1, hover = options.hoverPaddingMm ?? 0;
  if (![tickFactor, lineFactor, hover].every(Number.isFinite) || tickFactor <= 0 || lineFactor <= 0 || hover < 0)
    throw new Error('Invalid Citizen stroke or hover dimensions.');
  if (!Number.isFinite(margin) || margin < 0) throw new Error('Citizen margin must be finite and non-negative.');
  for (const row of ['outer', 'inner'] as const) {
    const layout = options[row];
    if (Object.values(layout).some((n) => !Number.isFinite(n)) || layout.innerRadiusMm < 0 ||
      layout.outerRadiusMm <= layout.innerRadiusMm || layout.sourcePixelMm <= 0 || layout.fontSizeMm <= 0 ||
      layout.tickRadiusMm < 0 || layout.numeralRadiusMm < 0) throw new Error(`Invalid Citizen ${row} layout.`);
  }
  const palette: Record<ColourRole, string> = { ...CITIZEN_PALETTE };
  if (options.colourMode === 'custom') for (const role of Object.keys(CITIZEN_PALETTE) as ColourRole[]) {
    const hex = options.colourOverrides?.[role];
    if (hex !== undefined) {
      if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`Invalid Citizen colour for ${role}.`);
      palette[role] = hex;
    }
  }
  const graduations = citizenGraduations(options.outerRotationDeg);
  const ticks: ScaleTick[] = [], labels: CitizenArtworkLabel[] = [], pointers: ScalePointer[] = [];
  const issues: string[] = [];
  const visible = (row: Row) => row === 'outer' ? options.outerVisible !== false : options.innerVisible !== false;
  // Strict envelope assertion: never repair an overfull reference by moving individual marks.
  const checkBounds = (id: string, row: Row, min: number, max: number) => {
    if (min < options[row].innerRadiusMm + margin || max > options[row].outerRadiusMm - margin)
      issues.push(`${id} exceeds the ${row} physical annulus; enlarge it or reduce artwork dimensions.`);
  };
  const addLabel = (row: Row, value: number, text: string, id: string, role: ColourRole, radiusMm = options[row].numeralRadiusMm, boxed = false) => {
    const fontSizeMm = options[row].fontSizeMm;
    const bounds = options.measureText?.(text, fontSizeMm) ?? { width: text.length * fontSizeMm * 0.7, height: fontSizeMm * 1.2 };
    if (!Number.isFinite(bounds.width) || !Number.isFinite(bounds.height) || bounds.width <= 0 || bounds.height <= 0)
      throw new Error(`Invalid Citizen glyph bounds for ${id}.`);
    const padding = boxed ? options[row].sourcePixelMm * 3 : 0;
    const h = bounds.height / 2 + padding + hover, w = bounds.width / 2 + padding + hover;
    checkBounds(id, row, radiusMm - h, Math.hypot(radiusMm + h, w));
    labels.push({ id, ringId: row, text, value, radiusMm,
      angleDeg: logDecadeAngle(value, CITIZEN_UNIT_ORIGIN_DEG + (row === 'outer' ? options.outerRotationDeg ?? 0 : 0)),
      orientation: 'radial', rotationDeg: 0, placement: row === 'outer' ? 'outside' : 'inside',
      fontSizeMm, colourRole: role, color: palette[role], boundsMm: bounds, hoverPaddingMm: hover,
      boundsEvidence: options.measureText ? 'browser-measured' : 'estimated',
      ...(boxed ? { backgroundColour: palette[row === 'outer' ? 'outer-light-ink' : 'inner-unit-yellow-box'], backgroundPaddingMm: padding } : {})
    });
  };
  for (const g of graduations) {
    if (!visible(g.row)) continue;
    const layout = options[g.row], [lengthPx, widthPx] = profiles[g.profileId];
    const lengthMm = lengthPx * layout.sourcePixelMm * tickFactor, widthMm = widthPx * layout.sourcePixelMm * lineFactor;
    if (g.geometry !== 'solid-inward-triangle') {
      const end = layout.tickRadiusMm + (g.row === 'outer' ? lengthMm : -lengthMm);
      checkBounds(g.id, g.row, Math.min(layout.tickRadiusMm, end) - widthMm / 2 - hover, Math.max(layout.tickRadiusMm, end) + widthMm / 2 + hover);
      ticks.push({ id: g.id, value: g.value, ringId: g.row, angleDeg: g.angleDeg, radiusMm: layout.tickRadiusMm,
        lengthMm, widthMm, hoverPaddingMm: hover, color: palette[g.colourRole], weight: g.tickClass === 'major' ? 'major' : 'minor',
        direction: g.row === 'outer' ? 'outside' : 'inside',
        style: g.geometry === 'shortened-square-or-rectangle' ? 'block' : 'line', tier: 'primary' });
    }
    if (g.printedText) addLabel(g.row, g.value, g.printedText, `${CITIZEN_REFERENCE_ID}.${g.row}.number.${g.value}`,
      g.value === 10 ? `${g.row}-unit-dark-ink` : g.row === 'outer' ? 'outer-light-ink' : 'inner-light-ink', layout.numeralRadiusMm, g.value === 10);
  }
  const km = 61.05560505168395;
  const references: { role: string; row: Row; value: number; caption: string; ink: ColourRole; width: number; height: number; hollow?: boolean }[] = [
    { role: 'hour-rate', row: 'inner', value: 60, caption: '', ink: 'inner-light-ink', width: 43, height: 17, hollow: true },
    { role: 'distance-km', row: 'inner', value: km, caption: 'KM.', ink: 'km-yellow-pointer', width: 10, height: 7 },
    { role: 'distance-naut', row: 'inner', value: km / KM_PER_NAUTICAL_MILE, caption: 'NAUT.', ink: 'naut-red-pointer', width: 20, height: 21 },
    { role: 'distance-stat', row: 'inner', value: km / KM_PER_STATUTE_MILE, caption: 'STAT.', ink: 'stat-red-pointer', width: 22, height: 22 },
    { role: '60', row: 'outer', value: 60, caption: '', ink: 'outer-light-ink', width: 32, height: 31 }
  ];
  for (const ref of references) {
    if (!visible(ref.row) || (ref.caption && options.distanceVisible === false)) continue;
    const layout = options[ref.row], unit = layout.sourcePixelMm;
    const id = `${CITIZEN_REFERENCE_ID}.${ref.row === 'outer' ? 'outer' : 'fixed'}.reference.${ref.role}`;
    // Outer 60 owns the physical graduation; fixed pointers occupy the inner numeral row.
    const radiusMm = ref.row === 'outer' ? layout.tickRadiusMm + ref.height * unit / 2 : layout.numeralRadiusMm;
    const widthMm = ref.width * unit, heightMm = ref.height * unit, strokeWidthMm = ref.hollow ? 2 * unit * lineFactor : 0;
    const inward = ref.hollow || ref.row === 'outer';
    const vertexRadii = [radiusMm + (inward ? -heightMm / 2 : heightMm / 2),
      Math.hypot(radiusMm + (inward ? heightMm / 2 : -heightMm / 2), widthMm / 2)];
    checkBounds(id, ref.row, Math.min(...vertexRadii) - strokeWidthMm / 2 - hover,
      Math.max(...vertexRadii) + strokeWidthMm / 2 + hover);
    pointers.push({ id, ringId: ref.row, value: ref.value, radiusMm, widthMm, heightMm, strokeWidthMm, hoverPaddingMm: hover,
      angleDeg: logDecadeAngle(ref.value, CITIZEN_UNIT_ORIGIN_DEG + (ref.row === 'outer' ? options.outerRotationDeg ?? 0 : 0)),
      shape: 'triangle', rotationDeg: ref.hollow || ref.row === 'outer' ? 180 : 0,
      color: ref.hollow ? 'none' : palette[ref.ink], strokeColor: palette[ref.ink],
      ...(ref.caption ? { dedicatedConversion: 'distance' as const } : {}) });
    if (ref.caption) {
      const kmCaption = ref.role === 'distance-km';
      addLabel(ref.row, ref.value, ref.caption, `${id}.caption`, 'inner-light-ink',
        kmCaption ? radiusMm : radiusMm - heightMm / 2 - layout.fontSizeMm);
      if (kmCaption) {
        // Native photograph places KM lettering alongside (clockwise from) its
        // yellow pointer, not below the blue numeral row. This reconstructed
        // text-run gap changes only typography; the calibrated pointer stays fixed.
        const label = labels.at(-1)!;
        label.angleDeg = (label.angleDeg + ((label.boundsMm?.width ?? 0) / 2 + widthMm / 2 + 4 * unit) / radiusMm * 180 / Math.PI) % 360;
      }
    }
  }
  return { referenceId: CITIZEN_REFERENCE_ID, evidence: 'photographic-reconstruction-not-factory-exact',
    graduations, ticks, labels, pointers, palette: Object.freeze(palette),
    validation: { valid: issues.length === 0, issues, boundsEvidence: options.measureText ? 'browser-measured' : 'estimated' } };
};
