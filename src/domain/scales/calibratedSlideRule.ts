/** Shared calibration, independent of reference artwork, physical radius and font. */
export const KM_PER_STATUTE_MILE = 1.609344;
export const KM_PER_NAUTICAL_MILE = 1.852;

export const wrapDegrees = (degrees: number): number => ((degrees % 360) + 360) % 360;

export const logDecadeAngle = (value: number, origin = 0, direction: 1 | -1 = 1): number => {
  if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(origin)) return Number.NaN;
  // Normalize durations and values across decades; 100 and 10 share one seam.
  const fraction = ((Math.log10(value / 10) % 1) + 1) % 1;
  return wrapDegrees(origin + direction * 360 * fraction);
};

export const alignmentRotation = (outerValue: number, innerValue: number, direction: 1 | -1 = 1): number =>
  wrapDegrees(logDecadeAngle(innerValue, 0, direction) - logDecadeAngle(outerValue, 0, direction));

export const durationMinutes = (text: string): number => {
  const match = /^(\d+):([0-5]\d)$/.exec(text.trim());
  if (!match) return Number.NaN;
  const value = Number(match[1]) * 60 + Number(match[2]);
  return Number.isSafeInteger(value) ? value : Number.NaN;
};

export const statuteMilesToKm = (value: number): number => value * KM_PER_STATUTE_MILE;
export const statuteMilesToNautical = (value: number): number => statuteMilesToKm(value) / KM_PER_NAUTICAL_MILE;

export type CalibratedMarkGroup = 'outer' | 'inner' | 'time' | 'fixed-reference' | 'rotating-reference';
export type CalibratedMarkKind = 'graduation' | 'numeral' | 'caption' | 'pointer';
export type ConversionClass = 'distance' | 'weight' | 'volume' | 'fuel-oil-weight';

export interface CalibratedMark {
  id: string;
  group: CalibratedMarkGroup;
  kind: CalibratedMarkKind;
  /** Always the mathematical value, never an abbreviated printed numeral. */
  value: number;
  printedText?: string;
  dedicatedConversion?: ConversionClass;
  radiusMm: number;
  colour: string;
  /** Separate text, tick and pointer marks permit distinct source colours. */
  rotationDeg?: number;
}

export const isForbiddenConversionCaption = (text: string): boolean => {
  const words = text.toUpperCase().replace(/[^A-Z0-9]/g, ' ').split(/\s+/);
  return words.some((word) => ['LB', 'LBS', 'KG', 'KGS', 'KILOGRAM', 'KILOGRAMS', 'POUND', 'POUNDS',
    'GAL', 'GALS', 'GALLON', 'GALLONS', 'LITER', 'LITERS', 'LITRE', 'LITRES'].includes(word));
};

/** Last-boundary defence for future render/export consumers; never remove nearby ordinary values. */
export const retainedSlideRuleMarks = (marks: readonly CalibratedMark[]): CalibratedMark[] => marks.filter((mark) =>
  !(mark.dedicatedConversion && mark.dedicatedConversion !== 'distance') &&
  !((mark.kind === 'caption' || mark.kind === 'pointer') && isForbiddenConversionCaption(mark.printedText ?? ''))
).map((mark) => ({ ...mark }));

export const resolveCalibratedMarks = (
  marks: readonly CalibratedMark[], origin: number, direction: 1 | -1, outerRotation: number
): Array<CalibratedMark & { angleDeg: number }> => retainedSlideRuleMarks(marks).map((mark) => ({
  ...mark,
  angleDeg: wrapDegrees(logDecadeAngle(mark.value, origin, direction) +
    (mark.group === 'outer' || mark.group === 'rotating-reference' ? outerRotation : 0))
}));
