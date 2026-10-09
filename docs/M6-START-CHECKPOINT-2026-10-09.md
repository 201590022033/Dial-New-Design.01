# Milestone 6 - start and asset audit

9 October 2026, Africa/Johannesburg. The user requested: commit/push Milestone 5, start Milestone 6, and prepare a laser test sheet. Milestone 5 was committed and pushed as **6c7204d387bc94a3b5895f07fc063ea0cd66ecb9**. Local HEAD and origin/main matched, with a clean working tree immediately after publishing. Subsequent audit/tests and worksheet work are uncommitted; this request did not ask to publish those new additions.

## What has actually started

The required first M6 step is complete: inspect the real asset nodes/materials before choosing which Blender families need modification. `scripts/audit-hand-regions.mjs` reads 22 existing GLBs, retaining SHA-256, every mesh node name, material name, transform, accessor bounds and extras in `docs/research/hand-region-audit-2026-10-09.json`. It does not alter any GLB. New `handRegionAudit.test.ts` tests protect those binaries and the compact NH05/VK63 contracts. Refresh the inventory only after reviewing an intentional asset regeneration.

**Milestone 6 is started, not complete.** No new lume/tip controls are exposed, no runtime rendering has been changed, and no new GLBs have yet been generated. Do not report colour-only tinting as hollow outline geometry or mark the M6 gate passed.

## Evidence and routing findings

| Family | Actual existing regions | Work needed |
| --- | --- | --- |
| Pilot/diver/field archetype hands | Two separate filled-lume mesh nodes plus main metal/hub | Reuse separate materials; add actual tip and outline regions only if requested |
| Dress archetype, dauphine and skeleton variants | No explicitly named filled-lume region | Do not offer Filled/Outline as working options until geometry is present; no generic green tint on the blade |
| Baton/sword/syringe/cathedral/pencil/broad-arrow variants | Two separately named filled-lume nodes | Reuse metal/lume separation; add tips and true hollow lume channels |
| Mercedes variant | Three named lume nodes, separate metal rim/spokes | Metal rim is not a luminous outline; preserve its topology and roles |
| Compact NH05 luminous set | HOUR/MINUTE/SECONDS extras retain 5/8/8mm radial tip lengths, two filled-lume regions | Preserve physical lengths and fittings; coloured tip extent is a separate parameter |
| Chronograph needle/baton/syringe | Main hour/minute, central chrono seconds and three distinct VK63 register nodes; published register-centre metadata and .37/.295/.32mm bore metadata | Scope main/register appearance independently; never recolour or resize registers by broad HAND-name guessing |

None of the 22 inventories has an explicitly named independently editable coloured-tip or hollow-outline lume region. This is a named-region audit, not proof that every unnamed legacy shape lacks usable geometry; inspect candidate geometry before regeneration. Reference-42 has three lume-named nodes; older Mercedes models use different node naming. Do not apply one universal string matcher without role mapping.

Current source risks:

- `GlbAsset.tsx` routes HAND_LUME through a broad generic lume branch using marker-owned lume enablement. VK63 register names and main central chrono seconds do not all match the existing HAND_ branch. Cached GLTF source scenes are correctly cloned; keep that isolation and repeated-switch behaviour.
- `svgRenderer.ts` still draws hard-coded pale-green hand inlays. Its main-hand lengths now correctly come from `watchAssemblyToVisualModel`; preserve that correction.
- `VisualWatchScene.tsx` procedural hands and register previews are a separate presentation fallback. They need the same resolved region settings, not unrelated defaults. The register descriptor must remain movement-owned.
- `designEngineStore.updateLumeConfig` currently changes session generator state without its own canonical assembly persistence. A new appearance model must own persistence/Undo rather than extending that split.
- The Style inspector currently exposes main-hand metal/hex and shape controls, but not independent lume/tip settings. Browser audit selected Hour Hand > Style and confirmed this baseline; screenshot: `docs/research/slide-rules/acceptance/m6-hand-controls-baseline.png`. No project geometry or colour was changed during the audit.

## Ordered implementation continuation

1. Add a versioned canonical appearance document with independent marker, main-hand and register scopes. Separate metal/print/lume/tip hex values; validate imports and locks; migrate absent settings without changing old designs. No duplicate session-owned appearance state.
2. Resolve semantic regions once for Engineering, HD and export. Filled/Outline/No Lume are geometric coverage modes, not just material colours. Gate capabilities by actual node/geometry support. Keep original scale palettes and M5 component-bound print untouched.
3. Reuse existing metal/filled-lume regions first. Introduce stable `DD_REGION` and `DD_ROLE` metadata. Distinguish the existing `DD_TIP_LENGTH_MM` radial-length metadata from a new coloured-tip extent parameter. Range-check coloured-tip extent from zero to the actual selected hand's radial length; never stretch the hand to satisfy it.
4. Update only affected Blender families for clipped coloured-tip regions and actual hollow lume channels; use reviewed versioned assets where baseline topology changes. Register centres, bores, Z stack and NH05 5/8/8mm lengths must be unchanged. No GLB per palette, no duplicate baked scales. Blender was not available as a command on PATH in this audit; locate the existing installation/configuration before claiming generation unavailable or installing anything.
5. Add contextual, fully connected controls, including exact hex and physical tip length, with independent main/register settings. Compare Filled/Outline/Off in both directions and daylight/night. Night preview is illustrative, not proprietary lume-performance evidence.
6. Verify save/load, Undo/Redo, locks, repeated preset changes and Engineering/HD/export agreement. Run full checks and capture 34/42/46mm acceptance fixtures before declaring M6 complete. No Milestone 7 start or push without further instruction.

## Laser sheet delivered

`output/pdf/aviation-laser-test-sheet.pdf` is a one-page A4 worksheet with two unscaled 42 x 42mm production vector specimens, a 100.00mm calibration bar, a 20mm square, .05-.30mm stroke coupons, .25-.80mm nominal-font-size coupons, a blank sample/settings record and preparation checklist. `scripts/prepare-aviation-laser-test.py` preserves original PDF vectors; verifies page sizes, no raster images and unchanged SVG coordinates/typography/IDs/clips. Separate `laser-test-decimal-hour.svg` and `laser-test-knots-mph.svg` collapse print colours to black without changing geometry or adding a substrate. The SVGs still contain text: outline it and recheck fit in the manufacturing application.

The PDF dark squares are viewing backgrounds, not engraving/cutting areas. Never send the worksheet straight to the laser as machine-ready artwork. Print at Actual Size / 100%, measure the bar first, explicitly assign operations and test a scrap sample using the machine/material instructions. No power/speed/pass recommendations or supplier-fit approval are made. The entire final PDF page was rendered and inspected: no clipped or overlapping worksheet text; specimen lettering is deliberately actual-size and tiny. Poppler's existing Symbol display-font warning did not cause missing Latin/numeric glyphs.

Verification at this checkpoint: Milestone 5 baseline 701 tests/typecheck/lint/build passed before publication. The four new audit tests and seven existing NH05 wiring tests passed. Final full checks are recorded in the handoff below; M6 implementation acceptance remains pending regardless of baseline test success.

Final handoff checks (9 October 2026): 705 tests across 91 files passed; typecheck, lint, production build and tracked diff whitespace checks passed. Existing Zod annotation and large-bundle warnings remain non-blocking. The PDF builder's vector/page-size/SVG-preservation assertions passed, and the final rendered A4 page was inspected. Published local HEAD and origin/main both resolve to `6c7204d387bc94a3b5895f07fc063ea0cd66ecb9`. This M6 audit, tests, checkpoint and laser worksheet are new uncommitted additions; no runtime appearance controls or GLB binaries were changed. Next implementation step is the versioned canonical appearance document and shared semantic-region resolver, followed by targeted assets and connected controls.

## Subsequent pre-M7 diver duplicate-marking repair

The diver bezel binary contains 60 `DD_ARCH_BEZEL_SCALE_*` meshes plus `DD_ARCH_BEZEL_ZERO`. These remained visible under the live editable scale because the earlier replacement rule recognised pilot artwork only. `VisualWatchScene.tsx` now passes the presence of a nonempty live scale bound to `band-outer-bezel` through `GlbAsset.tsx`; `authoredBezelMarkings.ts` suppresses only those authored print meshes (and equivalent chronograph tachymeter print), never the carrier, insert, grip or dial markers. The cached GLTF source is untouched; removing the replacement restores defaults in the next isolated clone. Dial-only and empty retained rows do not claim this replacement.

Four new tests inspect the actual diver binary (61 marking meshes), protect physical geometry, cover repeated replacement/removal and reject unrelated/empty targets. Full verification: 709 tests in 92 files, typecheck, lint, build and diff check passed. Existing build warnings remain. Computer-use previewed Diver without loading/replacing physical parts, inspected HD Visual and captured `docs/research/slide-rules/acceptance/diver-single-bezel-scale-2026-10-09.png`, then restored Pilot / Engineering / hand Style inspector with the original Navitimer artwork. One live bezel scale is visible; the current preview's small lettering close to the crystal still needs the broader size/legibility acceptance audit. No new GLBs or radial-scale geometry changes were needed. This repair remains uncommitted. M6 appearance implementation and M7 final acceptance are not declared complete.
