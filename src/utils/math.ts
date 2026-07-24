export const mmToPixels = (mm: number, scale = 10): number => mm * scale;

export const polarToCartesian = (radius: number, angleDeg: number): { x: number; y: number } => {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: radius * Math.cos(angleRad),
    y: radius * Math.sin(angleRad)
  };
};
