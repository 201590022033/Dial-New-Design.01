import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createPreviewChapterRingGeometry, PREVIEW_CHAPTER_FACE_OFFSET_MM } from '@/visual3d/proceduralEnvelope';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { scaleArtworkSurfaceZ } from '@/visual3d/scaleArtworkEnvelope';
import type { ScaleRunResult } from '@/services/scaleEngineService';
import { visualAssetRegistry } from '@/visual3d/visualAssetRegistry';

describe('procedural chapter ring print surface', () => {
  it.each([[14.05, 15.25], [13, 16], [10, 11]])('preserves selected radii %s–%s and keeps every carrier vertex below print', (inner, outer) => {
    const geometry = createPreviewChapterRingGeometry(inner, outer);
    const positions = geometry.getAttribute('position');
    const radii = Array.from({ length: positions.count }, (_, index) => Math.hypot(positions.getX(index), positions.getY(index)));
    expect(Math.min(...radii)).toBeCloseTo(inner, 5);
    expect(Math.max(...radii)).toBeCloseTo(outer, 5);
    expect(geometry.boundingBox!.max.z).toBeCloseTo(PREVIEW_CHAPTER_FACE_OFFSET_MM);
    const model = watchAssemblyToVisualModel(createDefaultWatchAssembly());
    const printZ = scaleArtworkSurfaceZ(model, 'inner', { fixedPlacementTargetBandId: 'band-chapter-ring' } as ScaleRunResult);
    expect(model.previewEnvelope.chapterZ+geometry.boundingBox!.max.z).toBeLessThan(printZ);
    expect(printZ).toBeLessThan(model.previewEnvelope.crystalZ-model.previewEnvelope.crystalThickness/2);
    geometry.dispose();
  });
  it('refuses degenerate physical chapter dimensions', () => {
    expect(() => createPreviewChapterRingGeometry(15, 14)).toThrow('Invalid chapter ring');
  });
  it('maps every authored 42 mm chapter-ring UV to the same watch-axis physical millimetres', () => {
    const descriptor = visualAssetRegistry['archetype-chapter-ring-pilot']!;
    const binary = readFileSync(resolve(process.cwd(), 'public'+descriptor.assetPath));
    const jsonLength = binary.readUInt32LE(12), binaryOffset = 20+jsonLength+8;
    const glb = JSON.parse(binary.subarray(20, 20+jsonLength).toString('utf8')) as {
      nodes: Array<{ name: string; mesh: number }>;
      meshes: Array<{ primitives: Array<{ attributes: Record<string, number> }> }>;
      accessors: Array<{ count: number; bufferView: number; byteOffset?: number }>;
      bufferViews: Array<{ byteOffset: number; byteStride?: number }>;
    };
    const surface = glb.nodes.find((node) => node.name === 'DD_SCALE_SURFACE_INNER')!;
    const attributes = glb.meshes[surface.mesh]!.primitives[0]!.attributes;
    const p = glb.accessors[attributes.POSITION!]!, uv = glb.accessors[attributes.TEXCOORD_0!]!;
    const vertex = (accessor: typeof p, index: number, component: number, dimensions: number) => {
      const view = glb.bufferViews[accessor.bufferView]!;
      return binary.readFloatLE(binaryOffset+view.byteOffset+(accessor.byteOffset ?? 0)+index*(view.byteStride ?? dimensions*4)+component*4);
    };
    expect(descriptor.referenceCaseDiameterMm).toBe(42);
    expect(p.count).toBe(uv.count);
    for (let index = 0; index < p.count; index++) {
      // GLTF export also flips UV V: map with Texture.flipY=false, never planeGeometry's default true.
      expect(vertex(uv,index,0,2)).toBeCloseTo(vertex(p,index,0,3)/42+0.5, 6);
      expect(vertex(uv,index,1,2)).toBeCloseTo(vertex(p,index,2,3)/42+0.5, 6);
    }
  });
});
