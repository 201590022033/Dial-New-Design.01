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

## Parametric 3D boundary

`WatchAssembly` remains the application-level source of truth. The current
`src/visual3d` layer adapts that assembly to procedural or registry-backed GLB
visuals; it is not yet a production CAD generator. Future dimensional case and
hand variation belongs behind versioned parameter schemas and generator
contracts under `src/domain/geometry/parametric/`. Blender Python/bpy under
`tools/blender/` is the reference geometry environment. See [Roadmap](ROADMAP.md)
and [ADR 0001](adr/0001-parametric-3d-geometry.md).

### P4 componentized assembly

`WatchAssemblyPartInstance.visual` optionally binds a stable category, registry
asset ID and local transform. `parametricGeometry` optionally stores the versioned
case or crown parameter set. Both survive existing assembly serialization; old
documents remain readable. Catalogue kind identifies legacy parts independently
of editable names: broad `case` includes crystals, casebacks and lugs and must not
be used as a midcase selector. A draft midcase catalogue entry is appended without
reordering the existing 43 entries. It is excluded from engineering export.

The case owns `DD_CASE_CROWN_BOSS` and `DD_CASE_CROWN_TUBE`. The removable crown head
is a separate part using `parametric-crown/v1`, generated in `DD_PARAMETRIC_CROWN`.
Replacing/hiding it does not modify the case. Its local origin is the rear socket
entrance, with +X pointing outward. Parameters retain provisional provenance and
explicit unknown dimensions; a visual socket is not a certified threaded interface.

`VisualWatchModel` has case/dial/bezel/crystal/hands/crown descriptors, visibility,
local transforms and typed `watch-axis`, `dial-seat`, `hand-stack`, `crown-interface`
frames. Frames are absolute in engineering coordinates (mm, XY dial plane, +Z toward
crystal). Each carries provenance. `designConfig.assemblyAnchors` supplies explicit
frames. Otherwise the crown frame is derived from the supplied case tube endpoint:
`caseDiameter / 2 - crownTubeEmbed + crownTubeLength`; unresolved seats/stacks and
legacy crown placement remain labelled provisional. These preview values do not
write inferred manufacturing dimensions back to the assembly.

Transform order is anchor -> instance offset/XYZ Euler rotation -> descriptor
offset/XYZ Euler rotation/scale -> GLB axes and units. Crown `axialGapMm` adds along
the anchor's local +X before rotation; it is never baked into exported crown meshes.
Unknown gaps use zero only for a provisional schematic preview. The scene uses
0.1 scene units/mm once at the root, with no implicit scaling of GLBs by case size.
Blender glTF Y-up is converted back to engineering Z-up; descriptors may explicitly
declare Z-up or metre units.

Every supported category uses the same `VisualComponent` and `GlbAsset` loading
path. Missing, mismatched, malformed, loading, failed and meshless assets retain a
procedural component. Each failed boundary remounts when asset ID/path changes.
Loaded scenes are cloned per instance without disposing the shared loader cache.
Fallbacks receive assembly placement but not GLB-specific corrections. There is
one WebGL canvas with `frameloop="demand"`; 2D rendering/export stays independent.

P4 keeps one representative part per supported visual category; hands remain a
hand-set slot, not arbitrary per-hand animation or complication instances. Broad
catalogue support, parameter editors, verified movement clearances, collision/fit
checks, live Blender regeneration and the rest of the component library are later
milestones. Registry GLBs remain opt-in reviewed assets, not automatic generation.

### P7 surface finishes

`src/visual3d/finishProfiles.ts` registers independent procedural surface
profiles for case, bezel, crown, hands, dial, crystal, lume and metal variants.
The visual adapter resolves a category profile from authored asset metadata or
assembly material/texture hints, with a safe fallback. Procedural previews use
the same profile values; authored GLBs retain their own materials. P7 establishes
surface ownership and provisional provenance without inventing texture maps or
manufacturing surface specifications. Image textures, anisotropic brushing and
measured finish references remain later work.

### P5 fixed reference selection

The opt-in 42 mm reference stores the case, crown and hand-set generator
parameters on independent assembly parts and binds three fixed GLBs by category.
It writes explicit frame provenance and survives serialization. A fixed asset
is used only while the complete fixture parameters and 42 mm diameter match;
changes fall back to procedural visuals. The 3D review panel surfaces known
paired-lug layout, movement/hand-bore conflicts and unresolved fit questions. The
case boss/tube remain part of the case and the removable crown remains a
separate part. This visual selection does not certify mechanical engagement or
movement clearance; details are in [P5 reference review](P5_REFERENCE_REVIEW.md).

## Data Flow

1. Inspector/store update.
2. Domain engines regenerate outputs.
3. Geometry + manufacturing + collision validation update warnings.
4. Renderer updates SVG preview immediately.
5. Export consumes engineering geometry outputs (not preview snapshots).
