/** Automatic presentation contrast only. Explicit user print/metal colours are never recoloured. */
export const resolveMarkerColour = (dialColour: string, explicitColour?: string, lumed = false): string => {
  if (explicitColour) return explicitColour;
  const light = lumed ? '#C7F9CC' : '#E2E8F0';
  const dark = '#26313D';
  const luminance = (hex: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return 0;
    const rgb = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
      .map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return rgb[0]! * .2126 + rgb[1]! * .7152 + rgb[2]! * .0722;
  };
  const face = luminance(dialColour);
  const ratio = (colour: string) => (Math.max(face, luminance(colour)) + .05) / (Math.min(face, luminance(colour)) + .05);
  return ratio(light) >= ratio(dark) ? light : dark;
};

export interface MarkerCutout { xMm: number; yMm: number; widthMm: number; heightMm: number }
/** Replace built-in hour artwork only, not minute tracks, register graphics or physical dial surfaces. */
export const isAuthoredHourMarker = (name: string): boolean =>
  /(?:ARCH_NUMERAL_|DIAL_MARKER|_INDEX_|HOUR_MARKERS)/i.test(name);
/** Conservative substitute glyph bounds; omit a colliding hour glyph, never move its angular station. */
export const markerNumeralLayout = (marker: { innerRadiusMm: number; outerRadiusMm: number; angleDeg: number; text?: string }, dialRadiusMm: number) => {
  const fontSizeMm = Math.min(1.55, Math.max(.9, (marker.outerRadiusMm - marker.innerRadiusMm) * .65));
  const widthMm = Math.max(1, marker.text?.length ?? 1) * fontSizeMm * .75, heightMm = fontSizeMm * 1.2;
  const safeRadius = Math.sqrt(Math.max(0, (Math.max(0, dialRadiusMm - .08)) ** 2 - (widthMm / 2) ** 2)) - heightMm / 2;
  const radiusMm = Math.max(0, Math.min((marker.innerRadiusMm + marker.outerRadiusMm) / 2, safeRadius));
  const angle = marker.angleDeg * Math.PI / 180;
  return { fontSizeMm, widthMm, heightMm, radiusMm, xMm: Math.sin(angle) * radiusMm, yMm: -Math.cos(angle) * radiusMm };
};
export const markerGlyphOverlapsCutout = (glyph: { xMm: number; yMm: number; widthMm: number; heightMm: number }, cutouts: MarkerCutout[]) =>
  cutouts.some((cutout) => Math.abs(glyph.xMm - cutout.xMm) < (glyph.widthMm + cutout.widthMm) / 2 + .08 &&
    Math.abs(glyph.yMm - cutout.yMm) < (glyph.heightMm + cutout.heightMm) / 2 + .08);
