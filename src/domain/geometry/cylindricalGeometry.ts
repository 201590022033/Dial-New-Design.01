/**
 * 2.5D CYLINDRICAL BOUNDARY & GEOMETRY DEFINITIONS
 * =================================================
 * Minimal 2.5D cylindrical coordinate system and bounding volumes for watchmaking CAD.
 *
 * AXIAL DATUM SYSTEM
 * ------------------
 * Canonical Datum: The dial-seat plane is defined as Z = 0.000 mm.
 *
 * Convention:
 * - Z = 0: Planar mating surface where the rear/back face of the dial blank sits.
 * - Negative Z (Z < 0): Movement / casing ring / caseback direction (interior downward).
 * - Positive Z (Z > 0): Dial thickness, dial front face, chapter ring, hand stack,
 *   crystal, and external bezel (exterior upward).
 *
 * Subsystems MUST NOT invent independent or floating axial origins.
 */

export const AXIAL_DATUM_DIAL_SEAT_Z = 0.0;

/**
 * CylindricalExtent
 * Bounded 2.5D cylindrical volume defined by:
 * - radial bounds [innerRadiusMm, outerRadiusMm]
 * - axial bounds [zBaseMm, zBaseMm + axialThicknessMm]
 */
export interface CylindricalExtent {
  innerRadiusMm: number;
  outerRadiusMm: number;
  zBaseMm: number;
  axialThicknessMm: number;
}

/**
 * Derived helper: Returns the top axial boundary (zBase + axialThickness).
 */
export const getZTop = (extent: CylindricalExtent): number => {
  return extent.zBaseMm + extent.axialThicknessMm;
};

/**
 * Derived helper: Returns the radial width (outerRadius - innerRadius).
 */
export const getRadialWidth = (extent: CylindricalExtent): number => {
  return extent.outerRadiusMm - extent.innerRadiusMm;
};

/**
 * Derived helper: Checks if a given radial coordinate is within the extent's radial boundary.
 */
export const containsRadius = (extent: CylindricalExtent, radiusMm: number): boolean => {
  return radiusMm >= extent.innerRadiusMm && radiusMm <= extent.outerRadiusMm;
};

/**
 * Derived helper: Checks if a given axial coordinate is within the extent's axial boundary.
 */
export const containsZ = (extent: CylindricalExtent, zMm: number): boolean => {
  return zMm >= extent.zBaseMm && zMm <= getZTop(extent);
};

/**
 * Derived helper: Checks whether two cylindrical extents overlap radially.
 * Overlap requires the intersection of radial spans to exceed toleranceMm.
 */
export const overlapsRadially = (
  a: CylindricalExtent,
  b: CylindricalExtent,
  toleranceMm = 0.001
): boolean => {
  const overlapStart = Math.max(a.innerRadiusMm, b.innerRadiusMm);
  const overlapEnd = Math.min(a.outerRadiusMm, b.outerRadiusMm);
  return overlapEnd - overlapStart > toleranceMm;
};

/**
 * Derived helper: Checks whether two cylindrical extents overlap axially.
 * Overlap requires the intersection of axial spans [zBase, zTop] to exceed toleranceMm.
 */
export const overlapsAxially = (
  a: CylindricalExtent,
  b: CylindricalExtent,
  toleranceMm = 0.001
): boolean => {
  const overlapStart = Math.max(a.zBaseMm, b.zBaseMm);
  const overlapEnd = Math.min(getZTop(a), getZTop(b));
  return overlapEnd - overlapStart > toleranceMm;
};

/**
 * Physical interference check:
 * Two solid components interfere if and only if they overlap BOTH radially AND axially.
 * Pure radial overlap at distinct axial heights is NOT a collision.
 */
export const checkCylindricalInterference = (
  a: CylindricalExtent,
  b: CylindricalExtent,
  radialToleranceMm = 0.001,
  axialToleranceMm = 0.001
): boolean => {
  return (
    overlapsRadially(a, b, radialToleranceMm) &&
    overlapsAxially(a, b, axialToleranceMm)
  );
};

/**
 * MechanicalInterfaceKind
 * Standardized mating mechanical interfaces in horological case construction.
 */
export type MechanicalInterfaceKind =
  | 'dial-seat'
  | 'rehaut-rebate'
  | 'bezel-shoulder'
  | 'crystal-seat'
  | 'movement-holder'
  | 'hand-collet-stack'
  | 'generic-radial-seat';

/**
 * MechanicalInterface
 * Formal mechanical joint or seating relationship between adjacent components.
 */
export interface MechanicalInterface {
  kind: MechanicalInterfaceKind;
  parentPartId: string;
  matingPartId?: string;
  zDatumOffsetMm: number; // axial location of the mating interface relative to Z = 0
  radialSeatMm: {
    innerRadiusMm: number;
    outerRadiusMm: number;
  };
  axialClearanceMm?: number;
  notes?: string;
}

/**
 * Resolution status of the assembly geometry.
 * Replaces previous silent clamping with explicit structured outcomes.
 */
export type GeometryResolutionStatus =
  | 'valid'
  | 'conditional'
  | 'invalid'
  | 'insufficient-data';

/**
 * Specific diagnostic error/warning codes for geometry resolution.
 */
export type GeometryDiagnosticCode =
  | 'NEGATIVE_RADIAL_WIDTH'
  | 'IMPOSSIBLE_SEAT_RELATIONSHIP'
  | 'RADIAL_AXIAL_COLLISION'
  | 'HAND_STACK_EXCEEDS_CRYSTAL_CLEARANCE'
  | 'MISSING_REQUIRED_DATUM'
  | 'MOVEMENT_EXCEEDS_CASE'
  | 'CHAPTER_RING_EXCEEDS_CASE'
  | 'BEZEL_SHOULDER_MISMATCH'
  | 'MISSING_DIMENSION'
  | 'INVERTED_AXIAL_EXTENT';

export interface GeometryDiagnostic {
  code: GeometryDiagnosticCode;
  severity: 'error' | 'warning' | 'info';
  affectedPartIds: string[];
  message: string;
  details?: Record<string, unknown>;
}

/**
 * ContentSlotKind
 * Authoritative content regions where dial features, scales, markers, or hands reside.
 */
export type ContentSlotKind =
  | 'dial-face-slot'
  | 'chapter-ring-slot'
  | 'bezel-insert-slot'
  | 'crystal-clearance-slot'
  | 'hands-clearance-slot';

/**
 * ContentSlotRegion
 * Resolved slot owned by a parent physical component.
 */
export interface ContentSlotRegion {
  slotId: string;
  kind: ContentSlotKind;
  name: string;
  innerRadiusMm: number;
  outerRadiusMm: number;
  zBaseMm: number;
  zTopMm: number;
  radialWidthMm: number;
  allowedContentTypes: (
    | 'dial-face'
    | 'markers'
    | 'typography'
    | 'complications'
    | 'scale'
    | 'bezel-insert'
  )[];
}

/**
 * AnnularContentRegion
 * Standard interface for Annular Content Providers (scales, slide rules, marker tracks).
 */
export interface AnnularContentRegion {
  innerRadiusMm: number;
  outerRadiusMm: number;
  startAngleDeg?: number;
  endAngleDeg?: number;
}
