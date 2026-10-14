# Watch realism: surface and studio-render execution plan

Status: planning only, 13 October 2026. No GLB, Blender scene, dashboard code or source palette was changed by this workstream. The preserved [user brief](../briefs/WATCH-REALISM-USER-BRIEF-2026-10-12.txt) remains the requirement. This plan supplies executable art direction for medium-effort implementation after the lead fixes the VR0 input/identity manifest.

## Visual outcome

Make the watches read as carefully photographed objects: broad steel reflections break into thin polished edge highlights; ceramic has depth; the dial remains readable through clear glass; straps show believable scale, edge treatment and construction. The visual impact comes from controlled lighting, surface response and close-up construction detail. Preserve the existing watch design, default colours and selected parts. Avoid coarse procedural grain, exaggerated scratches, blue glass, inflated lume, rainbow AR, crushed black straps and white reflections covering the dial.

Use one coherent studio family across all styles. A charcoal seamless background, neutral top light and restrained warm edge light establish the range. Keep a neutral-white strip reflection available on every metal component so bronze, rose gold and black PVD remain distinguishable using their existing colours. The light can be warm; the output palette must not be recoloured to create a mood.

## Source contracts to read before touching materials

| Existing source | Contract relevant to this work |
|---|---|
| `tools/blender/reference_42_supplemental.py` | Separate dial/chapter/bezel/crystal/strap assets; attachment metadata; spring bars; pre-existing keeper and tang hardware; numeric coordinates in millimetres. |
| `tools/blender/generate_archetype_library.py` | Separate diver/pilot/field/dress/chronograph parts and four strap surfaces. Current strap preview halves are symmetric, 58 mm long, 3 mm thick, 22-to-18 mm nominal taper before attachment clearance. |
| `tools/blender/generate_pilot_scale_surfaces.py` | Authored pilot inner/outer annuli and default scale details. Preserve the scale-bearing surfaces and their alignment. |
| `tools/blender/generate_component_variant_library.py` | Real material regions and exceptional components, including pre-existing sunburst roughness texture, rose gold, diamonds, 34 mm NH05 components and source-provenance metadata. |
| `tools/blender/parametric_case_v1.py` | Continuous steel shell and material-region polished shoulders; lug and crown interfaces. Do not give every region the same roughness. |
| `src/visual3d/visualAssetRegistry.ts` | Asset ID/path, category, anchor, authored units/axis, offsets, reference diameter and scale-artwork bounds. |
| `src/visual3d/watchAssemblyToVisualModel.ts` | Actual full-watch composition and fallback rules. |
| `src/domain/configurator/archetypeProfiles.ts` | Current gallery compositions and dashboard-owned default colours. |
| `src/visual3d/GlbAsset.tsx` | Runtime material replacement/recolouring and suppression of authored markings when live artwork is present. |
| `src/visual3d/VisualWatchScene.tsx` | Live artwork, marker/hand regions, procedural fallbacks and current studio environment. |
| `tools/blender/render_review.py` | Deterministic technical review views. Retain this review lane separately from the new Cycles beauty-render lane. |

**Runtime integration is required for the visual result.** `GlbAsset.tsx` currently reapplies scalar roughness, metalness, colours and crystal properties after importing a GLB. It can also replace dial finish maps. New exported textures alone cannot promise the same result in HD. The integration owner must retain the authored normal/roughness/anisotropy maps and region detail while applying the app's existing colour controls. Keep rendering changes out of engineering dimensions and supplier-fit evidence.

## Geometry preservation and the numeric brief

VR0 records mesh names, material slots, transforms, local bounds, evaluated bounds, UV sets, pivots, attachment frames, hand stack and printed surface frames. Every later output compares against that record.

| Requested target | Implementation rule |
|---|---|
| 22 mm strap tapering to about 20 mm; 3.5–4 mm padded profile | Treat as a target only where the recorded source already permits it. Current archetype previews differ. Keep attachment/bore geometry, near width, overall width/length/thickness envelope and proportions fixed. A material-only pillow appearance is safe; silhouette/profile redistribution requires the lead's recorded geometry decision. Do not stretch all straps to these numbers. |
| Seven long-tail holes, approximately 2 mm diameter at 7.5 mm pitch | First identify the real long and short ends. `12`/`6` labels and symmetric preview lengths do not establish tail identity. Existing reference hardware identifies its buckle end; record this rather than infer universally. If seven holes cannot fit with proper edge/end margins, flag that input for resolution instead of changing its length. New recess detail must leave the attachment interface untouched. |
| Keeper/buckle tongue | Reference rubber assets already have hardware. Add only after manifest confirms the relevant leather asset lacks it and identifies its buckle end. Never duplicate hardware or automatically put leather fittings on canvas/rubber. |
| Crystal dome rise 0.8–1 mm; thickness around 2.5 mm | Preserve actual selected crystal thickness, seat and dome. No automatic inflation of flat or thinner crystals. Obtain better reflections from shading and lighting. A dome is a geometry decision, not a shader shortcut. |
| Hard-edge bevel 0.1–0.2 mm | Never bevel all edges indiscriminately. Keep bores, seats, crystal interface, hand aperture and printed annuli unchanged. Prefer normal shading/baked microbevel inside the existing envelope; bounded bevel modifiers only on approved presentation edges. |
| Hands about 0.3 mm thick | Preserve hand stack, bores, pivots, overall silhouettes and clearance. Existing 0.16 mm hands must not be thickened silently. Shading/normal treatment can suggest a machined edge. |

Two explicit brief exceptions need ledger entries: additional strap construction details and hero-only hand rotation. Added helper objects receive a new reserved detail namespace while all original names remain unchanged. Hero pose is confined to a duplicate render assembly and is never exported back as an app default or a changed pivot.

## Material recipes

Values below are initial look-development settings, not measured material evidence. Preserve recorded base colours. All procedural texture distances are defined in millimetres in the original object frame, with deterministic seeds, so resizing a render camera cannot resize the grain. Bake visual-only relief for the web; it must not become manufacturing geometry.

### Leather and racing leather

- Single semantic base-colour parameter shared by the face, edge and hole-rim recipes. Use a linear-light multiplier of approximately `0.45` for the requested darker edges/rims, not a fixed brown/black painted texture. Retain a neutral grayscale modulation map with average near white. Stitch cream remains a separate existing/requested thread colour.
- Face: Metallic 0, Roughness 0.48–0.56, Sheen Weight start 0.32 and compare the brief's 0.5, with subtle warm sheen tint. Face highlights must be broad; leather must not resemble wet rubber.
- Full-grain recipe: a gently warped Voronoi distance field for 0.18–0.45 mm pores, fine noise at 0.02–0.06 mm and broad variation over 4–12 mm. Keep base-colour modulation within roughly ±3%; let roughness and normal carry most detail. Start height equivalent at 0.015–0.035 mm and reduce until normal-zoom leather does not look pebbled. Never bake actual light highlights into colour.
- Edge: a continuous darker boundary, Roughness 0.30–0.38, fine directional burnish. Preserve the sidewall envelope. Do not whiten the edge or add a thick raised border that changes the strap width.
- Stitch rows: requested 2 mm inset/3 mm pitch where recorded width allows; softly rounded waxed thread about 0.20–0.28 mm diameter. Hero curves may be high quality; web version can use a tangent-space normal plus neutral tint mask, or bounded instanced geometry if the budget permits. Curve endpoints should enter the leather rather than float above it. Check that existing decorative edge strips are not rendered as a second stitch row.
- Hole detail: use real geometry in the hero duplicate only after the geometry gate; web geometry or baked recess according to the agreed budget. Dark rim and slight local compression carry the appearance. Patina around holes and buckle fold is restrained roughness variation, not broad stains or a new colourway.
- Racing leather keeps its existing perforation pattern and style identity. Current generated racing 'holes' are shallow filled cylinders in both preview halves; do not call them real cut-through holes or blindly replace them with the seven adjustment holes. Distinguish decorative perforation from long-tail adjustment holes in the manifest.

### Rubber

Retain rubber construction, rails/grooves and hardware. Metallic 0, Roughness 0.58–0.68, very slight sheen 0.08–0.18. Use a fine 0.035–0.08 mm microtexture with 0.005–0.015 mm visual relief and no leather pores, cotton stitching or patina. Let groove flanks catch narrow gradients so the black strap stays readable without lightening its base colour. Keep rail/detail colour relative to the app's selected rubber colour; do not impose the leather edge-darkening rule on existing rubber relief without a reason.

### Canvas

Preserve the woven strap style. Metallic 0, Roughness 0.82–0.90, Sheen Weight 0.15–0.30. Procedural weave uses two crossing periodic fields, staggered over/under relief, yarn pitch 0.30–0.45 mm and microfibre noise below 0.03 mm; start normal relief at 0.02–0.04 mm. Yarn colour modulation stays neutral and within roughly ±4%. Bound weave contrast to avoid moiré at normal zoom. Use an edge seam where already represented; no leather edge paint, pores or unsolicited leather hardware. Do not add loose geometry fibres to web GLBs.

### Steel, bronze, rose gold, PVD and crown

- Brushed steel: Metallic 1, Roughness around 0.30, Anisotropic start 0.5 where the installed shader/exporter and runtime support it. Use radial/circumferential brushing on appropriate circular upper surfaces and longitudinal brushing on lug flats/sidewalls according to their existing design. A single world-axis brushed shader across the whole watch looks artificial.
- Polished shoulders, rim and hand bevel regions: Roughness 0.06–0.12, smoother normal response and restrained bright strip highlights. Preserve material boundaries in the continuous case; no new 'chrome' colour variant.
- Use microbrushing mostly in roughness/normal, with tightly bounded strength. No conspicuous radial grooves or uniform scratch decal. Give crowns' knurl valleys controlled normal contrast; retain the existing actual flute silhouette, crown position and dimensions.
- Preserve bronze/rose-gold/PVD defaults and finish identity; do not remap every named metal to silver. Blasted steel remains a fine isotropic roughness treatment. Diamond components remain distinct from sapphire crystal; do not give them the crystal IOR recipe.
- Web anisotropy is a capability test, not a promise. The Blender glTF exporter documents specific tangent/UV linkage for anisotropy. If support fails, bake restrained brush normals and roughness and record the loss. [Blender glTF material export](https://docs.blender.org/manual/id/5.0/addons/import_export/scene_gltf2.html).

### Ceramic and printed scales

Keep the bezel insert's existing base colour, use Coat Weight 1, coat roughness around 0.08 and base roughness 0.12–0.20. Compare metallic 0 against the current illustrative 0.18; select a calibrated response in the shared material contract rather than allowing Blender and runtime to diverge. Printed graduations/numerals use matte ink around roughness 0.5–0.7 with low metalness. Keep print fully sharp and the lume pearl's shape intact. No bump/noise chain is allowed to affect the scale ink, artwork alpha or numeral edges. Rotation/printing stays on the same physical annulus, including pilot inner/outer scale pairs.

### Dial, indices and hands

Preserve dial UV0, texture orientation, artwork aspect and selected content exactly. Existing SVG/live scale output is the artwork source for full-watch render assembly; do not substitute a screenshot or raster illustration of another watch. Use 4K–8K rasterisation for the offline render duplicate when needed for text, retaining the same UV mapping; web texture is at most 2048 px as requested. Do not re-unwrap the dial to add finish detail. A secondary UV can be used on other components; dial finish must follow the existing artwork coordinate contract.

Matte dial starts around Roughness 0.55–0.65 with 0.002–0.008 mm subtle bump. Sunburst/linen/guilloche remain the existing finish, with subdued procedural relief and their authored direction/registration. Printed text and minute tracks remain clean. Applied indices read through polished border versus soft lume interior, without changing silhouette. Existing hour/minute lume masks stay attached to the existing hands; respect the seconds counterweight and stack. Daytime lume has low emission only, so pale-green material retains visible form rather than glowing flat white. Night render is an optional proof of the existing switch, not a new dashboard mode or a required hero colourway.

### Clear crystal and AR

The brief requests neutral clear glass, Transmission 1, Roughness 0, IOR 1.55 and subtle angle-dependent magenta/green reflection. Start the Cycles development recipe at those values. Preserve recorded geometry and rim normals. Do not tint transmission or lower alpha to simulate AR. Thin-film support must be probed by socket/API inspection on the installed Blender; Blender documents thin film as a Cycles feature that can affect both reflection and transmission, so it needs a neutral-transmission visual check rather than automatic acceptance. [Principled BSDF thin film](https://docs.blender.org/manual/en/dev/render/shader_nodes/shader/principled.html).

The current source GLB helper uses blue crystal with alpha 0.16/transmission 0.45, while the current app overrides it with `#e8f7ff`, opacity 0.26, transmission 0.98, IOR 1.76 and thickness 0.75. These are inconsistent presentation recipes. The lead must record a shared neutral-crystal resolution and explicitly note the requested 1.55 versus current 1.76 discrepancy. Do not silently claim a physical sapphire calibration from either illustrative value. Correcting the inherited blue-opacity workaround fulfils the user's clear-glass requirement; it must remain one default material, not an added colour option.

For AR look development, sweep a narrow selection of film thickness/IOR values on a render-only duplicate and choose the faintest usable effect. Keep the chosen parameters in the recipe manifest. If thin film produces visible colour in the dial/transmission, reduce it or use the brief's render-only Fresnel reflection approach. Neither approach may use a tinted transmission hack. The off/on pair differs only in AR parameters, with identical scene/camera/exposure/seed. A subtle colour fringe confined to a grazing highlight is success; a magenta/green crystal disk is failure.

For web export, test actual iridescence/transmission/IOR support against this installed exporter and the app loader. Do not ship a complex unsupported node graph and assume it survived. If AR cannot carry correctly, export neutral glass without it and list AR as offline-only. Exporter normal maps need tangent-space data and recognised node connections, as documented in [Blender's glTF material workflow](https://docs.blender.org/manual/id/5.0/addons/import_export/scene_gltf2.html).

## Full-watch assemblies, not imagined complete inputs

Most existing GLBs are components. First refine each unique approved GLB once, then assemble hero scenes from a frozen app composition manifest. The six existing gallery targets are Ladies Dress, Dress, Field, Diver, Pilot and Chronograph. Do not create six independent complete-watch source models or overwrite shared parts multiple times. The assembled hero scene records exactly which refined or procedural component was used in every category.

| Gallery target | Asset composition that needs special attention |
|---|---|
| Ladies Dress | Uses procedural default dial/bezel/hands in the current profile and a 34 mm NH05 platform. Do not force 42 mm archetype parts into it or pretend there is an existing complete GLB. Use the resolver's actual supported assembly; a separately constructed offline procedural equivalent must be labelled in its manifest. |
| Dress | Dress dial/bezel/hands + leather; standard eligible reference platform components. |
| Field | Field dial/bezel/hands + canvas; weave is visible on the strap macro. |
| Diver | Diver dial/bezel/hands + rubber; zero pearl, elapsed-time ink and distinct brushed/polished metal response. |
| Pilot | Pilot dial/bezel/hands + leather + pilot chapter-ring annulus; both logarithmic scale surfaces and decimal-hours dial-only artwork must match current dashboard configuration. |
| Chronograph | Chronograph dial/bezel/hands + racing strap + actual pushers; preserve register centres, needle/baton/syringe choice and existing register hand colours. |

Read `referenceCaseDiameterMm` and use the resolver's fallback behavior. Never scale an authored fixed-size part to manufacture a larger hero watch. Include one default 42 mm reference proof and the supported 34 mm Ladies Dress proof to expose incorrect assumptions early. Additional variant and lug assets receive material/invariant processing and technical review according to the input manifest; they are not all new hero colour options.

## Studio recipe for the Cycles render lane

Create `tools/blender/realism/render_hero.py` during implementation, using a separate render scene/duplicate assembly. Never run the existing 512 px technical review renderer as the beauty renderer, and do not rewrite its recentering behavior for this task.

1. Import/assemble the frozen manifest with the original local transforms intact. For physically sensible offline camera/DOF settings, use a render-only parent scale of 0.001 if the source is numeric millimetres. This converts the assembled render duplicate to metres exactly once. Source objects/GLB output transforms remain untouched. Use the recorded axis conversion; import may already perform Y-up to Blender Z-up.
2. Let `D` be the actual case diameter in metres after that render-only conversion. Place all rig elements relative to D and use the mesh-space dial centre as the target. Scene metadata alone does not authorise changing source scale.
3. Put the watch over a charcoal seamless plane with a small contact shadow. Background is neutral, RGB approximately 0.025–0.04 after selected view transform. Tilt/pose the render assembly using its wrapper only. Allow natural existing strap curvature; no bone warp/deformation that changes source geometry to obtain a prettier pose.
4. Area key: rectangle roughly `5D × 3D`, centred above/slightly forward at about `6D` from the dial, neutral white. Start around 10 W for a 42 mm metre-scaled assembly, then calibrate once using a gray card test. This is an initial value, not a hardware lighting measurement.
5. Strip 1: `0.5D × 4D`, about `2.5D` from the case on camera left, neutral/cool white, approximately 30% key power. Strip 2: `0.35D × 3.5D`, about `3D` away camera right, neutral white, approximately 20–25% key power. Adjust angles until polished rim highlights describe continuous curvature and do not paint broad white bars across the dial.
6. Warm kicker: area rectangle `1.5D × 1D` behind the crown-side shoulder, about `3D` away, 4000–4500 K appearance, approximately 10–15% key power. Keep the influence confined to edge highlights. Optional large black flags supply shape in silver reflections; they do not alter a component's base colour.
7. World starts neutral at Strength 0.03–0.08. Avoid unrelated HDRI imagery. Render a small gray-card + chrome-ball calibration view once, save rig/exposure and then hide those helpers from deliverables. No per-style hue/saturation filters.
8. Cycles GPU preferred if the installation probe confirms a usable backend; CPU is a valid fallback. Development: 960 px, 64–128 samples. Final: at least 256 maximum samples, start 512, adaptive threshold around 0.005, min 32, denoise using supported Open Image Denoise/OptiX. If glass/strap detail is smeared, increase samples rather than sharpening the PNG. Blender documents adaptive sampling and denoising as complementary controls. [Cycles sampling](https://docs.blender.org/manual/en/3.6/render/cycles/render_settings/sampling.html), [GPU support/settings](https://docs.blender.org/manual/fi/5.0/render/cycles/gpu_rendering.html).
9. Use AgX as requested, no creative look initially, exposure locked after calibration, Gamma 1. Save a 16-bit working PNG and deliver a standard colour-managed 2400 px wide PNG. Retain the .blend and JSON recipe so images are reproducible. No denoised-text hallucination: inspect the live scale and typography at 100% before acceptance.

The light powers above assume the metre-scaled render duplicate, and require one initial exposure calibration. If the execution keeps numeric-millimetre scene coordinates instead, it must use one consistent scale-aware light/camera/DOF rig and record it; mixing both conventions will fail. Do not spend time installing render engines or paid asset libraries before a built-in Cycles probe demonstrates a missing capability.

## Camera and pose recipes

All final shots are 2400 px wide, with per-shot crop recorded. Proposed output names below are implementation deliverables, not existing files.

| Shot | Starting camera and framing | Focus and acceptance |
|---|---|---|
| `hero-three-quarter.png` | 2400×1800, 85 mm equivalent lens; camera roughly `(1.9D, -2.6D, 3.8D)` relative to dial target, then move along the viewing vector to fit the full requested assembly with 10% margin. Show crown, case flank and both strap constructions. | Focus near hand hub/upper dial. Start f/8–f/11 on the metre-scale scene; allow mild strap falloff, while case rim and main dial remain sharp. Adjust aperture based on the rendered result, not on an arbitrary 'shallow' label. |
| `hero-front.png` | 2400×2400, near perpendicular to dial; 100 mm equivalent perspective lens at sufficient distance for low distortion; record orientation so 12 is vertical. | f/16 or disable DOF for the artwork/fit proof. Entire dial, bezel scales and crystal rim legible. Restrained reflection toward upper glass, with hands/decimal hours unobscured. |
| `hero-strap-macro.png` | 2400×1800, 100–120 mm macro equivalent; frame 18–30 mm physical strap patch centred on actual long-tail holes and stitch row. For rubber/canvas, frame the relevant rail/weave/edge construction. | Focus on centre hole rim/thread; f/8–f/16 as needed to retain useful construction detail. No synthetic leather macro for a rubber watch. |
| `crystal-ar-off.png` / `crystal-ar-on.png` | 2400×1800; reuse the selected three-quarter camera with a grazing strip reflection. Same lens, focus, samples, seed, exposure and light transforms. | Only AR settings differ. Dial stays neutral and readable in both. Save individual PNGs plus an optional side-by-side plate for review; no new exported GLB variants. |

Hero hands are 10:10:35. Compute the hour and minute angles including fractional minutes/seconds (`305.2916667°`, `63.5°`, `210°` clockwise from 12) and use each recorded hand's rest-vector/pivot/sign. Do not assume the source hand mesh points along +Y or that its origin is at the hub. Rotate a render-only pivot parent if necessary and retain original local transform. Chronograph register hands retain the frozen app choice/position unless a clear hero fixture already defines them. Exported asset defaults are unchanged.

Each gallery style gets the three requested beauty views and AR proof where the same crystal recipe applies. An AR pair can be rendered once per unique crystal/rig combination with a manifest link shared by styles, avoiding redundant full-resolution duplicates. A file with no crystal or strap receives a component technical render and references its owning complete assembly; never fabricate unsupported component identities.

## Baking, colour control and detail preservation

- Maintain two material forms sharing one semantic recipe: high-detail procedural Cycles master and glTF-recognised image/PBR form. Bake from the immutable source frame; do not edit dial UVs or apply source transforms just to make a bake convenient.
- Own-generated grayscale textures need no external image library. Offline detail may use 4K maps when actual renders demonstrate a need; web maps are at most 2K. Use per-family shared tiles/maps where scale allows, not one unique 2K set per tiny object. Normal/roughness/metalness data are Non-Color; colour/artwork uses the appropriate colour-space setting.
- The web material must keep a neutral colour texture that multiplies the selected base colour. Derived rim/edge regions need a clear semantic mapping in the material manifest and a runtime recolour check. A Blender group input by itself does not survive glTF as a dashboard binding. Geometry stitch threads and baked stitch colour must follow the same intentionally separate cream-thread rule.
- Refine once, then export selected model objects only. Studio cameras, lights, plane, flags, AR comparison helpers, gray card, hero hand parents and render-only pose are excluded from web assets.
- No mandatory external PBR/HDRI library, texture purchase, Blender add-on or Python package is required by this recipe. Built-in bpy math/image pixels/texture nodes, Cycles and glTF exporter cover the proposed work. If a capability spike finds a missing dependency, pin and record it; do not install an asset pack merely because permission exists.

## Work packets for medium-effort execution

The filenames below are proposed ownership boundaries; the lead finalises them with the main roadmap.

| Packet | Owned files and task | Concrete done condition |
|---|---|---|
| Surface recipes | `tools/blender/realism/material_recipes.py`, procedural texture generator, material recipe JSON | Deterministic mapping by recorded role/material; original colours respected; Cycles master and web form; tests on leather/rubber/canvas, steel/ceramic/crystal; no scene-global source edits. |
| Strap construction | Independent strap detail script and approved geometry manifest | Tail identity resolved; only approved details; requested seven holes where feasible; rim recolour semantic data; no attachment/pivot drift; hardware not duplicated. |
| Hero studio | `tools/blender/realism/render_hero.py`, rig/camera recipe JSON | Six actual supported app compositions, requested 10:10:35 render pose, 2400 px shots, locked AR pair, reproducible scene and output manifest. |
| Runtime integration | Existing loader/appearance contracts, owned by app integration agent | Normal/roughness/anisotropy survive appearance updates; dark derived leather regions follow light/dark/strong selected colours; live dial/pilot scale remains sharp; authored marker suppression still works. |

Surface and hero implementation can be independent after the shared manifest/recipe schema is fixed. The studio agent consumes immutable refined asset candidates rather than modifying their objects/material defaults. The lead integrates completed outputs and checks the full app, rather than assigning one worker to compare or audit another.

## Visual acceptance sheet

For every selected hero assembly, retain a contact sheet of old/new using the same frozen composition, neutral rig, lens, pose and crop; beauty shots alone cannot prove geometry preservation. Include front, three-quarter and side, plus strap macro. Check:

1. Dial UV/artwork alignment and printed inner/outer scales unchanged; labels remain legible at 100% and normal app zoom.
2. Steel brushing visible as a surface response; polished bevel highlights distinct; no embossed-noise appearance.
3. Leather/rubber/canvas distinguishable without changing their default colours.
4. Adjustment holes belong to the actual long tail, are visible at normal zoom, and dark rims/edges follow dashboard recolouring. Decorative racing perforations remain semantically distinct.
5. Crystal clear; AR faint and reflection-bound; no ghost double-glass, excessive bloom, blue opacity or hidden dial contrast loss.
6. Original local units, original object identities/pivots/UV layout and engineering interfaces match VR0, with any approved added detail explicitly listed. Exported default hand pose unchanged.
7. Before/after triangle counts, file size, texture dimensions and unsupported feature losses appear in the per-file log. A shared output may serve several hero styles without an invented extra catalogue variant.
8. Browser proof includes the actual HD gallery, recolouring, dial/scale edits, bezel rotation and crystal/rehaut visibility, with no freeze introduced. A Cycles image and a correct exported material do not replace this app proof.

## Evidence and limitations

Local inspection for this plan read the existing brief, deferred roadmap, builders, registry, gallery profiles, GLB loader and visual scene. No material, geometry, shader or studio render was executed or evaluated by this workstream. Shader values and light placements are a proposed reproducible starting point; final subtlety is selected through the planned capability/look-development proof, not asserted in advance. The web preview named by the original brief was not supplied as a separate reference image/URL in this workstream; use the current dashboard as the functional reference and request that missing visual reference only if it would change the chosen art direction.

Blender web manuals were consulted on 13 October 2026. The available indexed material-export documentation was Blender 5.0 and the Principled page was the development manual. Installed Blender API/export/runtime probes remain authoritative for actual support; do not infer installed version or iridescence support from these pages.
