# Case-diameter D1-D2 handoff

Historical acceptance evidence from 10 October. The current consolidated implementation and publication status are recorded in [CASE-DIAMETER-RECONCILIATION-2026-10-11.md](CASE-DIAMETER-RECONCILIATION-2026-10-11.md). Earlier local/unpublished statements below describe that original handoff.

## Delivered scope

Status: D1-D2 implementation complete; autonomous follow-up acceptance performed after the user's “Do d1 d2 autonomously” instruction. This follow-up found no additional source repair necessary and did not expand into D3. Remaining device/tool-specific checks below are disclosed, not claimed as passed.

Fresh implementation, no bundle imported. Wider responsive existing slider retains 20-60 mm and 0.1 mm precision. Ten 34-52 mm comparison ticks and one vertical card below the control. Grey unmatched references retain readable concise text and a schematic thumbnail. Keyboard focus, pointer dragging and explicit Size guide/select browsing expose the same information. Browsing never intentionally resizes or chooses a supplier part. D3 catalogue filtering/navigation and Preview/Apply wiring are not implemented; the card explains the existing Parts → Case options route.

Live exact-size discovery accepts only case/midcase kinds, preserves decimal sizes, deduplicates IDs and excludes crystals/casebacks/lugs. A catalogue match is not fit/stock certification. Shroud envelopes are labelled separately. Selected physical case and committed preview are displayed separately. Locks and pending preview guard mutation but not reference browsing. Drag commits through the existing action; stale assembly identity rejects a late drag. Pointer cancellation restores local draft.

Three agents supported domain implementation, independent tests/review and official product-shot research. The computer-use skill guided real-browser acceptance. See [photography sources](research/case-diameter-2026-10-10/PHOTO-SOURCES.md): five official image candidates found, but permission not established; no photos copied or hotlinked. Original code-native schematic thumbnails are deliberately labelled illustrative.

## Browser checks actually performed

Local Vite app, Codex browser, 10 October 2026:

- 1280×720: slider 640 px wide; popup 288 px wide below anchor, bounded within viewport, scrollable; toolbar exports/Undo remain accessible through wrapping.
- 375×812 and 320×640: card stays inside viewport with internal scrolling. At 320, card x≈16, width 288, bottom 628. The wider app's existing dense mobile workspace/header layout is not redesigned here.
- 1280×420: popup bottom 408, below control, no off-screen card bottom.
- Grey 36 mm reference/selector leaves committed preview 42 and selected physical case 40 unchanged; branded references are not selectable products.
- Number 40.2 + Set: exact 40.2 pilot record discovered, separately labelled 40 mm comparison; one Undo restores 42.
- Keyboard ArrowRight: 42→42.1; Escape closes popup without stealing range focus; one Undo restores 42.
- Real pointer drag: 42→46.1, with explicit 46 comparison/not-exact caption; one Undo restores 42. Physical case remains 40.
- Select Midcase then Lock: slider disabled while Size guide remains enabled and readable. Unlock restored after test.
- Close and outside click dismissal exercised; no case purchase, catalogue Apply or preview replacement performed.
- Opening Settings dismisses the reference card; Project Workflow stays unobstructed. Closed Settings and restored the guide afterwards. This is one layering check, not the full modal matrix.
- Follow-up: 390×844, 768×1024 and 1920×1080 visually inspected, with popup and control inside the viewport and document scroll width equal to viewport width. Combined with the preceding checks, all six planned width classes have been visually inspected.
- Follow-up: keyboard End/Home reached 60/20 mm with “Custom case preview”, not an unrelated branded comparison; one Undo after each restored 42 mm.
- Follow-up: native pointer drag released below/outside the slider at y190 committed 46.1 mm through pointer capture; one Undo restored 42 mm.
- Follow-up: used the browser's native drag pointer movement to enter the 36 mm tick from a blank header area without activating it, then traversed into the card. Moved keyboard focus outside while the pointer remained over the card: it stayed open beyond the close delay. Moving both pointer and focus outside dismissed it. This tests actual entry/exit handlers via available pointer movement; a physical free-hover/touchscreen session is still not claimed.

Browser preview restored to 42 mm and case unlocked. Temporary viewport overrides reset before handoff. Screenshots are captured app UI, not manufacturer assets: [desktop grey reference](research/case-diameter-2026-10-10/desktop-grey-reference.jpg), [mobile reference](research/case-diameter-2026-10-10/mobile-grey-reference.jpg).

Follow-up evidence: [autonomous D1-D2 reference](research/case-diameter-2026-10-10/autonomous-d1-d2-reference.jpg). The browser is left on the readable grey 36 mm comparison, while committed preview remains 42 mm and selected physical case remains 40 mm.

## Automated checks

Final full suite: **108 files / 1,037 tests passed**. Feature suites contain 95 tests (28 data, 42 geometry/interaction-guard/SSR UI, 25 toolbar), including stale/current-identity and hover/focus dismissal assertions. Typecheck, ESLint, production build (`tsc -b && vite build`) and `git diff --check` passed. New task-owned text files were also checked with no-index whitespace checks. Existing non-blocking warnings remain: Three CommonJS deprecation, Zod pure-annotation placement and a large production chunk.

UI tests exercise pure geometry, markup and guards, not synthetic claims of real pointer/touch event coverage. Bounds tested deterministically at 320/375/390/768/1280/1920 widths and very short viewports. Exact discovery, locks, pending previews, precision, no-op browsing, selected-part preservation and undo guards covered. Independent review caught a focus-leaves/hover-remains dismissal edge: the close timer now rechecks both pointer and focus, plus pin/drag state. Five additional pure predicate assertions cover those guards; continuous real hover traversal remains a D4 acceptance limit.

## Remaining acceptance limits

Not claiming full D4 acceptance: physical touchscreen, screen reader, 200% browser zoom, native pointer-cancel, unrestricted free-hover and the full modal-layer matrix remain to inspect. Native release-outside and pointer entry/exit traversal have now been checked as described above. The browser API has no documented free-hover, zoom or pointer-cancel controls; narrower viewport checks are not represented as browser zoom. Engineering/HD case-replacement transitions belong to D3-D4 and were not performed. Pending preview guard is covered in tests, not a destructive live build transition. No new GLBs are needed for this informational UI. No manufacturer product photos bundled pending asset permission.

## Task-owned files and publication

- `src/components/layout/CaseDiameterControl.tsx`, `toolbarActions.ts`, `caseDiameterReferenceLayout.ts`, `caseDiameterReferences.css`, `CaseSizeReferenceThumbnail.tsx`
- `src/domain/catalogue/caseSizeReferences.ts`
- `src/tests/caseSizeReferences.test.ts`, `caseDiameterReferenceUI.test.tsx`, `toolbarActions.test.ts`
- Plan, this handoff and research/evidence directory.

Existing dirty crown/off-axis work preserved. Nothing staged, committed or pushed. Review D1-D2 before approving D3-D4 or publication.

Run: `npm install` if dependencies are missing, then `npm run dev -- --host 127.0.0.1`; open http://127.0.0.1:3000. The acceptance dev server is already running at handoff.
