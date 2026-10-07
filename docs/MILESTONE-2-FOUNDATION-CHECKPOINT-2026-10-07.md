# Milestone 2 implementation and runtime verification checkpoint

7 October 2026. Updated after the user authorised finishing the remaining work. The earlier first-slice record below is historical; the runtime integration follow-up supersedes its implementation and test status. Full reference/artwork acceptance remains explicitly unpassed, not implied by passing software tests.

## Implemented

- `calibratedSlideRule.ts`: shared one-decade logarithmic mapping, direction/origin, seam handling, outer-only rotation groups, actual-minute HH:MM parser, exact statute/NM/km constants, semantic mark identity and dedicated-conversion filtering. Pointer/text/tick are separate mark objects with independent colours; abbreviated printed numerals never replace underlying values.
- `slideRuleLayers.ts`: version-1 document keyed by physical target band; mutually exclusive active design or disabled; independent saved settings; lossless Simplified legacy payload. Incomplete Citizen/Navitimer selections are refused. It is a domain foundation, NOT yet a replacement editing store.
- Canonical assembly design config stores the document. Legacy projects without an assembly migrate their existing slide-rule configuration to Simplified, copying rather than regenerating it. Existing renderer payload remains unchanged. Serialization/load validate basic layer structure and refuse duplicate targets or unaccepted active branded references.
- Existing `aviationAngle` delegates to shared calibration with unchanged mathematical behaviour. No old tick schedule, typography or visual appearance was upgraded silently.
- Focused tests cover all six exact-prompt alignment examples, ratio invariance, duration vectors, distance vectors, rotation isolation, exclusions, lossless migration, canonical round-trip, disabled settings, target isolation and gated/injected references.

## Research and separate variant

See `research/slide-rules/navitimer-1967-variant-plan.json`: distinct cover-layout reference, confirmed HH:MM row, palette observations, explicit future selection and acceptance steps. The selected training disc remains unchanged. The AOPA PDF cover's embedded raster is 2148x855 pixels over the entire spread; a rendered top-detail crop was inspected. Outer 12-to-13 appears to have five intervals (four intermediate strokes), recorded as a provisional manual count, not a complete/accepted source schedule or measurement. No generic schedule was substituted. Citizen's official 856x1284 photo was reviewed at native browser zoom; unresolved small ticks and perspective remain unsuitable for proving all independent sectors. Primary inventories retain null counts.

## GLB dependency decision

New assets are NOT Milestone 1 research. Scale variants need live artwork on existing physical bezel/chapter surfaces, not a GLB per font, colour or reference. Complete M2's target-binding/artwork integration before altering scale surfaces so geometry and depths do not diverge. Milestone 6 handles real missing hand-tip/outline-lume geometry AFTER its appearance schema is defined. Do not regenerate cases or rescale compact NH05 hands for this work. No Blender generator, GLB or supplier-exact asset changed here.

Read-only generator inspection confirms `generate_pilot_scale_surfaces.py` already authors `DD_SCALE_SURFACE_<ring>` with `WatchAxisPrint` UVs and ring/UV-diameter metadata. Reuse and verify these surfaces before adding geometry; the generator explicitly describes them as provisional 42mm preview surfaces, not supplier engineering proof.

## Historical first-slice remaining work (superseded by follow-ups below)

1. Expand schema from lossless legacy snapshot to resolved row geometry, measured typography anchors, explicit dimensions, original immutable configurations and supported-writing controls. Do not use guessed metrics as source-exact.
2. Wire scaleStore as an editing projection of canonical assembly layers, with guarded Apply/Undo/autosave and existing assembly-containing project migration. Current runtime still uses the legacy scale payload. Existing assembly files are NOT automatically migrated by this first slice.
3. Resolve per-target semantic artwork with glyph/pointer/stroke/hover envelopes. Enforce inner AND outer annulus, report impossible fit without moving calibration or dropping required labels.
4. Replace the separate aviation SVG path and route Engineering/HD/vector export through one accepted artwork model; confirm physical surface depths and repeated switching.
5. Reset from trusted immutable defaults and reject excluded groups at every persistence/render/export boundary. Current semantic filter is tested but not wired into all old export consumers.
6. Finish independent source graduation inventories before enabling branded presets; no faithful claim until accepted.

Verification: 483 tests initially passed, including 38 new focused tests; the production build's stricter unchecked-index checks caught test-only accesses, corrected before acceptance. Full rerun passed; lint, typecheck and production build passed (existing Three deprecation/Zod annotation/large-chunk warnings only). Research validator and tracked/untracked whitespace checks passed. One final disabled-migration regression was then added; final totals below supersede the initial count. Read-only browser inspection confirmed the existing NH05 Engineering preview and right tray still load; this is not a new branded-UI or HD acceptance audit. Existing M0 edits preserved. Changes remain uncommitted; no push requested in this turn.

Earlier first-slice test total: **484 passed across 68 files**, including **39 new focused regressions**.

## Runtime integration follow-up

- Canonical assembly state now owns the live scale configuration, context, enable/disable state and per-target Simplified settings. The legacy scale store is an editing projection. Existing assembly-containing slide-rule projects migrate on import/edit, preserving their original reset baseline. Undo/Redo, autosave/reload, disabled settings and target switching are covered by tests.
- Fixed an actual browser-discovered first-edit Undo defect: the previous legacy snapshot is captured before creating canonical scale state. Also fixed a reload defect where stale saved display bands overrode the physical part dimensions. Canonical component IDs now resolve their print envelopes from the selected physical assembly, not historical display rings.
- Both outer and fixed rings resolve separately against their physical annuli and, for HD, authored print-surface bounds. Glyph bounds are measured when browser fonts are ready; non-browser tests use a disclosed conservative estimate. Stroke endpoints and widths are included. Impossible fit retains ticks/angles, reports the problem and disables the dedicated ring exports, instead of pretending the part grew. Shared authoring honours locks on either paired target.
- One resolved ticks/labels/colours/clip/transform payload is consumed by Engineering SVG, HD print textures, dedicated ring SVG and engineering SVG/DXF. The independent old aviation SVG generator delegates to this same payload. No GLB or Blender generator changed.
- Advanced has functional outer/inner scale and numeral visibility controls, plus Reset Simplified baseline. Reset is deliberately not called a manufacturer Original. Reference presets remain clearly gated. Existing Simplified collision-driven label omission is retained only for that legacy design, not accepted as reference reproduction.
- Added real asynchronous vector PDF export using jsPDF/svg2pdf, replacing the former pseudo-PDF text output. Fixed converter-specific baseline/600-weight handling after rendering an actual downloaded PDF and detecting clipped numerals. Dedicated ring PDFs use an explicitly disclosed dark viewing substrate without recolouring ink or implying a part finish. PDF fonts are substituted; SVG retains text, requiring font outlining and fit verification before manufacture. DXF text remains viewer-font-dependent. [Converter documentation](https://github.com/yWorks/svg2pdf.js/) explains custom font embedding; no claim of font-exact manufacturing output is made.
- DXF now includes resolved tick stroke widths, RGB colours, labels, rotation, target scoping and millimetre units. XML metadata is appended only to SVG, never to DXF.

### Browser and PDF evidence

Computer-use browser checks exercised outer-writing off/on, first-edit Undo/Redo, inner-ring off/on, reload, 42mm authored HD surfaces and a narrower procedural case with a refused fit. Both ring label sets survived reload. The PDF skill was used to render and inspect a real 42mm-square vector PDF; its numerals are now intact. Evidence resides in the calling chat workspace's `milestone-2-evidence` directory. The original NH05 ladies-dress project was restored through Project Import from the pre-test JSON backup; the dashboard remains running. The HD proof is a live pilot preview, not a manufacturer-reference comparison. Inner-ring text is visually crowded near existing dial indices; this is not accepted reference typography.

### Acceptance limits recorded before the completion follow-up

1. Complete the independent source graduation inventories and retained pointer/text/colour evidence before enabling Citizen/Navitimer or trusted Reset to Original. M1 remains unpassed; M3A exact-artwork implementation cannot honestly be accepted yet.
2. The current runtime resolves the active editing pair. Independent per-target settings persist, but simultaneous multiple active layer pairs are not yet a fully verified composite renderer. Full pointer-shape and hover-decoration bounds, and source-specific typography-anchor records, are not implemented by this ticks/labels integration.
3. Persisted font/radius/rotation settings regenerate measured glyph bounds; they are not an immutable source-measured glyph-outline manifest. Exact source fonts, outline conversion and manufacturing certification remain unverified.
4. Dedicated ring export refuses impossible fit; the older whole-project export still reports warnings rather than enforcing an absolute manufacturing refusal. HD physical depth checks covered the pilot bezel/chapter pair, not every custom target/archetype. No complete all-archetype UI audit is claimed.

### Verification and Git status

Final full rerun: **499 tests passed across 70 files**; **typecheck, lint, production build and tracked/untracked whitespace checks passed**. The 15 new runtime/PDF tests supplement the earlier 39 foundation tests. Existing Three deprecation, Zod annotation and bundle-size warnings remain. Research consistency passes, explicitly without original-fidelity acceptance (108 interval sectors remain uncounted).

Changes remain uncommitted. Existing M0 edits and all research are preserved; no push, new GLB or supplier mutation was performed. Adding the PDF dependencies exposed 15 existing development-toolchain audit advisories (5 moderate, 8 high, 2 critical); none listed the new PDF packages, and unrelated dependency upgrades were not attempted.

## Completion follow-up — shared runtime foundation

The user requested completion and a commit. The remaining source-independent runtime gaps above are now implemented:

- `scaleLayerArtworkService.ts` resolves every active saved Simplified layer against physical parts and composes the results for Engineering, HD and vector export. Disabled editing layers do not hide other enabled layers. A physical band cannot be claimed twice: conflicting layers are reported as invalid instead of silently overlaid, and export is blocked. Missing/deleted targets also block export. Fixed target identity updates with the layer configuration.
- Pointer geometry is an explicit persisted model (triangle, diamond or rectangle), with independent fill/stroke colours, dimensions, rotation and hover allowance. Calibration derives angles from mathematical values; relative bezel rotation applies only to outer pointers. SVG, HD canvas textures and DXF share vertices/rotation. DXF includes filled SOLID geometry and closed stroke outlines. No Citizen/Breitling pointer positions were invented.
- Hover hit regions for text, ticks and pointers participate in physical fit and remain clipped to their target annulus. They appear only in the interactive Engineering SVG, not manufacturing exports. Measured glyph extents now account for their actual centred anchor rather than using advance width alone; unavailable metrics are explicitly labelled estimates.
- Canonical layer settings now retain a versioned resolved artwork record: graduation values/angles, text anchors/orientation/bounds, font parameters, pointer styles and annular dimensions. This is a reproducibility record, not a claim of source evidence or an outlined-font manifest. Simplified baseline settings remain immutable through normal updates.
- Whole-project SVG/PDF/PNG and DXF export now refuse invalid scale fit. The export UI catches and displays refusal/errors. Fixed-bezel fallback print depth uses the bezel face, not the chapter-ring plane.
- Whole-project SVG declares physical millimetre dimensions at the existing 10 drawing units/mm; PNG retains the original viewBox raster resolution instead of accidentally shrinking when SVG dimensions become physical.

Nine additional regressions cover these paths, including simultaneous independent layers, conflicting targets, disabled layer composition, pointer rotation isolation, exclusions, bounds, persisted metrics, filled DXF pointers and manufacturing refusal. Browser checks repeated import, Undo, numeral visibility, bezel rotation and HD rendering after integration. The latest PDF is a readable vector preview, with the same known standard-font substitution and legacy Simplified numeral/tick crowding; it is not released as source-exact artwork. The NH05 project was restored again after testing. No GLB was changed.

### Completion boundary

The shared runtime foundation is complete for the available Simplified design and source-neutral pointer schema. **M1 original-fidelity acceptance is still unpassed** (108 interval sectors remain uncounted), so Citizen/Navitimer selection and manufacturer Reset to Original remain gated. Exact original typography/colours/gradations and source-specific row layouts belong to the verified-reference implementation; passing these software tests does not make the legacy Simplified layout an original reproduction. Manufacturing font outlining/certification and a full all-archetype visual audit are not claimed.

Final verification: **508 tests passed across 71 files**, typecheck and lint passed; final build and staged whitespace check passed. Existing toolchain warnings/advisories remain as recorded above. The commit includes the existing in-scope M0/M1/M2 work, this completion follow-up, tests and milestone/research documents; no supplier actions or push are included.
