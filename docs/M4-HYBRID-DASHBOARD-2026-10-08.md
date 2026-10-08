# Milestone 4 — hybrid dashboard checkpoint

Completed 8 October 2026. Implementation is local and uncommitted; baseline remains published `3b60e98`. No Milestone 5/6 work, supplier contacts, purchases or new GLBs were undertaken.

## Implemented

- Top diameter slider and typed 20–60 mm preview field, with explicit warning that supplier parts and hands are not resized; shared SVG/DXF/PDF shortcuts.
- Assembly-derived component thumbnails, physical dimensions, visibility/lock controls, selected context and ring highlight. Selecting a component no longer retargets an existing scale or causes a render loop.
- Contextual Style inspector, including stale legacy selection fallback, matte/sunburst/brushed previews, brushed direction, shared-grain close-up and validated/copyable six-digit hex colours. Unsupported guilloché/mirror dial finishes remain explicitly disabled.
- Shared Engineering/HD dial colour and grain/roughness configuration. Reference scale palettes remain independent of dashboard/theme colours.
- Persisted Simplified numeral detail, independent ring writing controls and reversible adaptive omission; calibrated graduations do not move. Unsupported annotations have explanations rather than working-looking placeholders.
- Wrapped laptop controls, compact narrow view controls, responsive inspector tabs and measured/sticky-header BOM popovers. Root overflow clipping prevents focus from scrolling the entire editor away from its toolbar.
- Export inputs use authoritative physical assembly dimensions. Disabled malformed scales cannot block exports; enabled invalid geometry still refuses export. Dynamic XML attributes/text/metadata are escaped, repairing the actual browser PDF failure caused by quoted font-family names.

## Changed file groups

`src/app/App.tsx`, layout `TopToolbar`, `CaseDiameterControl`, `toolbarActions`, `CentreCanvas`; configurator navigator/thumbnail/header/actions, `RightTray`, `RightTraySwitch`, `CostBomSummary`, reference/Simplified panels and Style/hex/finish components; domain navigator, aviation types/generator and texture engine; renderer SVG/types/zoom; design store; scale/export services; visual adapter, scene, GLB materials and shared finish texture; dashboard CSS. Focused regression tests cover these changes. Four browser screenshots are stored in `docs/research/slide-rules/acceptance/m4-*.jpg`.

## Verification

- Full suite: **652 tests / 86 files pass**.
- Typecheck and strict build TypeScript pass; full lint passes.
- Production build passes. Existing large-chunk/Zod annotation warnings and Three.js test deprecation remain non-blocking.
- Whitespace diff check passes.
- Browser acceptance covered desktop 1440×1000, laptop 1024×768 and narrow 390×844; Engineering, Advanced and HD; component selection and locks; valid/invalid/copy hex; finish direction; 34/46 mm and Undo; Simplified writing/detail; actual physical target menus; BOM open/close; all three export completion messages and invalid-fit refusal.
- Computer-use audit found real selection, responsive/focus and PDF failures; the PDF skill guided export checking. The repaired PDF reaches “PDF export prepared” in the live browser without suppressing errors.

## Honest limits

Browser blob download events were not exposed reliably by the in-app browser, so exported files were not retained and independently opened/raster-inspected; UI completion and export regressions are verified, not a certified laser/manufacturing proof. Existing manufacturing warnings remain visible.

HD grain is an illustrative material preview and subtle under sapphire, not a certified factory finish or exact UV reproduction. The loaded pilot project retains older derived Engineering-band/marker alignment inconsistencies (some hour labels can be obscured), and pale markers have weak contrast on pale dials. These are not claimed solved by the dashboard milestone. Physical fit/procurement warnings remain valid. Session-only Versions durability was not expanded. Fonts/reference-inspired artwork are substitutes, not claims of factory reproduction.

Next separately authorised milestone: M5 custom decimal-hour and knots/statute-MPH layers/calculators. Commit/push this checkpoint only when requested.
