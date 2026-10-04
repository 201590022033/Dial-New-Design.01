# Remaining focused menu repairs — 3 October 2026

This follow-up completes the NH05 data-source correction, legacy dimension/movement readouts, and Help documentation from the focused menu audit. Existing uncommitted colour, GLB, sourcing and menu repairs were preserved. No commit or push was made.

## Completed

- `compatibilityHelpers.ts`: prefer the visible midcase over lugs; resolve selected-part engineering properties and catalogue interfaces.
- `movementCaseRule.ts`, `caseDialRule.ts`, `chapterRingCaseRule.ts`, `crystalCaseRule.ts`, `bezelCaseRule.ts`: use the selected case interfaces. NH05 no longer inherits NH35 cavity/rehaut defaults. Missing NH05 shoulder/rehaut data stays unknown.
- `boundaryResolver.ts`: NH05 movement envelope and centre opening use the existing TMI reference record rather than NH35 defaults.
- `movementHandsRule.ts`, `handsClearanceRule.ts`: inspect visible hands, selected bore specifications and actual central-hand reach. Unknown central hand fittings are reported rather than skipped. NH05 axial stack requirement uses the published Type M reference.
- `defaultBuilds.ts`: fresh ladies starters no longer retain NH35 catalogue IDs for minute/seconds hands. Supplier fitting measurements remain unverified.
- `compatibilityEngine.ts`: draft/AI-extracted selections remain unknown after Apply, rather than losing their evidence warning.
- `applyCatalogueVisualSelection.ts`: replacements clear inherited engineering metadata and stale parametric geometry/provenance.
- `DetailsTab.tsx`: evaluate the live assembly rather than substituting a nominal catalogue candidate; clearly distinguish design dimensions from supplier measurements.
- `dateWindowMovementRule.ts`: unrelated candidate notes such as a 0.656 mm hand fitting no longer imply a six-o’clock date window.
- `RightInspector.tsx`, `storeSync.ts`, `projectStore.ts`, `ProjectWorkflowDialog.tsx`: geometry-derived band diameters and movement recommendations follow the active assembly. Project movement is an explicit read-only calibre readout, not an ineffective second movement selector. User-authored notes are preserved.
- `helpDocs.ts`, `HelpCenter.tsx`: all 29 topics contain practical instructions and explicit limitations, with scrollable navigation and labelled Close buttons.
- `remainingMenuRepair.test.tsx`: five regressions for NH05 interfaces, edited dimensions, movement switching, Help coverage/link integrity and false date-position parsing.
- `physicalCompatibilityPhase5.test.ts`: corrected the legacy false-green expectation. Default presentation assembly has an overlong central hand for the usable aperture and draft case data; it must not be certified green.

## Verification

- Full automated suite: **405 tests passed in 61 files**.
- Typecheck, ESLint, production build and `git diff --check` passed.
- Existing non-failing bundle-size, third-party annotation and Three.js deprecation warnings remain.
- Computer-use browser verification: Help opens and shows the new Movement Integration instructions; Project Information shows NH05; Advanced shows the current 34 mm case and 8.82 mm minute hand.
- Browser: changing minute-hand reach to 15 mm produces a live 15.0 mm clearance failure in Details rather than checking its nominal 13.5 mm catalogue version. The original 8.82 mm design was restored before further source updates.
- Browser Visual smoke check: the preserved silver dial, rose-gold case/hands/markers and diamond bezel load. No new GLBs were generated in this follow-up.

## Remaining limitations — not concealed as completed features

- The user's preserved older ladies design still contains a selected NH35 minute-hand catalogue reference. Its NH05 bore mismatch is real relative to that catalogue ID; changing displayed length or colour does not verify a new fitting. Fresh ladies starters now use unverified NH05 hand-set references instead. Supplier bore, tube-height and seating evidence is still needed.
- Case/rehaut/shoulder and supplier-exact compatibility are not certified by the visual GLB or matching nominal diameters. Draft parts and missing interfaces remain unknown.
- The disabled full measured CAD inspection overlays and a released fabrication-export workflow are separate feature work, not completed by this focused data/UI repair.
- Import/export downloads, supplier checkout prices/shipping, every asset variant and full hand/subdial visual permutations were not re-audited end to end in this pass.

All repository changes remain local and uncommitted. The development dashboard is available at http://127.0.0.1:3000/.
