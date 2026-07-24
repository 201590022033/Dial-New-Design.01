export type Millimeters = number;

export interface PolarPoint {
  radius: Millimeters;
  angleDeg: number;
}

export interface CartesianPoint {
  x: number;
  y: number;
}

export interface DonutGeometry {
  innerRadius: Millimeters;
  outerRadius: Millimeters;
}
