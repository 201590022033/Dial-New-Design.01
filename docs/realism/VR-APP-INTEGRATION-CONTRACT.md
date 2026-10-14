# Watch realism: application integration contract

Status: planning handoff, 13 October 2026. This work package changes no application code or GLB assets during planning. It implements the application side of the original [user brief](../briefs/WATCH-REALISM-USER-BRIEF-2026-10-12.txt), alongside the independent Blender modelling and studio-render work packages.

## 1. Outcome and scope

The improved GLBs must look better in the actual HD dashboard, retain all existing design controls and remain registered to the same engineering frames. A beautiful Blender render alone does not meet this requirement. The application currently overwrites many imported materials; this work package must make the new material details survive those overrides.

Keep one exported asset at each existing registered component path. Assembled hero scenes and AR comparison images are separate presentation outputs. Do not replace the component system with one merged complete-watch GLB or add colour variants to the catalogue.

### Asset families verified in the repository

There are **114 unique GLB files under `public/assets/3d`**. Of these, **101 unique paths are registered for runtime use or saved-binding compatibility**, and **13 are review-only**. Registered does not mean currently selected or visible in every UI. The reference crown has two registry IDs sharing one file.

| Family | Files | Application status and planning scope |
|---|---:|---|
| `variants/hands`, `variants/dials`, `variants/bezels`, `variants/cases` | 45 | Live component/supplier selection assets: 43 in `variants/manifest.json`, plus the two off-axis case assets. Preserve IDs, dimensions and provisional evidence. |
| `archetypes` | 24 | Live gallery dial, hand, bezel, pilot chapter ring, strap and chronograph pusher components. Fixed 42 mm assets fall back at other case sizes. |
| `lug-cases` | 10 | Live 42 mm lug-style presentations, selected through `visualReferenceConfig.lugStyleId`. |
| `crowns` | 6 | Live independent crown presentations. Canonical crown axis and specification remain the source of placement and size. |
| `reference-42` | 9 | Live **opt-in fixture** through Load 42 mm reference set. Not the default assembly and not production fit evidence. All nine components are registered. |
| `cases`, `bezels`, `crystals`, `dials`, `hands` | 7 | Earlier registered component library. `dials/dial_face_40mm_layout_v1.glb` is still the default 40 mm dial binding. The other six remain valid explicit/saved bindings; do not delete or rename as presumed dead assets. |
| `face-review` | 13 | Unregistered standalone development/review outputs from `generate_face_components.py`, including `assembly-animated.glb`. No application references were found. Preserve and inventory; do not publish these automatically or treat their animation/assembled transforms as the app contract. |

The definitive processing manifest must be produced by VR0 from file inventory and registry resolution. The application package consumes that manifest. This classification is not permission to blindly replace every `.glb` in the repository.

## 2. Concrete integration files

| File | Responsibility |
|---|---|
| `src/visual3d/visualAssetRegistry.ts` | Stable paths/IDs, category, anchor, numeric units, up axis, descriptor transforms, fixed-size checks and pilot print-surface metadata. |
| `src/visual3d/watchAssemblyToVisualModel.ts` | Derives active assets, colours, finishes, visibility, dimension-sensitive fallback and crown placement from canonical design. |
| `src/visual3d/componentPlacement.ts` | Places authored components in the assembled engineering frame. |
| `src/visual3d/GlbAsset.tsx` | Loads/caches GLBs, clones scene/materials, applies runtime appearance, hides replaceable artwork and owns derived material disposal. Main integration seam. |
| `src/visual3d/glbLoadUrl.ts` | Stable versioned URLs across Suspense retries. Needs one deliberate release-version update when binaries change. |
| `src/visual3d/VisualWatchScene.tsx` | HD scene, environment, live dial/scale layers, procedural components, lighting and PNG exporter. |
| `src/visual3d/finishProfiles.ts`, `src/visual3d/materials.ts` | Procedural physical finishes and older basic material factories. Keep crystal/leather behaviour consistent where these are actually used. |
| `src/visual3d/handAppearanceRegions.ts` | Main/register hand metal, lume and coloured tips; replaces whole materials today. |
| `src/visual3d/authoredBezelMarkings.ts`, `src/visual3d/crownAssetOwnership.ts` | Exact reviewed removable print and embedded-crown regions. Preserve this ownership. |
| `src/visual3d/useScaleArtworkTexture.ts`, `src/visual3d/ScaleArtwork3D.tsx`, `src/visual3d/scaleArtworkEnvelope.ts` | Live calibrated scale texture/decal, clipping and rotations. |
| `src/visual3d/dialFinishTexture.ts` | Dashboard-owned dial finish bump/roughness maps. |
| `src/domain/assembly/assemblyTypes.ts`, `src/domain/configurator/archetypeProfiles.ts` | Saved visual settings and existing archetype colour defaults. |
| `src/components/configurator/tray/StyleTab.tsx`, `src/stores/watchAssemblyStore.ts` | User controls and canonical appearance updates; no hover-driven expensive render changes. |

Existing Blender generation/validation helpers are under `tools/blender`. Do not regenerate their old output folders as an integration shortcut: that would overwrite independently refined assets.

## 3. Invariants that must remain true

1. **Identity and coordinates:** existing asset IDs, object names, pivots, local/world transforms, anchor selection, descriptor offsets and numeric dimensions remain unchanged unless VR0 explicitly resolves a conflict. Existing GLBs generally encode engineering millimetres with glTF Y up. `GlbAsset` rotates Y up back to the app's Z up by `+π/2` about X; metre descriptors alone receive `×1000`. The entire watch then receives `MM_TO_SCENE = 0.1`. Never bake a second axis/unit conversion.
2. **Engineering ownership:** visual improvements cannot update dimensions, movement geometry, BOM quantities, provenance, fit evidence, readiness status, supplier records or ordering eligibility. Fixed assets still fall back when dimensions do not match. The gem-set bezel's existing radial presentation scaling exception is not a new general resize rule.
3. **Attachment interfaces:** preserve spring-bar bores and recorded `DD_ATTACHMENT_AXIS_Y_MM` / `DD_ATTACHMENT_AXIS_Z_MM`, lug roots, case/strap clearance, crown tube/axis and hand stack. Numeric 22→20 mm leather and 0.8–1 mm dome targets do not override an existing hardware interface.
4. **Dial and scale registration:** retain the original dial UV layer and artwork topology. The pilot `DD_SCALE_SURFACE_OUTER` / `INNER` planar UVs, `DD_SCALE_UV_DIAMETER_MM = 42`, authored annulus radii and `DD_SCALE_SURFACE_Z_MM` must remain exact. Preserve descriptor print radii/offsets. Do not bake a new UV layout over these surfaces.
5. **One owner per visual layer:** live hour markers replace authored markers, live scale print replaces only the declared authored bezel/pilot print regions, date windows and typography remain application-owned. Do not reintroduce duplicate indices or static slide-rule markings when live print is enabled.
6. **User colours:** existing model and archetype defaults remain. Dashboard changes still affect the intended region, including independent case/crown/bezel finishes, dial, markers, main/register hands, tips and lume. No static coloured texture may defeat recolouring.
7. **Isolation and lifecycle:** cached `GLTFLoader` source scenes, source materials, shared source geometry and maps remain immutable. Recoloured instances have isolated materials. Dispose only resources created by that instance; keep demand-render invalidation after asynchronous loading and edits.
8. **Responsiveness:** preserve explicit selection/preview/apply behaviour. Stable URLs must remain identical across Suspense retries. No timestamp-per-mount cache busting, per-frame baking or geometry rebuild while the pointer merely hovers a menu.

## 4. Actual current material and recolour pipeline

`WatchAssembly` → `watchAssemblyToVisualModel` → `VisualWatchScene` / `componentPlacement` → `LoadedGlbAsset` → cloned material changes. This is the actual control path; a Blender node input by itself is not a dashboard control.

Current important behaviours:

- The loader clones the scene and each mesh material, then identifies materials by mesh/material names and rewrites colour, roughness, metalness and environment intensity. Source normal/roughness maps usually survive ordinary cloning, but imported numeric BRDF values do not necessarily survive the heuristic overrides.
- Crystal/diamond materials are reconstructed as `MeshPhysicalMaterial` using a limited map list. Imported extension properties, material name/extras and several physical values are lost in that conversion. The crystal branch then sets pale-blue `#e8f7ff`, opacity `0.26`, transmission `0.98`, IOR `1.76` and thickness `0.75`. This defeats the brief's neutral-transmission/faint-reflection AR intent and can discard imported iridescence.
- Strap meshes matching `rubber`, `leather`, `canvas`, `STRAP` or `RACING` are all assigned the resolved strap colour. `relief` or `RAIL` receives **lighter** colour through `offsetHSL(...,+0.08)`. There is no darker hole-rim/edge role and cream stitches whose mesh name includes STRAP can be recoloured with the face.
- Effective strap colour currently comes from the selected archetype/style palette. It is not an arbitrary editable strap-colour field: the adapter does not use `inst-strap-integration.color` as its final effective colour, and `StyleTab` currently exposes strap style only. Preserve those existing default transitions. The baseline package tests existing palette changes plus arbitrary colours at the material bridge's programmatic input; it does not expand the colour UI. If an arbitrary user-edited strap colour proves necessary in acceptance, the minimal follow-up is one optional authored `visualReferenceConfig.strapColor` and a contextual colour/reset control, with no catalogue colour variants.
- `applyHandAppearance` subsequently replaces recognised hand materials with fresh `MeshStandardMaterial`s. A refined hand normal map or anisotropic material will disappear after the first semantic-region edit unless this path preserves the source finish and changes only the chosen region's colour/lume state.
- Dial roughness/bump is dashboard-owned when an explicit generated dial finish texture exists. `DD_SCALE_SURFACE_*` receives the live scale map and a dedicated PBR ink surface. Preserve these intentional overrides.
- All four archetype strap GLBs are fixed to 42 mm. At 34, 38, 40, 46 mm and other mismatching sizes the application uses `PreviewStrap` procedural geometry. Refined GLBs alone will not improve those views. The same material/recolour semantics must be shared with procedural fallback, without scaling fixed strap hardware or introducing a new asset per diameter.

### Agreed export-to-app metadata proposal

Use material glTF `extras`, exported from Blender material custom properties and verified in the exported JSON. The installed Three loader copies material `extras` to `material.userData`. Confirm this with an actual Blender export probe before adopting it for production.

| Extra | Value / meaning |
|---|---|
| `DD_REALISM_SCHEMA` | `dial-designer/realism-material/v1` |
| `DD_REALISM_ROLE` | One of `strap-face`, `strap-edge`, `strap-hole-rim`, `strap-stitch`, `strap-hardware`, `steel-brushed`, `steel-polished`, `bezel-ceramic`, `crystal`, `diamond`, `dial-face`. |
| `DD_REALISM_BASE` | `strap` only for face/edge/hole-rim; identifies the single application colour source. |
| `DD_REALISM_SHADE` | `1` for face, `0.45` for edge/hole rim. Apply in linear RGB to a fresh copy of the resolved base `Color`; never repeatedly darken an already recoloured material. |

Use explicit material metadata before legacy name heuristics for refined assets, retaining legacy behaviour for assets with no recognised version. Multiple role materials may coexist within one unchanged named mesh. Do not rename meshes or overload the existing hand `DD_ROLE`, `DD_REGION` and `DD_APPEARANCE_SCOPE` fields.

Named Blender input/material base `StrapBaseColor` drives neutral grayscale face grain. Edge/rim materials derive from that colour. Cream thread retains its authored colour/roughness. Hardware follows the existing case finish. One colour source does not require one material for every surface.

Preserve imported `MeshPhysicalMaterial` by cloning it directly. Upgrade a plain standard material only when necessary, copying common fields, maps, name and extras rather than constructing a partial replacement. Explicit application appearance changes modify only their owned properties; keep imported roughness/normal/anisotropy/sheen/clearcoat/iridescence properties for recognised realism materials. Unknown metadata falls back safely and is reported by the asset validator.

The `crystal` role uses neutral white transmission and opacity 1; the selected brief's IOR/roughness values belong in the exported material/probe report. Preserve supported AR extension values after import. If AR does not export or render correctly, retain neutral glass and log the omission. Never substitute permanently tinted glass. Retain the no-shadow crystal behaviour and verify print visibility through it.

## 5. Render capability verified from current source

Installed application dependencies specify Three `^0.186.0` and React Three Fiber `^9.4.1`. Use the installed lockfile/runtime when implementing rather than upgrading them speculatively.

The local `node_modules/three/examples/jsm/loaders/GLTFLoader.js` supports clearcoat, IOR, transmission, volume, sheen, specular, anisotropy and iridescence glTF material extensions. This proves loader capability, not Blender exporter success or final visual quality. Exporter probes must confirm which extension each Blender material actually emits and the in-app material bridge must stop discarding it.

Current HD scene has a PMREM-prefiltered `RoomEnvironment`, exposure `0.94`, ACES filmic tone mapping, sRGB output, warm/cool studio lights, shadows, antialiasing, demand rendering and DPR capped at 1.75. It has no path tracer, Cycles samples, denoiser or shallow-depth-of-field postprocessing. Its existing exporter is **2048×2048 PNG**. Keep the requested 2400-pixel Cycles hero shots in the offline Blender package; do not label current browser PNGs as Cycles outputs.

No new application rendering dependency is required to preserve supported glTF physical materials. The built-in Three HDR loaders/PMREM can support a later licensed studio environment if the render owner chooses one. Add postprocessing only after a measured visual benefit/performance probe; it is not a prerequisite for this integration package.

## 6. Medium-effort implementation package

Owner: application integration agent. Own these source files/tests; modelling agents own their assigned scripts/asset outputs. Lead performs the final asset promotion and integrated browser acceptance.

### APP1 — Pure material bridge and tests

Create `src/visual3d/realismMaterials.ts` with validated role reading, clone/physical-upgrade helpers, base-colour resolution and role-specific appearance application. Integrate into `GlbAsset.tsx` before legacy heuristic branches. Reuse imported textures and numeric finish values for recognised roles. Keep marker/scale/crystal visibility and legacy fallback intact. Add meaningful tests proving source immutability, independent recolour instances, darker derived edges/rims, unchanged cream stitching/hardware, no compounded recolour and preserved physical extension properties.

Coordinate the exact metadata keys/enum with the Blender material owner **before export**. Do not implement an alternate independent metadata scheme.

### APP2 — Preserve semantic hand finish and the single strap colour source

Change hand region appearance application to retain cloned source finish/maps while applying region colours/lume/tip coverage. Derived hollow-lume/tip geometry remains instance-owned and disposable.

Keep the existing resolved `archetypeAppearance.strapColor` as the single face/edge/rim colour source and preserve every current archetype default and switching-away/back behaviour. Confirm Undo/Redo/save/load retains the selected style and its palette. Test arbitrary brown/blue/tan inputs directly through the material bridge to prove recolouring is not hard-coded to the current palettes. No new colour field, palette or supplier option set is required for the baseline package. If a later acceptance decision requires arbitrary user editing, add the optional saved field/control described above as a bounded follow-up and test its reset/persistence separately.

### APP3 — Procedural parity and studio tuning

Share the material bridge's leather finish/neutral grain with `PreviewStrap`, preserving its authored dynamic dimensions, spring-bar bores and existing attachment curve. Improve only presentation detail within the protected envelope. Long-side-only hole and stitch detail must follow the role mapping resolved by VR0, rather than assuming both ends need holes. Use the approved modelling budget to decide normal-map versus geometry detail.

Keep neutral crystal handling consistent in procedural profiles. Tune the existing studio environment/lights only after comparing actual GLB and procedural fallback at the same camera. Preserve dark background, small print legibility, day/night lume and case silhouette. Avoid large dependency or renderer rewrites.

### APP4 — Promotion and browser acceptance

Consume the validated staging manifest and promote only the agreed processed files to their unchanged public paths. Update relevant manifests to describe genuine added meshes/materials without silently weakening existing assertions. Increment a stable asset revision in `glbLoadUrl.ts`; retain current retry stability. Record exactly which paths changed and per-file export omissions.

Run focused tests, production build and the existing Blender validators against promoted assets. Lead then verifies the browser matrix below using computer-use. If a budget or visual check fails, return the affected asset to its worker; do not compensate by silently changing engineering dimensions or disabling validation.

## 7. Validation and visual acceptance

### Existing targeted checks to retain

- `src/tests/visualAssetRegistry.test.ts`: category, paths and descriptor validity.
- `src/tests/visualWatchAdapter.test.ts`, `reference3dPreset.test.ts`, `nh05ResearchVisualWiring.test.ts`: selection, fixture, fixed-size fallback and saved bindings.
- `src/tests/visualSceneIntegration.test.tsx`: one demand-driven canvas, stable retry URLs, cache cloning, axis/unit placement, fallback and disposal boundaries.
- `src/tests/pilotScaleGlb.test.ts`, `referenceArtworkRendering.test.ts`, `dialTextureDirection.test.ts`: planar print surfaces, scale alignment and live dial finishes.
- `src/tests/componentVariantGlbLibrary.test.ts`: 43 original workload entries, registered paths, important named geometry and embedded brushing. Preserve original workload count; describe additional refinement detail explicitly rather than conflating assets with meshes.
- `src/tests/appearanceRendering.test.ts`, `handRegionAudit.test.ts`, `strapOptionsApply.test.ts`, `styleInspectorContext.test.tsx`: region ownership, defaults and context-specific controls.
- `tools/blender/validate_glb.py`: importability and nonempty meshes, not full glTF spec validation.
- `tools/blender/validate_component_variant_library.py`, `test_archetype_library_blender.py`, `test_lug_case_library_blender.py`, `test_reference_42_assembly_blender.py`, `test_component_assembly_blender.py`: family counts/geometry/provenance.
- `tools/blender/test_attachment_assembly_blender.py`: protected spring-bar axes/bores and no strap/case intersections across five straps and nine cases. Retain this test's physical bounds; resolve any deliberately allowed detail change at VR0.
- Add real Khronos glTF validation and before/after contract comparison to the offline asset package. Existing validators alone do not prove UV equality, pivot preservation, triangle budgets, no external URIs or extension portability.

Run focused application tests after APP1/APP2, then full `npm test`, `npm run lint`, `npm run build` at integrated promotion. Avoid repeating the full suite after docs-only changes.

### Browser matrix

| Scenario | Required observation |
|---|---|
| Existing saved projects and fresh default 40 mm | Same design, default colours and layout; improved detail, no missing or doubled artwork. |
| 42 mm Dress/Pilot/Field/Diver/Chronograph | Correct strap material; cream stitches survive palette changes; pusher visibility belongs only to chronograph. |
| 34 mm Ladies Dress, 38/40/46 mm and 42→other→42 | Fixed assets fall back correctly; procedural leather remains convincing; no 22 mm strap forced into smaller hardware, no disappearing material on return. |
| Existing strap/archetype palette changes and switch-away/back | Grain remains neutral; edge/rim colour recomputes from the same input; stitches remain cream and buckle metal follows case. Brown/blue/tan arbitrary-input coverage belongs in the material-bridge test unless an editable colour control is explicitly included later. |
| Case/crown/bezel independent finish changes | Refined roughness/normal detail survives, gemstone colour/geometry unchanged, separate crown stays correctly placed. |
| Semantic main/register hand metal/lume/tips, then Undo | Finish maps survive; independent scopes and tip bounds remain; source cache instance is unchanged. |
| Pilot slide rule, all scale modes; diver outer/internal rotation | No static/live duplicate graduations; original calibrated ring UV and dial-only decimal layer remain; scale rotates on the existing target. |
| Custom SVG/image dial artwork and date/day apertures | Artwork aligned at centre/radii/orientation and not obscured by new detail or crystal tint. |
| Crystal front/oblique views, AR off/on reference | Clear print at front, faint angle-dependent coloured reflection only; no coloured bulk tint. |
| Full-screen HD, drag/zoom, explicit preview/apply, repeated component swaps | No freezes, loader errors or increasing resources; same controls remain responsive. |
| Day/night and 2048 PNG export/package | Lume ownership and image framing preserved; export restores prior viewport/camera. |

Capture before/after screenshots at identical design, viewport, camera and lighting; inspect a normal watch zoom plus strap macro. Record browser errors and measured frame/load cost on this computer. Agree final asset texture/triangle/file-size budgets with VR0; this package does not invent unmeasured performance targets.

## 8. Handoff completion checklist

- VR0 processing manifest, baseline binary/UV/transform report and backups exist.
- Role metadata exporter probe and Three import preservation probe agree.
- APP1–APP4 owners have separate write scopes; no worker overwrites another worker's staged assets.
- All original registered component IDs/paths remain available; review assets are not accidentally published.
- Before/after per-file triangles, bytes, maps, extensions and omissions are attached to the staged export report.
- Integrated tests and real browser matrix pass; public files are promoted only then.
- Original source assets and reproducible scripts remain recoverable. Cycles scene, hero pose/lighting and AR comparison are offline deliverables rather than new dashboard variants.

Medium reasoning effort should be sufficient to execute this package once VR0 resolves object identities and protected geometry conflicts. Re-escalate planning only for an unresolved attachment/dimension/UV contract or a failed exporter/renderer capability probe, not for routine material and UI wiring.
