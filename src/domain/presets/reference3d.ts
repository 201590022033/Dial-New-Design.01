import type { WatchAssembly, WatchAssemblyPartInstance } from '@/domain/assembly/assemblyTypes';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import type { ParametricCaseV1, ParametricCrownV1, ParametricHandSetV1 } from '@/domain/geometry/parametric';
import caseFixture from '../../../tools/blender/test_case_42.json';
import crownFixture from '../../../tools/blender/test_crown_v1.json';
import handsFixture from '../../../tools/blender/test_hand_set_v1.json';

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

const previewSource = 'P5 42 mm visual fixture; seat, stack, crown fit and movement clearances unverified';
const previewProvenance = { status: 'provisional' as const, source: previewSource };

/** An opt-in, fixed-size visual reference; never called by default assembly creation. */
export const applyReference42Preview = (assembly: WatchAssembly): WatchAssembly => {
  const existingCase = assembly.parts['inst-midcase'] ?? createDefaultWatchAssembly().parts['inst-midcase']!;
  const crown = assembly.parts['inst-crown'];
  const hands = assembly.parts['inst-hour-hand'];
  if (!crown || !hands) throw new Error('Reference preview requires crown and hour-hand assembly parts');
  const selected: Record<string, WatchAssemblyPartInstance> = {
    'inst-midcase': {
      ...existingCase, visible: true,
      dimensions: { ...existingCase.dimensions, diameterMm: 42 },
      parametricGeometry: structuredClone(reference42Parameters.case), geometryProvenance: previewProvenance,
      visual: { category: 'case', assetId: 'reference-42-case-preview' }
    },
    'inst-crown': {
      ...crown, visible: true,
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
  return { ...assembly, parts, designConfig: { ...assembly.designConfig, visualReferenceId: undefined } };
};
