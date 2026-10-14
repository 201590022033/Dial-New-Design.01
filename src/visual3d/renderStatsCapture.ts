type StatsTarget = { dataset: DOMStringMap };
type RendererStatsSource = {
  info: {
    render: { triangles: number; calls: number };
    memory: { geometries: number; textures: number };
  };
  domElement: { parentElement: StatsTarget | null };
};

/** QA only: count actual demand frames without invalidating or updating React state. */
export function createDevelopmentRenderStats(enabled: boolean) {
  let frames = 0;
  let active = true;
  let generation = 0;
  let target: StatsTarget | null = null;
  return {
    frame(renderer: RendererStatsSource) {
      if (!enabled || !active) return;
      const frame = ++frames;
      const currentGeneration = generation;
      // R3F frame subscribers run before gl.render. Read after this synchronous
      // render finishes, so renderer.info describes the completed frame.
      queueMicrotask(() => {
        if (!active || generation !== currentGeneration) return;
        target = renderer.domElement.parentElement;
        if (!target) return;
        const { render, memory } = renderer.info;
        target.dataset.watchRenderStats = JSON.stringify({
          frames: frame, triangles: render.triangles, calls: render.calls,
          geometries: memory.geometries, textures: memory.textures
        });
      });
    },
    start() { active = true; },
    dispose() {
      active = false;
      generation++;
      if (target) delete target.dataset.watchRenderStats;
    }
  };
}

