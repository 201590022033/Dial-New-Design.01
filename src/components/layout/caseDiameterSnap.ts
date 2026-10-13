export interface CaseDiameterSnapState {
  held: { diameterMm: number; until: number } | null;
  released: number | null;
}

export const emptyCaseDiameterSnap = (): CaseDiameterSnapState => ({ held: null, released: null });

/** Native range thumbs are 16 px wide; map the pointer to their centre travel. */
export const caseDiameterFromPointer = (clientX: number, left: number, width: number): number => {
  const travel = Math.max(1, width - 16);
  const fraction = Math.max(0, Math.min(1, (clientX - left - 8) / travel));
  return Math.round((20 + fraction * 40) * 10) / 10;
};

/** Pointer-only magnetic detent: a short pause, with an immediate escape on a larger move. */
export const snapCaseDiameter = (
  raw: number, sizes: readonly number[], now: number, previous: CaseDiameterSnapState
): { value: number; state: CaseDiameterSnapState } => {
  if (previous.held) {
    const { diameterMm, until } = previous.held;
    if (sizes.includes(diameterMm) && now < until && Math.abs(raw - diameterMm) <= 0.9) {
      return { value: diameterMm, state: previous };
    }
    // Do not immediately recapture the same size when its half-second pause expires.
    return { value: raw, state: { held: null, released: diameterMm } };
  }
  const released = previous.released !== null && Math.abs(raw - previous.released) <= 0.4
    ? previous.released : null;
  const nearby = sizes.filter(size => Number.isFinite(size) && size >= 20 && size <= 60
    && size !== released && Math.abs(size * 10 - Math.round(size * 10)) < 1e-7
    && Math.abs(raw - size) <= 0.25 + 1e-7)
    .sort((a, b) => Math.abs(a - raw) - Math.abs(b - raw) || a - b)[0];
  return nearby === undefined
    ? { value: raw, state: { held: null, released } }
    : { value: nearby, state: { held: { diameterMm: nearby, until: now + 500 }, released } };
};
