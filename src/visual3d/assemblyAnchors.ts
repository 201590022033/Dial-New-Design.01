import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import type { AssemblyAnchors, ParametricCaseV1, Vector3Tuple } from '@/domain/geometry/parametric';
import { resolveCanonicalCrownAxis } from './canonicalCrownAxis';

export const MM_TO_SCENE = 0.1;
export const finiteVector = (v: unknown): v is Vector3Tuple => Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === 'number' && Number.isFinite(n));

/** Matches the existing case generator's outer tube end, not the boss or crown head. */
export const caseCrownInterfacePosition = (c: ParametricCaseV1): Vector3Tuple | undefined => {
  const values = [c.caseDiameter, c.crownTubeEmbed, c.crownTubeLength];
  if (!values.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0)) return undefined;
  return [(c.caseDiameter as number) / 2 - (c.crownTubeEmbed as number) + (c.crownTubeLength as number), 0, 0];
};

/** Computes the outer tube-end position for a chronograph pusher at a given angle (degrees, 0° = 3h). */
export const casePusherInterfacePosition = (c: ParametricCaseV1, angleDeg: number): Vector3Tuple | undefined => {
  const values = [c.caseDiameter, c.pusherTubeEmbed, c.pusherTubeLength];
  if (!values.every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0)) return undefined;
  const r = (c.caseDiameter as number) / 2 - (c.pusherTubeEmbed as number) + (c.pusherTubeLength as number);
  const theta = (angleDeg * Math.PI) / 180;
  return [r * Math.cos(theta), r * Math.sin(theta), 0];
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
    'crown-interface': preview([radius, 0, 0]),
    'pusher-2h': preview([radius * Math.cos(Math.PI / 3), radius * Math.sin(Math.PI / 3), 0]),
    'pusher-4h': preview([radius * Math.cos(-Math.PI / 3), radius * Math.sin(-Math.PI / 3), 0])
  };
  const tubeEnd = caseParams && caseCrownInterfacePosition(caseParams);
  const casePart = Object.values(assembly.parts).find(part => part.visual?.category === 'case');
  const crownAngle = casePart?.customProperties?.visualCrownAngleDeg;
  if (!tubeEnd && typeof crownAngle === 'number' && Number.isFinite(crownAngle)) {
    const angle = crownAngle * Math.PI / 180;
    anchors['crown-interface'] = { ...preview([radius * Math.cos(angle), radius * Math.sin(angle), 0]), rotationRad: [0, 0, angle] };
  }
  if (tubeEnd) anchors['crown-interface'] = { ...preview(tubeEnd), provenance: { status: 'specified', source: 'parametric-case/v1 tube end; supplied parameters, not manufacturing verification' } };
  if (caseParams && caseParams.pusherCount > 0) {
    const pusher2h = casePusherInterfacePosition(caseParams, 60 + (typeof caseParams.pusherAngularOffsetDeg === 'number' ? caseParams.pusherAngularOffsetDeg : 0));
    const pusher4h = casePusherInterfacePosition(caseParams, -60 + (typeof caseParams.pusherAngularOffsetDeg === 'number' ? caseParams.pusherAngularOffsetDeg : 0));
    if (pusher2h) anchors['pusher-2h'] = { ...preview(pusher2h), provenance: { status: 'specified', source: 'parametric-case/v1 pusher tube end; supplied parameters, not manufacturing verification' } };
    if (pusher4h) anchors['pusher-4h'] = { ...preview(pusher4h), provenance: { status: 'specified', source: 'parametric-case/v1 pusher tube end; supplied parameters, not manufacturing verification' } };
  }
  for (const id of Object.keys(anchors) as (keyof AssemblyAnchors)[]) {
    const supplied = assembly.designConfig?.assemblyAnchors?.[id];
    if (supplied && finiteVector(supplied.positionMm) && finiteVector(supplied.rotationRad) && supplied.provenance?.source && ['specified', 'provisional'].includes(supplied.provenance.status)) anchors[id] = supplied;
  }
  const canonical = resolveCanonicalCrownAxis(assembly);
  if (canonical.present) {
    // Modern case datum is the single source. Legacy saved anchors remain stored
    // but inactive for this axis; unknown datums must not masquerade as 3h fit.
    anchors['crown-interface'] = canonical.frame
      ? { ...canonical.frame, provenance: { status: 'provisional', source: `crown-axis/v1 ${canonical.datum!.axisId}; authored placement, not mechanical fit verification` } }
      : { ...preview([0, 0, 0]), provenance: { status: 'provisional', source: 'crown-axis/v1 unresolved; operating head is omitted from visual preview' } };
  }
  return anchors;
};
