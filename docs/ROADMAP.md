# Dial Designer Roadmap

## Status at the parametric 3D milestone

The repository already provides a production-oriented 2D dial engineering system: typed watch assemblies, concentric geometry and validation engines, movement templates, manufacturing evidence, SVG/export workflows, project persistence, and a visual 3D adapter with procedural fallbacks and optional GLB descriptors. The architecture baseline remains frozen; new work must compose with those contracts.

An external prototype has proven the feasibility of a parameter-driven smooth watch mid-case (profiles, openings, crystal seat, lugs, crown boss and tube). A modular hand concept has also been proven externally. These are prototypes, not production-ready geometry and are not yet part of the browser runtime.

## Agreed target architecture

Parametric components are the source of dimensional variation. A generator consumes a versioned parameter set and produces validated geometry/preview/export output. Static GLB assets remain appropriate for authored or reference-specific parts, but must not be required for every size variation.

Canonical future component contracts:

- Case: diameter, height, profiles, dial/crystal/caseback openings, lug width and lug-to-lug, taper/drop, crown boss/tube, and resolution.
- Hand: hub, body/shaft, independently selected tip, independently selected tail, and region-aware lume for body/tip/tail. Unknown movement dimensions remain unknown.
- Crown: separate removable head, blind visual socket, grip, provenance and explicit attachment to the case's retained boss/tube interface (`parametric-crown/v1`).
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
- M2: Blender case generator prototype and visual regression fixtures. **Complete:** `tools/blender/parametric_case_v1.py` generates the reference case and alternate JSON-driven sizes; Blender smoke validation is recorded with the milestone.
- M3: modular hand generator with initial tip/tail families. **Complete:** `tools/blender/parametric_hand_v1.py` provides modular hand/hand-set generation.
- M4 / P4: **Complete:** componentized browser assembly for case/dial/bezel/crystal/hands/crown; typed frames/transforms, category-safe registry selection, shared GLB loading with procedural fallbacks, independent crown generator and shared deterministic Blender review harness. Case boss/tube remain case-side geometry. No remaining-component library was generated.

Each milestone must preserve existing 2D behavior, run typecheck/lint/tests/build, and avoid claiming unverified geometry or measurements as production ready.

### Recommended P5 starting point

Build one reviewed end-to-end case/crown/hand-set configuration: select versioned
parameters in the application, persist the explicit engineering frames, generate
and review those components, then deliberately publish/register the approved GLBs.
First verify the actual stem/tube/socket dimensions and dial/hand/crystal clearances;
keep absent movement evidence unknown. Audit the inherited case/lug geometry and
case/crown interference before any fit claim. Add movement-aware compatibility
checks and a small controlled preset set before expanding the component catalogue.
P4 does not yet provide live generation, a parameter editor, per-hand GLB slots,
thread/seal geometry, verified fit, or a production component library.

### P5 visual reference status

An opt-in `reference-42-preview/v1` now selects and persists one 42 mm
case/crown/hand-set configuration with explicit frames and three separately
reviewed GLBs. The case fixture has been corrected to paired 12/6 strap lugs
with a crown-side clearance; the crown boss and tube remain case-owned. The
movement template audit still finds three hand-bore mismatches. Stem engagement,
thread/seal geometry and axial clearances remain unknown. The assets are clearly
labelled preview-only and cannot support a fit claim. See [P5 reference review](P5_REFERENCE_REVIEW.md).

### P6 evidence gate

The reference now records evidence provenance for the strap interface, movement
hand bores, crown engagement, dial seat, hand stack and crystal clearance. These
fields remain provisional or unknown until measured evidence is supplied.

### Recommended P7 starting point

Source verified movement, hand-bore, stem, socket, dial-seat, hand-stack and
crystal-clearance evidence. Then revise the provisional fixture with those
measurements, regenerate all three components, and add fit checks only where
the evidence supports them. Continue with a small controlled component set.

## Deliberate non-goals

No massive application rewrite, huge style catalogue, fabricated calibre dimensions, or one-GLB-per-variation asset library is planned in this pass.

## Suggested locations

- `src/domain/geometry/parametric/`: shared schemas, contracts, validation, and assembly adapters.
- `tools/blender/`: bpy reference generators and export scripts.
- `src/domain/movement/`: future verified movement compatibility data (current compatibility rules remain authoritative).
- `src/domain/presets/`: later configuration-only presets.
- `public/assets/3d/generated/`: reviewed generated previews/exports only; not a source of truth.
