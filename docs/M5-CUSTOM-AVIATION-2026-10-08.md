# Milestone 5 - custom aviation layers

2026-10-08, Africa/Johannesburg. Baseline main c4ac3a8071d9f570052ad67ad9c2427a60d76b1d. Milestone 5 only; Milestone 6 has not started. Changes remain uncommitted and have not been pushed.

## Delivered

Advanced > Custom aviation now provides separately switchable Decimal hour and Knots / statute MPH layers. Independent versioned assembly settings retain target, lettering, colours, origin and speed range through disable, serialization and assembly Undo/Redo. They do not edit Citizen/Navitimer inventories or restore excluded weight/volume rows.

- Decimal hour has 100 exact 3.6-degree stations, 0.01h = 36s, major 0.10h labels and a red elapsed-minute row. One 0.00 origin also represents 1.00h after a complete turn, not a duplicated seam. The calculator retains whole hours explicitly: 1:30 is 1.50h, one whole hour plus a half turn.
- Direct speed conversion is a fixed linear paired scale, not a logarithmic distance-index group. Default 0-200kt occupies a disclosed 300-degree sweep with 41 ticks; kt and statute-mph labels share angles. Calculations retain the exact ratio 1852/1609.344. Ring labels round to one decimal mph; the numeric calculator rounds only its display to two decimals.
- Fuel used, burn rate, endurance, time, distance and groundspeed arithmetic accepts HH:MM elapsed duration, with explicit units and invalid-input refusal. No volume/mass conversion, automatic Hobbs recording or logbook decision. A one-revolution seconds hand is explicitly not an hour timer.
- Full glyph corners, hover padding, stroke/tick length, row separation and adjacent label spacing participate in annular fit. Missing/hidden/narrow targets and competing layers block exports; mathematical graduation angles are never moved to accommodate typography.
- SVG, DXF, vector PDF, Engineering and HD use the same resolved marks. HD chapter printing uses the existing authored annulus material, not another floating surface. No GLBs were changed or added.

Source constants checked against [NIST SP811 Appendix B.8](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8) on 2026-10-08: international nautical mile 1852m and mile 1609.344m. These custom designs make no manufacturer-reproduction claim.

## Verification

Final automated checks: 90 test files / 701 tests passed, typecheck passed, lint passed, production build passed, git diff --check passed. Existing large-bundle, Zod annotation and Three CommonJS deprecation warnings remain; they are not introduced rendering failures.

Focused custom tests cover the requested 6/15/30/45/60/90/10-minute vectors, whole-hour/seam handling, exact reciprocal speed conversion, linear paired angles, narrow/hidden/missing annuli, original-layer conflicts, serialization, Undo/Redo, locked parts, malformed imports, shared SVG/DXF and all six arithmetic modes. The HD regression test covers retained-but-disabled original fixed rows not claiming a custom chapter-ring material, physical clip preservation, zero radial shift and below-crystal Z placement.

Computer-use acceptance on the actual local dashboard:

- Engineering and HD displayed Decimal hour and Knots / statute MPH on the chapter ring; swapping the custom layers updated both views.
- The first HD check exposed a disabled original inner row still winning material selection. Fixed actual material routing to require marks on the claimed row; subsequent HD inspection showed the custom labels and graduations on the existing chapter ring.
- Original fixed-row coexistence produced an explicit physical-band conflict without deleting original settings. Explicitly disabling that original row allowed a custom chapter ring; its original settings were restored afterwards.
- 120kt displayed 138.09 statute mph; reversing 115.077944802mph displayed 100.00kt. 0:10 displayed 0.17h while retaining 0.1667h and 60 degrees. 6L/0:40 displayed 9.00L/h. Invalid 1:60 duration refused both duration and rate output.
- Selecting the 0.25mm inner bezel produced fit errors and disabled SVG export. Restoring the 1.80mm chapter ring restored valid geometry.
- Custom layers were disabled after QA and the original Navitimer inner fixed scale restored. No QA version was saved over the existing project checkpoint.

Screenshots retained in docs/research/slide-rules/acceptance: m5-decimal-engineering.png, m5-decimal-hd.png, m5-knots-engineering.png and m5-knots-hd.png.

Actual export specimens retained in output/pdf: m5-decimal-hour and m5-knots-mph, each SVG/DXF/PDF. Generated through production physical resolution and production export functions using the isolated custom-aviation-qa.html page and bounded loopback collector. No previous M4 exports were overwritten. Both PDF pages measure 119.055 x 119.055 points (42 x 42mm); both pages were rasterized and visually inspected for unclipped paired lettering and correct graduations. Poppler reported a Symbol display-font warning, but these specimens contain Latin/numeric text and rendered without missing glyphs. The in-app browser's download-event capture timed out; dashboard export produced no error, and the deterministic collector verified actual file creation using the same production functions instead. Native browser download UX is not independently certified by that event capture.

## Files and limits

New domain: src/domain/scales/customAviation.ts. New controls: src/components/configurator/CustomAviationPanel.tsx. New physical material binding: src/visual3d/scaleArtworkBinding.ts. New regression suite: src/tests/customAviation.test.ts.

Wiring changes: AdvancedModePanel, AviationSlideRulePanel, assemblyTypes/assemblySerialization, aviationSlideRule, scaleLayerArtworkService, scaleStore/storeSync/watchAssemblyStore, ScaleArtwork3D/VisualWatchScene and aviationSlideRule.test. QA support: custom-aviation-qa.html, src/qa/customAviationQa.ts and the existing export collector's exact filename allowlist. This checkpoint and the master ledger record acceptance.

Functional Milestone 5 gate passed. Physical manufacturing approval is not claimed: default custom lettering is 0.40mm and tick strokes 0.08mm; dashboard-size HD readability is inherently small. Larger fonts must fit the actual annulus and may be refused. PDF substitutes standard fonts and includes a disclosed dark viewing background to show light ink; that background is not engraving geometry. Use transparent SVG/DXF, outline lettering, verify 1:1 sizing and conduct a material/laser test before manufacturing. Colours do not certify engraving contrast. Only the pilot chapter ring was visually checked in this milestone; full cross-archetype acceptance remains Milestone 7. No factory typography gate was changed.

Next authorized milestone is 6: lume modes, hand tips and targeted GLB work. Do not begin it without the user's request. Commit/push requires a separate request.
