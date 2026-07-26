export const nextZoomValue = (currentZoom: number, deltaY: number): number => {
  const clampedDelta = Math.max(-120, Math.min(120, deltaY));
  const factor = Math.exp((-clampedDelta / 100) * 0.08);
  const next = currentZoom * factor;
  return Math.min(8, Math.max(0.25, Number(next.toFixed(2))));
};
