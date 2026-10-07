import type { ScalePointer } from './types';

/** Millimetre vertices relative to a centred pointer, shared by SVG, HD and DXF. */
export const scalePointerVertices = (pointer: ScalePointer): [number, number][] => {
  const x = pointer.widthMm / 2, y = pointer.heightMm / 2;
  if (pointer.shape === 'triangle') return [[0, -y], [x, y], [-x, y]];
  if (pointer.shape === 'diamond') return [[0, -y], [x, 0], [0, y], [-x, 0]];
  return [[-x, -y], [x, -y], [x, y], [-x, y]];
};

export const scalePointerRotation = (pointer: ScalePointer): number => pointer.angleDeg + (pointer.rotationDeg ?? 0);

export const pointerHalfExtentMm = (pointer: ScalePointer): number =>
  Math.hypot(pointer.widthMm, pointer.heightMm) / 2 + pointer.strokeWidthMm / 2 + (pointer.hoverPaddingMm ?? 0);
