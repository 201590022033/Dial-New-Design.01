/** Pure layout for deterministic narrow-screen checks. */
export const shouldCloseCaseReference = (state: { pinned: boolean; dragging: boolean; focusInside: boolean; pointerInside: boolean }): boolean =>
  !state.pinned && !state.dragging && !state.focusInside && !state.pointerInside;

export const caseReferencePosition = (anchor: { left: number; bottom: number; width: number }, viewportWidth: number, viewportHeight: number) => {
  const gutter = 12;
  const width = Math.max(0, Math.min(288, viewportWidth - gutter * 2));
  const left = Math.max(gutter, Math.min(anchor.left + anchor.width / 2 - width / 2, viewportWidth - width - gutter));
  // Normally below the slider; dock visibly only when a short viewport has no room below it.
  const below = anchor.bottom + 8;
  const top = viewportHeight - below - gutter >= 120 ? below : Math.max(gutter, Math.min(below, viewportHeight - 160 - gutter));
  return { position: 'fixed' as const, left, top, width, maxHeight: Math.max(0, viewportHeight - top - gutter) };
};
export const caseReferenceTickPercent = (diameterMm: number): number => (diameterMm - 20) / 40 * 100;
export const parseCasePreviewDiameter = (input: string): number => {
  if (!input.trim()) throw new Error('Enter a case preview diameter.');
  const value = Number(input);
  if (!Number.isFinite(value) || value < 20 || value > 60) throw new Error('Enter a case preview diameter from 20 to 60 mm.');
  if (Math.abs(value * 10 - Math.round(value * 10)) > 1e-7) throw new Error('Use 0.1 mm increments.');
  return value;
};
