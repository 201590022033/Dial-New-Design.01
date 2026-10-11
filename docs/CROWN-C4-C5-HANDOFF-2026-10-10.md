# Crown C4 and C5 completion handoff

10 October 2026. User instruction: "Go C4 and c5". C4 and C5 presentation-concept scope are complete on top of published C0-C3 commit `b5c313bf95e1b47c68d8bee1412cac46cbd32122`. This slice remains local and uncommitted. C6/C7, supplier onboarding, purchases, contacts and scheduling activation are separate scope.

## C4 connected controls

The operating crown opens dedicated controls in both Options and Style: Shape, Closure/protection, Finish and Source/fit. Six shapes, explicit default restoration, unspecified/push-pull/screw-down concepts, inherited or independent crown finish and cap concept state are separate choices. Click previews; Apply, double-click and Enter use the same validated transition against current committed state. Cancel changes nothing. Physical/tray/style locks prevent Apply, including locks acquired after Preview. A stale preview cannot overwrite unrelated edits. Undo/Redo, versions and project reload preserve crown choices.

Finish overrides (polished steel, brushed steel, rose gold, matte black) survive shape and case-finish edits. Inherit-case follows the current case. Legacy data is adapted only when the user edits it; loading does not migrate existing crown geometry. Closure changes are explicitly visual approximations and retain movement/socket/tube/gasket evidence. They cannot establish a matched conversion or pressure rating.

The crown tray includes a front engineering detail projected from the same procedural mesh used by HD fallback, with identical dimensions and resolved finish. The existing main Engineering dial viewport is unchanged and still has no watch-side crown viewport. This detail makes the supported crown envelope inspectable; it does not constitute full C6 Engineering/HD placement acceptance.

## C4 commercial records and BOM

Exact case-offer package contents may identify included crown/tube/stem with drawing or supplier-statement evidence. Inferred/visual package contents do not suppress charges. An exact bundled crown is shown as included with its case, with cost accounted in the case row. Explicitly buying a separate replacement adds its own price and leaves the original case bundle cost intact. An unknown replacement remains unpriced. No new production bundle or supplier was onboarded: exact supplier/variant evidence gaps from C0 remain open.

Synthetic accounting examples (software fixtures, not supplier quotes):

| Selection | Case package | Separate crown | Known parts subtotal |
| --- | ---: | ---: | ---: |
| Use exact included crown | R500 | Included | R500 |
| Explicit priced replacement | R500 | R100 | R600 |
| Replacement without quote | R500 | Unknown | R500 plus unresolved crown cost |

Unknown South Africa shipping stays unknown. New capture snapshots store exact SKU when available, variant, native price/currency, checked-at time, sourced FX rate/time and tax/import assumptions. A new foreign-currency snapshot without its own FX evidence cannot borrow the old global rate. Legacy pricing retains its historical conversion behaviour. No fresh supplier/FX quotes or tax advice were generated in this slice.

Selected supplier records and package contents now survive .dial export/autosave/reload/import, saved versions and restore. Before this change runtime project loading reset all sourcing selections. Snapshot validation runs before hydration; malformed commercial data cannot partially replace the active project. Version restore replaces sourcing selections completely and can undo the previous quote snapshot. A supplier selection remains separate from engineering geometry and fit verification.

## C5 protected-cap concept

The generic cap/holder presentation is an additive `crown-cap-concept/v1` part field, separate from the physical C1 protection contract. The existing case-owned crown datum places it; no second crown angle or mirrored dial/date installation is introduced. The operating head remains the sole operating crown; the holder and cap have distinct scene names and ownership in render review metadata.

The cap is a hollow, closed-tip sleeve generated procedurally around the selected maximum head envelope. Its assumed radial/axial clearance is 1 mm and wall 0.6 mm in the exposed preset. The holder occupies local X -0.8 to -0.1 mm. Closed mode is transparent for review; open mode is an exploded axial presentation, not a simulated hinge or extraction control. The same geometry envelope is shown in the engineering detail. Procedural generation accommodates all six head dimensions without colour-specific or nominal-size GLBs; original C0/C3 case/crown binaries are unchanged.

Only head-versus-cap envelope clearance is tested. Case/guard/shroud, stem installation, gasket/sealing, holder attachment, threads, hinge, lever, waterproof rating and manufacturing tolerances are unqualified. Fixed guards and bezel locks are not advertised as cap locks. Changing case/starter clears the old holder concept while preserving an explicit operating-crown choice. Ordinary Crown Apply has no left-side relocation command; supported 9 o'clock movement/dial/calendar/hand-stack evidence remains a separate platform gate.

The concept is labelled in the controls, HD (including full-screen), suppliers, BOM and render-package review metadata. Still filenames identify the cap concept. BOM shows unknown cap/holder cost with no supplier selector or physical Apply action. A browser-found undefined-catalogue-ID bug initially admitted unrelated listings; the repair and regression test ensure concept and package-only rows have no such choices. No orderable cap hardware or universal retrofit is offered.

## Verification and evidence

- Full application suite: 104 files / 911 tests passed, including 27 new C4/C5 tests. Lint passed with zero warnings; production build including TypeScript passed. Existing dependency annotations, bundle-size and Three.js CommonJS warnings remain non-fatal.
- Tests cover cancellation, shared intent, stale previews, acquired locks, independent/inherited finish, physical evidence retention, explicit default restore, durable versions, exact source snapshots, malformed imports, included/separate/unknown costs, timestamped FX and destination-aware shipping.
- C5 tests inspect actual generated geometry bounds for all six head shapes, radial/axial head clearance, exploded separation, one head owner, wrong-owner/invalid persistence, 34/38/42 mm case-size independence, unrelated hand edits, hide/reveal and case-holder invalidation.
- Actual isolated localhost:3019 browser checks: preview/cancel, explicit Apply, Enter, double-click finish, acquired physical lock, Undo/Redo, version save/restore and reload. Shape, rose-gold finish and cap state survived reload. A case/starter switch cleared the old holder; explicit default restore selected the compact ladies crown. Front/side HD and engineering-detail screenshots were inspected. The final browser error log was empty.
- Evidence directory: `docs/research/crown-c4-c5-2026-10-10/`. Screenshots include generic onion open/closed, restored engineering detail, ladies34 open/closed front/side and repaired unpriced cap BOM. The manifest pins screenshots and changed source hashes. Temporary browser/server resources were cleaned up after acceptance.

## Continuation boundaries

Next full acceptance work is C6 after approved platform scope. Recheck all ten profiles/six starters, new/inherited/imported projects, 34/38/42 mm, shape/closure/finish transitions, actual case changes, hand/dial/strap/bezel independence, cap label persistence, exact bundle accounting and unknown procurement costs. C7 off-axis supplier/case integration remains unimplemented; do not represent 3.8/4/4.1/4.2h cases or a left-side conversion as qualified. Physical cap hardware requires a matched platform and external dimensional/installation evidence before adding ordering or physical Apply.
