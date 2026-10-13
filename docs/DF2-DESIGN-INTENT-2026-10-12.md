# DF2 design intent checkpoint

Date: 12 October 2026. Implemented locally; no commit or push.

## Result

The Suppliers tab now starts with Design & fit intent. Choose Concept design or Build around selected case, preserve dimensions/appearance, and write style notes. Save preferences stores only versioned authored intent in canonical designConfig.designIntent; it marks the project dirty and uses existing Undo/Redo. Old projects retain their parts and use conservative defaults. Invalid preferences are rejected during assembly and .dial import/export.

Case measurements and package evidence are an expandable read-only section. A unique visible case is resolved through its actual catalogue identity. Exterior diameter never generates crystal, crown, lug or caseback measurements. Explicit legacy dimensions are assumed; supported captured legacy claims remain recorded but unreviewed. Missing data and unidentified stem datums remain unknown. New optional catalogue caseConstraints accepts validated exact-case evidence and preserves field sources, review and synthetic identity; it creates no supplier records. Invalid/mismatched evidence documents retain unknown interfaces. Package inclusion and fixed interfaces are independent.

Capture search brief copies the selected physical target, authored dimensions, style intent, preserve/change paths and canonical locks without changing assembly or sourcing. Content identity detects geometry, visibility, locks, intent and catalogue changes; it is not a security signature. Captures are local to the panel session and clear when leaving/remounting the panel. They are not saved project data. Capture can use unsaved preferences; Save preferences is separate. Actual matching/results belong to DF3 and current-state Apply/Cancel to DF4.

Supported targets: case, crystal, caseback, crown, dial, hands, chapter ring, inner/rotating bezel and strap. Unsupported decorative targets show a clear error. Snapshot permissions are intent, not executable arbitrary property paths; DF4 must resolve them, respect current locks and revalidate fit before Apply.

## Independent delivery and integration

Three workers delivered separate case adapters, intent/extraction/persistence, and panel UI. The lead integrated catalogue evidence typing, public exports, Suppliers mounting and the canonical dirty/history action; checked their work and the combined product. Existing dirty work was preserved. Filesystem checkpoint: outputs/df2-checkpoint-20261012T183847Z in the Codex workspace (72 files; captured after delegation began, not a pristine milestone start).

## Validation

- Full suite: 125 files / 1,144 tests passed, including 22 new DF2 checks.
- Lint and production build passed; existing chunk-size advisory remains.
- Browser: concept and selected-case evidence, deliberate Enter capture, current/stale preference status, saved notes and Undo restoration; desktop and 722 × 686 short-window layout checked. Close the overlaid component navigator before interacting with the right tray on narrow screens.
- Screenshots: outputs/df2-desktop-2026-10-12.png and outputs/df2-short-window-2026-10-12.png.
- Logs: outputs/df2-tests.log, df2-lint.log, df2-build.log. Diff whitespace check passed.
- No GLBs changed; separate VR roadmap remains deferred until DF7.

## Human screen-reader checks still required

1. In Suppliers, find Design & fit intent and announce expanded state.
2. Change Design approach and hear the selected mode; toggle both preserve checkboxes and read Style notes.
3. Expand Case measurements & package evidence with the keyboard; distinguish assumed, unknown, recorded, inclusion and fixed-interface wording.
4. Save preferences and hear confirmation; Undo restores saved intent. Capture and hear current/out-of-date status after changing a preference.
5. Select an unsupported decorative component and hear the capture error; verify short-window scrolling and focus with the component navigator closed.

Automated semantics and keyboard browser checks do not substitute for these human checks. Next milestone: DF3 fit-first matching and explainable aesthetic ranking. DF4 will add usable results and Apply.
