import { describe, expect, it } from 'vitest';
import { resolveAttachmentRegion, resolveOuterNeighbor, resolvePhysicalAssembly } from '@/domain/assembly/physicalAssembly';
import { createBand } from '@/domain/bands/bandRegistry';

describe('physical assembly', () => {
  it('separates physical regions from attached component geometry', () => {
    const assembly = resolvePhysicalAssembly([
      createBand('dial', 'dial-face', { innerRadius: 0, outerRadius: 14 }),
      createBand('chapter', 'chapter-ring', { innerRadius: 14.2, outerRadius: 16 }),
      createBand('outer', 'outer-bezel', { innerRadius: 16.2, outerRadius: 20 }),
      createBand('hands', 'hands', { innerRadius: 0, outerRadius: 12 }),
      createBand('text', 'text', { innerRadius: 6, outerRadius: 10 }),
      createBand('date', 'complications', { innerRadius: 7, outerRadius: 9 })
    ]);

    expect(assembly.centerOut.map((region) => region.kind)).toEqual([
      'dial-face',
      'chapter-ring',
      'outer-bezel'
    ]);
    expect(resolveAttachmentRegion(assembly, 'hands')?.kind).toBe('dial-face');
    expect(resolveAttachmentRegion(assembly, 'text')?.kind).toBe('dial-face');
    expect(resolveAttachmentRegion(assembly, 'complications')?.kind).toBe('dial-face');
    expect(resolveAttachmentRegion(assembly, 'scale-generator')?.kind).toBe('chapter-ring');
    expect(resolveOuterNeighbor(assembly, 'chapter-ring')?.kind).toBe('outer-bezel');
  });

  it('falls optional ring attachments back to the dial face', () => {
    const assembly = resolvePhysicalAssembly([
      createBand('dial', 'dial-face', { innerRadius: 0, outerRadius: 17 })
    ]);

    expect(resolveAttachmentRegion(assembly, 'scale-generator')?.kind).toBe('dial-face');
    expect(resolveOuterNeighbor(assembly, 'dial-face')).toBeNull();
  });
});