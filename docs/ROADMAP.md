# Dial Designer Roadmap

## Status at the parametric 3D milestone

The repository already provides a production-oriented 2D dial engineering system: typed watch assemblies, concentric geometry and validation engines, movement templates, manufacturing evidence, SVG/export workflows, project persistence, and a visual 3D adapter with procedural fallbacks and optional GLB descriptors. The architecture baseline remains frozen; new work must compose with those contracts.

An external prototype has proven the feasibility of a parameter-driven smooth watch mid-case (profiles, openings, crystal seat, lugs, crown boss and tube). A modular hand concept has also been proven externally. These are prototypes, not production-ready geometry and are not yet part of the browser runtime.

## Agreed target architecture

Parametric components are the source of dimensional variation. A generator consumes a versioned parameter set and produces validated geometry/preview/export output. Static GLB assets remain appropriate for authored or reference-specific parts, but must not be required for every size variation.

Canonical future component contracts:

- Case: diameter, height, profiles, dial/crystal/caseback openings, lug width and lug-to-lug, taper/drop, crown boss/tube, and resolution.
- Hand: hub, body/shaft, independently selected tip, independently selected tail, and region-aware lume for body/tip/tail. Unknown movement dimensions remain unknown.
- Finish: material/appearance profiles are separate from geometry; case finishes and hand metal/lume materials can vary independently.

Movement templates provide verified hour/minute/seconds pinion specifications to hand compatibility and, later, hub generation. The existing compatibility layer is the authority for known versus unknown data.

Blender Python/bpy is the canonical reference geometry environment. Browser rendering consumes normalized model output and may use procedural preview or GLB assets through the existing visual registry. Engineering SVG/DXF/PDF/PNG export remains separate from 3D preview/export.

## Migration path

1. Add versioned case and hand parameter schemas and validation, without changing current assembly serialization.
2. Add pure, testable parameter-to-intermediate-geometry contracts and adapters from `WatchAssembly`.
3. Implement Blender generators as the reference implementation, with golden fixtures and explicit units.
4. Add browser preview adapters and retain current fallbacks/GLB registry behavior.
5. Add verified movement-aware hub checks and finish/material mapping.
6. Add a small preset layer (configuration only), then broaden named styles after the engine is stable.

## Near-term milestones

- M1: schemas, provenance, unknown-dimension semantics, and compatibility tests. **Complete:** versioned TypeScript contracts and deterministic validation live under `src/domain/geometry/parametric/`.
- M2: Blender case generator prototype and visual regression fixtures.
- M3: modular hand generator with initial `NONE/POINT/TRIANGLE/SPEAR` tips and `NONE/NEEDLE/BATON/ARROW/LOLLIPOP/COUNTERWEIGHT` tails.
- M4: browser integration and controlled GLB export.

Each milestone must preserve existing 2D behavior, run typecheck/lint/tests/build, and avoid claiming unverified geometry or measurements as production ready. The next milestone is **BLENDER PARAMETRIC CASE GENERATOR v1**.

## Deliberate non-goals

No massive application rewrite, huge style catalogue, fabricated calibre dimensions, or one-GLB-per-variation asset library is planned in this pass.

## Suggested locations

- `src/domain/geometry/parametric/`: shared schemas, contracts, validation, and assembly adapters.
- `tools/blender/`: bpy reference generators and export scripts.
- `src/domain/movement/`: future verified movement compatibility data (current compatibility rules remain authoritative).
- `src/domain/presets/`: later configuration-only presets.
- `public/assets/3d/generated/`: reviewed generated previews/exports only; not a source of truth.
