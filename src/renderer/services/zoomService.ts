export const nextZoomValue = (currentZoom: number, deltaY: number): number => {
  const direction = deltaY > 0 ? -1 : 1;
  const step = currentZoom < 1 ? 0.05 : 0.1;
  const next = currentZoom + direction * step;
  return Math.min(8, Math.max(0.25, Number(next.toFixed(2))));
};
