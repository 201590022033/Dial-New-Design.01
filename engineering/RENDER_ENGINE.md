# Render Engine

## Architecture

Rendering remains separate from engineering geometry and validation.

Primary modules:

- src/renderer/svgRenderer.ts
- src/renderer/types.ts
- src/stores/watchComponentStore.ts

## Rendering Pipeline

1. Collect immutable engineering state.
2. Render guides and layered bands.
3. Render design overlays and scale overlays.
4. Apply highlight/focus states.
5. Resolve interactive hit testing.

## Performance Decisions

- Render-key caching prevents duplicate draw passes.
- Basic viewport culling skips off-radius scale ticks/labels.
- Vite manual chunking splits heavy dependencies for faster load and lower memory pressure.

## Preview Modes

- Engineering
- High Quality
- Presentation

Low Power Mode is exposed as state for future render-cost tuning.

## Assumptions

- Renderer visual choices never change manufacturing geometry.
- Material and finish previews are representational, not physical simulations.

## Future Integration

- Reflection maps and BRDF material packs.
- High DPI adaptive rendering tiers.
- GPU-backed preview path.
