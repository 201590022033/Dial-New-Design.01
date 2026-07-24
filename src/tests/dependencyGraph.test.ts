import { describe, expect, it } from 'vitest';
import { createBand } from '@/domain/bands/bandRegistry';
import { buildDependencyGraph, markDirtyFromNode } from '@/domain/geometry/dependencyGraph';

describe('dependency graph', () => {
  it('tracks parent-child dependencies and dirty propagation', () => {
    const outer = createBand('band-outer', 'outer-bezel', { innerRadius: 18, outerRadius: 20 });
    const inner = createBand('band-inner', 'inner-bezel', { innerRadius: 16, outerRadius: 18 });
    const chapter = createBand('band-chapter', 'chapter-ring', { innerRadius: 14, outerRadius: 16 });

    outer.childBandIds = [inner.id];
    inner.parentBandId = outer.id;
    inner.childBandIds = [chapter.id];
    chapter.parentBandId = inner.id;

    const graph = buildDependencyGraph([outer, inner, chapter]);
    const dirty = markDirtyFromNode(graph, outer.id);

    expect(dirty.nodes[outer.id]?.dirty).toBe(true);
    expect(dirty.nodes[inner.id]?.dirty).toBe(true);
    expect(dirty.nodes[chapter.id]?.dirty).toBe(true);
    expect(graph.hasCircularDependency).toBe(false);
  });
});
