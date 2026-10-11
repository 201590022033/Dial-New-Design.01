# C7 off-axis platform acceptance

10 October 2026, Africa/Johannesburg. User authority: “So can we do c7”, reinforced by “please fcomplete”. C7A–E implementation and the subsequent C6 software regression gate are complete **for disclosed provisional presentation**. Exact variant confirmation and measured hardware qualification remain external evidence gates. No commit/push, supplier contact, purchase or scheduling action was taken. C4–C7 remain local above published C0–C3 HEAD `b5c313bf95e1b47c68d8bee1412cac46cbd32122`.

## Supported and unqualified scope

| Platform | Supplier envelope | Presentation scope | Evidence limitations |
| --- | --- | --- | --- |
| Existing NMK920 identity, `cat-case-namoki-nmk920-tuna-47` | 47 mm shroud, 46.5 mm lug-to-lug, 11.3 mm without caseback, 22 mm lugs | NH35 software preview; one generic supplied-head envelope; approximate 30° clockwise datum | Current SKU/variant linkage and exact angle unconfirmed. Old envelope sketch cannot establish current hidden interfaces. |
| Tandorio black, `cat-case-tandorio-tuna-465-black` | 46.5 mm shroud, 15.4 mm stated height, 22 mm lugs, 27–29 mm dial claim | Supplier-listed NH34/NH35/NH36/NH38 families, separately checked; supplier “4 o’clock” represented provisionally at 30° | Installation, numeric angle tolerance and hidden interfaces unmeasured; current variant metadata/stock conflict unresolved. |

Both records persist `off-axis-platform/v1`, exact case owner, retained C0 variant IDs/SKUs, `identityStatus: requires-confirmation` and `physicalFit: unqualified`. Midcase, bezel OD/ID, dial/crystal seats and caseback interfaces have individual unknown evidence. Movement rotation, dial rotation, calendar aperture/date wheel, stem height, spacer, dial feet and loading path are independent unknown fields. Unsupported software movement families and visible 22 mm strap mismatches refuse Apply; Tandorio's published dial range is checked. No dial rotation conceals an installation gap. Generic NH35 physical-seat/3h fallbacks cannot turn these cases' interface checks green.

## Source observations

Primary pages rechecked 10 October; snapshot time `2026-10-10T10:27:19Z`:

- [Namoki NMK920 brushed](https://www.namokimods.com/products/nmk920-tuna-skx007-srpd-watch-case-brushed-finish): SGD195, sold out, crown and bezel included. Retained variant `40465538744495`, C0 SKU `NMK920-PL`, old repository alias `NMK920-BRUSHED`; exact current linkage requires confirmation.
- [Tandorio Tuna 46.5](https://tandoriowatch.com/products/tuna-can-watch-case-46-5mm): USD60.90, retained black variant `50602694836509`, SKU `1005010072446013-black`. Sold-out page versus prior API stock remains unresolved. No discount inferred from an inconsistent compare-at price.
- Public variant JSON requests returned HTTP403; this is explicitly recorded, not treated as fresh identity verification. No supplier interface drawing was recovered in this slice; C0 drawing limitations remain.
- [Frankfurter FX observation](https://api.frankfurter.dev/v1/latest?base=USD&symbols=ZAR,SGD), rate date 9 October, retrieved 10 October: USD/ZAR16.5331 and USD/SGD1.2804. Archived `fx-usd.json`; indicative case-only conversions R2,517.93 / R1,006.87. Shipping to ZA, duties/import fees and delivered totals remain unknown. Existing unrelated component estimates retain their own older provenance.

These are bounded, unverified catalogue/source records with ordering disabled. Neither pricing nor catalogue visibility is a physical-fit certificate.

## Model, transitions and accounting

`offAxisLayouts.json` is shared by TypeScript and the Blender generator. New GLBs retain original C0/C3 assets for legacy projects. Each binary has eight meshes: midcase, floor, four lugs, shroud with cutout, and a structural tube. There is no embedded operating head. The one assembly crown supplies the removable head at the same datum. Binary vertex checks verify shroud radius/height, cutout angle, tube endpoint/collinearity and ordinary-head render clearance. Render assumptions include 42 mm body, 34.5 mm opening, 1.8 mm tube diameter, zero presentation stem height and Tandorio 49 mm lug-to-lug. These do not become measured dimensions; guards/sealing/pressure performance are unqualified.

Case Apply replays against current state, preserves explicit crown shape/finish and surrounding appearance, clears cap/holder concept, old crown offsets, reference seat anchors, fit certificates and stale changed-part procurement choices. Ordinary/reference returns clear the off-axis contract. Locks include the operating crown and bundled bezel transition. The case projection uses the same anchor as HD; main Engineering remains a dial artwork view, with the separate case/crown projection in the tray. The 47/46.5 mm shroud never supplies the bezel marking annulus.

NMK920's default bezel is an explicitly generic included-envelope identity, retaining appearance while suppressing the default separate charge. Included crown/bezel are charged once in the case price. Deliberate separate replacements add their own price or remain unpriced, while the original included package remains visible at zero additional charge. Tandorio's included crown is treated likewise; bezel inclusion is not inferred. Supplier selection alone does not mutate geometry. Render packages identify the actual off-axis platform and its unqualified status rather than the NMK901 reference kit.

## Acceptance evidence and repairs

`src/tests/offAxisCrownPlatform.test.tsx`: 25 tests, including exact identities, independent unknown installation evidence, invalid import/ownership refusal, 3h/3.8h/4h/4.1h/4.2h transforms, actual GLB vertices, one head, strap/movement/dial refusals, stale Apply, locks/cancel, reference cleanup, source invalidation, Undo/Redo, durable versions/import, FX/shipping, and included/replacement bezel/crown accounting. Existing inventory tests now expect the two added assets and explicitly downgraded NMK920 drawing provenance.

Actual isolated browser at localhost:3021: preview/cancel, Enter and double-click Apply, 22 mm strap, both case dimensions/default heads, front and side HD, matching tray projection, persistent fullscreen warning, supplier selection, BOM/FX/unknown shipping, case lock refusal, explicit onion/rose-gold preservation across repeated swaps, header Undo/Redo, save/version/reload/restore with exact supplier selection, and a real PNG/project/manifest package export. Browser error log empty at review. Screenshot and source/asset hashes are in `docs/research/crown-c7-2026-10-10/manifest.json`. The review package contains an actual saved NMK920 fixture and render manifest; rendered fit remains provisional.

Repaired during acceptance: missing catalogue-store strap/package wiring; collapsed projection height; legacy physical fallback certification; stale reference evidence/anchors; wrong reference return identity; misleading reference-platform export metadata; included bezel double charging. Focused retests and final full suite passed. No unresolved advertised software defect remains within this presentation scope. Existing hand-clearance failures remain visible as BUILD RED in the test starter and are not relabelled compatible by a case swap.

Final fresh verification: **106 test files / 965 tests passed**, including the C6 1,620 ordinary-crown combinations, 216 cap states and all ten profiles; lint, TypeScript production build, separate typecheck and whitespace/diff checks passed. Existing dependency annotation, Three.js CommonJS and large-bundle warnings remain non-fatal. The C6 six-starter screenshot matrix is retained as prior visual evidence; this slice adds actual two-case views and reruns its automated matrix, not a claim to have recaptured every C6 screenshot.

After acceptance, copying the exported ZIP into the watched research folder triggered a Windows EBUSY development-server watcher error. The archive was moved to the projectless outputs folder (`crown-c7-review-package.zip`); extracted fixture/manifest/PNG remain in research. The development server was restarted and checked before cleanup. Application checks and captured browser acceptance preceded this archive-copy issue.

Exclusions: measured mating fit, stem trimming/thread qualification, water resistance, supplier-exact geometry, confirmed current variants/stock, SA delivered quote, orderable cap hardware, multiple operating heads, top-loading KARAJAN or left-side conversion. Publishing requires fresh user authorization; scheduler remains paused.
