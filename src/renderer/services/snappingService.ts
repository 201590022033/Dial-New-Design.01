import type { CartesianPoint } from '@/types/geometry';

export interface SnapSettings {
  enabled: boolean;
  gridSize: number;
}

export const applySnapping = (point: CartesianPoint, settings: SnapSettings): CartesianPoint => {
  if (!settings.enabled) return point;
  return {
    x: Math.round(point.x / settings.gridSize) * settings.gridSize,
    y: Math.round(point.y / settings.gridSize) * settings.gridSize
  };
};
