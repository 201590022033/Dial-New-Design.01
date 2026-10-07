import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SvgRenderer } from '@/renderer/svgRenderer';
import { createDefaultWatchAssembly } from '@/domain/assembly';
import type { RendererOptions } from '@/renderer/types';
import { getScalePlugin } from '@/domain/scales/scaleRegistry';
import { runScalePlugin } from '@/services/scaleEngineService';

const svg = vi.hoisted(() => {
  const node: Record<string, unknown> = { node: { setAttribute: vi.fn() } };
  for (const method of ['addTo', 'size', 'clear', 'remove', 'group', 'id', 'attr', 'css', 'line', 'stroke', 'circle', 'polygon', 'center', 'fill', 'path', 'front', 'clip', 'add', 'clipWith', 'text', 'font', 'rotate', 'svg']) {
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

  it('does not draw the old partial crystal-reflection crescent in Engineering mode', () => {
    const renderer = new SvgRenderer();
    renderer.mount({} as HTMLElement);
    renderer.renderBands([], context, options);

    expect(svg.path).not.toHaveBeenCalled();
  });

  it('uses the selected hand-set style for Engineering hand geometry', () => {
    const renderer = new SvgRenderer();
    const assembly = createDefaultWatchAssembly();
    assembly.designConfig = { ...assembly.designConfig, visualReferenceConfig: { componentAssetOverrides: { hands: 'hands-mercedes-42' } } };
    renderer.mount({} as HTMLElement);
    renderer.renderBands([], context, { ...options, assembly });
    expect(svg.attr).toHaveBeenCalledWith('data-hand-style', 'mercedes');
    expect(svg.polygon).toHaveBeenCalled();
  });

  it('uses the same selected colour for scale ticks and numerals in Engineering mode', () => {
    const renderer = new SvgRenderer();
    const scalePreview = runScalePlugin('circular', { ...getScalePlugin('circular')!.defaultConfig, color: '#a37db5' }, { startAngleDeg: 0, endAngleDeg: 360 });
    renderer.mount({} as HTMLElement);
    renderer.renderBands([], context, { ...options, scalePreview });
    expect(svg.svg).toHaveBeenCalledWith(expect.stringContaining('stroke="#a37db5"'));
    expect(svg.svg).toHaveBeenCalledWith(expect.stringContaining('fill="#a37db5"'));
  });
});
