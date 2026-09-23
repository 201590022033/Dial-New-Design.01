# Dial Designer Roadmap

## P11 movement-owned subdials and case-family expansion

The first movement-owned dial architecture is now implemented for TMI VK63. The central preview uses the published 9 h chronograph-minute, 6 h small-seconds and 3 h 24-hour roles, with configurable needle, baton and syringe register-hand presentation assets. The social-media subdial, movement and lug references are catalogued as `reference-only`.

The VK63 register centres and post diameters are now sourced from TMI's official drawing. Register artwork diameter and hand silhouettes remain temporary `ESTIMATED_NOMINAL` preview values. Commercial movement, compatible dial and register-hand supplier mappings remain incomplete, so this slice is intentionally not orderable. The next engineering step is supplier-SKU qualification and physical case/pusher validation.

Lug families are queued as separate case-platform variants rather than decorative archetype choices. Curved, twisted, hooded, integrated, wire, teardrop, faceted and skeleton lugs must each receive their own measured case envelope before GLB generation can claim physical compatibility.

### P11 lug-geometry implementation

The 42 mm preview now supports straight, curved, twisted, hooded, integrated, drilled, wire, teardrop, faceted and skeleton case GLBs. The central-view Style controls select the complete case asset. All ten variants retain `provisional-presentation` provenance; integrated and wire options declare different strap interfaces and cannot inherit the NMK901 spring-bar fit claim.

### P11 case and lug presentation refinement

The case generator now applies its upper and lower shoulder-reduction parameters to the actual silhouette, uses a denser eased loft through each conventional lug, and separates brushed flanks from polished upper facets. Integrated polished midcase shoulder surfaces and broad rectangular studio reflection lights make the chamfers and lug curvature legible without adding detached decorative geometry. These refinements preserve the controlled 42 mm envelope and remain `provisional-presentation`; they do not upgrade any lug family to verified fit geometry.

The dark studio shadow receiver now remains parallel to the watch face and behind the full assembly. This removes the edge-on black disk that previously intersected and visually split the watch when the camera was rotated away from the face preset.

The central viewer now treats browser Ctrl/Cmd-wheel zoom separately from 3D camera zoom, rejects stale out-of-range saved camera distances, updates the live Three.js camera explicitly, and uses responsive workflow/inspector columns without a forced 1260 px workspace. The startup information card also collapses detailed evidence notes so the watch remains visible at 100% browser zoom on a 1280 × 720 viewport.

The official VK63A drawing review replaces the estimated 6.2 mm register spacing with published 7.50 mm centres and records the published register posts. Register artwork size and hand silhouettes remain estimated pending supplier dial and hand drawings. See `docs/VK63_ENGINEERING_REFERENCE.md`.

### P11 central-view visual QA

The first 2048 px Dark Dramatic review exposed and corrected two presentation defects: archetype hand GLBs were below the dial surface, and baked dial signatures duplicated the configurable typography layer. Archetype hand assets now use a reviewed axial preview offset, dial signatures remain controlled by the live typography system, and exported render filenames identify archetype, lug family, subdial-hand style and camera preset. These are visual-composition corrections only and do not change interface evidence.

### P11 VK63 high-detail presentation pass

The chronograph dial now carries a dense outer minute track, applied hour markers and three layered 7.50 mm-centred register assemblies with dark inset surfaces, polished rims, inner tracks, 30-step scales and compact numerals. The main hour/minute/chronograph hands use tapered profiles and the needle, baton and syringe register-hand choices now have genuinely different silhouettes rather than width-only variants. Register artwork and silhouettes remain `ESTIMATED_NOMINAL`; the published TMI centres and post bores remain the engineering authority.

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

### P8 complete 42 mm central-view assembly

The opt-in NMK901 reference now loads nine independent high-quality GLBs in the
central view: strap preview, caseback, midcase, dial, chapter ring, bezel and
insert, hands, crystal, and crown. The complete deterministic Blender review
contains 185 meshes and 31,220 vertices. Published dial, chapter-ring,
bezel-insert, crystal-diameter, case, crown and hand dimensions remain distinct
from estimated visual placement and exterior baselines.

Presentation-polish pass 1 adds a tapered, rounded strap with relief rails,
hierarchical dial/bezel ticks, shadow-enabled imported meshes, ACES filmic tone
mapping, three-point warm/cool studio lighting, and tighter camera framing. It
also reduces the strap from 23,088 to 144 vertices while improving its visible
silhouette. Presentation-polish pass 2 adds generated studio-environment
reflections, separate polished/brushed web finishes, a layered date display,
brand-neutral dial signature, depth text, a framed luminous bezel pip, tighter
camera composition, and a bounded 1.75 device-pixel-ratio ceiling. The next
visual slice completes configurable 3D dial typography, modeled strap keepers
and polished tang-buckle hardware, plus a camera-preserving 2048 x 2048 PNG
export. Further visual work should focus on optional user-supplied artwork and
multiple strap styles rather than adding unverified mechanical detail.

### P9 archetype-driven central preview and dashboard routing

Archetype selection is now connected to the canonical assembly presentation
state. Dive, pilot, dress, field and chronograph starter choices preview their
own dial palette, marker language, typography, bezel treatment and strap color
in the central 2D and 3D views before the user commits the starter build. The
full reference selector uses the same profile adapter for every listed
archetype, while retaining the current engineering dimensions and fit evidence.

The left navigation rail now routes each workspace choice to its intended
right-hand destination: Parts opens Options, Style opens Style, AI Research
opens Suppliers and Manufacture opens Manufacture. Selecting an affected part
for a warning no longer overrides that destination tab.

### P10 high-definition archetype component library

The five starter archetypes now select dedicated 42 mm presentation GLBs for
dials, bezels and hand sets, plus rubber, leather, canvas and perforated racing
straps. The chronograph preview also carries separate external pushers. Twenty
generated assets are registered with explicit provisional-presentation
provenance and retain the NMK901 case envelope without changing fit evidence.

The central viewer adds Studio, Face and Detail camera presets while preserving
the existing 2048 px export. The Style workspace now supports live strap
selection and optional PNG/JPEG/WebP dial artwork up to 2 MB. Imported artwork
is a preview layer only and is never treated as manufacturing geometry.

### P11 saved HD presentation and review package

The central 3D viewer now opens into a distraction-free full-screen HD mode.
Studio, Face and Detail views store their exact camera rotation and distance in
the canonical project, so reopening or exporting a project restores the same
composition. A five-watch render gallery switches directly among Dress, Field,
Diver, Pilot and Chronograph presentations while retaining the NMK901 basis.

An in-view alignment review checks archetype binding, required render assets,
saved camera state and the active 42 mm reference assembly. A one-click ZIP
package contains the 2048 px PNG, canonical watch project and a render-review
manifest. These checks confirm presentation completeness; they do not promote
estimated interfaces or the chronograph pusher preview to manufacturing truth.

### P12 production presentation materials

The central model now uses physically based presentation profiles for polished
and brushed steel, high-transmission sapphire, matte and sunburst-sensitive
dials, emissive lume, vulcanized rubber, leather and woven canvas. Authored GLB
materials are cloned before refinement so cached assets remain immutable across
archetype changes. The material profiles remain explicitly provisional visual
choices; Golden Sample color, gloss, texture and optical validation is deferred.

### P13 dark studio and platform/kit library

The visual renderer now uses one intentional Dark Dramatic studio instead of a
growing environment preset catalogue. The library separates the shared NMK901
platform from archetype presentation kits and exposes evidence/compatibility
labels in the viewer and controlled BOM. NMK901 remains
`GOLDEN_SAMPLE_PENDING`; compatible NH35 kits remain orderable with existing
assembly warnings, while Chronograph, GMT and Digital Sport are
`PRESENTATION_ONLY` and blocked from the NMK901 ordering pipeline.

The next library phase is documented in
[`ARCHETYPE_PLATFORM_LIBRARY.md`](ARCHETYPE_PLATFORM_LIBRARY.md): ingest two
new reference images, model movement-owned subdial geometry and hand interfaces,
map those interfaces to supplier-qualified components, then regenerate the dial
and subdial-hand GLBs. No image-derived subdial position will become engineering
truth without a matching movement record.

## Deliberate non-goals

No massive application rewrite, huge style catalogue, fabricated calibre dimensions, or one-GLB-per-variation asset library is planned in this pass.

## Suggested locations

- `src/domain/geometry/parametric/`: shared schemas, contracts, validation, and assembly adapters.
- `tools/blender/`: bpy reference generators and export scripts.
- `src/domain/movement/`: future verified movement compatibility data (current compatibility rules remain authoritative).
- `src/domain/presets/`: later configuration-only presets.
- `public/assets/3d/generated/`: reviewed generated previews/exports only; not a source of truth.
