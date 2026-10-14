# Watch model realism — separate planned task after DF7

Status: **VR0–VR5 complete locally, 14 October 2026**. DF7 was committed and pushed as `c1cead1` before this work. The [work plan and execution ledger](WATCH-REALISM-WORK-PLAN-2026-10-14.md) records the medium-effort implementation, approved strap sides and completion evidence. The [release report](WATCH-REALISM-RELEASE-2026-10-14.md) identifies 101 refined components, six standalone watches/editable scenes, 20 final images and the verified archive, with preservation limits and remaining manual gates. Git publication was authorized on 14 October 2026; the generated archive remains a local pre-publication validation snapshot. Added 12 October 2026 as a separate post-DF task; it remains separate from the DF implementation.

The original attached brief is preserved in [WATCH-REALISM-USER-BRIEF-2026-10-12.txt](briefs/WATCH-REALISM-USER-BRIEF-2026-10-12.txt). Its detailed material, geometry, rendering and export requirements remain the source request. The user's later explicit instructions authorize preparation and full implementation; the earlier planning-only boundary below is retained as historical context.

## Outcome

Improve existing watch GLB realism through Blender/bpy while preserving dashboard controls, calibrated artwork, component identities, pivots and engineering geometry. Deliver updated web GLBs, reusable Python scripts, 2400 px hero renders and a per-file change/export-loss log. Work non-destructively with verified originals and separate outputs.

## Future milestones

| ID | Work | Gate |
|---|---|---|
| VR0 | Inventory agreed input GLBs, back up originals, report objects/materials/units/triangles and identify component roles. Locate the referenced target web preview. | Confirm the input scope and unresolved object identities. The brief requests user OK before Phase 1 if names are ambiguous. |
| VR1 | Leather strap profile, holes on long end only, stitching/grain, edge paint, keeper/buckle where appropriate. | Dashboard recolouring drives darker rims/edges; preserve recorded attachment interfaces and inspect normal-zoom readability. |
| VR2 | Sapphire/AR material and crystal presentation. | Subtle reflection, no tinted-glass workaround; retain actual crystal geometry unless a change is explicitly resolved at VR0. |
| VR3 | Metal finishes, chamfers, bezel/dial preservation, hand detailing. | SVG/UV registration and scale markings unchanged; existing colours, names, pivots and hand stack preserved. |
| VR4 | Cycles studio hero shots at 10:10:35: three-quarter, front and strap macro, plus AR-off/on comparison. | Lighting/AR comparison only; no shipped colour variants or dashboard option expansion. |
| VR5 | Web export and app integration. | Before/after triangle/file-size report, exporter feature-loss log, GLB validator, real dashboard recolouring, live scale texture and Engineering/HD integration checks. |

## Resolve at VR0 before modelling

- The brief asks both to preserve dimensions/proportions and to introduce strap thickness/taper, crystal dome/thickness and hand thickness. These can conflict. Numeric targets (22→20 mm strap, 3.5–4 mm strap thickness, 0.8–1 mm dome, 2.5 mm crystal and 0.3 mm hands) must not override selected hardware dimensions automatically. Identify which are material/detail changes and which require explicit geometric scope decisions.
- Current assets include separate components and fixed-size authored models, not necessarily one complete watch per file. Identify the intended input folder and supported styles rather than blindly processing every GLB in the repository. Preserve the component asset registry and app-owned variants.
- Preserve the existing Blender/app/glTF coordinate and UV contracts. Verify +Y-up export against current transforms; do not introduce a second rotation or change pivots to meet a label.
- Procedural Blender materials may need baking or glTF extensions. Test actual exporter and renderer support before promising anisotropy, iridescence, transmission or thin-film AR. Record exactly what is omitted from web GLBs.
- Hole/stitch detail must fit agreed triangle, texture and file-size budgets. App-driven base colour must continue to control derived darker details; a Blender node input alone does not guarantee this in GLB or the dashboard.
- Do not add hero-render poses, AR comparison variants or permanent colour sets to the dashboard catalogue.

## Independent work when scheduled

After VR0 has fixed interfaces, separate agents may own strap detail, glass/materials and the rendering/export pipeline in isolated files/assets. The lead integrates and checks the app's asset/UV/colour contracts. Blender scripts and existing GLB validators are the main tools; browser computer-use verifies dashboard behaviour. Image generation is not a substitute for editing the existing 3D assets.

No asset edits, Blender execution, scheduling automation or publication were performed when adding this planned task on 12 October. The subsequently authorized VR0 inspected and backed up all 114 GLBs and ran Blender/capability probes without changing source assets. See the [inventory report](realism/VR0-ASSET-INVENTORY.md) and current execution ledger for later work.
