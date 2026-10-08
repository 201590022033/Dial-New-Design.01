import { KM_PER_NAUTICAL_MILE, KM_PER_STATUTE_MILE, logDecadeAngle } from './calibratedSlideRule';
import type { CitizenRowLayout } from './citizenReferenceArtwork';
import type { ScaleLabel, ScalePointer, ScaleTick } from './types';

export const NAVITIMER_REFERENCE_ID = 'navitimer-booklet-training-disc-2026-10-07';
export const NAVITIMER_UNIT_ORIGIN_DEG = 360 - 360 * Math.log10(6);
/** Raw scan approximations, not calibrated factory inks. Unsampled reds are explicit substitutions. */
export const NAVITIMER_PALETTE = Object.freeze({
  'black-ink': '#3D2826', 'mph-black-pointer': '#2E1A1A', 'mph-black-caption': '#3C2623',
  'inner-unit-red': '#B01422', 'outer-unit-red': '#A4353C', 'outer-rate-red': '#C53F45',
  'km-red-pointer': '#C12529', 'km-black-caption': '#362022',
  'naut-red-pointer': '#C10F1B', 'naut-black-caption': '#241517',
  'stat-red-pointer': '#C9131E', 'stat-black-caption': '#281215',
  'seconds-red-pointer': '#C12529', 'outer-reference-red': '#C12529',
  'outer-light-substrate': '#C2B3AC', 'fixed-light-substrate': '#BEAEA6'
});
type ColourRole = keyof typeof NAVITIMER_PALETTE;
type Row = 'outer' | 'inner';
export type NavitimerRowLayout = CitizenRowLayout;
export interface NavitimerArtworkOptions {
  outer: NavitimerRowLayout; inner: NavitimerRowLayout;
  outerRotationDeg?: number; colourMode?: 'original' | 'custom';
  colourOverrides?: Partial<Record<ColourRole, string>>;
  outerVisible?: boolean; innerVisible?: boolean; distanceVisible?: boolean;
  safetyMarginMm?: number; tickFactor?: number; lineFactor?: number; hoverPaddingMm?: number;
  measureText?: (text: string, fontSizeMm: number) => { width: number; height: number };
}
const profiles = {
  'outer-major': [9.5, 3.75], 'outer-intermediate': [10, 2.25], 'outer-minor': [5.5, 1.85],
  'inner-major': [16.5, 3], 'inner-intermediate': [15, 1.75], 'inner-minor': [12, 1.5]
} as const;
type Profile = keyof typeof profiles | 'inner-unit-footprint' | 'inner-rate-footprint';
export interface NavitimerGraduation {
  id: string; row: Row; group: 'rotating' | 'fixed'; value: number; angleDeg: number;
  printedText: string | null; tickClass: 'major' | 'intermediate' | 'minor'; profileId: Profile;
  geometry: 'radial-line' | 'composite-reference-footprint' | 'solid-outward-triangle';
  colourRole: ColourRole; direction: 'inward' | 'outward'; referencePointerRole: string | null;
  underlyingLineVisibility: string | null;
}
export interface NavitimerArtworkLabel extends ScaleLabel {
  id: string; ringId: Row; fontSizeMm: number; colourRole: ColourRole;
}
export interface NavitimerArtwork {
  referenceId: typeof NAVITIMER_REFERENCE_ID;
  evidence: 'photographic-reconstruction-not-factory-exact';
  limitations: readonly string[];
  distanceAnchor: { nominalKmValue: number; sourceFittedKmValue: number; uncertainty: number };
  graduations: NavitimerGraduation[]; ticks: ScaleTick[]; labels: NavitimerArtworkLabel[];
  pointers: ScalePointer[]; palette: Readonly<Record<ColourRole, string>>;
  validation: { valid: boolean; issues: string[]; boundsEvidence: 'browser-measured' | 'estimated' };
}
const values = () => ([[100, 150, 1], [150, 250, 2], [250, 600, 5], [600, 1000, 10]] as const)
  .flatMap(([start, end, step]) => Array.from({ length: (end - start) / step }, (_, i) => (start + i * step) / 10));
const major = (v: number) => Number.isInteger(v) && (v <= 25 || v % 5 === 0);
const printed = (row: Row, v: number) => row === 'outer' ? major(v) ? String(v) : null
  : Number.isInteger(v) && (v <= 25 || [30, 35, 40, 45, 50, 55, 70, 80, 90].includes(v)) ? String(v >= 70 ? v / 10 : v) : null;

/** Independent 210-position schedule, never borrowed from the Citizen 225-position inventory. */
export const navitimerGraduations = (outerRotationDeg = 0): NavitimerGraduation[] => {
  if (!Number.isFinite(outerRotationDeg)) throw new Error('Navitimer rotation must be finite.');
  return (['outer', 'inner'] as const).flatMap((row) => values().map((value) => {
    const tickClass = major(value) ? 'major' : Number.isInteger(value) && value > 25 && value < 60 ? 'intermediate' : 'minor';
    const special = value === 10 || value === 60;
    return {
      id: `${NAVITIMER_REFERENCE_ID}.${row}.tick.${value}`, row, group: row === 'outer' ? 'rotating' : 'fixed', value,
      angleDeg: logDecadeAngle(value, NAVITIMER_UNIT_ORIGIN_DEG + (row === 'outer' ? outerRotationDeg : 0)),
      printedText: printed(row, value), tickClass,
      profileId: row === 'inner' && special ? value === 10 ? 'inner-unit-footprint' : 'inner-rate-footprint' : `${row}-${tickClass}`,
      geometry: special ? row === 'outer' ? 'composite-reference-footprint' : 'solid-outward-triangle' : 'radial-line',
      colourRole: row === 'inner' && value === 10 ? 'inner-unit-red' : 'black-ink',
      direction: row === 'outer' || special ? 'outward' : 'inward',
      referencePointerRole: special ? row === 'outer' ? value === 10 ? 'outer-unit' : 'outer-rate' : value === 10 ? 'inner-unit' : 'hour-rate' : null,
      underlyingLineVisibility: special ? row === 'outer'
        ? 'Unresolved under red pointer; retain source footprint without claiming a factory stroke omission.' : 'No separate black main stroke observed.' : null
    };
  }));
};

/** Disclosed source footprints in native pixels; not orthographic engineering dimensions. */
const references: { role: string; row: Row; value: number; caption?: string; ink: ColourRole; text?: ColourRole; width: number; height: number }[] = [
  { role: 'inner-unit', row: 'inner', value: 10, ink: 'inner-unit-red', width: 14, height: 13 },
  { role: 'hour-rate', row: 'inner', value: 60, caption: 'MPH', ink: 'mph-black-pointer', text: 'mph-black-caption', width: 5, height: 11 },
  { role: 'seconds', row: 'inner', value: 36, ink: 'seconds-red-pointer', width: 11, height: 13 },
  { role: 'distance-km', row: 'inner', value: 61, caption: 'KM', ink: 'km-red-pointer', text: 'km-black-caption', width: 7, height: 11 },
  { role: 'distance-naut', row: 'inner', value: 61 / KM_PER_NAUTICAL_MILE, caption: 'NAUT.', ink: 'naut-red-pointer', text: 'naut-black-caption', width: 13, height: 14 },
  { role: 'distance-stat', row: 'inner', value: 61 / KM_PER_STATUTE_MILE, caption: 'STAT.', ink: 'stat-red-pointer', text: 'stat-black-caption', width: 14, height: 10 },
  { role: 'outer-unit', row: 'outer', value: 10, ink: 'outer-unit-red', width: 7, height: 8 },
  { role: 'outer-rate', row: 'outer', value: 60, ink: 'outer-rate-red', width: 13, height: 9 },
  { role: 'outer-unlabelled-reference', row: 'outer', value: 36, ink: 'outer-reference-red', width: 13, height: 8 }
];

export const generateNavitimerReferenceArtwork = (options: NavitimerArtworkOptions): NavitimerArtwork => {
  const margin = options.safetyMarginMm ?? 0.08, tickFactor = options.tickFactor ?? 1;
  const lineFactor = options.lineFactor ?? 1, hover = options.hoverPaddingMm ?? 0;
  if (![margin, tickFactor, lineFactor, hover].every(Number.isFinite) || margin < 0 || tickFactor <= 0 || lineFactor <= 0 || hover < 0)
    throw new Error('Invalid Navitimer stroke, margin or hover dimensions.');
  for (const row of ['outer', 'inner'] as const) {
    const layout = options[row];
    if (Object.values(layout).some((n) => !Number.isFinite(n)) || layout.innerRadiusMm < 0 ||
      layout.outerRadiusMm <= layout.innerRadiusMm || layout.sourcePixelMm <= 0 || layout.fontSizeMm <= 0 ||
      layout.tickRadiusMm < 0 || layout.numeralRadiusMm < 0) throw new Error(`Invalid Navitimer ${row} layout.`);
  }
  const palette: Record<ColourRole, string> = { ...NAVITIMER_PALETTE };
  if (options.colourMode === 'custom') for (const role of Object.keys(palette) as ColourRole[]) {
    const hex = options.colourOverrides?.[role];
    if (hex !== undefined) {
      if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`Invalid Navitimer colour for ${role}.`);
      palette[role] = hex;
    }
  }
  const graduations = navitimerGraduations(options.outerRotationDeg);
  const ticks: ScaleTick[] = [], labels: NavitimerArtworkLabel[] = [], pointers: ScalePointer[] = [], issues: string[] = [];
  const visible = (row: Row) => row === 'outer' ? options.outerVisible !== false : options.innerVisible !== false;
  const angle = (row: Row, value: number) => logDecadeAngle(value, NAVITIMER_UNIT_ORIGIN_DEG + (row === 'outer' ? options.outerRotationDeg ?? 0 : 0));
  const check = (id: string, row: Row, min: number, max: number) => {
    if (min < options[row].innerRadiusMm + margin || max > options[row].outerRadiusMm - margin)
      issues.push(`${id} exceeds the ${row} physical annulus; enlarge it or reduce artwork dimensions.`);
  };
  const addLabel = (row: Row, value: number, text: string, id: string, role: ColourRole, radiusMm = options[row].numeralRadiusMm, fontSizeMm = options[row].fontSizeMm) => {
    const bounds = options.measureText?.(text, fontSizeMm) ?? { width: text.length * fontSizeMm * 0.7, height: fontSizeMm * 1.2 };
    if (![bounds.width, bounds.height].every(Number.isFinite) || bounds.width <= 0 || bounds.height <= 0) throw new Error(`Invalid Navitimer glyph bounds for ${id}.`);
    const h = bounds.height / 2 + hover, w = bounds.width / 2 + hover;
    check(id, row, radiusMm - h, Math.hypot(radiusMm + h, w));
    const label: NavitimerArtworkLabel = { id, ringId: row, text, value, radiusMm, angleDeg: angle(row, value), orientation: 'radial', rotationDeg: 0,
      placement: row === 'outer' ? 'outside' : 'inside', fontSizeMm, colourRole: role, color: palette[role],
      boundsMm: bounds, hoverPaddingMm: hover, boundsEvidence: options.measureText ? 'browser-measured' : 'estimated' };
    labels.push(label);
    return label;
  };
  for (const g of graduations) {
    if (!visible(g.row)) continue;
    const layout = options[g.row];
    // Composite stations are represented by their red footprint once; hidden black underlays stay explicitly unresolved.
    if (g.geometry === 'radial-line') {
      const [lengthPx, widthPx] = profiles[g.profileId as keyof typeof profiles];
      const lengthMm = lengthPx * layout.sourcePixelMm * tickFactor, widthMm = widthPx * layout.sourcePixelMm * lineFactor;
      const end = layout.tickRadiusMm + (g.row === 'outer' ? lengthMm : -lengthMm);
      check(g.id, g.row, Math.min(layout.tickRadiusMm, end) - widthMm / 2 - hover, Math.max(layout.tickRadiusMm, end) + widthMm / 2 + hover);
      ticks.push({ id: g.id, value: g.value, ringId: g.row, angleDeg: g.angleDeg, radiusMm: layout.tickRadiusMm, lengthMm, widthMm,
        color: palette[g.colourRole], hoverPaddingMm: hover, direction: g.row === 'outer' ? 'outside' : 'inside',
        weight: g.tickClass === 'major' ? 'major' : 'minor', style: 'line', tier: 'primary' });
    }
    if (g.printedText) addLabel(g.row, g.value, g.printedText, `${NAVITIMER_REFERENCE_ID}.${g.row}.number.${g.value}`,
      g.value === 10 ? `${g.row}-unit-red` : g.row === 'outer' && g.value === 60 ? 'outer-rate-red' : 'black-ink');
  }
  for (const ref of references) {
    if (!visible(ref.row) || (ref.role.startsWith('distance-') && options.distanceVisible === false)) continue;
    const layout = options[ref.row], unit = layout.sourcePixelMm, inward = ref.row === 'outer';
    const id = `${NAVITIMER_REFERENCE_ID}.${inward ? 'rotating' : 'fixed'}.reference.${ref.role}`;
    const widthMm = ref.width * unit * lineFactor, heightMm = ref.height * unit * tickFactor;
    // Reference footprints meet the common graduation boundary; captions remain in the separate numeral row.
    const radiusMm = layout.tickRadiusMm + (inward ? heightMm / 2 : -heightMm / 2);
    const radii = [radiusMm + (inward ? -heightMm / 2 : heightMm / 2),
      Math.hypot(radiusMm + (inward ? heightMm / 2 : -heightMm / 2), widthMm / 2)];
    check(id, ref.row, Math.min(...radii) - hover, Math.max(...radii) + hover);
    pointers.push({ id, value: ref.value, ringId: ref.row, radiusMm, widthMm, heightMm, strokeWidthMm: 0, hoverPaddingMm: hover,
      angleDeg: angle(ref.row, ref.value), shape: 'triangle', rotationDeg: inward ? 180 : 0,
      color: palette[ref.ink], strokeColor: palette[ref.ink], ...(ref.role.startsWith('distance-') ? { dedicatedConversion: 'distance' as const } : {}) });
    if (ref.caption && ref.text) {
      // Caption metrics are a disclosed substitute-font reconstruction, not factory cap heights.
      const label = addLabel(ref.row, ref.value, ref.caption, `${id}.caption`, ref.text, layout.numeralRadiusMm, layout.fontSizeMm * 0.65);
      if (ref.role === 'distance-km') {
        const mph = labels.find((entry) => entry.text === 'MPH');
        if (mph) {
          // Source KM lettering sits clockwise beside MPH. Move only its glyph-run centre,
          // never the calibrated pointer or numerical graduation; full tangent bounds set the gap.
          const halfAngle = (entry: NavitimerArtworkLabel) => Math.atan2((entry.boundsMm!.width / 2 + hover),
            Math.max(0.001, entry.radiusMm - entry.boundsMm!.height / 2 - hover)) * 180 / Math.PI;
          const required = halfAngle(mph) + halfAngle(label) + 0.06 / layout.numeralRadiusMm * 180 / Math.PI;
          const delta = (label.angleDeg - mph.angleDeg + 360) % 360;
          label.angleDeg = (mph.angleDeg + Math.max(delta, required)) % 360;
        }
      }
    }
  }
  return { referenceId: NAVITIMER_REFERENCE_ID, evidence: 'photographic-reconstruction-not-factory-exact',
    limitations: ['Outer10/60 black underlays unresolved; composite footprints retained once.',
      'Seconds and unlabelled outer-reference red use an explicit KM-red substitution; divider ink unverified.',
      'Native low-resolution skewed scan does not establish factory fonts, exact inks or physical print dimensions.',
      'Outer unlabelled reference is compatible with36; no operational purpose or caption invented.',
      'Caption fonts are reconstructed at65% of numeral size; KM glyph centre clears MPH clockwise without moving either pointer.'],
    distanceAnchor: { nominalKmValue: 61, sourceFittedKmValue: 61.205358305169234, uncertainty: 1 },
    graduations, ticks, labels, pointers, palette: Object.freeze(palette),
    validation: { valid: issues.length === 0, issues, boundsEvidence: options.measureText ? 'browser-measured' : 'estimated' } };
};
