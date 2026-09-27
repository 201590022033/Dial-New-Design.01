/**
 * Manufacturer-controlled NH05B interface dimensions transcribed from the
 * TMI specification drawing. Values are millimetres unless noted otherwise.
 * The 24.5 mm aftermarket dial and 34 mm case are platform choices, not TMI
 * movement dimensions, and therefore do not belong in this record.
 */
export const nh05EngineeringReference = {
  calibre: 'NH05B',
  drawingRevision: '2021-12-14',
  evidence: {
    status: 'published' as const,
    manufacturer: 'Time Module Inc. (TMI)',
    specificationUrl: 'https://timemodule.com/upload/category/21/spec_sheet/NH05_SS.pdf',
    technicalGuideUrl: 'https://timemodule.com/upload/category/21/technical_guide/NH05_TG.pdf',
    operationManualUrl: 'https://timemodule.com/upload/category/21/operation_manual/NH05_OM.pdf',
    partsListUrl: 'https://timemodule.com/upload/category/21/parts_list/NH05_PL.pdf',
    checkedAtIso: '2026-09-27T15:09:06+02:00'
  },
  movement: {
    ligne: 7.75,
    outsideDiameterMm: 17.5,
    casingDiameterMm: 17.2,
    dialSupportOuterDiameterMm: 19.8,
    movementHeightWithDialSupportMm: 5.92,
    maximumHeightFromDialSupportMm: 1.684,
    totalHeightIncludingMovementMm: 7.604
  },
  dial: {
    manufacturerDrawingOuterDiameterMm: 19,
    outerDiameterToleranceMm: 0.05,
    thicknessMm: 0.4,
    centreHoleDiameterMm: 1.65,
    centreHoleToleranceMm: 0.05,
    datePosition: '3:00',
    dateApertureWidthMm: 1.85,
    dateApertureHeightMm: 1.3,
    fixingMethod: 'two dial legs retained by eccentric pins'
  },
  hands: {
    maximumRadiusMm: 9.5,
    fittingDiameterMm: { hour: 1.1, minute: 0.656, second: 0.213 },
    typeMStackFromDialMm: { hourTop: 0.62, minuteTop: 1.01, secondTop: 1.37 },
    maximumUnbalanceMgMm: { hour: 100, minute: 75, second: 11 }
  },
  stem: {
    partNumber: '0351 247',
    referenceLengthAMm: 5.71,
    totalReferenceLengthBMm: 12.445
  },
  casingRing: {
    outsideDiameterMm: 19.8,
    movementSeatDiameterMm: 17.55,
    innerDiameterMm: 17.2
  }
} as const;
