# M6/M7 integrated repair and acceptance — 9 October 2026

This follow-up supersedes the open M6 implementation and positive Apply entries in the earlier [M7 audit](M7-FINAL-ACCEPTANCE-AUDIT-2026-10-09.md). It preserves that audit as a dated record, not a current claim that appearance controls remain unimplemented.

## Implemented

- Canonical, validated, saved appearance scopes for markers, main hands and movement-owned register hands; independent metal, lume and coloured tips, with real hex controls and Undo/Redo integration. Marker print is separate; an unsupported printed hand region is not advertised as an editable control.
- Filled, hollow-outline and off coverage in Engineering, HD authored-asset clones and procedural presentation. Actual boundary geometry and clipped triangle tips are derived from reviewed GLB meshes, rather than stretching a whole hand or recolouring a filled surface and calling it hollow. Unsupported luminous assets/registers explain and disable unsupported modes.
- Physical hand reach, bores and original `DD_ROLE` metadata remain intact. All 22 audited hand GLB binaries are unchanged; no Blender regeneration was necessary for these runtime regions. See [rendering contract](M6-APPEARANCE-RENDERING-2026-10-09.md).
- Candidate fit evaluation uses the same whole-set transition as Apply. Checks use all three applied central reaches, not a nominal set diameter, and cannot overlook an unchanged oversized seconds hand. Canonical/tray locks still reject prohibited replacements.
- Reviewed authored bezel artwork yields to nonempty bound live artwork, without hiding structural carrier, grip or gemstone meshes. Scale controls and writes share one physical/tray/legacy lock decision. Earlier uncommitted repairs are included, not discarded.
- Saved-version storage losslessly pools repeated full reference artwork above its existing raw-size threshold. Independent copies, all settings and version identities are restored. Old schema loads; malformed, oversized or quota-failed saves do not overwrite durable data. No old version was deleted to make the acceptance checkpoint fit.
- Project JSON/`.dial`/`.watch` downloads use an attached temporary anchor and delayed URL cleanup. Tests cover lifecycle and failed click cleanup; actual browser download completion remains qualified below.

## Actual browser acceptance

The computer-use skill guided the UI checks and screenshot evidence. The PDF skill guided inspection of the four existing production-generated vector PDF fixtures and rendered pages; no new factory or manufacturing certification is implied.

| Check | Observed result |
| --- | --- |
| Options preview / double-click / Enter | Single-click Baton preview, double-click Baton Apply and Enter Sword Apply succeeded. Coin-edge bezel Apply updated physical OD/ID/width. Existing incompatible assemblies still refuse Apply. |
| BOM positive Apply | Sword hand set applied with the explicit message that both views updated and supplier fit still needs verification. [Evidence](research/slide-rules/acceptance/m7-bom-apply-success-2026-10-09.jpg). |
| 42mm appearance | Hollow tips/colours visible in Engineering and HD; filled → outline → off → filled and daylight → night → daylight exercised. [Engineering](research/slide-rules/acceptance/m6-engineering-outline-tips-2026-10-09.jpg), [HD](research/slide-rules/acceptance/m6-hd-outline-tips-2026-10-09.jpg), [night](research/slide-rules/acceptance/m6-hd-night-2026-10-09.jpg). |
| Compact NH05 | Researched luminous 5/8/8mm set applied via Enter; 0.7mm coloured tip and outline inspected in ladies 34mm HD. Compact reach was not replaced by a 42mm set. [Evidence](research/slide-rules/acceptance/m6-ladies34-hd-2026-10-09.jpg). |
| Chronograph scope | Main silver and register gold with independent red tips inspected in Engineering and full-screen HD. Register luminous modes correctly unavailable. Final audit also exposed redundant painted register circles and a diameter-fallback hand-occlusion issue; follow-up results are recorded below. |
| Versions / reload | Four saved checkpoints survived real reload after the size repair, including original M4 and pre-starter checkpoints. Later acceptance loads brought the total to eight preserved checkpoints without capacity warning. Saved 42mm appearance checkpoint restored successfully and left active at handoff. |
| Import / repeated import | Existing real user JSON imported successfully twice through the file chooser. This verifies loading/repeated selection, not the export of a newly generated file. |
| Branded scales / locks | Prior same-day M7 browser evidence retains Citizen/Navitimer switching, independent colours/rotation, disable/reset and lock/unlock checks. Automated tests cover independent physical bands, serialization and all retained inventories. A fresh full manual multi-band sweep is not claimed. |
| Vector fixtures | Four 42/46mm Citizen/Navitimer SVG/DXF/PDF sets reviewed; PDFs are vector (0 raster images), 1 page at 60×60mm. Both 34mm branded originals intentionally refuse unsafe fits. |

## Remaining boundaries

- Physical 1:1 print/laser legibility, kerf/material proof, text outlining and operation assignment remain the user's manufacturing acceptance. DXF hollow numeral TEXT cannot encode the required outline; it explicitly refuses that combination instead of silently exporting filled glyphs. SVG/PDF is the supported preparation route.
- A 46mm preview is not a purchasable or fit-certified 46mm supplier assembly. Preview changes must not silently resize sourced hands or components.
- Engineering hand silhouettes are schematic; HD retains authored silhouettes. Day/night is illustrative, not certified lume performance. Source-derived fonts, colours and radial spacing retain the already accepted approximation disclosures.
- Browser download event timed out and no new download was verified. File import and download-helper tests pass, but a complete newly exported JSON → file-picker reimport round trip still needs manual browser confirmation. This is not proof the app export is broken, nor a passed download acceptance gate.
- No supplier records, prices, purchases or external supplier contacts were introduced in this checkpoint.

## Verification and publication

### Late visual repairs

- Removed three pre-existing normalized chronograph circles from `DialArtwork`; they were decorative texture strokes at the wrong centres, not actual VK63 hubs. Real movement-owned register geometry remains. Five regression cases in `dialArtworkRegisters.test.tsx` include circle ownership, fallback visibility, actual catalogue Sword 42→46 transition and the NH05 authored-dial frame.
- Mixed-frame hand occlusion: at 46mm the procedural dial centre moved from 3.70 to 4.85mm while a selected `hands-sword-42` GLB remained at its original 4.25mm placement. Reviewed generated-hand descriptors now record their authored dial datum; their axial offset follows the actual dial frame without changing GLB geometry, blade lengths, scale or source registry. All nine generated styles use this datum. NH05 authored dial/special-hand offsets are not double-translated. The repaired 46mm HD screenshot visibly contains the hands again: [evidence](research/slide-rules/acceptance/m6-pilot46-preview-hd-2026-10-09.jpg).
- The 3D controls now label the actual preview diameter (not a hard-coded 42mm) and offer an expandable read-only placement diagnostic, making this class of mixed-frame defect observable without altering the user's project.
- Tachymeter reciprocal stations naturally converge. Adaptive writing selection now uses final physical glyph bounds and at least 0.12mm clearance, without moving calibration angles. Baseline writing is horizontal, with short outer-edge graduations and a separate inner writing row, so tick strokes no longer run through numeral centres. A target that cannot fit a separate row reports an explicit issue. Explicit saved opt-outs remain supported; a freshly loaded Chronograph starter gets its own canonical baseline snapshot rather than rehydrating retained old radial writing. Citizen/Navitimer original inventories are untouched.

### Changed code groups

- `src/domain/appearance/appearance.ts`, assembly types/serialization and `watchAssemblyStore.ts`: canonical appearance, validation, persistence and authoritative edits.
- `AppearanceControls.tsx`, `StyleTab.tsx`, `HexColourField.tsx`, `appearancePreviewStore.ts`, `designEngineStore.ts`, `CentreCanvas.tsx`: contextual controls, session preview and Engineering adapters.
- `handAppearanceRegions.ts`, `GlbAsset.tsx`, `VisualWatchScene.tsx`, `VisualWatchRenderer.tsx`, `visualAssetRegistry.ts`, `watchAssemblyToVisualModel.ts`, `svgRenderer.ts`, `exportGeometryService.ts`: geometry, region materials, shared projection, export and placement repairs.
- Compatibility helpers, hand clearance rule, configurator UI store, default builds and version manager: exact Apply transition, locks, baseline hydration and durable checkpoints.
- Scale target lock/store/controls, authored bezel ownership, tachymeter writing/service, project download helper/toolbar: related acceptance repairs.
- New/extended tests, isolated M7 QA fixtures/page/collector, screenshots and vector review fixtures are included with the implementation. No hand GLB binaries changed.

Publication is explicitly authorized by the user. This is a verified software checkpoint with the stated external/manual boundaries, not factory reproduction or unconditional laser-release sign-off.

### Final verification

- `npm test -- --run`: 99 test files, 786 tests passed.
- `npm run typecheck`, `npm run lint`, `npm run build`: passed after the final rendering and typography repairs. Build retains non-fatal dependency annotation and large-chunk warnings.
- Final chronograph Engineering and HD screenshots show separated tachymeter writing, retained central hands and independently coloured movement registers.
- Browser/PDF evidence and the manual boundaries above qualify the software acceptance; the unverified new-download round trip and physical laser/supplier checks are not marked complete.
