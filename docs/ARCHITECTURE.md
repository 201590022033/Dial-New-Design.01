# Architecture Guide

## Core Layers

1. Domain engines
- Geometry Engine: concentric constraints, dependency graph, validation categories.
- Scale Engine: plugin-driven tick/label generation and validation.
- Watch Design Engine: dial face, texture, typography, marker, chapter ring, bezel, lume, templates.

2. Stores (Zustand)
- Global settings, bands, scale, design engine, export, project, viewport, selection, history.

3. Renderer
- SVG renderer adapter with strict geometry-based rendering.
- Engineering overlays and scale overlays rendered from domain outputs.

4. Services
- Export service (engineering geometry to SVG/DXF/PDF/PNG).
- Project file service (.dial serialization/deserialization).
- Manufacturing and movement recommendation services.

## Extension Points

- Scale plugins through registry.
- Texture plugins through texture engine plugin list.
- Template presets via template library.
- Help documentation mappings via engineering help index.

## Data Flow

1. Inspector/store update.
2. Domain engines regenerate outputs.
3. Geometry + manufacturing + collision validation update warnings.
4. Renderer updates SVG preview immediately.
5. Export consumes engineering geometry outputs (not preview snapshots).
