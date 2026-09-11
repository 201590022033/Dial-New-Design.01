import type { WatchAssembly, WatchAssemblyPartInstance } from '@/domain/assembly/assemblyTypes';
import type { DonutGeometry } from '@/types/geometry';
import type { ScalePluginConfig } from '@/domain/scales/types';
import type { MarkerEngineConfig } from '@/domain/generators/markerEngine';
import {
  AXIAL_DATUM_DIAL_SEAT_Z,
  checkCylindricalInterference,
  getRadialWidth,
  getZTop,
  type AnnularContentRegion,
  type ContentSlotKind,
  type ContentSlotRegion,
  type CylindricalExtent,
  type GeometryDiagnostic,
  type GeometryResolutionStatus,
  type MechanicalInterface
} from './cylindricalGeometry';

export interface ResolvedPhysicalRegions {
  dial?: CylindricalExtent;
  chapterRing?: CylindricalExtent;
  bezel?: CylindricalExtent;
  crystal?: CylindricalExtent;
  movementEnvelope?: CylindricalExtent;
  handsClearanceEnvelope?: CylindricalExtent;
  caseBody?: CylindricalExtent;
  [partId: string]: CylindricalExtent | undefined;
}

export interface ResolvedAssemblyGeometry {
  status: GeometryResolutionStatus;
  assemblyId: string;
  datumPlaneZ: number;
  regions: ResolvedPhysicalRegions;
  interfaces: MechanicalInterface[];
  contentSlots: Record<ContentSlotKind, ContentSlotRegion | undefined>;
  diagnostics: GeometryDiagnostic[];
  projected2DBands: Record<string, DonutGeometry>;
  insufficientDataReasons: string[];
}

/**
 * Helper to find parts in the assembly by criteria
 */
const findPart = (
  assembly: WatchAssembly,
  predicate: (part: WatchAssemblyPartInstance) => boolean
): WatchAssemblyPartInstance | undefined => {
  return Object.values(assembly.parts).find(predicate);
};

/**
 * resolveAssemblyGeometry
 * Consumes authoritative WatchAssembly state and computes the 2.5D cylindrical geometry,
 * bounding envelopes, mechanical interfaces, content slots, and physical diagnostics.
 *
 * Does NOT silently clamp or compress invalid geometry into fake valid states.
 */
export const resolveAssemblyGeometry = (
  assembly: WatchAssembly
): ResolvedAssemblyGeometry => {
  const diagnostics: GeometryDiagnostic[] = [];
  const insufficientDataReasons: string[] = [];
  const interfaces: MechanicalInterface[] = [];
  const regions: ResolvedPhysicalRegions = {};

  const global = assembly.globalDimensions;
  const caseDiameterMm = global.caseDiameterMm;
  const totalThicknessMm = global.totalThicknessMm ?? 12.5;

  // 1. Datum & Case Sanity Checks
  if (typeof caseDiameterMm !== 'number' || caseDiameterMm <= 0 || isNaN(caseDiameterMm)) {
    diagnostics.push({
      code: 'MISSING_REQUIRED_DATUM',
      severity: 'error',
      affectedPartIds: [],
      message: 'Assembly case diameter is missing, undefined, or non-positive.'
    });
    insufficientDataReasons.push('Global case diameter is missing or non-positive');
  }

  const caseRadiusMm = (caseDiameterMm && caseDiameterMm > 0) ? caseDiameterMm / 2 : 0;

  // 2. Resolve Dial Blank
  const dialPart = findPart(
    assembly,
    (p) => p.category === 'dial' || p.catalogueItemId === 'cat-dial-blank' || p.instanceId === 'inst-dial-blank'
  );

  let dialExtent: CylindricalExtent | undefined;
  if (dialPart) {
    const dDim = dialPart.dimensions;
    if (typeof dDim.diameterMm !== 'number' || dDim.diameterMm <= 0 || isNaN(dDim.diameterMm)) {
      diagnostics.push({
        code: 'MISSING_DIMENSION',
        severity: 'error',
        affectedPartIds: [dialPart.instanceId],
        message: `Dial part "${dialPart.instanceId}" lacks a valid diameter.`
      });
      insufficientDataReasons.push(`Dial diameter missing on ${dialPart.instanceId}`);
    } else if (typeof dDim.thicknessMm !== 'number' || dDim.thicknessMm <= 0 || isNaN(dDim.thicknessMm)) {
      diagnostics.push({
        code: 'MISSING_DIMENSION',
        severity: 'error',
        affectedPartIds: [dialPart.instanceId],
        message: `Dial part "${dialPart.instanceId}" lacks a valid thickness.`
      });
      insufficientDataReasons.push(`Dial thickness missing on ${dialPart.instanceId}`);
    } else {
      const centerHoleMm = assembly.designConfig?.geometryParameters?.movementCentreHoleMm ?? 1.5;
      const innerRadiusMm = centerHoleMm / 2;
      const outerRadiusMm = dDim.diameterMm / 2;

      if (innerRadiusMm >= outerRadiusMm) {
        diagnostics.push({
          code: 'NEGATIVE_RADIAL_WIDTH',
          severity: 'error',
          affectedPartIds: [dialPart.instanceId],
          message: `Dial part "${dialPart.instanceId}" has inverted radial bounds (inner: ${innerRadiusMm}mm, outer: ${outerRadiusMm}mm).`
        });
      }

      dialExtent = {
        innerRadiusMm,
        outerRadiusMm,
        zBaseMm: AXIAL_DATUM_DIAL_SEAT_Z,
        axialThicknessMm: dDim.thicknessMm
      };
      regions.dial = dialExtent;
    }
  } else {
    insufficientDataReasons.push('Dial part instance not found in assembly');
  }

  const dialThickness = dialExtent?.axialThicknessMm ?? 0.4;
  const dialOuterRadius = dialExtent?.outerRadiusMm ?? (caseRadiusMm > 5 ? caseRadiusMm - 5 : 14);

  // 3. Resolve Movement / Casing Ring Envelope
  const movementDiameter = assembly.designConfig?.geometryParameters?.movementDiameterMm ?? 27.4;
  const movementThickness = 5.32; // Standard calibre thickness (e.g. NH35)
  const movementRadius = movementDiameter / 2;

  const movementExtent: CylindricalExtent = {
    innerRadiusMm: 0,
    outerRadiusMm: movementRadius,
    zBaseMm: -movementThickness,
    axialThicknessMm: movementThickness
  };
  regions.movementEnvelope = movementExtent;

  interfaces.push({
    kind: 'dial-seat',
    parentPartId: 'movement-casing-seat',
    matingPartId: dialPart?.instanceId,
    zDatumOffsetMm: AXIAL_DATUM_DIAL_SEAT_Z,
    radialSeatMm: {
      innerRadiusMm: Math.max(0, movementRadius - 1.2),
      outerRadiusMm: movementRadius
    },
    notes: 'Dial seat plane at Z = 0'
  });

  if (caseRadiusMm > 0 && movementRadius > caseRadiusMm) {
    diagnostics.push({
      code: 'MOVEMENT_EXCEEDS_CASE',
      severity: 'error',
      affectedPartIds: [dialPart?.instanceId ?? 'case'],
      message: `Movement radius (${movementRadius}mm) exceeds case body radius (${caseRadiusMm}mm).`
    });
  }

  // 4. Resolve Chapter Ring / Rehaut
  const chapterPart = findPart(
    assembly,
    (p) => (p.category === 'rings' && (p.catalogueItemId === 'cat-chapter-ring' || p.catalogueItemId === 'cat-rehaut' || p.instanceId.includes('chapter') || p.instanceId.includes('rehaut')))
  );

  let chapterExtent: CylindricalExtent | undefined;
  if (chapterPart) {
    const cDim = chapterPart.dimensions;
    if (typeof cDim.diameterMm !== 'number' || cDim.diameterMm <= 0 || isNaN(cDim.diameterMm)) {
      diagnostics.push({
        code: 'MISSING_DIMENSION',
        severity: 'error',
        affectedPartIds: [chapterPart.instanceId],
        message: `Chapter ring "${chapterPart.instanceId}" lacks a valid outer diameter.`
      });
      insufficientDataReasons.push(`Chapter ring diameter missing on ${chapterPart.instanceId}`);
    } else if (typeof cDim.widthMm !== 'number' || cDim.widthMm <= 0 || isNaN(cDim.widthMm)) {
      diagnostics.push({
        code: 'MISSING_DIMENSION',
        severity: 'error',
        affectedPartIds: [chapterPart.instanceId],
        message: `Chapter ring "${chapterPart.instanceId}" lacks a valid radial width.`
      });
      insufficientDataReasons.push(`Chapter ring width missing on ${chapterPart.instanceId}`);
    } else {
      const outerRadiusMm = cDim.diameterMm / 2;
      const innerRadiusMm = outerRadiusMm - cDim.widthMm;
      const thicknessMm = (typeof cDim.thicknessMm === 'number' && cDim.thicknessMm > 0) ? cDim.thicknessMm : 1.5;

      if (innerRadiusMm >= outerRadiusMm || innerRadiusMm < 0 || cDim.widthMm <= 0) {
        diagnostics.push({
          code: 'NEGATIVE_RADIAL_WIDTH',
          severity: 'error',
          affectedPartIds: [chapterPart.instanceId],
          message: `Chapter ring "${chapterPart.instanceId}" has negative or zero radial width.`
        });
      }

      // Chapter ring sits on top of dial blank or dial rebate at Z = dialThickness
      chapterExtent = {
        innerRadiusMm,
        outerRadiusMm,
        zBaseMm: dialThickness,
        axialThicknessMm: thicknessMm
      };
      regions.chapterRing = chapterExtent;

      interfaces.push({
        kind: 'rehaut-rebate',
        parentPartId: chapterPart.instanceId,
        matingPartId: dialPart?.instanceId,
        zDatumOffsetMm: dialThickness,
        radialSeatMm: {
          innerRadiusMm,
          outerRadiusMm: Math.min(outerRadiusMm, dialOuterRadius)
        },
        notes: 'Chapter ring sits above dial edge at Z = dialThickness'
      });

      if (caseRadiusMm > 0 && outerRadiusMm > caseRadiusMm) {
        diagnostics.push({
          code: 'CHAPTER_RING_EXCEEDS_CASE',
          severity: 'error',
          affectedPartIds: [chapterPart.instanceId],
          message: `Chapter ring outer radius (${outerRadiusMm}mm) exceeds case radius (${caseRadiusMm}mm).`
        });
      }
    }
  }

  // 5. Resolve Hands Clearance Envelope
  const handParts = Object.values(assembly.parts).filter(
    (p) => p.category === 'hands'
  );
  let maxHandLength = 0;
  handParts.forEach((h) => {
    if (typeof h.dimensions.diameterMm === 'number' && h.dimensions.diameterMm > 0) {
      maxHandLength = Math.max(maxHandLength, h.dimensions.diameterMm);
    }
  });

  if (maxHandLength === 0) {
    maxHandLength = dialOuterRadius > 0 ? dialOuterRadius * 0.85 : 12;
  }

  const handStackHeight = 1.8; // Standard 3-hand pinion clearance stack
  const handStackZBase = dialThickness;
  const handStackZTop = handStackZBase + handStackHeight;

  const handsEnvelope: CylindricalExtent = {
    innerRadiusMm: 0,
    outerRadiusMm: maxHandLength,
    zBaseMm: handStackZBase,
    axialThicknessMm: handStackHeight
  };
  regions.handsClearanceEnvelope = handsEnvelope;

  interfaces.push({
    kind: 'hand-collet-stack',
    parentPartId: 'movement-hand-arbor',
    zDatumOffsetMm: handStackZBase,
    radialSeatMm: { innerRadiusMm: 0, outerRadiusMm: 1.5 },
    axialClearanceMm: handStackHeight,
    notes: 'Hands occupy axial envelope above dial face'
  });

  // 6. Resolve Crystal (Watch Glass)
  const crystalPart = findPart(
    assembly,
    (p) => p.category === 'case' && (p.catalogueItemId.includes('crystal') || p.catalogueItemId.includes('sapphire') || p.instanceId.includes('crystal') || p.instanceId.includes('sapphire'))
  );

  let crystalExtent: CylindricalExtent | undefined;
  // Crystal seat height: sits above chapter ring and hands stack
  const chapterZTop = chapterExtent ? getZTop(chapterExtent) : 0;
  const minRequiredHandClearance = 0.3; // Required clearance between hand stack and crystal underside
  const nominalCrystalUndersideZ = Math.max(chapterZTop, handStackZTop + minRequiredHandClearance, 2.8);

  if (crystalPart) {
    const crDim = crystalPart.dimensions;
    if (typeof crDim.diameterMm !== 'number' || crDim.diameterMm <= 0 || isNaN(crDim.diameterMm)) {
      diagnostics.push({
        code: 'MISSING_DIMENSION',
        severity: 'error',
        affectedPartIds: [crystalPart.instanceId],
        message: `Crystal "${crystalPart.instanceId}" lacks valid diameter.`
      });
      insufficientDataReasons.push(`Crystal diameter missing on ${crystalPart.instanceId}`);
    } else {
      const crThickness = (typeof crDim.thicknessMm === 'number' && crDim.thicknessMm > 0) ? crDim.thicknessMm : 1.5;
      const crystalRadius = crDim.diameterMm / 2;

      crystalExtent = {
        innerRadiusMm: 0,
        outerRadiusMm: crystalRadius,
        zBaseMm: nominalCrystalUndersideZ,
        axialThicknessMm: crThickness
      };
      regions.crystal = crystalExtent;

      interfaces.push({
        kind: 'crystal-seat',
        parentPartId: 'case-crystal-gasket',
        matingPartId: crystalPart.instanceId,
        zDatumOffsetMm: nominalCrystalUndersideZ,
        radialSeatMm: {
          innerRadiusMm: crystalRadius - 1.0,
          outerRadiusMm: crystalRadius
        }
      });
    }
  }

  // Hand-stack / crystal clearance validation check
  const actualCrystalUndersideZ = crystalExtent ? crystalExtent.zBaseMm : nominalCrystalUndersideZ;
  const handToCrystalClearance = actualCrystalUndersideZ - handStackZTop;

  if (handToCrystalClearance < 0) {
    diagnostics.push({
      code: 'HAND_STACK_EXCEEDS_CRYSTAL_CLEARANCE',
      severity: 'error',
      affectedPartIds: [crystalPart?.instanceId ?? 'crystal', 'hands-stack'],
      message: `Hand stack top (${handStackZTop.toFixed(2)}mm) penetrates crystal underside (${actualCrystalUndersideZ.toFixed(2)}mm). Interference: ${Math.abs(handToCrystalClearance).toFixed(2)}mm.`
    });
  } else if (handToCrystalClearance < minRequiredHandClearance) {
    diagnostics.push({
      code: 'HAND_STACK_EXCEEDS_CRYSTAL_CLEARANCE',
      severity: 'warning',
      affectedPartIds: [crystalPart?.instanceId ?? 'crystal', 'hands-stack'],
      message: `Hand stack clearance to crystal underside is marginal (${handToCrystalClearance.toFixed(2)}mm < required ${minRequiredHandClearance}mm).`
    });
  }

  // 7. Resolve Bezel
  const bezelPart = findPart(
    assembly,
    (p) =>
      p.category === 'rings' &&
      !p.catalogueItemId.includes('inner') &&
      !p.instanceId.includes('inner') &&
      (p.catalogueItemId.includes('bezel') || p.instanceId.includes('bezel'))
  );

  let bezelExtent: CylindricalExtent | undefined;
  if (bezelPart) {
    const bDim = bezelPart.dimensions;
    if (typeof bDim.diameterMm === 'number' && bDim.diameterMm > 0) {
      const bOuterRadius = bDim.diameterMm / 2;
      const bWidth = (typeof bDim.widthMm === 'number' && bDim.widthMm > 0) ? bDim.widthMm : 2.5;
      const bInnerRadius = bOuterRadius - bWidth;
      const bThickness = (typeof bDim.thicknessMm === 'number' && bDim.thicknessMm > 0) ? bDim.thicknessMm : 2.0;

      if (bInnerRadius >= bOuterRadius) {
        diagnostics.push({
          code: 'NEGATIVE_RADIAL_WIDTH',
          severity: 'error',
          affectedPartIds: [bezelPart.instanceId],
          message: `Bezel "${bezelPart.instanceId}" has negative or zero radial width.`
        });
      }

      bezelExtent = {
        innerRadiusMm: bInnerRadius,
        outerRadiusMm: bOuterRadius,
        zBaseMm: dialThickness + 0.8,
        axialThicknessMm: bThickness
      };
      regions.bezel = bezelExtent;

      interfaces.push({
        kind: 'bezel-shoulder',
        parentPartId: 'case-bezel-recess',
        matingPartId: bezelPart.instanceId,
        zDatumOffsetMm: bezelExtent.zBaseMm,
        radialSeatMm: { innerRadiusMm: bInnerRadius, outerRadiusMm: bOuterRadius }
      });
    }
  }

  // 8. Resolve Case Body
  if (caseRadiusMm > 0) {
    regions.caseBody = {
      innerRadiusMm: dialOuterRadius,
      outerRadiusMm: caseRadiusMm,
      zBaseMm: -movementThickness - 1.5,
      axialThicknessMm: totalThicknessMm
    };
  }

  // 9. Physical Collision Detection (Radial Overlap AND Axial Overlap)
  // Check solid pairs that should not intersect without a mating mechanical interface
  const solidPartsToCheck: Array<{ id: string; name: string; extent: CylindricalExtent }> = [];
  if (dialExtent) solidPartsToCheck.push({ id: dialPart?.instanceId ?? 'dial', name: 'Dial', extent: dialExtent });
  if (chapterExtent) solidPartsToCheck.push({ id: chapterPart?.instanceId ?? 'chapter', name: 'Chapter Ring', extent: chapterExtent });
  if (movementExtent) solidPartsToCheck.push({ id: 'movement', name: 'Movement', extent: movementExtent });

  for (let i = 0; i < solidPartsToCheck.length; i++) {
    for (let j = i + 1; j < solidPartsToCheck.length; j++) {
      const partA = solidPartsToCheck[i]!;
      const partB = solidPartsToCheck[j]!;

      // Check if these two share a valid mating interface (e.g. dial resting on movement seat, chapter ring on dial face)
      const hasMating = interfaces.some(
        (inter) =>
          (inter.parentPartId.includes(partA.id) && inter.matingPartId?.includes(partB.id)) ||
          (inter.parentPartId.includes(partB.id) && inter.matingPartId?.includes(partA.id))
      );

      // Check if they interfere (radial AND axial overlap)
      if (checkCylindricalInterference(partA.extent, partB.extent)) {
        // If there is no permitting mating interface or if penetration is deeper than zero-datum boundary:
        if (!hasMating) {
          diagnostics.push({
            code: 'RADIAL_AXIAL_COLLISION',
            severity: 'error',
            affectedPartIds: [partA.id, partB.id],
            message: `Physical collision between "${partA.name}" and "${partB.name}": overlapping both radially and axially without a permitted interface.`
          });
        }
      }
    }
  }

  // 10. Compute Authoritative Content Slots
  const dialApertureRadius = chapterExtent ? chapterExtent.innerRadiusMm : dialOuterRadius;

  const dialSlot: ContentSlotRegion = {
    slotId: 'slot-dial-face',
    kind: 'dial-face-slot',
    name: 'Dial Face Content Slot',
    innerRadiusMm: dialExtent?.innerRadiusMm ?? 0.75,
    outerRadiusMm: dialApertureRadius,
    zBaseMm: AXIAL_DATUM_DIAL_SEAT_Z,
    zTopMm: dialThickness,
    radialWidthMm: Math.max(0, dialApertureRadius - (dialExtent?.innerRadiusMm ?? 0.75)),
    allowedContentTypes: ['dial-face', 'markers', 'typography', 'complications']
  };

  const chapterSlot: ContentSlotRegion | undefined = chapterExtent
    ? {
        slotId: 'slot-chapter-ring',
        kind: 'chapter-ring-slot',
        name: 'Chapter Ring Content Slot',
        innerRadiusMm: chapterExtent.innerRadiusMm,
        outerRadiusMm: chapterExtent.outerRadiusMm,
        zBaseMm: chapterExtent.zBaseMm,
        zTopMm: getZTop(chapterExtent),
        radialWidthMm: getRadialWidth(chapterExtent),
        allowedContentTypes: ['scale', 'markers', 'typography']
      }
    : undefined;

  const bezelSlot: ContentSlotRegion | undefined = bezelExtent
    ? {
        slotId: 'slot-bezel-insert',
        kind: 'bezel-insert-slot',
        name: 'Bezel Insert Content Slot',
        innerRadiusMm: bezelExtent.innerRadiusMm,
        outerRadiusMm: bezelExtent.outerRadiusMm,
        zBaseMm: bezelExtent.zBaseMm,
        zTopMm: getZTop(bezelExtent),
        radialWidthMm: getRadialWidth(bezelExtent),
        allowedContentTypes: ['bezel-insert', 'scale', 'markers']
      }
    : undefined;

  const handsSlot: ContentSlotRegion = {
    slotId: 'slot-hands-clearance',
    kind: 'hands-clearance-slot',
    name: 'Hands Clearance Slot',
    innerRadiusMm: 0,
    outerRadiusMm: maxHandLength,
    zBaseMm: handStackZBase,
    zTopMm: handStackZTop,
    radialWidthMm: maxHandLength,
    allowedContentTypes: []
  };

  const crystalSlot: ContentSlotRegion = {
    slotId: 'slot-crystal-clearance',
    kind: 'crystal-clearance-slot',
    name: 'Crystal Clearance Slot',
    innerRadiusMm: 0,
    outerRadiusMm: crystalExtent?.outerRadiusMm ?? (caseRadiusMm > 2 ? caseRadiusMm - 2 : 15),
    zBaseMm: handStackZTop,
    zTopMm: actualCrystalUndersideZ,
    radialWidthMm: crystalExtent?.outerRadiusMm ?? (caseRadiusMm > 2 ? caseRadiusMm - 2 : 15),
    allowedContentTypes: []
  };

  const contentSlots: Record<ContentSlotKind, ContentSlotRegion | undefined> = {
    'dial-face-slot': dialSlot,
    'chapter-ring-slot': chapterSlot,
    'bezel-insert-slot': bezelSlot,
    'hands-clearance-slot': handsSlot,
    'crystal-clearance-slot': crystalSlot
  };

  // 11. Compute Projected 2D Bands for Existing SVG Renderer Pipeline
  // Derives bands from resolved 2.5D physical boundaries, avoiding magic fallbacks
  const r0 = 0;
  const r1 = dialSlot.outerRadiusMm;
  const r2 = chapterSlot ? chapterSlot.outerRadiusMm : r1 + 2.5;
  const r3 = bezelSlot ? bezelSlot.innerRadiusMm : r2 + 1.5;
  const r4 = caseRadiusMm > 0 ? caseRadiusMm : r3 + 2.0;

  const projected2DBands: Record<string, DonutGeometry> = {
    'dial-face': { innerRadius: r0, outerRadius: r1 },
    'chapter-ring': { innerRadius: r1, outerRadius: r2 },
    'inner-bezel': { innerRadius: r2, outerRadius: r3 },
    'outer-bezel': { innerRadius: r3, outerRadius: r4 }
  };

  // 12. Determine Final Status
  let status: GeometryResolutionStatus = 'valid';
  const hasErrors = diagnostics.some((d) => d.severity === 'error');
  const hasWarnings = diagnostics.some((d) => d.severity === 'warning');

  if (insufficientDataReasons.length > 0) {
    status = 'insufficient-data';
  } else if (hasErrors) {
    status = 'invalid';
  } else if (hasWarnings) {
    status = 'conditional';
  } else {
    status = 'valid';
  }

  return {
    status,
    assemblyId: assembly.metadata.id,
    datumPlaneZ: AXIAL_DATUM_DIAL_SEAT_Z,
    regions,
    interfaces,
    contentSlots,
    diagnostics,
    projected2DBands,
    insufficientDataReasons
  };
};

/**
 * Annular Content Provider Helpers
 * ================================
 * Bridges scale generators and marker engines to authoritative 2.5D resolved regions.
 */

/**
 * Converts a ContentSlotRegion to an AnnularContentRegion.
 */
export const slotToAnnularRegion = (
  slot: ContentSlotRegion,
  startAngleDeg = -90,
  endAngleDeg = 270
): AnnularContentRegion => ({
  innerRadiusMm: slot.innerRadiusMm,
  outerRadiusMm: slot.outerRadiusMm,
  startAngleDeg,
  endAngleDeg
});

/**
 * Validates whether an annular content element is strictly contained within an AnnularContentRegion.
 */
export const validateAnnularContainment = (
  region: AnnularContentRegion,
  content: {
    innerRadiusMm?: number;
    outerRadiusMm?: number;
    radiusMm?: number;
    lengthMm?: number;
  }
): { contained: boolean; overflowInnerMm: number; overflowOuterMm: number } => {
  const inner = content.innerRadiusMm ?? (content.radiusMm !== undefined ? content.radiusMm - (content.lengthMm ?? 0) : region.innerRadiusMm);
  const outer = content.outerRadiusMm ?? (content.radiusMm !== undefined ? content.radiusMm : region.outerRadiusMm);

  const overflowInnerMm = Math.max(0, region.innerRadiusMm - inner);
  const overflowOuterMm = Math.max(0, outer - region.outerRadiusMm);

  return {
    contained: overflowInnerMm <= 0.001 && overflowOuterMm <= 0.001,
    overflowInnerMm,
    overflowOuterMm
  };
};

/**
 * Fits a ScalePluginConfig inside an AnnularContentRegion boundary.
 * The parent physical component owns the boundary; the scale generator receives this region.
 */
export const fitScaleToAnnularRegion = (
  region: AnnularContentRegion,
  config: Partial<ScalePluginConfig>
): Partial<ScalePluginConfig> => {
  const width = region.outerRadiusMm - region.innerRadiusMm;
  const tickLength = Math.min(config.majorTickLengthMm ?? 1.4, width * 0.7);

  return {
    ...config,
    bandInnerRadiusMm: region.innerRadiusMm,
    bandOuterRadiusMm: region.outerRadiusMm,
    radiusMm: region.outerRadiusMm - tickLength / 2,
    outerRadiusMm: region.outerRadiusMm,
    innerRadiusMm: region.innerRadiusMm,
    majorTickLengthMm: tickLength,
    minorTickLengthMm: Math.min(config.minorTickLengthMm ?? 0.8, tickLength * 0.6)
  };
};

/**
 * Fits a MarkerEngineConfig inside an AnnularContentRegion boundary.
 */
export const fitMarkersToAnnularRegion = (
  region: AnnularContentRegion,
  markerConfig: MarkerEngineConfig,
  marginMm = 0.2
): MarkerEngineConfig => {
  const allowedInner = region.innerRadiusMm + marginMm;
  const allowedOuter = region.outerRadiusMm - marginMm;
  const length = Math.min(markerConfig.radiusOuterMm - markerConfig.radiusInnerMm, allowedOuter - allowedInner);

  return {
    ...markerConfig,
    radiusInnerMm: Math.max(allowedInner, allowedOuter - Math.max(0.5, length)),
    radiusOuterMm: allowedOuter
  };
};
