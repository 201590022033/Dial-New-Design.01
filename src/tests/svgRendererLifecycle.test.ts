import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SvgRenderer } from '@/renderer/svgRenderer';
import { createDefaultWatchAssembly } from '@/domain/assembly';
import type { RendererOptions } from '@/renderer/types';

const svg = vi.hoisted(() => {
  const node: Record<string, unknown> = { node: { setAttribute: vi.fn() } };
  for (const method of ['addTo', 'size', 'clear', 'remove', 'group', 'id', 'attr', 'css', 'line', 'stroke', 'circle', 'center', 'fill', 'path', 'front']) {
    node[method] = vi.fn(() => node);
  }
  node.findOne = vi.fn(() => null);
  return node;
});
vi.mock('@svgdotjs/svg.js', () => ({ SVG: () => svg }));

describe('engineering renderer lifecycle', () => {
  beforeEach(() => vi.clearAllMocks());
  const context = { width: 800, height: 600, centerX: 400, centerY: 300, zoom: 1, panX: 0, panY: 0 };
  const options: RendererOptions = { showGuides: false, showSnapping: false, scalePreview: null, designOverlay: null, highlightedBandIds: [], assembly: createDefaultWatchAssembly() };

  it('redraws identical inputs after switching away and remounting', () => {
    const renderer = new SvgRenderer();
    const container = {} as HTMLElement;
    renderer.mount(container);
    renderer.renderBands([], context, options);
    expect(svg.clear).toHaveBeenCalledTimes(1);
    renderer.renderBands([], context, options);
    expect(svg.clear).toHaveBeenCalledTimes(1);
    renderer.unmount();
    renderer.mount(container);
    vi.mocked(svg.clear as () => void).mockClear();
    renderer.renderBands([], context, options);
    expect(svg.clear).toHaveBeenCalledTimes(1);
  });

  it('keeps the viewport centre fixed when zooming and invalidates assembly changes', () => {
    const renderer = new SvgRenderer();
    renderer.mount({} as HTMLElement);
    renderer.renderBands([], { ...context, zoom: 2 }, options);
    const calls = vi.mocked(svg.attr as (...args: unknown[]) => unknown).mock.calls;
    const matrix = String(calls.find(args => args[0] === 'transform')?.[1]);
    const [a, , , d, e, f] = matrix.slice(7, -1).split(' ').map(Number);
    expect(a! * context.centerX + e!).toBeCloseTo(context.centerX);
    expect(d! * context.centerY + f!).toBeCloseTo(context.centerY);
    renderer.renderBands([], { ...context, zoom: 2 }, { ...options, assembly: { ...options.assembly!, metadata: { ...options.assembly!.metadata, name: 'Changed' } } });
    expect(svg.clear).toHaveBeenCalledTimes(2);
  });
});
