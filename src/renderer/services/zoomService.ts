export const nextZoomValue = (currentZoom: number, deltaY: number): number => {
  const clampedDelta = Math.max(-120, Math.min(120, deltaY));
  const factor = Math.exp((-clampedDelta / 100) * 0.08);
  const next = currentZoom * factor;
  return Math.min(8, Math.max(0.25, Number(next.toFixed(2))));
};

export const isBrowserZoomGesture = (event: Pick<WheelEvent, 'ctrlKey' | 'metaKey'>): boolean =>
  event.ctrlKey || event.metaKey;

/** Fit may shrink below 1 on narrow panes; this never resizes physical geometry. */
export const fitWatchScale = (width: number, height: number, nominalDiameterPx: number): number =>
  Math.max(.05, Math.min(2.6, Math.min(Math.max(1, width), Math.max(1, height)) * .9 / Math.max(1, nominalDiameterPx)));
