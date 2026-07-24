import type { BandEntity, BandKind } from '@/domain/bands/types';
import { buildDefaultSnapTargets } from '@/domain/geometry/snapTargets';
import type { DonutGeometry } from '@/types/geometry';

const clampDonut = (geometry: DonutGeometry): DonutGeometry => {
  const inner = Math.max(0, geometry.innerRadius);
  const outer = Math.max(inner, geometry.outerRadius);
  return { innerRadius: inner, outerRadius: outer };
};

const defaults: Record<
  BandKind,
  Omit<BandEntity, 'id' | 'geometry' | 'dependencyIds' | 'affectedObjectIds' | 'dirty' | 'lastUpdatedIso'>
> = {
  'dial-face': {
    kind: 'dial-face',
    displayName: 'Dial Face',
    name: 'Dial Face',
    parentBandId: null,
    childBandIds: [],
    outerDiameterMm: 28,
    innerDiameterMm: 0,
    calculatedWidthMm: 14,
    thicknessMm: 0.4,
    color: '#1E293B',
    material: 'brass',
    visible: true,
    locked: false,
    exportEnabled: true,
    zIndex: 10,
    svgGroupId: 'band-group-dial-face',
    snapTargets: [],
    relationships: [],
    validationState: { valid: true, warnings: [] },
    manufacturingWarnings: [],
    style: { fill: '#1E293B', stroke: '#14B8A6', strokeWidth: 1, opacity: 1 }
  },
  'chapter-ring': {
    kind: 'chapter-ring',
    displayName: 'Chapter Ring',
    name: 'Chapter Ring',
    parentBandId: 'band-dial-face',
    childBandIds: [],
    outerDiameterMm: 34,
    innerDiameterMm: 28,
    calculatedWidthMm: 3,
    thicknessMm: 0.35,
    color: '#0F172A',
    material: 'steel',
    visible: true,
    locked: false,
    exportEnabled: true,
    zIndex: 20,
    svgGroupId: 'band-group-chapter-ring',
    snapTargets: [],
    relationships: [{ relation: 'concentric', targetBandId: 'band-dial-face' }],
    validationState: { valid: true, warnings: [] },
    manufacturingWarnings: [],
    style: { fill: '#0F172A', stroke: '#F59E0B', strokeWidth: 1, opacity: 0.95 }
  },
  'inner-bezel': {
    kind: 'inner-bezel',
    displayName: 'Inner Bezel',
    name: 'Inner Bezel',
    parentBandId: 'band-chapter-ring',
    childBandIds: [],
    outerDiameterMm: 37,
    innerDiameterMm: 34,
    calculatedWidthMm: 1.5,
    thicknessMm: 0.4,
    color: '#111827',
    material: 'aluminium',
    visible: true,
    locked: false,
    exportEnabled: true,
    zIndex: 30,
    svgGroupId: 'band-group-inner-bezel',
    snapTargets: [],
    relationships: [{ relation: 'concentric', targetBandId: 'band-chapter-ring' }],
    validationState: { valid: true, warnings: [] },
    manufacturingWarnings: [],
    style: { fill: '#111827', stroke: '#2DD4BF', strokeWidth: 1, opacity: 0.9 }
  },
  'outer-bezel': {
    kind: 'outer-bezel',
    displayName: 'Outer Bezel',
    name: 'Outer Bezel',
    parentBandId: 'band-inner-bezel',
    childBandIds: [],
    outerDiameterMm: 40,
    innerDiameterMm: 37,
    calculatedWidthMm: 1.5,
    thicknessMm: 0.6,
    color: '#0B1224',
    material: 'steel',
    visible: true,
    locked: false,
    exportEnabled: true,
    zIndex: 40,
    svgGroupId: 'band-group-outer-bezel',
    snapTargets: [],
    relationships: [{ relation: 'concentric', targetBandId: 'band-inner-bezel' }],
    validationState: { valid: true, warnings: [] },
    manufacturingWarnings: [],
    style: { fill: '#0B1224', stroke: '#FBBF24', strokeWidth: 1, opacity: 0.9 }
  },
  'movement-template': {
    kind: 'movement-template',
    displayName: 'Movement Template',
    name: 'Movement Template',
    parentBandId: 'band-dial-face',
    childBandIds: [],
    outerDiameterMm: 26,
    innerDiameterMm: 12,
    calculatedWidthMm: 7,
    thicknessMm: 0.2,
    color: '#111C36',
    material: 'brass',
    visible: true,
    locked: false,
    exportEnabled: false,
    zIndex: 50,
    svgGroupId: 'band-group-movement-template',
    snapTargets: [],
    relationships: [{ relation: 'derived-from', targetBandId: 'band-dial-face' }],
    validationState: { valid: true, warnings: [] },
    manufacturingWarnings: [],
    style: { fill: '#111C36', stroke: '#14B8A6', strokeWidth: 1, opacity: 0.8 }
  },
  'scale-generator': {
    kind: 'scale-generator',
    displayName: 'Scale Generator',
    name: 'Scale Generator',
    parentBandId: 'band-chapter-ring',
    childBandIds: [],
    outerDiameterMm: 36,
    innerDiameterMm: 30,
    calculatedWidthMm: 3,
    thicknessMm: 0.2,
    color: '#0F172A',
    material: 'enamel',
    visible: true,
    locked: false,
    exportEnabled: true,
    zIndex: 60,
    svgGroupId: 'band-group-scale-generator',
    snapTargets: [],
    relationships: [{ relation: 'inherits-scale', targetBandId: 'band-chapter-ring' }],
    validationState: { valid: true, warnings: [] },
    manufacturingWarnings: [],
    style: { fill: '#0F172A', stroke: '#F59E0B', strokeWidth: 1, opacity: 0.8 }
  },
  hands: {
    kind: 'hands',
    displayName: 'Hands',
    name: 'Hands',
    parentBandId: 'band-dial-face',
    childBandIds: [],
    outerDiameterMm: 24,
    innerDiameterMm: 0,
    calculatedWidthMm: 12,
    thicknessMm: 0.2,
    color: '#E2E8F0',
    material: 'steel',
    visible: true,
    locked: false,
    exportEnabled: true,
    zIndex: 70,
    svgGroupId: 'band-group-hands',
    snapTargets: [],
    relationships: [{ relation: 'derived-from', targetBandId: 'band-dial-face' }],
    validationState: { valid: true, warnings: [] },
    manufacturingWarnings: [],
    style: { fill: '#E2E8F0', stroke: '#111827', strokeWidth: 0.6, opacity: 0.95 }
  },
  indices: {
    kind: 'indices',
    displayName: 'Indices',
    name: 'Indices',
    parentBandId: 'band-chapter-ring',
    childBandIds: [],
    outerDiameterMm: 35,
    innerDiameterMm: 30,
    calculatedWidthMm: 2.5,
    thicknessMm: 0.25,
    color: '#D1D5DB',
    material: 'steel',
    visible: true,
    locked: false,
    exportEnabled: true,
    zIndex: 80,
    svgGroupId: 'band-group-indices',
    snapTargets: [],
    relationships: [{ relation: 'inherits-scale', targetBandId: 'band-scale-generator' }],
    validationState: { valid: true, warnings: [] },
    manufacturingWarnings: [],
    style: { fill: '#D1D5DB', stroke: '#475569', strokeWidth: 0.6, opacity: 0.95 }
  },
  text: {
    kind: 'text',
    displayName: 'Text',
    name: 'Text',
    parentBandId: 'band-dial-face',
    childBandIds: [],
    outerDiameterMm: 30,
    innerDiameterMm: 24,
    calculatedWidthMm: 3,
    thicknessMm: 0.2,
    color: '#F8FAFC',
    material: 'enamel',
    visible: true,
    locked: false,
    exportEnabled: true,
    zIndex: 90,
    svgGroupId: 'band-group-text',
    snapTargets: [],
    relationships: [{ relation: 'derived-from', targetBandId: 'band-dial-face' }],
    validationState: { valid: true, warnings: [] },
    manufacturingWarnings: [],
    style: { fill: '#F8FAFC', stroke: '#64748B', strokeWidth: 0.4, opacity: 0.95 }
  },
  logo: {
    kind: 'logo',
    displayName: 'Logo',
    name: 'Logo',
    parentBandId: 'band-dial-face',
    childBandIds: [],
    outerDiameterMm: 16,
    innerDiameterMm: 8,
    calculatedWidthMm: 4,
    thicknessMm: 0.2,
    color: '#CBD5E1',
    material: 'enamel',
    visible: true,
    locked: false,
    exportEnabled: true,
    zIndex: 100,
    svgGroupId: 'band-group-logo',
    snapTargets: [],
    relationships: [{ relation: 'derived-from', targetBandId: 'band-dial-face' }],
    validationState: { valid: true, warnings: [] },
    manufacturingWarnings: [],
    style: { fill: '#CBD5E1', stroke: '#334155', strokeWidth: 0.4, opacity: 0.95 }
  },
  complications: {
    kind: 'complications',
    displayName: 'Complications',
    name: 'Complications',
    parentBandId: 'band-dial-face',
    childBandIds: [],
    outerDiameterMm: 22,
    innerDiameterMm: 10,
    calculatedWidthMm: 6,
    thicknessMm: 0.25,
    color: '#94A3B8',
    material: 'brass',
    visible: true,
    locked: false,
    exportEnabled: true,
    zIndex: 110,
    svgGroupId: 'band-group-complications',
    snapTargets: [],
    relationships: [{ relation: 'derived-from', targetBandId: 'band-dial-face' }],
    validationState: { valid: true, warnings: [] },
    manufacturingWarnings: [],
    style: { fill: '#94A3B8', stroke: '#334155', strokeWidth: 0.6, opacity: 0.85 }
  }
};

export const createBand = (
  id: string,
  kind: BandKind,
  geometry: DonutGeometry
): BandEntity => {
  const base = defaults[kind];
  const clamped = clampDonut(geometry);
  const nowIso = new Date().toISOString();
  const band: BandEntity = {
    id,
    ...base,
    geometry: clamped,
    innerDiameterMm: clamped.innerRadius * 2,
    outerDiameterMm: clamped.outerRadius * 2,
    calculatedWidthMm: clamped.outerRadius - clamped.innerRadius,
    color: base.style.fill,
    dependencyIds: base.relationships.map((relationship) => relationship.targetBandId),
    affectedObjectIds: [],
    dirty: false,
    lastUpdatedIso: nowIso,
    snapTargets: []
  };

  return {
    ...band,
    snapTargets: buildDefaultSnapTargets(band)
  };
};

export const updateBandGeometry = (band: BandEntity, geometry: DonutGeometry): BandEntity => {
  const clamped = clampDonut(geometry);
  const updated: BandEntity = {
    ...band,
    geometry: clamped,
    innerDiameterMm: clamped.innerRadius * 2,
    outerDiameterMm: clamped.outerRadius * 2,
    calculatedWidthMm: clamped.outerRadius - clamped.innerRadius,
    lastUpdatedIso: new Date().toISOString()
  };

  return {
    ...updated,
    snapTargets: buildDefaultSnapTargets(updated)
  };
};

export const bandKinds: BandKind[] = Object.keys(defaults) as BandKind[];
