import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { ParametricCaseV1 } from '@/domain/geometry/parametric';
import caseFixture from '../../tools/blender/test_case_42.json';
import faceFixture from '../../tools/blender/reference_42_supplemental.json';

const positive = (n: unknown, fallback: number): number => typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : fallback;

/** Presentation envelope only; never writes dimensions or fit evidence back to the assembly. */
export const resolveProceduralEnvelope = (diameter: number, height: number, parameters?: ParametricCaseV1, faceFrameHeight = height) => {
  const scale = diameter / caseFixture.caseDiameter;
  const zShift = faceFrameHeight / 2 - caseFixture.midcaseHeight / 2;
  const rootWidth = positive(parameters?.lugRootWidth, caseFixture.lugRootWidth * scale);
  const gap = positive(parameters?.lugPairGap, caseFixture.lugPairGap * scale);
  const rootRadius = diameter / 2 - positive(parameters?.lugCaseOverlap, caseFixture.lugCaseOverlap * scale);
  return {
    lugs: {
      gap, rootWidth,
      tipWidth: positive(parameters?.lugTipWidth, caseFixture.lugTipWidth * scale),
      thickness: positive(parameters?.lugThickness, caseFixture.lugThickness * scale),
      drop: positive(parameters?.lugTipDrop, caseFixture.lugTipDrop * scale),
      rootY: Math.sqrt(Math.max(0, rootRadius ** 2 - (gap / 2 + rootWidth / 2) ** 2)),
      tipY: positive(parameters?.lugToLug, caseFixture.lugToLug * scale) / 2
    },
    dialZ: faceFixture.placement.dialCenterZMm + zShift,
    chapterZ: faceFixture.placement.chapterRingCenterZMm + zShift,
    bezelZ: faceFixture.placement.bezelCenterZMm + zShift,
    crystalZ: faceFixture.placement.crystalCenterZMm + zShift,
    handsZ: faceFixture.placement.dialCenterZMm + zShift + 0.65,
    crystalRadius: faceFixture.crystal.outerDiameterMm / 2,
    crystalThickness: faceFixture.crystal.thicknessMm,
    // Top = crystal top + 0.05 mm. A seat wall, not a decorative torus.
    bezelHeight: 2.8,
    bezelInnerRadius: faceFixture.crystal.outerDiameterMm / 2,
    bezelOuterRadius: faceFixture.bezel.outerDiameterMm * scale / 2
  };
};

/** Same eased, full-depth lug section as the authored conventional-lug generator. */
export const createPreviewLugGeometry = (lugs: ReturnType<typeof resolveProceduralEnvelope>['lugs'], side: number, end: number) => {
  const vertices: number[] = [];
  const indices: number[] = [];
  const sections = [0, 0.18, 0.42, 0.68, 0.86, 1];
  for (const t of sections) {
    const eased = t * t * (3 - 2 * t);
    const width = lugs.rootWidth + (lugs.tipWidth - lugs.rootWidth) * eased;
    const x = side * (lugs.gap / 2 + width / 2);
    const y = end * (lugs.rootY + (lugs.tipY - lugs.rootY) * t);
    const z = -lugs.drop * (0.12 + 0.38 * eased);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      vertices.push(x + sx! * width / 2, y, z + sz! * lugs.thickness / 2);
    }
  }
  const quad = (a: number, b: number, c: number, d: number) => {
    if (end > 0) indices.push(a, b, c, a, c, d);
    else indices.push(a, c, b, a, d, c);
  };
  quad(0, 1, 2, 3);
  const last = (sections.length - 1) * 4;
  quad(last, last + 3, last + 2, last + 1);
  for (let section = 0; section < sections.length - 1; section++) {
    for (let edge = 0; edge < 4; edge++) {
      const a = section * 4 + edge;
      const b = section * 4 + (edge + 1) % 4;
      quad(a, a + 4, b + 4, b);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
};
