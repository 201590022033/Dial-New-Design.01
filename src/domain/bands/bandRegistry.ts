import type { BandEntity, BandKind } from '@/domain/bands/types';
import type { DonutGeometry } from '@/types/geometry';

const clampDonut = (geometry: DonutGeometry): DonutGeometry => {
  const inner = Math.max(0, geometry.innerRadius);
  const outer = Math.max(inner, geometry.outerRadius);
  return { innerRadius: inner, outerRadius: outer };
};

const defaults: Record<BandKind, Omit<BandEntity, 'id' | 'geometry'>> = {
  'dial-face': {
    kind: 'dial-face',
    name: 'Dial Face',
    visible: true,
    locked: false,
    zIndex: 10,
    style: { fill: '#1E293B', stroke: '#14B8A6', strokeWidth: 1, opacity: 1 }
  },
  'chapter-ring': {
    kind: 'chapter-ring',
    name: 'Chapter Ring',
    visible: true,
    locked: false,
    zIndex: 20,
    style: { fill: '#0F172A', stroke: '#F59E0B', strokeWidth: 1, opacity: 0.95 }
  },
  'inner-bezel': {
    kind: 'inner-bezel',
    name: 'Inner Bezel',
    visible: true,
    locked: false,
    zIndex: 30,
    style: { fill: '#111827', stroke: '#2DD4BF', strokeWidth: 1, opacity: 0.9 }
  },
  'outer-bezel': {
    kind: 'outer-bezel',
    name: 'Outer Bezel',
    visible: true,
    locked: false,
    zIndex: 40,
    style: { fill: '#0B1224', stroke: '#FBBF24', strokeWidth: 1, opacity: 0.9 }
  },
  'movement-template': {
    kind: 'movement-template',
    name: 'Movement Template',
    visible: true,
    locked: false,
    zIndex: 50,
    style: { fill: '#111C36', stroke: '#14B8A6', strokeWidth: 1, opacity: 0.8 }
  },
  'scale-generator': {
    kind: 'scale-generator',
    name: 'Scale Generator',
    visible: true,
    locked: false,
    zIndex: 60,
    style: { fill: '#0F172A', stroke: '#F59E0B', strokeWidth: 1, opacity: 0.8 }
  }
};

export const createBand = (
  id: string,
  kind: BandKind,
  geometry: DonutGeometry
): BandEntity => {
  const base = defaults[kind];
  return {
    id,
    ...base,
    geometry: clampDonut(geometry)
  };
};

export const updateBandGeometry = (band: BandEntity, geometry: DonutGeometry): BandEntity => {
  return {
    ...band,
    geometry: clampDonut(geometry)
  };
};

export const bandKinds: BandKind[] = Object.keys(defaults) as BandKind[];
