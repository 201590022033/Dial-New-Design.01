import type { ScaleLabel, ScaleTick } from '@/domain/scales/types';

export interface ScalePreviewGeometry {
  tickCount: number;
  labelCount: number;
  bounds: {
    minRadiusMm: number;
    maxRadiusMm: number;
  };
}

export const createPreviewGeometry = (ticks: ScaleTick[], labels: ScaleLabel[]): ScalePreviewGeometry => {
  const radii = [...ticks.map((tick) => tick.radiusMm), ...labels.map((label) => label.radiusMm)];
  const minRadiusMm = radii.length > 0 ? Math.min(...radii) : 0;
  const maxRadiusMm = radii.length > 0 ? Math.max(...radii) : 0;

  return {
    tickCount: ticks.length,
    labelCount: labels.length,
    bounds: {
      minRadiusMm,
      maxRadiusMm
    }
  };
};
