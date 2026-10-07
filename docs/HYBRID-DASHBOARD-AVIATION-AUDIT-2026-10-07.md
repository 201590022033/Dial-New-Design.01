# Hybrid dashboard and aviation scale audit / implementation plan

Date: 7 October 2026, South Africa. Status: original audit proposal; Milestone 0 has subsequently been authorised. The linked consolidated plan controls execution and records the latest typography/Simplified requirements.

Consolidation: use [MILESTONE-PROMPTS-HYBRID-SLIDE-RULES-2026-10-07.md](MILESTONE-PROMPTS-HYBRID-SLIDE-RULES-2026-10-07.md) as the execution plan. The [verbatim user prompt](SLIDE-RULE-EXACT-USER-PROMPT-2026-10-07.txt) supplies the detailed Citizen Skyhawk / Classic Navitimer requirements and takes precedence over conflicting earlier suggestions below. This document remains the broader UI/architecture audit.

Basis: supplied `4aedf5e2-682e-4a34-bb97-e08284935ca7.png`, current repository source, and manufacturer/unit-reference research linked below. The original comparison is a source-and-image audit. Milestone 0 subsequently completed a focused live browser baseline and three scoped repairs, with 445 passing tests and successful typecheck/lint/build/diff checks. See [baseline evidence and limitations](MILESTONE-0-BASELINE-2026-10-07.md); this is not acceptance of the proposed redesign or faithful branded artwork.

## 1. Recommended hybrid

Keep the current Build / Parts / Style / Research / BOM / Manufacture / Advanced workflow, procurement safeguards, Engineering/HD switch, versions, Undo and component Apply. Add the mock-up's compact top diameter control, optional visual component navigator, and contextual right-hand inspector. Do not replace the workflow rail with the old engineering panel or create a second assembly state.

The centre remains the largest area. The new component navigator should collapse beside the existing rail and use generated dial/ring/hand thumbnails, selected outline, visibility control, physical dimensions and scale-program badge. The right inspector should identify the selected component with the same thumbnail and highlight its matching ring in the centre. Preserve current Options / Style / Suppliers / Details / Manufacture navigation; subdivide Style into Background, Colours & Lume, Cutouts, and Logo & Text where applicable. Do not show irrelevant cutout or dial controls for a strap.

On narrow windows, collapse thumbnails and move header actions into a menu rather than shrinking the watch and making small labels illegible.

## 2. Feature comparison

| Mock-up feature | Current repository evidence | Rewiring required |
| --- | --- | --- |
| Top 38–44mm slider, 42mm readout | `TopToolbar.tsx` has project/navigation controls; authoritative size writes exist in `watchAssemblyStore` and `globalSettingsStore` | Add slider plus typed mm field to toolbar; do not hard-limit ladies/46–47mm models to 38–44mm |
| Thumbnail cards for dial, chapter, inner/outer bezel and movement | Active app uses `LeftNavRail` and `RightTraySwitch`; legacy `LeftBandsPanel` exists but is not the active layout | Add compact navigator backed by actual assembly IDs, not mock-up names or legacy stores |
| Selected ring shown visually | Current selected-component context already exists | Generate annular thumbnail and centre highlight from the same resolved component; include ID/OD/ID/width |
| Cream scales, dark marks, red landmarks | `ScaleRunResult` exposes one colour; ticks/labels lack semantic per-mark colour roles | Add semantic mark identities and style resolution shared by every renderer/export |
| Exact hex fields | Style has colour pickers and presets, but no displayed/editable hex field beside each | Add validated text entry, picker, reset/default and copy; show resolved effective values |
| Filled / outline / no lume | Marker model already has `lumed`, `outline`, `filled`; HD appearance mostly uses lume enabled/colour | Reuse/migrate these fields into coherent per-component lume modes; distinguish metal outline from luminous outline |
| Red main/subdial tips | Main hand colour and subdial hand styles exist; no dedicated tip-region configuration | Separate metal, lume, tip colour and tip length for main and register hands |
| Satin sunburst samples/direction/close-up | Current texture presets and generator exist | Add actual texture thumbnails, applicable direction control and selected-part crop from existing preview |
| Multiple scale rows at once | One selected scale kind/config/preview; aviation special-cases inner/outer | Introduce persistent scale layers with physical target IDs and row allocation |
| Direct decimal-hour and knots/MPH rows | Custom conversion plugin exists; no dedicated aviation hundredths preset | Add explicit tested presets, not decorative text labels |
| SVG / DXF / PDF shortcuts | Export store supports these formats, but aviation panel has a separate SVG-only path | Route shortcuts and aviation exports through one canonical artwork/export pipeline |

## 3. What can actually be read from the mock-up

Visible: 42mm case, 2.20mm chapter width; concentric dense graduated rows; an outer numeric row with red 60/TIME near 12 o'clock and red 30 near 6 o'clock; red DIST and FUEL captions; a triangular index near KM/MPH; US.GAL-like lettering; an inner hours:minutes-style row (for example 1:10, 1:20, 1:30); and fine minute markings surrounding the hour markers. Main hands have pale luminous centres and contrasting borders; the small register hands have red tips. Printed hex values are `#1A1D24`, `#F0F0F0`, `#E63946`.

Some tiny rotated text/numerals are ambiguous or appear malformed. The bottom caption cannot be confidently identified. The image does not prove a calibrated knots-to-MPH pairing, a correct gallon conversion, or mathematically consistent angular spacing. DIST/FUEL alone do not establish conversion constants. The red outer 30 is a style landmark, not a universally required aviation slide-rule index.

The movement card says NH31 while the dial depicts a chronograph/flyback. That is not a valid movement-to-complication specification. Preserve compatibility guards and label unsupported register artwork as presentation only; do not let this UI redesign imply physical chronograph support.

### Valid aviation functions to retain/add

Our existing `aviationSlideRule.ts` already calculates time, distance, groundspeed, fuel used and endurance, and aligns the rotating ring. Extend it with fuel burn-rate calculation, multiplication/division and explicit unit-conversion presets. Manufacturer guidance supports these time/rate, distance and fuel uses. The inner 60 index is the per-hour rate reference; the red inner 10 is the multiplication/division unit index. [Breitling slide-rule instructions](https://www.breitling.com/media/document/2/archive-archive-archive-archive-archive-archive-archive-archive-archive-archive-archive-archive-archive-navitimer_slide_rule.pdf)

Retain verified NM / statute miles / kilometres references. Earlier suggestions to add litre/gallon conversion markings are superseded by the new prompt: weight, volume and fuel/oil-weight conversion labels, dedicated pointers and supporting rows are excluded from both branded presets, including optional controls and exports. Ordinary numerical scales still support fuel rate/quantity/endurance arithmetic using consistent units. [Citizen calculator guide](https://www.citizenwatch-global.com/support/exterior/calculation.html)

Do not add universal FUEL LBS/OIL LBS conversions: volume-to-mass requires an explicit density/fuel assumption. Do not promise wind correction or true airspeed from two basic log rings alone; these need additional inputs/models. The watch remains an approximate reference, not a substitute for aircraft operating information or an approved navigation calculation.

## 4. Dimensions, colours and red-mark policy

### Known versus proposed defaults

- **Image-confirmed:** case 42.00mm; chapter width 2.20mm; dial/base `#1A1D24`; text `#F0F0F0`; accent `#E63946`.
- **Proposed approximation, not recovered source colours:** ring substrate `#E8DFC8`; ring ink `#191919`; lume preview `#D9EBAD`.
- **Initial configurable artwork defaults:** text height 0.80mm, major tick stroke 0.15mm, minor stroke 0.10mm, major tick length 0.45mm and minor 0.25mm, reusing existing aviation generation defaults where applicable. These are design starting values, not supplier/manufacturing approval.
- **Unknown:** ring OD/ID, crystal opening, dial opening, bezel insert sizes, font metrics and all other exact printed dimensions. Derive these from selected component dimensions/drawings. The photograph cannot supply them exactly.

The toolbar must explain diameter changes: resizing a custom/provisional design is allowed, but a purchased case is not physically resized by a slider. Offer a matching catalogue case or mark a manual resize as custom/unverified. Preserve hand lengths, lug spacing and supplier identity only where physically valid. A slider change must not silently stretch every supplier GLB.

Use stable roles such as `unit-index`, `hour-rate-index`, `conversion-index`, `major-number`, `minor-tick` and `caption`. Give each a ring ID, value, unit and independent pointer/text/tick colours. For branded Original Colours, verify every colour against that specific reference; do not assume all indices are red or Blue Angels references yellow. The mock-up palette applies to the hybrid UI/custom design only. Any decorative red overrides require explicit Custom Colours and are not original-reference artwork. No hard-coded pixel coordinates or recolouring every numeric 60 regardless of ring/function.

For a screenshot-style home position, rotate the logarithmic scales consistently so the chosen reference index is at 12 o'clock. Preserve logarithmic spacing and subsequent relative rotation; do not force evenly spaced watch-minute numbers onto a logarithmic calculator.

All glyph corners, strokes, tip triangles and hover envelopes must stay inside the target's physical printable annulus, with radial safety margin from actual font metrics and tick length. Inner rows have their own component envelope, not the outer bezel's envelope. Never move a conversion index to avoid overlap: simplify minor marks/labels or warn that the row does not fit. Colour cannot be the only indication of a functional reference.

## 5. New chapter-ring programs

### A. Decimal hour / hundredths converter

Name: **Decimal hour (0.00–1.00 h)**. One revolution represents one hour, not one minute. Use 100 graduations; each 0.01h represents 36 seconds of elapsed time. Major labels at 0.10h intervals; optional minor ticks at every hundredth; quarter-hour references 0.25 / 0.50 / 0.75 if space permits. Avoid overlapping 0.00 and 1.00 at the seam: one origin label with a wrap annotation.

Mapping: angle = 360 × fractional hours = 6 × elapsed minutes. Thus 6min = 0.10h, 15min = 0.25h, 30min = 0.50h, 45min = 0.75h, 60min = 1.00h. For 1h30min, the full result is 1.50h; the fractional ring alone cannot encode the whole-hour count. At 10min the result is about 0.17h, not 0.10h.

Offer an aligned minute/decimal pair as a conversion reference. Label the required elapsed-minute input clearly: a seconds hand completing a revolution is not an hour timer. No automatic Hobbs recording or automatic decision about which time is legally/logbook-applicable. Store precision and rounding separately; do not silently round hundredths to tenths or sum already-rounded segments.

This must be independently targetable to the chapter ring and coexist with pilot log rings only when enough printable radial width exists. Selecting it must not silently delete the fixed logarithmic partner of an active slide-rule pair.

### B. Knots ↔ statute MPH

Name: **Knots / statute MPH**. Paired rows at the same angle, clearly labelled `kt` and `mph`. Exact factor = 1852 / 1609.344; 100kt ≈ 115.08mph, 120kt ≈ 138.09mph. Reverse conversion divides by the same factor. [NIST conversion references](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8)

Offer two distinct modes: a direct fixed paired reference with an explicit displayed range, and a logarithmic aviation conversion-index group. Do not mix linear ticks and log ticks under the same program name. Use the same source-of-truth constants for the calculator, printed index positions and test vectors. Distinguish knots from nautical miles and statute MPH from km/h.

### C. Fuel / distance / time extras

Add guided calculators for quantity = rate × hours, rate = quantity / hours, endurance = usable quantity / rate, and HH:MM ↔ decimal hours. Do not add weight/volume conversion marking groups to either branded preset. Whole-hour clock labels, reference-faithful logarithmic HH:MM labels and custom linear decimal-hour graduations must remain separate selectable systems. The new decimal-hour and direct knots/MPH options are custom layers, never falsely presented as original Citizen/Navitimer rows.

## 6. Rewiring architecture

One path: **component + scale-layer configuration → generated semantic marks → per-target envelope validation → shared resolved artwork → Engineering / HD material artwork / SVG / DXF / PDF**.

1. `WatchAssembly.designConfig`: versioned scale-layer collection, component appearance and hand-region settings. Persist each layer's ID, program, target part/band ID, units, calibrated orientation, style overrides and source metadata. Migrate old single-scale documents without changing their appearance.
2. `scaleStore`: editing/selection projection over persisted layers, not a second competing configuration. Preserve archetype policy and deliberate manual unlock. Commit/Undo/autosave/BOM Apply must retain target bindings.
3. `domain/scales/types.ts`: stable semantic mark IDs, role/unit, resolved colours and ring/row IDs; shared style resolver. `aviationSlideRule.ts`, program registry and conversion plugins generate tested calibrated marks.
4. `placementEnvelope.ts` and `scaleArtworkEnvelope.ts`: resolve each layer against the selected physical component and font bounds. No outer-diameter spill, inner-edge spill, glyph clipping or relocated reference indices.
5. `svgRenderer.ts`, `useScaleArtworkTexture.ts`, `ScaleArtwork3D.tsx`: consume the same bounded marks and colour map. HD print sits on the bezel/chapter material at its real surface, below the crystal where appropriate, rather than a screen overlay. Clear stale textures and duplicate baked scales when a layer/style is changed.
6. Replace `createAviationRingSvg`'s separate regenerated/hard-coded black path with the canonical resolved artwork. Manufacture can additionally export monochrome engraving layers without losing colour-print layers or altering calibration. DXF represents paths/layers, not a promise that every viewer renders ink identically; include a colour/material legend and outlined fonts in manufacturing deliverables.
7. `StyleTab`/right inspector: contextual thumbnails, three explicit colour roles plus per-mark overrides, editable hex fields, lume modes and main/subdial tip controls. Use current guarded Preview/Apply and double-click behaviour; previews never overwrite committed sourcing.
8. `TopToolbar`/`App`: add diameter slider/readout and compact component navigator. Reuse authoritative assembly geometry and existing export service, not the disconnected legacy left panel.

### GLB scope

Ring thumbnails and top controls do not need Blender. Live scale print can be a component-bound material texture using the same geometry data as exports; it need not become a new GLB for every colour/layout. Audit existing hand and register mesh names/material regions. Where tips, metal and lume are already separate, wire material controls. Where a tip or hollow lume boundary does not exist, update the Blender generator and regenerate only affected families with stable node IDs and tip/lume-region metadata. Outline lume may need actual channel geometry; a material tint cannot create a hollow luminous outline. Keep compact NH05 tip lengths unchanged. No new GLB may silently overwrite an established supplier-exact model with provisional geometry.

## 7. Phased implementation and acceptance gates

**Phase 0 — baseline and specification.** Complete deferred strap/typecheck/build/browser checks; capture current archetypes; fix any baseline regressions before redesign. Define supported movement/layout combinations and measured ring dimensions. Save an approval checkpoint. Deliver migration/schema spec and representative 42mm pilot, 34mm ladies and 46mm diver acceptance fixtures.

**Phase 1 — hybrid shell.** Top slider + numerical field, visual component cards and contextual inspector. Retain workflow rail, BOM, fits, versions, Undo and existing export actions. Gate: each thumbnail selects the same right-hand component; supplier case resize stays unverified; layout remains usable on laptop/small windows.

**Phase 2 — calibrated multicolour scale core.** Semantic roles/IDs, per-layer state, correct red indices, cream/ink defaults, per-target clipping and shared exporter. Gate: inner and outer log rows visible; rotation preserves index relationships; colour/geometry agree across Engineering, HD and export; no overlap or double-baked scale. Preset home position and red overrides restore correctly.

**Phase 3 — new aviation programs.** Decimal-hour custom chapter row, knots/MPH direct conversion, verified distance markers and fuel-rate calculations without excluded weight/volume markings. Gate: exact test vectors, reverse conversion, positive-input validation, zero/seam/wrap handling, HH:MM/decimal precision, and safe coexistence with slide-rule pair. Lock out overfull annuli rather than silently dropping critical information.

**Phase 4 — lume and hand regions.** Filled/outline/off, independent metal/lume/print/accent colours, red tips for main and register hands; targeted Blender work only where required. Gate: repeated colour/style changes both directions, no inherited finish, no change to physical lengths/bores; day/night appearance and outline/fill agree in both views.

**Phase 5 — complete visual and manufacturing audit.** Click every relevant left/right control; exercise single-click preview, double-click Apply, keyboard Apply, incompatibility/lock refusal, Undo/Redo, project reload, BOM Apply and archetype switching. Run full tests, typecheck, lint, build and diff check. Check 1:1 exports and font outlines, tiny text/ticks, colour legends and 34/42/46mm envelopes. Capture proof screenshots; document any provisional GLB/fit limitations. Commit/push only when requested.

Execution order is now the linked consolidated milestone plan: baseline, original-reference/typography inventory, shared state/math/artwork, individual branded presets, hybrid shell and fully wired Simplified controls, custom aviation, lume/GLBs, final acceptance. Preserve the existing simplified marking design as a third option; its optional writing/detail controls must work in both views and exports without moving calibrated graduations. Each milestone gets an independently reviewable checkpoint. This is not a claim that the pictured decorative scale is flight-calibrated.
