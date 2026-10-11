# Case-size slider reconciliation — 11 October 2026

## One implementation

The user requested reconciliation and removal of unnecessary material. Keep the local D1–D2 implementation as the sole implementation in Dial Designer, on top of the published Crown C4–C7 checkpoint (0d710ad).

The earlier effort originated in “Add Dial References Hover” and cloud task 01a126af-f0f7-707a-94ae-e6d1292e7063. Its branch feat/case-size-reference-popups ended at 230fc10f2ca216eb4bf2dd14c67e75bed53ee84c, but publication failed and its bundle never reached the local repository. The local chat “Commit and push Dial Designer update” then implemented D1–D2 afresh. Inspection found one local CaseDiameterControl, one toolbar mount, one reference dataset and no imported cloud feature branch or duplicate reference card. No second local implementation needs deletion. Do not subsequently import the obsolete cloud bundle over this implementation.

## Kept and cleaned

- Keep the wider 20–60 mm slider with 0.1 mm precision, ten 34–52 mm reference ticks, one responsive popup and original schematic thumbnails.
- Keep exact live case/midcase matching, including decimal and off-axis shroud sizes, separately from comparison watches, compatibility and stock.
- Keep the existing resize action, lock/pending-preview guards, stale-drag rejection and Undo behavior. Browsing references does not select or resize supplier parts.
- Remove unused photo URL/alt fields from the reference contract. The UI renders schematics only; the external link is labelled “Official watch reference”.
- Retire the bundle-import path and stale publication/approval instructions. Retain the research, tests and browser screenshots as useful evidence rather than delete them.

The commit containing this reconciliation records the consolidated slider work separately from the crown checkpoint. No crown implementation is removed or duplicated. Earlier Crown publication notes about excluded/local slider changes describe the preceding crown-only commit, not the reconciled state.

## Still outstanding

D3: an explicit filtered catalogue navigation action from the size guide, using the existing case Preview/Apply workflow. The current guide lists matching records and explains the Parts → Case options route; it does not automatically swap parts or add supplier sizes.

D4: physical touchscreen, screen reader, 200% zoom, native pointer cancellation and the remaining modal-layer/Engineering/HD transitions. The previous browser checks are preserved in CASE-DIAMETER-D1-D2-ACCEPTANCE-2026-10-10.md; this cleanup does not claim those remaining checks passed.

The reference sizes are comparison examples, not ten newly orderable case products. Manufacturer photographs and the original cloud screenshot are not runtime dependencies. No scheduler changes are included.

## Reconciliation validation

Fresh combined checks on 11 October: 108 test files / 1,037 tests passed; ESLint and production build including TypeScript compilation passed. Whitespace checks passed. Existing non-fatal dependency annotation and bundle-size warnings remain. The prior browser acceptance is retained; the only UI copy change in this reconciliation is the external reference link label, and no new browser acceptance is claimed.
