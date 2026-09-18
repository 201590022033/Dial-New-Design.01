import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { AssemblyAnchors, ParametricCaseV1, Vector3Tuple } from '@/domain/geometry/parametric';

export const MM_TO_SCENE = 0.1;
export const finiteVector = (v: unknown): v is Vector3Tuple => Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === 'number' && Number.isFinite(n));

/** Matches the existing case generator's outer tube end, not the boss or crown head. */
export const caseCrownInterfacePosition = (c: ParametricCaseV1): Vector3Tuple | undefined => {
  const values = [c.caseDiameter, c.crownTubeEmbed, c.crownTubeLength];
  if (!values.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0)) return undefined;
  return [(c.caseDiameter as number) / 2 - (c.crownTubeEmbed as number) + (c.crownTubeLength as number), 0, 0];
};

export const resolveAssemblyAnchors = (assembly: WatchAssembly, caseParams?: ParametricCaseV1): AssemblyAnchors => {
  const diameter = assembly.globalDimensions.caseDiameterMm;
  const thickness = assembly.globalDimensions.totalThicknessMm;
  const radius = (Number.isFinite(diameter) && diameter > 0 ? diameter : 40) / 2;
  const height = Number.isFinite(thickness) && thickness > 0 ? thickness : 12.5;
  const preview = (positionMm: Vector3Tuple) => ({ positionMm, rotationRad: [0, 0, 0] as Vector3Tuple, provenance: { status: 'provisional' as const, source: 'Schematic preview placement; seat/stack/stem dimensions unverified' } });
  const anchors: AssemblyAnchors = {
    'watch-axis': { positionMm: [0, 0, 0], rotationRad: [0, 0, 0], provenance: { status: 'specified', source: 'Engineering coordinate convention' } },
    'dial-seat': preview([0, 0, height / 2]),
    'hand-stack': preview([0, 0, height / 2 + 0.8]),
    'crown-interface': preview([radius, 0, 0])
  };
  const tubeEnd = caseParams && caseCrownInterfacePosition(caseParams);
  if (tubeEnd) anchors['crown-interface'] = { ...preview(tubeEnd), provenance: { status: 'specified', source: 'parametric-case/v1 tube end; supplied parameters, not manufacturing verification' } };
  for (const id of Object.keys(anchors) as (keyof AssemblyAnchors)[]) {
    const supplied = assembly.designConfig?.assemblyAnchors?.[id];
    if (supplied && finiteVector(supplied.positionMm) && finiteVector(supplied.rotationRad) && supplied.provenance?.source && ['specified', 'provisional'].includes(supplied.provenance.status)) anchors[id] = supplied;
  }
  return anchors;
};
