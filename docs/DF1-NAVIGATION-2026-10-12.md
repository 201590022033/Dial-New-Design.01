# DF1 — simpler component navigation

Implemented locally on 12 October 2026. No commit/push or GLB edits performed.

## Result

The component navigator has two visible disclosure headings: Design components (open by default) and Case & hardware (collapsed by default). Related hands, indices/numerals, lettering/logos, complications, crystal variants and case/lug entries are consolidated into expandable families. Distinct chapter/inner/rotating/fixed bezel entries remain directly accessible. Every actual assembly instance remains reachable once; no canonical part was removed or relabelled into a supplier claim.

Case & hardware is navigation organisation only. Its description explains that included and replaceable parts need supplier evidence. Actual evidence-aware case constraints and design-intent extraction are DF2, not completed by this milestone.

Selection, dimensions, artwork badges, visibility and locks reuse the existing actions. Selecting a hidden component reveals its group/family. Manually folding the selected group offers a Reveal selected button and remains folded through unrelated assembly updates. The compact icon rail retains access to all components. Disclosure controls use native buttons with expanded state and controlled labelled regions.

Both section headings remain outside their independently scrolling contents. The lead's browser check found that a narrow-window overlay was trapped inside a very short preview area. Its containing block now spans the available workspace grid at narrow widths, making the list reachable while retaining the collapse control. The desktop sidebar keeps its normal layout.

## Ownership and integration

- Domain worker: componentNavigator.ts and componentNavigatorGroups.test.ts — grouping projection, actual catalogue kinds, custom fallback and all-starter coverage.
- UI worker: ComponentNavigator.tsx and componentNavigatorRendering.test.tsx — disclosures, selected-item reveal, native control semantics and markup checks.
- Lead: App.tsx narrow-window containing block correction, product-copy integration, browser checks, checkpoint/docs and final validation. No worker was assigned to audit another worker.

## Validation

- Full suite: 120 files / 1,122 tests passed; full lint and production build passed. Existing build chunk-size advisory remains.
- New grouping checks cover six starter archetypes, exact-once membership, custom/unordered instances, unchanged metadata/locks/visibility/artwork and empty groups.
- Static markup checks verify initial open/closed states, one selector per instance, and valid disclosure-to-region links.
- Browser: default desktop group state; Enter/Space for families and groups; nested Hour Hand selection; Advanced remains open when selecting a bezel; hide/show rotating bezel restored; compact-rail Crown selection reveals hardware; manual collapse shows Reveal selected; crystal alternatives remain reachable; locked Flat Sapphire disables visibility, unlocking restores it.
- Browser sizes: 1280×800 desktop regression and the normal 722×686 short-window view. Temporary viewport override reset afterward. No browser console errors observed. Screenshots and logs are in the project workspace outputs: df1-desktop-navigation-2026-10-12.png, df1-short-window-navigation-2026-10-12.png, df1-tests.log, df1-lint.log and df1-build.log.
- Source checkpoint: outputs/df1-checkpoint-20261012T144450Z retains hashed changed/untracked files and a HEAD-relative patch; the earlier DF0 snapshot remains intact.

## Real screen-reader checks still needed

These are human acceptance checks, not claimed as passed by automated browser testing:

1. Navigate to the component navigator and confirm both group names and expanded/collapsed states are announced clearly.
2. Expand Hands, Crystal and Indices & numerals using Enter/Space; confirm folded children are absent from keyboard and browse navigation.
3. Select a child and confirm its selected state, name and component details are understandable without the thumbnail.
4. Fold the selected component's group; confirm Reveal selected announces the component and returns access without losing focus unexpectedly.
5. Confirm Hide/Show names describe the correct component, locked controls are unavailable, and all groups remain usable in the short-window layout.

DF1 implementation and automated/browser checks are complete locally. Human screen-reader confirmation remains a recorded accessibility gate for release; DF7 must not describe it as passed until actually checked.

## Separate future task

The attached Blender brief is preserved verbatim under docs/briefs and scheduled as [VR0–VR5 after DF7](WATCH-REALISM-PLANNED-AFTER-DF-2026-10-12.md). No modelling, rendering or asset replacement was started. Its dimensional conflicts and input-scope questions are recorded for VR0.

## Next milestone

DF2 — evidence-aware case constraints and design intent. The grouped UI can consume those projections later without implying that case diameter alone determines compatible hardware.
