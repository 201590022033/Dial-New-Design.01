import type { WatchAssembly, WatchAssemblyPartInstance } from '@/domain/assembly/assemblyTypes';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import type { ParametricCaseV1, ParametricCrownV1, ParametricHandSetV1 } from '@/domain/geometry/parametric';
import caseFixture from '../../../tools/blender/test_case_42.json';
import crownFixture from '../../../tools/blender/test_crown_v1.json';
import handsFixture from '../../../tools/blender/test_hand_set_v1.json';
import { CONTROLLED_NMK901_FIXTURE, CONTROLLED_ORDER_ID } from '@/domain/ordering/controlledNmk901Order';

export const REFERENCE_42_ID = 'reference-42-preview/v1';
export const reference42Parameters = {
  case: caseFixture as ParametricCaseV1,
  crown: crownFixture as ParametricCrownV1,
  hands: handsFixture as ParametricHandSetV1
};

/** Fixed GLBs are valid only for the exact generated fixture parameters. */
export const matchesReference42Parameters = (assembly: WatchAssembly): boolean =>
  assembly.designConfig?.visualReferenceId === REFERENCE_42_ID &&
  JSON.stringify(assembly.parts['inst-midcase']?.parametricGeometry) === JSON.stringify(reference42Parameters.case) &&
  JSON.stringify(assembly.parts['inst-crown']?.parametricGeometry) === JSON.stringify(reference42Parameters.crown) &&
  JSON.stringify(assembly.parts['inst-hour-hand']?.parametricGeometry) === JSON.stringify(reference42Parameters.hands);

const previewSource = 'P7 NMK901 controlled reference; supplied PDFs plus ESTIMATED_NOMINAL interface baselines; preview geometry, not production approval';
const previewProvenance = { status: 'provisional' as const, source: previewSource };
const unknownEvidence = (source: string) => ({ status: 'provisional' as const, source });
const specifiedEvidence = (source: string) => ({ status: 'specified' as const, source });
const nominal = CONTROLLED_NMK901_FIXTURE.fields;

export const reference42NominalInterfaces = {
  springBarHoleDiameterMm: nominal.springHoleDiameter.value,
  springBarHoleFromLugTipMm: nominal.springHoleXy.value.fromLugTipMm,
  springBarHoleFromLowerLugEdgeMm: nominal.springHoleXy.value.fromLowerLugEdgeMm,
  dialSeatDepthMm: nominal.dialSeatZ.value,
  chapterRingSeatDepthMm: nominal.chapterSeatZ.value,
  crownTubeThreadOuterDiameterMm: nominal.crownTubeThreadOuterDiameter.value,
  crownTubeThreadPitchMm: nominal.crownTubeThreadPitch.value,
  crownTubeBoreMm: nominal.crownTubeBore.value,
  stemEngagementMm: nominal.stemEngagementLength.value,
  crystalAxialSeatDepthMm: nominal.crystalAxialSeatZ.value,
  handCrystalClearanceMm: nominal.handCrystalClearance.value
} as const;

/** An opt-in, fixed-size visual reference; never called by default assembly creation. */
export const applyReference42Preview = (assembly: WatchAssembly): WatchAssembly => {
  const existingCase = assembly.parts['inst-midcase'] ?? createDefaultWatchAssembly().parts['inst-midcase']!;
  const crown = assembly.parts['inst-crown'];
  const hands = assembly.parts['inst-hour-hand'];
  if (!crown || !hands) throw new Error('Reference preview requires crown and hour-hand assembly parts');
  const selected: Record<string, WatchAssemblyPartInstance> = {
    'inst-midcase': {
      ...existingCase, visible: true,
      dimensions: { ...existingCase.dimensions, diameterMm: 42, widthMm: 22, thicknessMm: 10.2 },
      parametricGeometry: structuredClone(reference42Parameters.case), geometryProvenance: previewProvenance,
      visual: { category: 'case', assetId: 'reference-42-case-preview' }
    },
    'inst-crown': {
      ...crown, visible: true,
      dimensions: { ...crown.dimensions, diameterMm: 7, widthMm: 7, thicknessMm: 4.9 },
      parametricGeometry: structuredClone(reference42Parameters.crown), geometryProvenance: previewProvenance,
      visual: { category: 'crown', assetId: 'reference-42-crown-preview' }
    },
    'inst-hour-hand': {
      ...hands, visible: true,
      parametricGeometry: structuredClone(reference42Parameters.hands), geometryProvenance: previewProvenance,
      visual: { category: 'hands', assetId: 'reference-42-hands-preview' }
    }
  };
  const diameter = reference42Parameters.case.caseDiameter;
  const caseHeight = reference42Parameters.case.midcaseHeight;
  if (typeof diameter !== 'number' || typeof caseHeight !== 'number') throw new Error('Reference case dimensions must be known');
  const tubeEnd = diameter / 2 - Number(reference42Parameters.case.crownTubeEmbed) + Number(reference42Parameters.case.crownTubeLength);
  return {
    ...assembly,
    globalDimensions: { ...assembly.globalDimensions, caseDiameterMm: diameter },
    parts: { ...assembly.parts, ...selected },
    partOrder: assembly.partOrder.includes('inst-midcase') ? [...assembly.partOrder] : ['inst-midcase', ...assembly.partOrder],
    designConfig: {
      ...assembly.designConfig,
      geometryParameters: { ...assembly.designConfig?.geometryParameters, caseDiameterMm: diameter },
      visualReferenceId: REFERENCE_42_ID,
      controlledOrderId: CONTROLLED_ORDER_ID,
      fitEvidence: {
        strapInterface: unknownEvidence(`NMK901 publishes 22 mm lug width and 46 mm lug-to-lug; spring-bar hole baseline ${reference42NominalInterfaces.springBarHoleDiameterMm} mm / ${reference42NominalInterfaces.springBarHoleFromLugTipMm} mm from lug tip is ESTIMATED_NOMINAL ±${nominal.springHoleDiameter.uncertaintyMm} mm`),
        movementHandBores: specifiedEvidence('TMI NH35A post geometry and nominal NH35-compatible hand bores 1.50 / 0.90 / 0.20 mm are recorded; broach tolerances remain unverified'),
        crownEngagement: unknownEvidence(`CT208-class crown head is published at 7.0 x 4.9 mm; ESTIMATED_NOMINAL tube M3.5 x ${reference42NominalInterfaces.crownTubeThreadPitchMm} mm, bore ${reference42NominalInterfaces.crownTubeBoreMm} mm and stem engagement ${reference42NominalInterfaces.stemEngagementMm} mm remain to be measured`),
        dialSeat: unknownEvidence(`28.5 mm dial and CT252 chapter-ring geometry are published; ESTIMATED_NOMINAL dial/chapter seat depths are ${reference42NominalInterfaces.dialSeatDepthMm} / ${reference42NominalInterfaces.chapterRingSeatDepthMm} mm`),
        handStack: unknownEvidence('Visual frame only; measured axial stack evidence not supplied'),
        crystalClearance: unknownEvidence(`31.5 mm crystal diameter and 5.1 mm middle thickness are published; ESTIMATED_NOMINAL axial seat ${reference42NominalInterfaces.crystalAxialSeatDepthMm} mm and hand clearance ${reference42NominalInterfaces.handCrystalClearanceMm} mm remain to be measured`),
        pusherEngagement: specifiedEvidence('NMK901 is a non-chronograph case with no pusher interfaces; pusher engagement is not applicable'),
        pusherClearance: specifiedEvidence('NMK901 is a non-chronograph case with no pusher interfaces; pusher clearance is not applicable')
      },
      assemblyAnchors: {
        ...assembly.designConfig?.assemblyAnchors,
        'watch-axis': { positionMm: [0, 0, 0], rotationRad: [0, 0, 0], provenance: { status: 'specified', source: 'Engineering coordinate convention' } },
        'dial-seat': { positionMm: [0, 0, caseHeight / 2], rotationRad: [0, 0, 0], provenance: previewProvenance },
        // Existing hand generator bakes reference Z offsets 1.0/1.45/1.9 mm.
        // This preview frame clears the schematic dial/glass only; not a movement stack measurement.
        'hand-stack': { positionMm: [0, 0, 2.85], rotationRad: [0, 0, 0], provenance: previewProvenance },
        'crown-interface': { positionMm: [tubeEnd, 0, 0], rotationRad: [0, 0, 0], provenance: previewProvenance }
      }
    }
  };
};

/** Switch only this preview's assets off; preserve authored parameters and frames. */
export const useProceduralReference42 = (assembly: WatchAssembly): WatchAssembly => {
  if (assembly.designConfig?.visualReferenceId !== REFERENCE_42_ID) return assembly;
  const parts = { ...assembly.parts };
  for (const [instanceId, category] of [['inst-midcase', 'case'], ['inst-crown', 'crown'], ['inst-hour-hand', 'hands']] as const) {
    const part = parts[instanceId];
    if (part?.visual?.assetId === `reference-42-${category}-preview`) {
      parts[instanceId] = { ...part, visual: { ...part.visual, assetId: undefined } };
    }
  }
  return { ...assembly, parts, designConfig: { ...assembly.designConfig, visualReferenceId: undefined, controlledOrderId: undefined } };
};
