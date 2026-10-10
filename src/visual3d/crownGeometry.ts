import { BufferGeometry, Float32BufferAttribute } from 'three';

export type CrownSurface = { shape: string; grip: string; coreDiameterMm: number; maximumOuterDiameterMm: number; lengthMm: number };

/** Closed visual head, rear at x=0 and outward +X. No invented physical bore. */
export const createCrownGeometry = (p: CrownSurface): BufferGeometry => {
  const positions: number[] = [], indices: number[] = [];
  const segments = 128, rings = 24;
  const teeth = p.grip === 'coarse-fluted' ? 16 : p.grip === 'smooth' ? 0 : 32;
  for (let j = 0; j <= rings; j++) {
    const t = j / rings;
    const profile = p.shape === 'onion' ? .62 + .38 * Math.sin(Math.PI * t) : .94 + .06 * Math.min(1, t * 12, (1 - t) * 12);
    for (let i = 0; i < segments; i++) {
      const a = i / segments * Math.PI * 2;
      const relief = !teeth ? 0 : p.grip === 'cross-knurled'
        ? (2 + Math.cos(teeth * a + t * Math.PI * 4) + Math.cos(teeth * a - t * Math.PI * 4)) / 4
        : (1 + Math.cos(teeth * a)) / 2;
      const radius = profile * (p.coreDiameterMm / 2 + (p.maximumOuterDiameterMm - p.coreDiameterMm) / 2 * relief);
      positions.push(t * p.lengthMm, radius * Math.cos(a), radius * Math.sin(a));
      if (j < rings) { const k = j * segments + i, next = j * segments + (i + 1) % segments; indices.push(k, next, k + segments, next, next + segments, k + segments); }
    }
  }
  const rear = positions.length / 3; positions.push(0, 0, 0, p.lengthMm, 0, 0);
  for (let i = 0; i < segments; i++) { const n = (i + 1) % segments; indices.push(rear, n, i, rear + 1, rings * segments + i, rings * segments + n); }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingBox();
  return geometry;
};
