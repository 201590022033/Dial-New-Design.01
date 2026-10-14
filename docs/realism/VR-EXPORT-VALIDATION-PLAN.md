# Watch realism export, validation and promotion plan

Status: planning handover, 13 October 2026. No models or application code were changed by this workstream. Blender version, Cycles device and installed exporter capabilities are supplied by the lead's machine probe; references to current upstream source below establish what to test, not what this installation has already passed.

The source contract is [the user's preserved brief](../briefs/WATCH-REALISM-USER-BRIEF-2026-10-12.txt) and [the separate post-DF plan](../WATCH-REALISM-PLANNED-AFTER-DF-2026-10-12.md). Execute the mechanical steps below at medium effort after VR0 has recorded component identities and resolved geometry scope. Keep larger decisions and acceptance limits in the manifest so execution does not depend on remembering this conversation.

## Existing pipeline and material integration findings

- `tools/blender/validate_glb.py` currently imports a GLB and requires meshes and nonzero vertices. It is a smoke check, not a glTF conformance, artwork, triangle-budget or pivot validator.
- `validate_component_variant_library.py` additionally checks manifest mesh counts, finite bounds, assigned materials and overlapping supplier lug roots. Preserve these checks for their applicable assets; they do not cover the new material/UV contract.
- `render_review.py` provides reproducible four-view 512 px orthographic reviews, currently expecting the `BLENDER_EEVEE` engine and AgX. Reuse it for geometry comparisons only after confirming the installed engine identifiers. Add a separate Cycles hero harness rather than converting this small existing regression fixture into the final photography pipeline.
- Existing generators export selected components with `export_yup=True` and `export_extras=True`. The renderer uses registry units, axis conversion, component anchors and offsets. Most current descriptors declare numerical millimetres and Y-up. Do not add a second axis rotation, origin relocation or 0.001/1000 scale conversion to production assets.
- `src/visual3d/GlbAsset.tsx` clones the cached source scene and adjusts materials by object/material name. These names are part of a working application interface. It also hides authored hour markers and bezel scale relief when live application artwork replaces them.
- **Critical integration item:** the crystal path currently creates a new `MeshPhysicalMaterial` from a small subset of texture/base properties, losing physical properties imported through glTF extensions. It then forces a blue colour, opacity 0.26, IOR 1.76 and thickness 0.75. The brief asks for neutral clear glass and subtle AR reflection. A refined crystal GLB alone cannot meet this brief while that override remains. Preserve imported supported physical channels and resolve display overrides explicitly in VR5; test neutral glass both before and after dashboard updates.
- **Critical recolouring item:** the strap path currently overwrites base colours and lightens relief/rail pieces. The requested darker hole rims/edge paint need an explicit semantic/material contract, neutral texture modulation and dashboard-derived darker colour. A Blender node group input will not become an application control automatically.
- Local `node_modules/three/package.json` reports **0.186.0**. Its checked loader source supports clearcoat, IOR, sheen, transmission, volume, iridescence and anisotropy. No Draco, KTX2 or Meshopt decoder is configured in `GlbAsset.tsx`. The first release should use standard uncompressed GLB geometry with PNG/JPEG textures. Additional compression is a separate measured improvement requiring actual loader setup, decoder assets and fallback tests. The official [Three GLTFLoader documentation](https://threejs.org/docs/pages/GLTFLoader.html) describes the required decoder hooks.

## Observed baseline and provisional web budgets

A read-only GLB JSON scan on 13 October found **114 GLB files**, **40,814,872 bytes** in total and **730,050 stored triangles**. This includes review fixtures and legacy component assets; it is not an approved input list or the geometry simultaneously rendered by the app. The scan sums mesh primitives once; the final inventory must also count node instances and visible runtime geometry.

| Existing example | Bytes | Stored triangles | Primitive groups |
|---|---:|---:|---:|
| `reference-42/strap.glb` | 126,416 | 2,160 | 15 |
| `archetypes/strap-leather.glb` | 105,044 | 1,808 | 10 |
| `archetypes/strap-racing.glb` | 409,520 | 7,448 | 40 |
| All nine `reference-42` components, combined | 1,688,720 | 43,096 | 194 |
| `archetypes/bezel-pilot.glb` | 1,596,400 | 52,708 | 162 |
| `archetypes/chapter-ring-pilot.glb` | 1,416,880 | 50,564 | 89 |
| `variants/dials/dial-namoki-108-silver-285.glb` | 1,251,772 | 19,452 | 380 |
| `face-review/assembly-animated.glb`, review fixture | 4,527,672 | 43,088 | 1,328 |

Use these as initial engineering budgets, finalized in VR0 after profiling the actual supported style assemblies. They are project decisions, not limits imposed by glTF.

| Web asset or resource | Target | Promotion ceiling / handling |
|---|---|---|
| Leather strap, holes and stitching included | 15,000 triangles | 25,000; bake fine thread/grain before exceeding it |
| Case/lugs component | 35,000 triangles | 60,000; no unnecessary hidden bevel subdivision |
| Hand set | 12,000 triangles | 20,000; preserve hand stack/pivots |
| Bezel or chapter ring | 70,000 triangles | 90,000; existing pilot geometry is already expensive |
| Dial component | 60,000 triangles | 80,000; no decimation/repacking of protected artwork geometry |
| Crystal | 12,000 triangles | 24,000; silhouette/dome quality decides subdivisions |
| Complete visible watch assembly | 180,000 triangles | 250,000; total every simultaneously loaded node instance |
| One component GLB | 2 MiB | 4 MiB; justify necessary texture exceptions in manifest |
| Complete style download, distinct loaded components | 8 MiB | 12 MiB; count actual transferred bytes, not duplicate aliases |
| Exported image dimension | 1024 typical; 2048 for close-up leather/printed scale | 2048 on either axis, per brief; hero source textures can be larger outside GLBs |
| Decoded resident asset texture memory per watch | 64 MiB | 96 MiB, excluding framebuffers/environment; record full RGBA mip estimates |
| Visible runtime draw calls | 250 typical | No unexplained increase above baseline; >400 requires optimization/explicit per-style exception |

Do not join/re-name protected meshes merely to hit draw calls. Some existing dials already have hundreds of separately named objects. Prefer baked non-artwork microdetail and material reuse; report exceptions rather than quietly altering component identity. A 2048² RGBA texture with full mip levels costs about 21.3 MiB in GPU memory even if its PNG is small. Keep separate images only where channels/UVs require them; pack occlusion R, roughness G and metallic B when appropriate.

Record the existing and candidate visible triangle/draw-call counts, load/decode timing and interaction timing on the user's machine at the same viewport and pixel ratio. Aim for 60 fps orbit, accept no sustained drop below 30 fps on this machine, and no more than 10% regression in warm selection/orbit p95 timings without an explicit decision. Run at least 20 component/recolour/HD toggles and check texture/geometry memory returns to a stable level. Hero sample count never becomes the browser quality setting. Existing repeated-selection freezes mean performance is an acceptance requirement, not a final optional polish.

## Output layout and immutable source contract

Use one unique run directory under `.artifacts/watch-realism/<run-id>/`. Do not overwrite a previous run, even a failed one.

```text
backup/                         exact original GLBs and dependent external source images
input-manifest.json             approved assets, styles and source SHA-256 values
capabilities.json               Blender/exporter/renderer/device/dependency versions and probe results
baseline/<asset-id>.json        decoded geometry and application interface snapshot
work/<asset-id>.blend           source objects plus unapplied detail modifiers/materials
bakes/<asset-id>/               neutral maps and bake provenance
candidate/components/           same relative component paths as source
candidate/styles/               assembled per-style deliverable GLBs, separate from runtime components
renders/<style-id>/             2400 px PNGs, AR comparison pair and review images
reports/<asset-id>/             validator, roundtrip diff, budgets and export-loss records
promotion-manifest.json         candidate hashes, destination paths, baseline hashes and test evidence
run.log                        commands, exit codes, durations and failed stage details
```

Keep the scripts/configuration in versioned `tools/blender/realism/` during implementation; the files named in the next section are proposed interfaces and do not exist yet. Preserve existing public assets until promotion. Large work `.blend` files and high-resolution bake sources stay in the run directory or designated deliverable archive; final web assets, pipeline code, configs and small reports are the reviewable Git change.

Every manifest entry must include `assetId`, source and destination relative paths, source/candidate SHA-256, category, component role resolution, baseline node and mesh names, parent hierarchy, local/world transforms, units/axis interpretation, attachment anchors, protected artwork objects, UV channel ownership, source/default colours, before/after stored and instantiated triangles, primitive/material/image counts, image dimensions, bytes, renderer extensions and declared feature losses. Record any added detail objects and their parent; preserve every original object name and pivot. Added objects use stable unique names in a `DD_VR_` namespace after confirming application matchers will not misclassify them. Missing role identification gets `unresolved`, never a guessed geometry edit.

glTF's standard coordinates are right-handed Y-up and its linear distances are metres. The project deliberately interprets many existing numerical coordinates as millimetres in the registry; a schema validator does not catch an inappropriate project scale. Preserve this inherited convention for replacement components and verify the renderer's actual assembled millimetre envelope. A standalone style GLB may use standards-correct metres only through a **separate documented export profile**, with its own envelope test and no registry-path replacement. See the [Khronos coordinate and units specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#coordinate-system-and-units).

## Reproducible execution stages

### 1. Preflight and approved inventory

1. Confirm Git base and the lead's recorded Blender path/version/device; write capabilities with `bpy.app.version_string`, Python version, export operator RNA settings and relevant Principled socket names. Select supported options rather than hard-code Blender 5.2 APIs into new scripts.
2. Discover all repository GLBs but modify only manifest-approved production files. Review/legacy assets remain inventoried with explicit exclusion reasons. Identify duplicate-byte aliases so a component is refined once and propagated deliberately.
3. Copy approved originals plus original texture dependencies to `backup/`, hash them, verify copied hashes, then inventory originals in fresh Blender processes. Blender saves happen only to `work/`.
4. Preserve transforms, material slots, UVs and metadata before any modifier. Count triangulated evaluated geometry via loop triangles, not Blender polygon counts. Compute glTF primitive triangle modes correctly and include instance multiplication.
5. Render baseline review and one representative assembled reference/pilot style. Where names/roles are ambiguous, the original brief requires user OK before Phase 1. Continue unrelated resolved inventories/probes while that narrow ambiguity is resolved. Do not turn routine exporter configuration into another approval gate.

### 2. Export capability canary before expensive assets

Build a small disposable probe scene outside production with separate materials: metallic/roughness/normal, clearcoat, sheen, anisotropy, transmission+IOR+volume, and iridescence. Export it with the installed exporter, read its GLB JSON, run the validator, re-import in a fresh Blender process and display through the application's exact Three loader path. Record the expected/actual property values and extension names individually.

Upstream exporter source contains dedicated [anisotropy](https://raw.githubusercontent.com/KhronosGroup/glTF-Blender-IO/main/addons/io_scene_gltf2/blender/exp/material/extensions/anisotropy.py), [transmission](https://raw.githubusercontent.com/KhronosGroup/glTF-Blender-IO/main/addons/io_scene_gltf2/blender/exp/material/extensions/transmission.py), [clearcoat](https://raw.githubusercontent.com/KhronosGroup/glTF-Blender-IO/main/addons/io_scene_gltf2/blender/exp/material/extensions/clearcoat.py) and [iridescence](https://raw.githubusercontent.com/KhronosGroup/glTF-Blender-IO/main/addons/io_scene_gltf2/blender/exp/material/extensions/iridescence.py) handling. Those upstream features may differ from the installed exporter. The canary result is the execution authority.

The web decision table:

| Desired feature | Cycles/work source | Shipped GLB representation and test |
|---|---|---|
| Leather pores, grain, subtle patina | Voronoi/noise/procedural colour and bump | Bake neutral greyscale albedo modulation, roughness and tangent-space normal; no fixed strap hue or studio shadows baked into colour |
| Raised seams, hole rims, keeper and buckle | Non-destructive geometry/modifiers | Real silhouette/holes when budget permits; thin stitches/rims may use normal maps; ensure long strap only and dashboard colour linkage |
| Brushed metal | Procedural direction/anisotropic BSDF | Tangent normal/roughness plus optional proven `KHR_materials_anisotropy`; verify circumferential tangent direction after export |
| Ceramic coat | Principled coat | Proven `KHR_materials_clearcoat`; log fallback if unavailable |
| Clear crystal | Principled transmission/IOR | Proven transmission+IOR, volume only with deliberate unit conversion; opacity stays fully opaque alpha for physically transmitted clear glass unless tested need says otherwise |
| AR thin film | Supported Principled thin-film, or restrained reflection-only fallback | Proven `KHR_materials_iridescence` only if subtle neutral transmission survives app loading; otherwise omit AR from GLB and disclose it |
| Leather sheen | Principled sheen | Proven `KHR_materials_sheen`, otherwise retain roughness/normal fallback |
| Dial/scale artwork | Original texture/UVs plus separate microfinish | Exact protected UV/artwork relationship; runtime live SVG remains dynamic and crisp |
| Bevel/displacement/thread curves | Modifiers/high-detail source | Evaluated mesh for silhouette; bake subpixel detail; curves must become exportable meshes in staging only |
| Studio lights, shallow DOF, denoising, AgX | Hero scene | PNG delivery only, not a claim that GLB stores Cycles lighting or colour management |

Arbitrary Blender node networks do not ship as shaders. A bake preserves appearance channels, not a live procedural graph. The [iridescence specification](https://raw.githubusercontent.com/KhronosGroup/glTF/main/extensions/2.0/Khronos/KHR_materials_iridescence/README.md) describes angle-dependent thin-film reflection; it is not a fixed glass colour or a guarantee of a physically complete antireflective coating. The brief explicitly permits dropping web AR rather than tinting glass.

### 3. Deterministic candidate build

Implement `build_watch_realism.py` with `--manifest`, `--asset-id`, `--stage` and `--output-dir`. Build one known reference component first, then the first complete style. Import original into a clean scene, resolve role by the manifest, apply only that workstream's materials/modifiers, save `.blend`, bake deterministic maps using a recorded seed and write candidate GLB.

Keep source transforms/origins un-applied. Export a staging copy with selected component objects, Y-up, extras, UVs, normals and tangents as applicable; apply geometric modifiers there. No hero lights, cameras, backup collections, cutters or temporary objects are selected. Disable compression for initial profile. Do not animate or bake 10:10:35 into runtime component defaults; use that pose in assembled render scenes/deliverables only.

`--stage` supports resume at validated boundaries, and each stage checks the manifest hash plus its inputs. Rebuild if a script, source, bake setting or capability fingerprint changes. Reproducible means semantic geometry/material equality and recorded settings; PNG/GLB binary bytes may contain metadata or renderer-level nondeterminism. Use SHA-256 for provenance, not as the only reproducibility test.

### 4. Independent GLB and preservation validation

Implement a small Node wrapper `tools/blender/realism/validate_gltf.mjs` around a pinned local `gltf-validator` package. The lead may install it during planning in isolated tooling or as a dev dependency; no global install and no application runtime dependency are needed. Write complete JSON reports, fail on errors, and review every warning against an explicit code/path/reason allowlist. An unknown-extension warning must not become a blanket ignored warning. Khronos's [official validator](https://github.com/KhronosGroup/glTF-Validator) validates GLB/JSON/buffers/images and produces issue/statistics reports; it does not prove visual quality or app compatibility.

Implement `compare_watch_contract.py` to compare original and fresh re-imported candidate against the baseline in one coordinate convention. Check:

- Every original object/node name and hierarchy remains; there are no unexpected `.001` duplicates, renamed pivots, recentered roots, omitted components or moved parent frames. Compare raw GLB names as well as Blender names, because import may uniquify duplicates.
- Protected object local transform differences stay within numeric tolerance; physical attachment points and unchanged dimensions remain within **0.001 mm** in project coordinates. This is a numerical preservation gate, not a claim of manufacturing accuracy. Record any explicit approved geometry envelope exception per object and reject all unlisted exceptions.
- Protected dial and `DD_SCALE_SURFACE_*` geometry/UV mapping remains unchanged. Decode accessor semantics and compare position+UV correspondences across index/vertex reorderings, preserving UV seams. Do not compare only accessor byte offsets or counts. Do not unwrap/repack/decimate protected artwork geometry. A normal/bake UV channel can be added to non-artwork surfaces without replacing their primary UV ownership.
- Preserve existing texture image bytes when unchanged, colour space, sampler/wrap modes, texture transforms and material assignments. New normal/roughness/metal maps use linear data; albedo/emission use colour interpretation. Verify normal-map handedness and tangents in actual app lighting.
- Retain `DD_*` extras, source provenance and scale annulus metadata. Check live scale extents and the current pilot surface extras used by `pilotScaleGlb.test.ts`.
- Non-artwork evaluated detail geometry has finite positions/normals, valid indices/material assignments and no gross new self-intersections, floating buckle/rims, wrong-face normals, interpenetrating hands/crystal or disconnected attachments. Report intentional open strap holes separately from invalid geometry.
- Enumerate every used/required extension against canary and loader support. Required unsupported features block promotion. Every intentionally dropped feature appears in per-file change log with precise Cycles/web scope.
- Budgets pass; seven holes are on long strap only; colour dependency test proves rims/edges darken with at least dark, light and saturated dashboard strap colours. Existing base/default colours are retained.

The existing `validate_glb.py`, relevant Blender assembly/attachment tests and repository asset tests remain additional checks. They are not substitutes for this contract comparison.

### 5. Visual and application acceptance

Render baseline/candidate under identical neutral review lights and hero studio lights. Inspect 100% crops plus normal app zoom: front dial alignment, 3/4 metal highlights, crystal readability, hole/stitch macro, buckle attachment and hand stack. Hero delivery is at least 2400 px wide and at least 256 Cycles samples with a recorded denoiser, device, view transform, exposure, lens/focus and 10:10:35 pose. AR-off/on images use precisely the same camera/lights/exposure; the off image is comparison evidence only.

Use browser computer-use for the real dashboard. Test representative ladies dress, dress, field, diver, pilot and chronograph assemblies, sizes that use authored assets and sizes that select procedural fallbacks. Exercise recolours, lume/night, live pilot/diver markings, rotating bezel, hiding/unhiding crystal/rehaut, component replacement/Undo and repeated HD/Engineering switches. Keep screenshots and console/network evidence. Verify no live artwork doubled by authored relief, sapphire does not become cloudy/tinted after app override, strap edges follow recolouring and exact selected component remains aligned after Undo/reload.

Run focused asset/appearance/pilot tests after each first integrated family. At final promotion run full repository tests, lint and production build once. New failures or changed geometry/material logic justify focused reruns; do not spend execution effort repeatedly running unrelated passing suites.

### 6. Promotion, rollback and handover

Only the lead promotes candidates after all checks pass. Construct `promotion-manifest.json` with exact source hashes, candidate hashes and destination paths. Recheck current destination hashes against the original baseline to detect intervening work. Copy only approved candidate files; preserve registry asset IDs, geometry anchors and default colour configuration. Update an explicit content version in `glbLoadUrl.ts` or equivalent stable content URL so browser cache cannot serve old GLBs; avoid per-render random URL changes which previously caused Suspense load loops.

Do not replace registry components with the assembled per-style delivery GLBs. Keep those as separate download/review outputs so independent component selection, ownership and fitting remain valid. If the agreed scope excludes an asset, the final report lists that asset and reason rather than claiming all repository GLBs were refined.

Rollback copies exact backed-up originals to the manifest's destination paths and restores the matching material/URL integration change. Verify original SHA-256 values and reload an isolated browser test session. Git revert is suitable after a committed integration; do not reset unrelated later changes. A failed candidate remains under its run ID for diagnosis and never receives a success/promotion manifest.

The medium-effort implementer receives: approved input/role manifest; machine capability and canary report; agreed budgets/exceptions; protected object/UV/geometry baselines; script CLI contracts; first reference style config; output paths; named application material integration changes; test commands/checklist; license/provenance list for any external textures; and the exact next runnable stage. Hand back a per-file change/export-loss log, before/after budgets, validator/contract reports, final GLBs, `.blend` sources/scripts, hero PNGs and a promotion/rollback record. Stop only the affected modelling work if unresolved identities or new dimensional changes need a decision; continue independent validated tasks.
