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

The opt-in `reference-42-preview/v1` remains the stable entry point for the
42 mm review, with explicit frames and three independently registered GLBs. The
fixture now carries the supplied NMK901 case-set envelope: 42 mm diameter,
46 mm lug-to-lug, 10.2 mm case-only thickness, 22 mm inside-lug width and no
chronograph pushers. The crown is updated to the published 7.0 x 4.9 mm CT208
class, and the hand fixture uses the supplied nominal NH35-compatible lengths
and bores. These are controlled preview inputs; unknown seat, thread, gasket,
spring-bar and axial-clearance dimensions still prevent production-fit approval.
See [canonical measurement evidence](CANONICAL_MEASUREMENT_EVIDENCE.md).

### P6 evidence gate

Evidence provenance now distinguishes specified nominal interfaces from unknown
mechanical interfaces. Published case, movement, nominal hand-fit, dial/chapter,
crystal-diameter and crown-head dimensions are recorded, while spring-bar holes,
seat depths, crown tube/thread, gaskets and axial hand/crystal clearance remain
provisional.

### Recommended P7 starting point

Complete the NMK901 measurement pass for spring-bar holes, dial/chapter seats,
crystal gasket/axial seat, caseback sealing, crown tube/thread and stem
engagement. Then add only the corresponding fit checks and regenerate assets
again when the remaining dimensions are actually available.

### P7 surface finish status

The visual layer now has registered, independent procedural finish profiles for
the supported categories. These profiles supply preview color, metalness,
roughness and provisional provenance while leaving authored GLB materials intact.
No texture maps or measured surface specifications are claimed yet; those are
the next texture refinement step after finish references are selected.

### P7 chronograph pusher status

The case schema, Blender generator, browser procedural preview, movement
templates and template archetypes still support two chronograph pushers at 2 h
and 4 h. The controlled NMK901 reference is explicitly non-chronograph, so its
pusher interfaces are marked not applicable; chronograph pusher engagement and
clearance evidence remains provisional in separate VK fixtures.

### P7 measurement research status

The supplied NMK901 case-set and expanded engineering references now define one
controlled preview configuration and are recorded in [canonical measurement evidence](CANONICAL_MEASUREMENT_EVIDENCE.md).
The new values are specified for preview, not promoted to a production release:
the remaining work is direct measurement or toleranced drawing evidence for the
unresolved internal interfaces.

### Controlled ordering block

The single NMK901 / SKX007-SRPD / 42 mm / NH35 Type-M configuration is now
captured as a deterministic controlled-order preset. It validates the supported
case envelope, 22 mm strap and spring-bar envelope, NH35 Type-M movement, 28.5
mm dial, CT252 chapter ring, matched 31.5 mm crystal/bezel insert, and SKX hand
radial clearance. The BOM contains the case, movement, dial, chapter ring, flat
insert, crystal, hand set, matched crown/tube, trim-to-fit stem, two spring bars,
caseback gasket and crystal gasket.

Every controlled engineering field retains one of the explicit provenance
statuses `PUBLISHED`, `DERIVED`, `DESIGN_TARGET`, `SUPPLIER_CONTROLLED`,
`VERIFY_GOLDEN_SAMPLE`, or `COMPATIBILITY_ONLY`. Unknown machining values remain
non-numeric holds. The BOM is orderable with assembly validation where a matched
supplier assembly supplies the hidden interface; it does not claim production fit.
See [NMK901 golden-sample backlog](NMK901_GOLDEN_SAMPLE_BACKLOG.md).

Temporary `ESTIMATED_NOMINAL` baselines now unblock preview geometry and ordering
for the spring-bar holes, seats, crown tube/stem, crystal axial seat, and hand
clearance. They surface as engineering soft warnings and remain pending Golden
Sample #1 micrometer validation.

### P7 visual library status

Presentation-only GLBs now exist for a 40 mm case, diver bezel, domed crystal and
Mercedes-style hand set under `public/assets/3d/`. A texture-ready 32 mm dial
layout fixture with three subdial slots and date/day aperture slots is also
included. They are registry-backed,
fixed-size visual assets and fall back safely when the case is resized. The
procedural renderer also has higher-density meshes, dial markers, case lugs,
shadows and a presentation surface. These assets improve debugging and visual
inspection but do not change the engineering evidence gate.

## Deliberate non-goals

No massive application rewrite, huge style catalogue, fabricated calibre dimensions, or one-GLB-per-variation asset library is planned in this pass.

## Suggested locations

- `src/domain/geometry/parametric/`: shared schemas, contracts, validation, and assembly adapters.
- `tools/blender/`: bpy reference generators and export scripts.
- `src/domain/movement/`: future verified movement compatibility data (current compatibility rules remain authoritative).
- `src/domain/presets/`: later configuration-only presets.
- `public/assets/3d/generated/`: reviewed generated previews/exports only; not a source of truth.
