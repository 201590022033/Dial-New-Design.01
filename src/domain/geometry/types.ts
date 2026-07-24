export interface GlobalGeometryParameters {
  caseDiameterMm: number;
  caseThicknessMm: number;
  dialDiameterMm: number;
  movementDiameterMm: number;
  manufacturingToleranceMm: number;
  laserKerfMm: number;
  minimumLineWidthMm: number;
  minimumTextSizePt: number;
  bandSpacingMm: number;
}

export interface DerivedGeometryContext {
  caseRadiusMm: number;
  dialRadiusMm: number;
  movementRadiusMm: number;
  usableBandRadiusMm: number;
}

export interface GeometryWarning {
  code:
    | 'DIAMETER_OUT_OF_RANGE'
    | 'DIAL_EXCEEDS_CASE'
    | 'MOVEMENT_EXCEEDS_DIAL'
    | 'BAND_OVERFLOW'
    | 'LINE_WIDTH_UNDER_MIN'
    | 'TEXT_SIZE_UNDER_MIN';
  message: string;
  severity: 'info' | 'warning' | 'error';
}
