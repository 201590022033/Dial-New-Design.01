import type { EngineeringDimension } from '@/domain/geometry/types';

export const diameterToRadius = (diameterMm: number): EngineeringDimension => ({
  kind: 'radius',
  value: diameterMm / 2,
  units: 'mm',
  label: 'Radius'
});

export const radiusToDiameter = (radiusMm: number): EngineeringDimension => ({
  kind: 'diameter',
  value: radiusMm * 2,
  units: 'mm',
  label: 'Diameter'
});

export const calculateWidth = (outerDiameterMm: number, innerDiameterMm: number): EngineeringDimension => ({
  kind: 'width',
  value: Math.max(0, (outerDiameterMm - innerDiameterMm) / 2),
  units: 'mm',
  label: 'Width'
});

export const calculateGap = (leftOuterDiameterMm: number, rightInnerDiameterMm: number): EngineeringDimension => ({
  kind: 'gap',
  value: Math.max(0, (rightInnerDiameterMm - leftOuterDiameterMm) / 2),
  units: 'mm',
  label: 'Gap'
});

export const createAngleDimension = (deg: number, label = 'Angle'): EngineeringDimension => ({
  kind: 'angle',
  value: deg,
  units: 'deg',
  label
});
