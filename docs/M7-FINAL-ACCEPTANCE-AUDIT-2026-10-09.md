# Milestone 7 acceptance audit — 9 October 2026

> Historical initial audit. The later [integrated M6/M7 repair and acceptance](M6-M7-INTEGRATED-ACCEPTANCE-2026-10-09.md) supersedes its M6 implementation, positive Apply and version-durability status. Keep the limitations below as evidence unless that follow-up explicitly closes them.

## Decision

Acceptance audit checkpoint recorded, with open exceptions. **Not a full product/release sign-off:** Milestone 6 remains an asset audit and plan, not completed lume/tip controls. Passing calculations and exports do not prove factory reproduction or laser legibility.

Baseline: main at `f113e1b417a7e485b45f857886fffff69de1bf93`. All work below is local and uncommitted; no push was requested for this milestone. The earlier uncommitted bezel-artwork ownership repair was preserved. No GLB binaries or supplier records were changed.

## Requirements ledger

| Requirement | Result and evidence |
| --- | --- |
| Literal multiplication/division, speed and duration examples | Automated pass: production logarithmic alignment functions tested with 20/10→60/30, 20/10→30/15, 80/20→40/10, 25/20→12.5/10, 12/60→60/30, 18/60→45/150. Correct orders: 6, 300, 4, 1.25, 120 km/h, 150 min. |
| Ratio invariance | Pass: 20→40 and 30→60 both 108.370798439°. |
| Exact distance conversions | Pass: 30 statute miles = 26.069287257 NM / 48.28032 km; 60 = 52.138574514 NM / 96.56064 km. |
| HH:MM | Pass: 1:10, 1:20, 1:30, 2:30, 3:00 resolve to 70/80/90/150/180 minutes and correct logarithmic positions. Neither selected original has an HH:MM printed row. |
| Advanced left / configuration right | Browser pass: switching Citizen/Navitimer, mutual exclusivity, unticking, reopening Advanced, Original/Custom Colours, outer/inner/distance visibility, rotation and Reset to Original. Citizen custom #123456 and 37° survived switching away/back; Navitimer Original remained independent. |
| Per-band state / save-load | Automated state and serialization checks pass. Full manual multi-band editing and real browser file-picker export/import round trip **not reverified** this turn. A browser download event timed out; this is not proof that the application's export failed. |
| Locks | Repaired and verified: tray locks, canonical part locks and legacy band locks now share one scale write/control guard. Rotating and fixed target locks covered by regression tests; actual rotating-bezel lock/unlock checked in browser. Both left and right controls disable and explain the lock. |
| Undo / Redo | Browser pass for rotation 0→37→Undo 0→Redo 37, before development reload. Development-page edits triggered reloads and cleared ephemeral history; do not claim Undo survives reload. |
| Single / double-click / keyboard Apply | Single click previews. Double-click and Enter correctly refused the current incompatible hand-fit assembly. A successful compatible Apply path is covered by existing tests but **not reverified manually** here. |
| BOM Apply | Browser refusal correctly reports the same hand-fit conflict without applying the option. Positive BOM Apply covered by automated tests, not reverified manually here. |
| Whole-circumference comparisons | Both brands compared beside their individually selected source, full circles captured. Inventory, values and exclusions pass; photographic/radial/typographic approximations remain, described below. |
| Engineering / HD | Citizen both rows inspected in Engineering and HD. Whole-circle SVG comparisons cover both brands. Existing prior Navitimer HD evidence retained; complete fresh 34/46mm HD and all-archetype appearance sweep **not completed**. |
| 34 / 42 / 46mm | Six deterministic fixtures tested. Both 34mm branded originals explicitly rejected as unreadable. 42mm and 46mm-preview exports pass geometry validation. A 46mm preview is not evidence of a purchasable 46mm case or resized supplier components. |
| Exclusions / reset / exports | Full suite passes semantic exclusions and state/reset tests. New fixtures assert retained tick/label/pointer inventories and reject excluded captions. No repositioning of mathematical stations to dodge collisions. |
| SVG / DXF / PDF | Four actual production-generated vector sets inspected; details below. 34mm invalid originals are not exported. |
| Lume, independent hand-tip appearance | **Open: Milestone 6 implementation**, not silently counted as accepted. |

## Repair and test files

- `src/domain/scales/scaleTargetLock.ts`: one pure lock decision for physical rotating/fixed targets, legacy bands and right-tray locks.
- `src/stores/scaleStore.ts`: write guards use the same decision as the interface.
- `src/components/configurator/ReferenceSlideRulePanel.tsx`: visibly disabled locked controls and unlock explanation in both panels.
- `src/tests/referenceSlideRuleState.test.ts`: four canonical/tray lock regression cases, including fixed chapter ring.
- `src/tests/milestone7Acceptance.test.ts`: 20 literal-calculation and size/export acceptance tests.
- `src/qa/milestone7Fixtures.ts`, `src/qa/milestone7Qa.ts`, `milestone7-qa.html`: isolated fixtures/source comparisons without mutating the user assembly. Fixture-specific SVG clip IDs avoid collisions between multiple comparison SVGs on the same page.
- `scripts/export-qa-collector.mjs`: allowlisted loopback collection of these QA exports. Collector stopped after generation.

Earlier bezel repair remains separately documented in [the artwork ownership audit](BEZEL-ARTWORK-OWNERSHIP-AUDIT-2026-10-09.md): reviewed authored print is replaced only when actual live artwork exists; structural bezel/grip/gem meshes remain. Its tests are included in the full run.

## Reference identities and limitations

Citizen: `citizen-jy8078-01l-2026-10-07`, native Canada 1600×2000 and Europe 2000px product images. 225 stations per ring, 449 radial strokes, 54 labels, five pointers and three substrates. Source inventory records 52 reviewed sectors and 51 numeral runs. Retains dark inner 10/yellow box, hollow light hour-rate 60, yellow KM and red NAUT/STAT with light lettering. No HH:MM or separate 36 row. Seven shortened radio-exception ticks remain without excluded captions. Exact distance-ratio group is retained; measured KM placement is a photographic approximation.

Navitimer: `navitimer-booklet-training-disc-2026-10-07`, booklet training disc on viewer page 2, native 600×525 JPEG. This is not a claimed verified 1967 AOPA or named production-watch reproduction. 210 stations per ring, 416 radial strokes, 59 labels, nine pointers and two substrates; pointer stations own four strokes. Source inventory records 56 reviewed sectors and 55 literal numbers. Inner 70/80/90 print 7/8/9; no ordinary inner 60 or HH:MM row. The fixed 36 pointer is captionless. Source outer phase approximately −29.05° is photographic registration, not runtime zero. The withheld photographic fit has a −2.3524° residual and is not factory calibration evidence.

Substitute fonts and sampled colours are accepted reconstruction choices, not a reopened exact-font gate. Full-circle comparison still shows adapted radial spacing, finer/smaller lettering than the reference and sparse substrate areas, especially Navitimer. Zoomed screenshots cannot prove 1:1 legibility. No copyrighted dial logos were added.

## Physical geometry and export measurements

| Fixture | Outer printable radii (mm) | Fixed printable radii (mm) | Result |
| --- | --- | --- | --- |
| 34mm ladies dress | 15.500–15.895 | 12.400–13.500 | Refused: minimum font about .043mm Citizen / .034mm Navitimer, below .10mm safety floor. Use a wider physical target or clearly labelled Simplified adaptation. |
| 42mm pilot | 15.900–19.000 | 13.450–15.250 | Geometry pass; physical print proof still required. |
| 46mm pilot preview | 15.500–19.000 | 13.450–15.250 | Geometry pass on unchanged physical components; not a verified 46mm supplier assembly. |

Outer content retains the hard .08mm edge inset. Both ticks and full glyph/pointer extents are validated against the physical target; numerical stations are not shifted to make an overfull original fit.

Exports in `output/pdf/`: `m7-42-citizen`, `m7-42-navitimer`, `m7-46-citizen`, `m7-46-navitimer`, each with `.svg`, `.dxf`, `.pdf` and rendered `-review.png`. All four PDFs rendered and visually inspected, one 60×60mm page each; the artwork retains physical mm dimensions, it does not fill the page as an arbitrary case size.

| Measurement, both valid sizes | Citizen | Navitimer |
| --- | --- | --- |
| SVG tick lines / labels / embedded images | 449 / 54 / 0 | 416 / 59 / 0 |
| Smallest SVG tick stroke (mm) | .034783 | .040000 |
| Smallest SVG font (mm) | .352591 | .282557 |
| PDF vector drawings / text spans / images | 463 / 54 / 0 | 431 / 59 / 0 |
| Smallest positive PDF stroke (mm) | .027826 (pointer outline) | .040000 |
| DXF TEXT entities / true-colour entries | 54 / 515 | 59 / 486 |

DXF has millimetre INSUNITS=4, physical LWPOLYLINE widths, annular HATCH substrates and SOLID pointer/box fills. PDF is real vector/text output, not screenshots. Actual PDF text uses Helvetica-Bold, not outlined factory glyphs. SVG text is also unoutlined; DXF viewers can substitute fonts and interpret true colour differently. Existing component outlines are separate from brand print and need laser-layer preparation. Navitimer minimum text is below the selected .30mm profile guidance and remains warned. Fine strokes, kerf, substrate/layer selection, font outlining and a 1:1 material test are required before manufacturing approval.

## Evidence and verification

- [Advanced left and right](research/slide-rules/acceptance/m7-advanced-citizen-2026-10-09.jpg)
- [Citizen HD](research/slide-rules/acceptance/m7-hd-citizen-2026-10-09.jpg)
- [Citizen/source full-circle comparison](research/slide-rules/acceptance/m7-citizen-source-comparison-2026-10-09.jpg)
- [Navitimer/source full-circle comparison](research/slide-rules/acceptance/m7-navitimer-source-comparison-2026-10-09.jpg)
- [Locked control feedback](research/slide-rules/acceptance/m7-locked-scale-controls-2026-10-09.jpg)

Final run after code repairs: **740 tests across 93 files passed; typecheck, lint, production build and git diff --check passed.** Existing build warnings concern dependency annotations and bundle size; tests retain the existing Three.js CommonJS deprecation warning.

Browser handback: 42mm pilot, Engineering/Advanced, Navitimer Original, rotation 0, rotating bezel unlocked, no pending component preview and BOM closed. Existing version entries were not deleted. Development reloads cleared ephemeral Undo history; full byte-identical project restoration is not claimed.

## Remaining sign-off work

1. Complete Milestone 6 appearance controls and necessary targeted asset geometry; repeat Engineering/HD switching and night/day checks across archetypes.
2. Resolve the current hand fit: 14.0mm reach exceeds 13.45mm usable radius by .55mm. Do not bypass the compatibility gate to make Apply appear successful.
3. Repeat successful compatible single/double-click/keyboard and BOM Apply, manual per-band isolation and real file export/import; run fresh 34/46mm HD checks on intended physical assemblies.
4. Print/laser-test the finest lines and labels at 1:1, with explicit layer/colour/font preparation. Final acceptance stays conditional until these checks are recorded.
