# Milestone 0 baseline checkpoint

7 October 2026. Repository: `Dial-New-Design.01`, branch `main`, baseline HEAD `2fc7038c6fac7f2891c551db39ad181195465584`.

Status: baseline audit complete, with three scoped repairs verified and known limitations recorded below. This gate establishes a reproducible baseline, not redesign or original-artwork acceptance. No redesign or new scale artwork has begun. No commit or push is authorised in this milestone.

## Scoped regression repair

The first baseline run (before this repair) passed 436 of 437 tests. `archetypeInteractions` failed because the pilot's default leather strap palette changed from `#4b2d1c` to the generic leather `#704536`.

Cause: archetype selection writes `strapStyleId`, but the visual adapter treated any value in that field as a user override. The adapter now uses the archetype palette whenever the effective style matches that archetype's default. Different styles still use their distinct material/colour profiles; returning to the default restores its original palette.

Files: `src/visual3d/watchAssemblyToVisualModel.ts`, `src/tests/strapOptionsApply.test.ts`. Six new parameterised cases cover every gallery archetype, switching away/back, material-colour agreement, asset identity and canonical save/load. Existing small-case strap switching and guarded Apply tests remain intact.

The live audit found two more narrow defects:

- Pilot straight lettering: `generateTypographyLayout` emitted every character at the same polar anchor because the straight/horizontal angle span is zero. These layouts now emit one shaped text run; arc lettering remains unchanged. Two regression cases preserve the full caption and its existing position. Files: `src/domain/generators/typographyEngine.ts`, `src/tests/designEngines.test.ts`. Engineering now visibly renders `FLIEGER` instead of stacked glyphs. This does not complete font-metric, spacing, alignment or original scale typography work.
- Open/Import input cleanup: both asynchronous handlers accessed React's `event.currentTarget` after awaiting the file read, when it was null. `src/components/layout/TopToolbar.tsx` captures the input synchronously. Browser Import, Open and repeated Import restored the NH05 project and cleared the input without a new console error. No new test dependencies were added.

## Recorded verification

| Check | Result |
| --- | --- |
| Focused design/strap/archetype tests | 27 passed |
| Full test suite | 445 passed across 67 files after final application edit |
| Typecheck | Passed |
| Lint | Passed |
| Production build | Passed; final Vite build completed in 12.62s after TypeScript project build |
| Git whitespace check | Passed; only normal LF-to-CRLF notices |
| BOM Apply, save/load, Undo, geometry/compatibility regressions | Existing automated tests passed in full suite; focused live checks below also completed |
| Live Engineering/HD screenshots and option interaction audit | Recorded for ladies dress, pilot, diver and chronograph; Advanced captured for chronograph |

Existing Three.js CommonJS deprecation notices were emitted by tests. No dependency changes were made.
The build also reports existing Zod annotation and large-chunk warnings; it completed successfully. These do not establish a live visual pass.

## Live acceptance evidence

Computer-use skill: tested the localhost dashboard through the Codex in-app browser, tab 2. The earlier native browser restriction was not bypassed. No supplier sites, purchases or remote writes were involved.

- Ladies dress HD: Leather -> Rubber -> Leather changed the visible strap and selected control; Undo restored Rubber, Redo restored Leather.
- Dial Options: a single click on Black Sunburst left the committed Tandorio White dial heading unchanged and showed Live Preview Active. Double-click committed Black Sunburst and updated the heading/cost. Enter committed the original Tandorio White dial again.
- Lock: locking the dial kept the White heading, disabled Apply and showed the explicit locked-component explanation when Black was double-clicked. Cancelled the preview and unlocked it afterwards.
- Incompatible: the NH35 Mercedes set exceeded the compact usable dial radius by 1.60 mm; double-click did not change the NH05 hand heading and showed disabled Apply plus a refusal alert.
- BOM: chose the rose-gold Tandorio NH05 hand listing, applied it, and observed the success status, changed cost and right-side NH05 hand heading. Unknown supplier fit was retained, not certified.
- Starter checks: loaded Pilot, Diver and Chronograph, recording their Engineering and HD renders. Each Load added a pre-starter backup. Their presentation-only labels and red compatibility results remained visible; these are not orderable/approved kits.
- Project round trip: the initial Export JSON did create `C:/Users/Deon/Downloads/untitled-dial-project (1).json` (50,088 bytes, 15:46:58 SAST), although the browser download waiter timed out. That file, not an unconfirmed download, is the durable pre-audit backup. Restored it through Import; reload retained the NH05 project and R3,655 displayed estimate. After the cleanup fix, tested Import, Open and repeat Import of this same file. Both file input values were empty and no new console error followed. The old pre-fix error remains in the browser's historical log.

Screenshots are stored outside the repository at `C:/Users/Deon/Documents/Codex/2026-09-25/referenced-chatgpt-conversation-this-is-an/milestone-0-evidence/`: ladies-dress Engineering/HD; Rubber and Leather-return HD; pilot Engineering/HD and repaired-caption Engineering; diver Engineering/HD; chronograph Engineering/HD/Advanced; restored-ladies-project HD. The restored original project is left in the audit tab. User-owned browser tabs and the existing development server were not closed.

## Known baseline limitations / carry-forward

- Pale markers and hands are difficult to read on pale dials. This was observed in both views; original brand colours and reference typography are not implemented. Carry into state/contrast and hybrid-inspector work, not a silent recolour of the user's saved design.
- Dark scale marks can disappear on a black bezel. The pre-audit export records scale colour `#111827`; `scaleStore.applyScaleProgram` explicitly preserves colour/font/size across archetype changes independently of the fresh assembly. This explains the captured low-contrast scale rows. Milestone 2 must consolidate per-band persisted state, and Milestone 4 must expose effective colours clearly. The inner pilot row exists in the SVG text inventory and HD rendering, but no full-circumference original-fidelity comparison was performed in this milestone.
- Engineering is a schematic dial/overlay view, not the HD physical case render. No crescent artifact was apparent in these baseline captures, but this is not exhaustive camera-angle or target-envelope visual certification.
- `savedVersions` is session-only in `configuratorUIStore`; reload/HMR clears its cards. The created in-app backup was lost on the typography hot reload, but the exported project was preserved and restored successfully. Do not rely on filmstrip cards for overnight durability. Record a version-persistence repair separately before promising durable filmstrip checkpoints.
- Browser logs contain existing Three.js clock/shadow-map deprecation and shader precision warnings. No dependency or material pipeline changes were made. The Import error identified above was repaired and retested.
- No PDFs, supplier drawings, new GLBs, original-colour inventories or redesigned scale artwork were created in Milestone 0. Those retain their separate gates.

## Restart

Read the overarching milestone plan and current Git diff. Milestone 1 (reference/typography inventory) is next when explicitly requested. Preserve the three pre-existing uncommitted planning documents. Five application/test files and this checkpoint are uncommitted. Start no new major milestone solely to consume allowance. No recurring schedule or automatic token-reset continuation was created.
