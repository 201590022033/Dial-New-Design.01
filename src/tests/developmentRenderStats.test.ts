import { describe, expect, it, vi } from 'vitest';
import { createDevelopmentRenderStats } from '@/visual3d/renderStatsCapture';

const fixture = () => ({
  info: { render: { triangles: 10, calls: 2 }, memory: { geometries: 3, textures: 4 } },
  domElement: { parentElement: { dataset: {} as DOMStringMap } }
});

describe('development renderer acceptance capture', () => {
  it('reads completed-frame statistics and counts frames without changing rendering', async () => {
    const renderer = fixture(), capture = createDevelopmentRenderStats(true);
    capture.frame(renderer);
    expect(renderer.domElement.parentElement.dataset.watchRenderStats).toBeUndefined();
    // Simulate gl.render completing after the R3F pre-render callback.
    renderer.info.render = { triangles: 120000, calls: 71 };
    renderer.info.memory = { geometries: 92, textures: 14 };
    await Promise.resolve();
    expect(JSON.parse(renderer.domElement.parentElement.dataset.watchRenderStats!)).toEqual({ frames: 1, triangles: 120000, calls: 71, geometries: 92, textures: 14 });
    capture.frame(renderer);
    await Promise.resolve();
    expect(JSON.parse(renderer.domElement.parentElement.dataset.watchRenderStats!)).toHaveProperty('frames', 2);
    expect(renderer.info.render).toEqual({ triangles: 120000, calls: 71 });
    capture.dispose();
    expect(renderer.domElement.parentElement.dataset.watchRenderStats).toBeUndefined();
  });

  it('does no work in production and ignores queued captures after disposal', async () => {
    const renderer = fixture();
    const schedule = vi.spyOn(globalThis, 'queueMicrotask');
    const production = createDevelopmentRenderStats(false);
    production.frame(renderer);
    expect(schedule).not.toHaveBeenCalled();
    const development = createDevelopmentRenderStats(true);
    development.frame(renderer);
    development.dispose();
    development.start(); // React StrictMode repeats effect setup after cleanup.
    await Promise.resolve();
    expect(renderer.domElement.parentElement.dataset.watchRenderStats).toBeUndefined();
    development.frame(renderer);
    await Promise.resolve();
    expect(JSON.parse(renderer.domElement.parentElement.dataset.watchRenderStats!)).toHaveProperty('frames', 2);
    development.dispose();
    schedule.mockRestore();
  });
});
