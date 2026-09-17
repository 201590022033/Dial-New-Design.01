# ADR 0001: Parametric 3D geometry with Blender as reference

- Status: accepted
- Date: 2026-09-17

## Context

Dial Designer is expanding from a primarily 2D dial tool into a parametric watch design environment. The repository has a typed assembly model, movement compatibility rules, a visual 3D adapter, procedural fallbacks, and optional GLB assets. A case and modular hand approach has been proven in external prototypes, but no production generator has been integrated.

## Decision

Dimensional variation for important watch components will be represented by versioned parameter sets and regenerated geometry. Blender Python/bpy is the canonical reference/prototyping environment. Browser rendering and GLB export are adapters, not the engineering source of truth. Geometry and finish/material profiles remain separate.

Cases and hands will be modular. Hands consist of hub, body/shaft, tip, tail, and lume regions. Initial tip and tail families are intentionally small and extensible. Movement data may constrain hub/pinion geometry only when verified; otherwise compatibility is explicitly unknown.

## Consequences

This avoids an explosion of static GLBs and makes dimensional changes auditable. It introduces schema/versioning, generator validation, Blender fixture testing, and a clear distinction between reference geometry, browser preview, and exported assets. Existing 2D engines, renderer, export pipeline, stores, and component registry remain compatible and frozen unless a verified defect requires a minimal change.
