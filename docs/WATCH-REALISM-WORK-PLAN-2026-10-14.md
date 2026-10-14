# Watch realism — plan and execution ledger

Planning baseline: DF7 commit `c1cead147bf88c2b4e6ae8272984e75d096e49b1`. User approved automatic implementation on GPT-6.1 Sol at medium effort on 14 October 2026. The lead coordinates independent deliverables and checks their integrated result. Routine milestones need no further “go”.

## Outcome and authority

The [original brief](briefs/WATCH-REALISM-USER-BRIEF-2026-10-12.txt) supplies the requested leather, sapphire/AR, metal/ceramic/dial/hands, Cycles shots and GLB deliverables. The confirmed functional/visual reference is `http://127.0.0.1:3000/`. Preserve current dashboard designs, dimensions, original names/pivots, dial/scale UVs, colours and hardware interfaces. Produce a convincing material/lighting upgrade in the live app as well as 2400 px product photography.

The user explicitly selected: **6 o’clock is the adjustment-hole tail; 12 o’clock is the buckle side; preserve existing dimensions**. This resolves the symmetric archetype-strap naming ambiguity. Seven 2 mm holes at approximately 7.5 mm pitch belong only to the leather tail where the recorded envelope accommodates them. The short reference rubber strap is not stretched into a leather strap. Keep rubber, canvas and racing construction distinct. Do not impose the brief’s generic 22→20 mm width, 3.5–4 mm leather, 2.5 mm crystal or 0.3 mm hand targets where they conflict with an existing component. New details/modifiers remain inside approved envelopes and outside protected attachment/artwork regions.

## Preparation completed

- Blender **5.2.1 LTS**, build `9e2066aef7ef`, at `C:/Program Files/Blender Foundation/Blender 5.2/blender.exe`.
- Machine: i7-8700, approximately 16 GB RAM, GeForce GT 1030 with 2 GB VRAM. Full-watch CPU, CUDA and combined CUDA+CPU probes passed. The same packed scene measured 15.20 s CPU, 26.61 s CUDA and 10.16 s combined at 600 px/64 samples; use a single combined rendering process for the remaining final photographs. Camera/material/quality settings stay unchanged. Do not install a CUDA toolkit or update drivers speculatively.
- **114 GLBs**, 40,814,872 bytes, 730,050 triangulated source faces, 6,726 imported objects. All imported successfully. Hash-verified originals are under `.artifacts/blender-review/realism/vr0-2026-10-13/backup/`; full names, materials, units, transforms, geometry/UV hashes and deviations are in that run’s `inventory.json`.
- **101 registered/compatibility assets** form the refinement workload. The 13 unregistered `face-review/` demonstration files remain inventoried/backed up and are excluded from runtime promotion; their animated/mixed-role content is not silently rebuilt. Every workload file receives a processed/no-op-with-reason record.
- Official Khronos validator `2.0.0-dev.3.10` is installed/pinned under `tools/blender/realism-toolchain/`. Baseline validation: **114 files, zero errors, zero warnings**. `UNUSED_OBJECT` informational messages are retained in reports rather than suppressed.
- A disposable exporter fixture proved clearcoat, transmission, IOR, anisotropy and iridescence. Blender’s `glTF Material Output` group needs `Iridescence Factor` and `Iridescence Thickness Minimum` inputs; Principled thin-film settings alone do not export iridescence. The installed socket is named `Anisotropic`.
- Original colour/physical properties are currently overwritten by the app loader. Fixing the material bridge is necessary; simply exporting new GLBs is insufficient. Preserve imported physical materials/maps and recognized material-role extras, while retaining intentional live dial/scale/appearance ownership.
- Browser baseline images: `dashboard-before.png` and `dashboard-hd-before.png` in the VR0 run. On entering HD the current watch initially stayed small/off-centre; Reset view corrected it. Include automatic HD framing in acceptance. No original watch design was modified by the baseline inspection.

No external texture/HDRI pack is required. Generate deterministic neutral leather grain, brush normals/roughness and studio lights. No main application package upgrade is needed. Additional dependencies require an observed need, a pinned version and provenance.

## Milestones and evidence

| Milestone | Deliverable | Completion gate | Status |
|---|---|---|---|
| VR0 | Read-only inventory, immutable backup, machine/exporter/loader probes, frozen plan | Correct scope/roles; tools runnable; no input changed | Complete; final loader-extra probe passed |
| VR1 | One finished 42 mm leather watch, reusable material recipes, strap holes/stitches/edge paint and app material bridge | Before/after normal-zoom and macro proof; 6-only holes; derived dark rims; cream stitching; unchanged attachments | Complete; geometry/material/preservation checks passed |
| VR2 | Neutral crystal and subtle AR, matching procedural fallback | Front dial readable; grazing AR reflection only; export/runtime feature loss stated; no blue-opacity workaround | Complete; full-resolution same-camera AR pair reviewed, export omissions finalized |
| VR3 | Remaining registered components: metal, ceramic, dial/hands, rubber/canvas/racing and procedural parity | Every input logged; names/pivots/UVs/envelopes preserved; no permanent colour variants | Complete; 101 processed and promoted, zero validator/contract errors |
| VR4 | Six supported gallery assemblies: front, three-quarter and appropriate strap macro; AR pair | 2400 px PNGs; 256+ configured maximum Cycles samples with adaptive sampling; 10:10:35 in render duplicate; reproducible .blend/scripts/shot metadata | Complete; all 20 final PNG files inspected and dependency/hash verified, six packed editable scenes |
| VR5 | Validated web GLBs, one standalone assembled GLB per style, integrated app, per-file changes/losses, release report | Validator/contract/budgets/tests/build/browser checks; source backups retained | Complete locally; 101 components and six assemblies validated, strict delivery and archive integrity passed; measured runtime exceptions recorded |

Do the first complete look before the bulk build. Evaluate clarity, restrained microdetail and reflections at actual app zoom, then reuse the established recipes. Independent workers deliver their own assigned files; they do not create competing alternatives or audit each other. The lead integrates and checks the work.

## Frozen shared material interface

Use material extras `DD_REALISM_SCHEMA = dial-designer/realism-material/v1`, `DD_REALISM_ROLE`, and, for derived strap regions, `DD_REALISM_BASE = strap` and `DD_REALISM_SHADE = 1` or `0.45`. Recognized roles include strap-face/edge/hole-rim/stitch/hardware, steel-brushed/polished, bezel-ceramic, crystal, diamond and dial-face. Extend the enum deliberately for hand/ink/lume roles rather than misclassifying them by a broad name match. Preserve existing hand appearance metadata separately.

Grain maps are neutral and multiply the single existing resolved strap colour. Derive darker edge/rim colour from a fresh linear RGB base on every update; never compound darkening. Thread stays authored cream, buckle follows metal. Keep existing palettes and option sets. Test arbitrary colours through the pure material bridge without adding unsolicited UI controls.

Crystal uses neutral base colour and full alpha with physical transmission, brief IOR 1.55 and subtle reflection. IOR is a chosen presentation recipe, not new manufacturing evidence. Web AR is optional only if actually unsupported/visually unsuccessful, and the omission must be documented. No tinted-glass substitute. Keep imported supported roughness/normal/anisotropy/iridescence values after app edits, including semantic hand-region recolouring. Live artwork overrides remain authoritative.

## Independent implementation ownership

1. **Application/material worker:** pure material bridge, loader/hand preservation, shared procedural finishes and responsive studio/HD framing; focused meaningful tests. Own app source/tests only.
2. **Blender/asset worker:** deterministic recipes/bakes, conservative geometry detail and staged per-component outputs; original assets remain unchanged until validated promotion. Own its Python helpers/staging outputs.
3. **Execution lead:** freeze input/assembly manifests, provide export/build entry points, hero assembly/rig/rendering, preservation validator, budget/change logs, integration/promotion and full checks. Workers can run independent work, but serialize render/bake processes on this machine.
4. **Root coordinator:** preserve the agreed brief, check the assembled deliverable/browser proof and report actual completion/limitations. Implementation agents use GPT-6.1 Sol, medium effort.

Use the existing pure `createDefaultWatchAssembly`, `applyReference42Preview`, `applyArchetypeVisualProfile` and `watchAssemblyToVisualModel` functions for the frozen six-style manifest. A development-only tool may bundle this entry with the already installed esbuild and `@`→`src` alias; avoid manually duplicating app selection rules. Include the actual resolved descriptor, anchors, transforms, procedural envelope, colours, dial/scale artwork and component visibility. Ladies Dress uses its real 34 mm/procedural composition. Standalone style GLBs are deliverables, not replacements for independently selected registry components.

## Outputs and promotion

Use the existing ignored `.artifacts/blender-review/realism/` root for versioned runs. Create implementation run `vr-implementation-2026-10-14/` with `work/`, `bakes/`, `web/`, `styles/`, `renders/`, `reports/` and manifests. Keep exact backups in VR0; never export onto them. Retain modifier-based .blend sources and scripts. Web maps are <=2048 px; hero source maps may be larger. New detail objects use a stable `DD_VR_` namespace; originals keep exact names, frames and UVs.

Start with uncompressed GLB/PNG/JPEG because the current loader has no configured Draco/KTX2/Meshopt decoder. Preserve inherited numeric millimetres/Y-up for runtime replacements; a separately labelled standard-metre profile may be used for standalone style exports. Convert render duplicates exactly once for sensible camera/DOF, without changing production transforms.

Target <=180k visible triangles per watch (250k review ceiling), <=8 MiB distinct component download (12 MiB review ceiling), <=2048 px exported maps, and no unexplained draw-call increase. Existing pilot scale geometry is already ~103k triangles across both rings. Prefer baked subpixel detail; never join/rename protected objects or decimate artwork just to hit a budget. Report exceptions with measured reason. On the GT 1030, stable responsiveness and bounded texture memory take precedence over excessive maps/postprocessing.

Preservation checks compare every original name/hierarchy/local transform, attachment interface and protected UV/position correspondence. Use <=0.001 mm numerical transform/envelope tolerance for unchanged interfaces, without claiming manufacturing accuracy. Account for export vertex/index reorderings. Verify base/default colours and DD extras, seven tail holes, readable text, no doubled live graduations, and no new intersections. Run Khronos validation plus applicable existing Blender attachment/family tests. Only the lead promotes hash-checked staged outputs to their existing public paths and increments a stable asset revision; never use random per-render loader URLs.

## Validation and completion report

Per first family: focused asset/appearance/scale/attachment checks. After integration: full repository tests, lint and production build. Browser proof covers six gallery styles, 34/38/40/42/46 mm and 42→other→42, recolour/Undo, pilot/diver live scales and rotation, visibility, HD enter/exit/resize, repeated explicit preview/apply and stable rendering resources. Inspect 100% hero crops and normal dashboard zoom. Record what was actually checked.

Final delivery must identify source/candidate hashes, before/after triangles/bytes, new maps/extensions/objects, preserved contracts, exact feature losses, screenshots, rendered PNGs, source .blend/Python and standalone style GLBs. The software visual release does not change pending physical-fit or real screen-reader qualification. Record whether work is local/committed/pushed; do not claim those actions happened without verifying them.

## Release closure — 14 October 2026

All VR0–VR5 deliverables are complete within the approved preservation limits. The [release report](WATCH-REALISM-RELEASE-2026-10-14.md) identifies the local gallery, package, source scenes and per-file changes. The package contains 101 refined components, six standalone GLBs, six packed assembled scenes, the modifier-based leather construction scene, 20 final PNG files, scripts, neutral maps/artwork, immutable originals and verification evidence. The AR-on reference shares one verified three-quarter render; there are 19 distinct rendered images.

Full application tests passed (147 files, 1,315 tests), as did full lint/build and the asset-revision follow-up. All 101 components and six final assembled GLBs have zero Khronos errors/warnings. Strict delivery verification has 20/20 completed image hashes/fingerprints and no pending file evidence.

The final isolated-origin browser session completed 20 HD gallery switches after rendering ended. The same Dress endpoint held 438 geometries and 55 textures after each of four cycles, with no observed app console errors. This bounded check does not certify every intermediate frame or long-session frame rate; the Pilot/Chronograph measured cost exceptions remain recorded. Existing real screen-reader and physical-fit/supplier gates remain manual. The Chronograph's existing date/subdial overlap is preserved for separate dial-layout work. Git publication was authorized on 14 October 2026; use the repository history for the published revision. The generated archive retains pre-publication validation evidence and remains local in the ignored artifact folder.

## Detailed workstream references

- [Application integration](realism/VR-APP-INTEGRATION-CONTRACT.md)
- [Surface and studio recipes](realism/VR-SURFACE-AND-RENDER-PLAN.md)
- [Export/validation pipeline](realism/VR-EXPORT-VALIDATION-PLAN.md)

This ledger resolves conflicts in those supporting proposals: approved strap-side assignment, unchanged dimensions, current dashboard reference, existing ignored artifact root, pinned toolchain, no new colour-control UI, and automatic medium-effort execution. If a new ambiguity concerns one object, preserve it and continue other resolved work; do not guess a physical redesign.
