import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Path, Shape } from 'three';
import type { ParametricCaseV1 } from '@/domain/geometry/parametric';
import caseFixture from '../../tools/blender/test_case_42.json';
import faceFixture from '../../tools/blender/reference_42_supplemental.json';
import attachmentSpec from '../../tools/blender/attachment_preview.json';

const positive = (n: unknown, fallback: number): number => typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : fallback;

/** Presentation envelope only; never writes dimensions or fit evidence back to the assembly. */
export const resolveProceduralEnvelope = (diameter: number, height: number, parameters?: ParametricCaseV1, faceFrameHeight = height) => {
  const scale = diameter / caseFixture.caseDiameter;
  const zShift = faceFrameHeight / 2 - caseFixture.midcaseHeight / 2;
  const rootWidth = positive(parameters?.lugRootWidth, caseFixture.lugRootWidth * scale);
  const gap = positive(parameters?.lugPairGap, caseFixture.lugPairGap * scale);
  const rootRadius = diameter / 2 - positive(parameters?.lugCaseOverlap, caseFixture.lugCaseOverlap * scale);
  const tipY = positive(parameters?.lugToLug, caseFixture.lugToLug * scale) / 2;
  const thickness = positive(parameters?.lugThickness, caseFixture.lugThickness * scale);
  const drop = positive(parameters?.lugTipDrop, caseFixture.lugTipDrop * scale);
  const barY = tipY - positive(parameters?.springBarHoleFromLugTip, caseFixture.springBarHoleFromLugTip * scale);
  const barZ = -drop / 2 - thickness / 2 + positive(parameters?.springBarHoleFromLowerLugEdge, caseFixture.springBarHoleFromLowerLugEdge * scale);
  const strapThickness = attachmentSpec.strapThicknessMm * scale;
  return {
    attachment: {
      status: attachmentSpec.status, barY, barZ, gap,
      strapWidth: gap - 2 * attachmentSpec.strapSideClearanceMm * scale,
      strapThickness, strapLength: 58 * scale,
      boreRadius: attachmentSpec.strapBoreRadiusMm * scale,
      bodyRadius: attachmentSpec.springBarBodyRadiusMm * scale,
      tipRadius: attachmentSpec.springBarTipRadiusMm * scale,
      tipEngagement: attachmentSpec.springBarTipEngagementMm * scale,
      notchY: barY - strapThickness / 2 - attachmentSpec.caseClearanceMm * scale,
      notchTop: barZ + strapThickness / 2 + attachmentSpec.caseClearanceMm * scale
    },
    lugs: {
      gap, rootWidth,
      tipWidth: positive(parameters?.lugTipWidth, caseFixture.lugTipWidth * scale),
      thickness, drop,
      rootY: Math.sqrt(Math.max(0, rootRadius ** 2 - (gap / 2 + rootWidth / 2) ** 2)),
      tipY
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

type Attachment = ReturnType<typeof resolveProceduralEnvelope>['attachment'];

/** Rounded, bored strap end. Its bore and spring bar share the lug-hole datum. */
export const createPreviewStrapGeometry = (a: Attachment, sign: number) => {
  const r = a.strapThickness / 2;
  const shape = new Shape();
  shape.moveTo(a.barY, a.barZ - r);
  shape.lineTo(a.barY + a.strapLength, a.barZ - r);
  shape.lineTo(a.barY + a.strapLength, a.barZ + r);
  shape.lineTo(a.barY, a.barZ + r);
  shape.absarc(a.barY, a.barZ, r, Math.PI / 2, 3 * Math.PI / 2, false);
  shape.closePath();
  const hole = new Path();
  hole.absarc(a.barY, a.barZ, a.boreRadius, 0, 2 * Math.PI, true);
  shape.holes.push(hole);
  const geometry = new ExtrudeGeometry(shape, { depth: a.strapWidth, bevelEnabled: false, curveSegments: 32 });
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getX(i), z = positions.getY(i);
    const taper = 1 - Math.max(0, (y - a.barY) / a.strapLength) * .16;
    positions.setXYZ(i, (positions.getZ(i) - a.strapWidth / 2) * taper, sign * y, z);
  }
  // Mapping YZ + extrusion to XYZ preserves winding only on the 12 h end.
  if (sign < 0) {
    for (let i = 0; i < positions.count; i += 3) {
      const b = [positions.getX(i + 1), positions.getY(i + 1), positions.getZ(i + 1)];
      positions.setXYZ(i + 1, positions.getX(i + 2), positions.getY(i + 2), positions.getZ(i + 2));
      positions.setXYZ(i + 2, b[0]!, b[1]!, b[2]!);
    }
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
};

/** Closed ring with underside strap pockets; leaves the face stack untouched. */
export const createPreviewCaseGeometry = (radius: number, height: number, a: Attachment) => {
  const profile: Array<[number, number, boolean]> = [
    [radius * .78, -height / 2, true], [radius * .95, -height / 2, true],
    [radius, -height / 2 + .5, true], [radius, a.notchTop, true],
    [radius, a.notchTop, false], [radius, height / 2 - .5, false],
    [radius * .95, height / 2, false], [radius * .78, height / 2, false]
  ];
  const segments = 192, positions: number[] = [], indices: number[] = [];
  for (const [r, z, clipped] of profile) {
    for (let i = 0; i < segments; i++) {
      const theta = i * 2 * Math.PI / segments;
      positions.push(r * Math.cos(theta), clipped ? Math.max(-a.notchY, Math.min(a.notchY, r * Math.sin(theta))) : r * Math.sin(theta), z);
    }
  }
  for (let ring = 0; ring < profile.length; ring++) for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments, upper = (ring + 1) % profile.length;
    const v = ring * segments + i, w = ring * segments + next;
    const x = upper * segments + next, y = upper * segments + i;
    indices.push(v, w, x, v, x, y);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
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
