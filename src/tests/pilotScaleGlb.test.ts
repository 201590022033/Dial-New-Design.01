import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { visualAssetRegistry } from '@/visual3d/visualAssetRegistry';

type GlbJson = {
  nodes: Array<{ name: string; mesh?: number; extras?: Record<string, number> }>;
  meshes: Array<{ primitives: Array<{ attributes: Record<string, number> }> }>;
};

describe('Blender pilot logarithmic scale surfaces', () => {
  it('includes the characteristic Mercedes hour-head and three spokes in the actual hand GLB', () => {
    const descriptor = visualAssetRegistry['hands-mercedes-42']!;
    const binary = readFileSync(resolve(process.cwd(), 'public' + descriptor.assetPath));
    const glb = JSON.parse(binary.subarray(20, 20 + binary.readUInt32LE(12)).toString('utf8')) as GlbJson;
    expect(glb.nodes.some((node) => node.name === 'DD_HAND_HOUR_MERCEDES_RIM')).toBe(true);
    expect(glb.nodes.filter((node) => node.name.startsWith('DD_HAND_HOUR_MERCEDES_SPOKE_'))).toHaveLength(3);
  });
  it.each(['outer', 'inner'] as const)('contains the %s ring geometry, default numerals and planar UVs', (ring) => {
    const descriptor = visualAssetRegistry[ring === 'outer' ? 'archetype-bezel-pilot' : 'archetype-chapter-ring-pilot']!;
    const binary = readFileSync(resolve(process.cwd(), 'public' + descriptor.assetPath));
    const glb = JSON.parse(binary.subarray(20, 20 + binary.readUInt32LE(12)).toString('utf8')) as GlbJson;
    const surface = glb.nodes.find((node) => node.name === `DD_SCALE_SURFACE_${ring.toUpperCase()}`)!;
    expect(surface).toBeDefined();
    expect(surface.extras?.DD_SCALE_UV_DIAMETER_MM).toBe(42);
    expect(glb.meshes[surface.mesh!]!.primitives[0]!.attributes.TEXCOORD_0).toBeDefined();
    expect(glb.nodes.some((node) => node.name === `DD_PILOT_SCALE_${ring.toUpperCase()}_LABEL_10`)).toBe(true);
    expect(glb.nodes.some((node) => node.name === `DD_PILOT_SCALE_${ring.toUpperCase()}_TICK_60`)).toBe(true);
    expect(surface.extras?.DD_SCALE_OUTER_RADIUS_MM).toBe(descriptor.scaleArtworkOuterRadiusMm);
    if (ring === 'inner') {
      const top = descriptor.offset![2] + surface.extras!.DD_SCALE_SURFACE_Z_MM!;
      expect(top).toBeLessThan(6.25 - 1.5 / 2);
    }
  });
});
