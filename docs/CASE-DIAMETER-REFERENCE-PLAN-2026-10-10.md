# Wider case-diameter references - research and approval plan

Historical research plan. The current implementation and reconciliation are recorded in [CASE-DIAMETER-RECONCILIATION-2026-10-11.md](CASE-DIAMETER-RECONCILIATION-2026-10-11.md). Do not import the earlier cloud bundle or replay completed D1–D2. Research and future milestones below are retained for reference; old approval/publication instructions are superseded by the current user instruction and reconciliation.

Prepared 10 October 2026, Africa/Johannesburg. Repository: `201590022033/Dial-New-Design.01`.

## Authority and scope

The existing slider was enhanced locally after the cloud bundle could not be found. The user approved D1–D2 and subsequently requested reconciliation and removal of unnecessary material on 11 October. See [D1-D2 acceptance](CASE-DIAMETER-D1-D2-ACCEPTANCE-2026-10-10.md) and the current reconciliation. D3 catalogue navigation/Apply integration and the remaining D4 checks are not implemented by this cleanup.

Crown/off-axis C4–C7 is published at 0d710ad. The slider uses those current catalogue records and the existing resizing action. No applicable AGENTS.md was found in the repository or checked ancestor paths during the original audit.

## Recommended design

- Keep the full 20-60 mm range and 0.1 mm precision, number input and explicit Set action. Make the desktop control substantially wider through responsive toolbar layout, not a fixed width that pushes Undo/exports offscreen. Proposed target: roughly 520-640 px when space permits; full available row on narrow screens.
- Mark the photo's ten reference sizes: 34, 36, 38, 40, 42, 44, 46, 48, 50, 52 mm. Position ticks on the actual 20-60 scale, not an expanded 34-52 subscale. Show fewer printed labels on narrow widths; exact values remain accessible. Decimal catalogue sizes such as 40.2/43.8/46.5 get distinct discovery labels rather than being rounded to integer reference ticks.
- Show ONE compact vertical reference card BELOW the slider, with thumbnail at top, size/model label, one descriptive sentence, availability explanation, and an explicit catalogue action. Do not display ten expanded cards across the toolbar. Proposed card width 240-300 px, constrained to the viewport with internal scrolling when necessary.
- Hovering a reference opens its card without changing diameter. Focusing a reference offers the same information; an explicitly labelled activation may set that preview size through the existing action. Dragging/focusing the slider shows the draft value and a clearly labelled comparison example, without snapping to reference ticks. At 40.2 mm, distinguish 'Current preview 40.2 mm' from '40 mm comparison example'. Outside 34-52, show the actual value and a neutral thumbnail, not a misleading distant reference.
- Hover, focus, touch and reference browsing NEVER change assembly, current selection, sourcing, modes, preview state or undo history. Touch gets an explicit discoverable reference toggle; tap should not accidentally resize. Escape, Close and outside press dismiss the panel. Pointer/focus moving from anchor into panel must keep it open.
- Keep reference browsing available for locked cases; disable only mutation controls and explain the lock. Do not grey the descriptive sentence into unreadability. Use a muted thumbnail/marker plus explicit 'Reference only - no catalogue case at this size' text.

## Two independent kinds of availability

1. **The pictured watch:** a size/style comparison, not a selectable supplier component. A Rolex/Omega image does not become selectable because a same-size generic case exists. Exact chart model identification remains separate from maker specification verification.
2. **Cases in our catalogue:** derive matches from the live catalogue store, using explicit case/midcase kinds and numeric nominal size. Show 'View N catalogue cases' only for actual matches; review status, compatibility, stock, price and GLB readiness remain separate badges/reasons.

Grey reference sizes with no matching case records, while retaining their text/image and allowing ordinary custom preview sizing throughout 20-60 mm. A matching size is discovery, never a guarantee of fit, manufacturing support or stock. Do not disable arbitrary preview diameters merely because no supplier offers them.

## Research findings: the social chart is illustrative, not authoritative

Three read-only agents audited application contracts and verified official manufacturer sources for the ten reference sizes. The references below establish an example at a size, NOT identity of the exact photograph. All concise copy is editorial size/style description, not a guaranteed wrist-fit recommendation. Case width is not dial/artwork diameter; crown/shroud conventions must be disclosed where relevant. No prices or new supplier onboarding are part of this feature.

| Size | Research-safe reference choice | Concise candidate sentence | Evidence / uncertainty |
| --- | --- | --- | --- |
| 34 | Generic compact dress reference, recommended | Compact dress-watch proportions with a restrained, classical look. | Chart's Tissot Le Locle 34 not verified. [T006.407.16.033.00](https://www.tissotwatches.com/en-us/T0064071603300.html) is 39.3 mm. [Tissot Ballade T156.210.11.351.00](https://www.tissotwatches.com/en-in/T1562101135100.html) is an alternative verified 34 mm example, but NOT the pictured Le Locle |
| 36 | Rolex Oyster Perpetual 126000 | A clean three-hand design with a domed bezel and steel bracelet. | [Official 36 mm configuration](https://www.rolex.com/watches/oyster-perpetual/m126000-0001); selected silver example differs from the green chart image |
| 38 | Seiko Presage Classic HCC002J1, replacement example | A refined automatic design with a silk-inspired dial and curved sapphire crystal. | [Official 38.0 mm example](https://www.seikowatches.com/pt-pt/products/presage/HCC002J1). [SRPE43J1](https://www.seikowatches.com/global-en/products/presage/srpe43j1) is 38.5 mm, so do not silently round it to38 |
| 40 | Longines Spirit L3.810.4.53.6 | An aviation-inspired design with a black dial and luminous details. | [Official 40 mm example](https://www.longines.com/en-us/p/watch-longines-spirit-l3-810-4-53-6); bracelet/strap and exact photo identity not established |
| 42 | Omega Seamaster Diver300M 210.30.42.20.03.001 | A blue-dial dive-watch design with a rotating bezel and skeleton hands. | [Official 42 mm example](https://www.omegawatches.com/en-us/watch-omega-seamaster-diver-300m-co-axial-master-chronometer-42-mm-21030422003001) |
| 44 | Hamilton Khaki Field Auto H70625133 | A larger field-watch reference with clear, functional styling. | [Official 44 mm past-collection model](https://www.hamiltonwatch.com/en-int/h70625133-khaki-field-auto.html); past collection is not current supplier stock |
| 46 | Breitling Super Avenger B01 EB0148101B1X1, replacement example | A substantial chronograph reference with a 46 mm titanium case. | [Official 46 mm model](https://www.breitling.com/gb-en/watches/avenger/super-avenger-b01-chronograph-46-my23/EB0148101B1X1/). Older [Super Avenger II A13371111B1S1](https://www.breitling.com/gb-en/watches/avenger/super-avenger-ii/A13371111B1S1/) is48 mm; chart model cannot be inferred from family name alone |
| 48 | Generic oversized sport reference, recommended | Oversized sports-watch proportions with a prominent case silhouette. | No accessible Hublot-hosted specification recovered for the pictured older Big Bang King48. Do not substitute a King Gold page. Verified Breitling Super Avenger II48 is an alternative only if deliberately relabelled |
| 50 | Invicta Subaqua10040 | A broad sports-watch design illustrating a 50 mm case diameter. | [Official model10040](https://www.invictawatch.com/watches/detail/10040-subaqua-men) |
| 52 | U-BOAT Black Widow8054 | A statement-sized reference with a black-diamond-set gold case. | [Official 52 mm example](https://www.uboatwatch.com/product/black-widow-52-mm/) |

Recommendation for approval: use generic truthful34/48 entries, precise referenced examples for other sizes, and mark all branded watches 'visual reference only'. Avoid claims such as ideal wrist size/comfort, since thickness, lug-to-lug, case shape, strap and wrist shape also matter.

### Thumbnail provenance gate

The supplied social screenshot can guide layout and private design review; uploading it does not establish a reusable product-photo licence or make its labels accurate. Do not automatically redistribute the full screenshot or crop personal/social overlays into a public dashboard. Product-page specification links also do not automatically establish permission to bundle manufacturer photographs. Example restrictions: [Tissot terms, section4](https://www.tissotwatches.com/en-us/terms-of-use.html).

Plan a photo-capable thumbnail contract: source/asset path, alt text, model identity, dimensions of the asset, provenance and approved use. Use an approved/licensed photo if available; otherwise use an original small schematic thumbnail labelled illustrative, without pretending it is a supplier-exact GLB or identified chart watch. An image-load failure gets the same neutral fallback and does not break catalogue actions. Select the final image policy before coding, not after public deployment. No images have been generated, cropped, copied or downloaded in this slice.

## Application audit and integration contracts

- `src/components/layout/CaseDiameterControl.tsx`: existing local draft, 20-60/0.1 range, number/Set; desktop maximum380 px. Extend layout and reference components, not the resizing engine.
- `src/components/layout/toolbarActions.ts`: `applyToolbarDiameter` rejects active component/build previews and relevant current lock states; `resizeCasePreview` changes preview envelope/global geometry only. Purchased part dimensions, catalogue IDs and hand lengths remain unchanged.
- `src/stores/watchAssemblyStore.ts`: assembly identity changes enter undo history. Drag stays local, with at most one canonical commit per gesture; no-op Set creates none. Pointer cancel/release outside must not leave a half-committed interaction.
- `src/stores/catalogueStore.ts`: use live store records, including runtime additions, not compatibility-test fixtures from a broad registry helper. Filter explicit `kind === case || kind === midcase`, not just category case (which includes crystals/casebacks/lugs).
- Size matching: normalized tenths or explicit tight numeric comparison; never round40.2 to40,43.8 to44,46.5 to46. Preserve different records of the same size; deduplicate only identical IDs. Do not infer diameter from marketing name or tag.
- Current nominal catalogue sizes:34,38,40,40.2,41,42,43.8,44,46.5,47. Thus chart ticks36,46,48,50,52 currently have no exact case/midcase match. Catalogue records are provisional/draft, not automatically verified or stocked.
- Off-axis46.5/47 records use shroud envelope as nominal diameter; physical midcase OD remains unknown. Label that convention, do not call it measured body OD or a scale-placement radius.
- Real right workflow: RightTraySwitch -> RightTray -> OptionsTab, driven by configuratorUIStore. There is no rightOptions API. Add a typed optional case-size filter, not a '40mm' text-search hack. Resolve a genuine case/midcase target, not first category-case part; missing/multiple targets need explicit handling.
- Explicit catalogue action must respect pending preview before context navigation. `selectPartContext` can cancel a different preview and restore a remembered non-Options tab, so never call it on hover/focus. Only intentional navigation opens the appropriate work mode and Options tab.
- Preview/replacement must reuse `applyCatalogueVisualSelection`, `setPreview`, compatibility evaluation and existing checked Apply/Cancel. Preserve source/platform/crown/supplied-bezel effects and dependent locks; do not implement a second case-swap engine.
- Existing broad category lock behaviour may include crystals/casebacks/lugs. Preserve it for this feature unless a separately reviewed change is explicitly approved; changing crown or lock semantics is outside scope.
- Fixed supplier GLBs may fall back to procedural preview when the preview envelope differs. Keep selected physical case size visible separately. A toolbar resize must not stretch sourced crowns/hands or change their evidence status.

## Interaction/accessibility research

Prefer native range plus number input. [W3C slider guidance](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) covers arrows/Home/End and warns that touch assistive technology needs actual testing. The number input remains a precise alternative. Do not flood live regions with every drag event.

The panel contains actionable catalogue controls, so treat it as an interactive nonmodal popover/disclosure, not a passive ARIA tooltip. On hover/focus, content must remain reachable, dismissible and persistent as described by [WCAG hover/focus guidance](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html). Do not steal focus merely on hover. Explicit open can move focus appropriately; closing returns focus to a valid trigger when needed.

TopToolbar is a motion header and workspace ancestors have overflow-hidden. Prefer a body portal with measured anchor position and explicit layer contract below modal dialogs. Clamp horizontally, keep below the control where feasible, constrain height to the remaining viewport, and recompute after scroll/resize/toolbar wrapping. On very short/mobile viewports use a bounded below-slider disclosure rather than cover the input or force inaccessible overflow. Only one popup/browser operator at a time during acceptance.

## Milestones and agent assignments

Suggested counts exclude the main integrator; maximum three subagents concurrently. Agents are assigned disjoint files. Main owns shared types/store integration and approval ledger. Do not spawn parallel edits into the current crown work. No new model or schedule is needed for this bounded feature.

### D0 - Approve research, imagery and interaction contract (no production code)

Agents: two manufacturer-source researchers and one read-only architecture reviewer, already used. Main reconciles conflicts and presents this plan. Tools: official web sources, rg/Git/source inspection; computer-use skill reserved for actual browser checks, not claimed as completed in this source audit. PDF skill only if unresolved historical model evidence genuinely requires a manufacturer PDF; no PDF is needed just to implement the slider.

Gate: approve generic34/48 fallback versus explicitly verified replacement examples, thumbnail policy, ten photo reference ticks, grey-state semantics and preview-versus-physical distinction. Remaining historical photo identification can stay explicitly unverified; do not spend unbounded research to force a match.

### D1 - Pure reference data and live catalogue discovery

Agents: one domain/data implementer; one independent test reviewer. Main freezes typed size-filter/target contracts before UI changes. Proposed files: new `src/domain/catalogue/caseSizeReferences.ts`, focused tests, minimal typed UI-filter addition where required. Exact file placement confirmed against current architecture before editing.

Run card after approval: add source-backed reference metadata, concise captions, image provenance/fallback, pure exact-size index and deterministic case target resolution. Reflect live catalogue edits. Separate reference-only, has catalogue records, compatible, researched, in-stock and visual readiness. No assembly writes from selectors.

Gate/tests: exclude35 mm caseback/48 mm lugs; include both34 identities; preserve40.2/43.8/46.5; shroud label; runtime addition/removal updates; no phantom branded product; no fit/stock claims from size match. Missing/multiple targets handled explicitly.

### D2 - Wider toolbar and vertical reference popover

Status: implemented and autonomously rechecked. See the acceptance report for all six visually inspected width classes, endpoint/precision/undo checks, lock browsing, native release-outside and pointer/focus traversal. Physical-device, assistive-technology and unsupported browser-zoom/cancel checks remain explicitly disclosed; D3 is not started.

Agents: one UI implementer; one accessibility/interaction test reviewer. Domain agent may prepare tests in disjoint files; main owns toolbar integration. Skills/tools: computer-use for actual browser checks, existing React/native controls, browser geometry/interaction tests. No imagegen or Blender required for code-native schematic fallback.

Run card: widen responsive control; add proportional reference ticks and restrained narrow labels; implement below-slider thumbnail card, hover/focus/drag/touch state, source/availability labels, independent read-only reference browsing when locked, portal positioning and dismissal. Keep draft local, numeric precision and canonical resize guard. Test pointer capture/cancel, release outside, stale events, keyboard repeats, Escape and hover-to-panel traversal.

Gate:320/375/390/768/1280/1920 widths and200% zoom; no page horizontal overflow, clipping, modal overlap, lost controls or popup flicker; reference browsing zero undo entries; one drag at most one undo entry; number/Set still work; touch does not depend on hover; no forced snapping.

### D3 - Connect catalogue navigation and existing Preview/Apply

Agents: one workflow implementer; one regression reviewer. Main owns shared configurator store changes and reviews conflicts with crown work. Skills/tools: computer-use, existing compatibility/Options flow, transition tests.

Run card: explicit 'View catalogue cases' opens a typed exact-size case filter in Options; choosing a candidate enters existing validated preview and Apply/Cancel. Never auto-pick the first record or silently cancel a pending preview. Keep unknown/red, source status and physical dimensions visible. Size discovery may browse blocked options but never bypass locks or checks.

Gate: persisted/session/dependent crown+bezel locks; active build/component preview policy; incompatible refusal; unknown remains unknown; cancel leaves committed assembly unchanged; case replacements update bothviews, right options and BOM through existing flow; old typed filter clears predictably; resize and replacement each undo/redo; import/reload persists committed design not transient popup.

### D4 - Independent acceptance and approval checkpoint

Agents: up to three reviewers - domain/undo/compatibility, browser/responsive/accessibility, and Engineering/HD/sourcing regressions. One browser operator at a time or isolated fixtures; others inspect evidence/tests. Main triages and assigns isolated repairs, reruns failures and records exclusions.

Run card: focused tests including toolbarActions, catalogueVisualSelection, largeCaseSupplierResearch and crown/off-axis regressions; then full test suite, typecheck, lint, production build and git diff --check using current scripts. Inspect actual front/side Engineering/HD after size and case transitions; no new GLBs required by this reference UI. Check numeric20/60 endpoints, decimal values, unavailable sizes, loaded-image/fallback states, locks, touch, keyboard, modal layering and repeated navigation.

Gate: evidence distinguishes actual browser inspection from model assertions; no new supplier/fit/manufacturing claims; no changes outside approved feature. Record existing limitations separately. Report task-owned files and remaining dirty crown work. Stop for user review. Commit/push/merge only after approval resumes implementation/publication; do not publish unrelated crown work.

## Proposed first implementation approval

D1-D2 have been approved and implemented. Review the popup and grey-state behaviour, then approve D3-D4 for explicit catalogue navigation and full workflow acceptance. No automation was activated. Official photography is linked, not bundled; the default thumbnail is an original, clearly labelled schematic.
