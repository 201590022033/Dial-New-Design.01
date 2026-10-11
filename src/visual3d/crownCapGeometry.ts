import { LatheGeometry, Vector2 } from 'three';
import type { CrownSurface } from './crownGeometry';
import { validCapConcept, type CrownCapConcept } from '@/domain/crown/edit';

/** Generic envelope only: no thread, seal, hinge, extraction control or lock. */
export const crownCapEnvelope = (surface: CrownSurface, concept: CrownCapConcept) => {
  if (!validCapConcept(concept) || !Number.isFinite(surface.maximumOuterDiameterMm) || surface.maximumOuterDiameterMm <= 0 || !Number.isFinite(surface.lengthMm) || surface.lengthMm <= 0) throw new Error('Invalid crown cap concept dimensions');
  const innerRadius = surface.maximumOuterDiameterMm / 2 + concept.clearanceMm;
  return { innerRadius, outerRadius: innerRadius + concept.wallMm, innerLength: surface.lengthMm + concept.clearanceMm,
    capOffsetX: concept.state === 'open' ? surface.lengthMm + concept.clearanceMm + 2 : 0,
    holderRearX: -.8, holderFrontX: -.1, presentationOnly: true as const, orderable: false as const };
};
const latheX = (points: number[][]) => {
  const geometry = new LatheGeometry(points.map(([radius, x]) => new Vector2(radius, x)), 96);
  geometry.rotateZ(-Math.PI / 2); geometry.computeBoundingBox();
  return geometry;
};
export const createCrownCapGeometry = (surface: CrownSurface, concept: CrownCapConcept) => {
  const e = crownCapEnvelope(surface, concept);
  const cap = latheX([[e.innerRadius, 0], [e.outerRadius, 0], [e.outerRadius, e.innerLength + concept.wallMm], [0, e.innerLength + concept.wallMm], [0, e.innerLength], [e.innerRadius, e.innerLength], [e.innerRadius, 0]]);
  const holder = latheX([[e.innerRadius, e.holderRearX], [e.outerRadius + .4, e.holderRearX], [e.outerRadius + .4, e.holderFrontX], [e.innerRadius, e.holderFrontX], [e.innerRadius, e.holderRearX]]);
  cap.translate(e.capOffsetX, 0, 0); cap.computeBoundingBox();
  return { cap, holder, envelope: e };
};
