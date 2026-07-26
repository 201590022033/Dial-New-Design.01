# Engineering Workspace

## Architecture

Interactive workflow is state-driven and composed from existing stores with additive watch-component control state.

Primary modules:

- src/components/layout/LeftBandsPanel.tsx
- src/components/layout/RightInspector.tsx
- src/components/layout/RightFeatureStack.tsx
- src/components/layout/ExtensionPointsPanel.tsx
- src/stores/watchComponentStore.ts

## Workspace Capabilities

- Component selection filters
- Component visibility/locking
- Component isolation
- Exploded view toggle
- Cross-section preview toggle
- Dimension overlay toggle
- Ring snapping toggle
- Rotating bezel angle control
- Slide-rule cursor angle state
- Live validation and manufacturing warning visibility

## Engineering Readout

Scale hover readouts include scale/plugin/value/normalized angle/ring/collision/manufacturing/score fields.

## Decisions

- Keep object-centric inspector model.
- Keep interactions additive to existing selection/viewport/render architecture.

## Future Integration

- Direct ring drag gestures with snapping constraints.
- Measurement tool overlays and assembly stack views.
- Cross-section compositing by layer/material.
