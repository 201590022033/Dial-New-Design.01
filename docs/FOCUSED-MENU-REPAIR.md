# Focused right-side menu repair — 2026-10-03

## Audit extension

The browser audit exercised the remaining dial index choices, lettering select, Search all components and the modern/legacy inspector switch in addition to the earlier right-tray Options/Style/Suppliers/Details/Manufacture checks. Index choices selected correctly and all-component search expanded from 0 to 84 options when no physical context was selected. Legacy controls expose nominal/reference geometry; they are not a substitute for actual part interfaces.

This is not an exhaustive certification of every supplier, upload, GLB combination, legacy field or manufacturing output. No purchase, supplier contact, destructive action, commit or push was performed.

## Implemented

- `ControlledBomPanel.tsx`: replaced the misleading fixed NH35 kit approval with active assembly components, movement, actual case size, compatibility, readiness and planning total. Explicitly not order approval.
- `LeftNavRail.tsx`: BOM badge now reflects assembly compatibility instead of remaining green during red errors.
- `CostBomSummary.tsx`: removed “Verified Components” wording from estimated selected-component prices.
- `defaultBuilds.ts`, `StarterBuildPanel.tsx`: fresh platform prevents carrying ladies NH05 physical parts into larger NH35 starters. Preserves the reviewed reference-42 NH35 rendering fixture and authored NH35 case frame to avoid regressing existing HD placement. Clears supplier selections after saving the pre-starter backup. All starters are presentation-only; kit reasoning is clearly distinguished from the actual BOM.
- `AdvancedModePanel.tsx`: diameter editor writes canonical part dimensions, clears obsolete parametric geometry/provenance, reflects the current component and no longer applies a universal NH35 dial limit. The five unavailable CAD layers are disabled with an explicit explanation; datums/radii remain schematic guides.
- `storeSync.ts`: canonical global case dimensions take priority over stale legacy geometry parameters (ladies case now shows 34, not 42).
- `configuratorUIStore.ts`, `OptionsTab.tsx`: incompatible replacement previews expose their error before Apply, both buttons respect errors, texture-only Apply validates that it changes no geometry. Existing build errors remain visible; finish changes do not manufacture a green approval.
- `watchAssemblyStore.ts`, `TopToolbar.tsx`: bounded 50-entry canonical assembly history supports live Style/CAD Undo/Redo. It does not claim to undo supplier, scale-session or viewport changes.
- `menuRepairRegression.test.tsx`: six regressions covering platform reset, canonical dimension priority, history, actual BOM rendering, unfinished overlays and texture-only validation.

## Verified

- Browser: active BOM now reports NH05 / 34 mm / RED Needs compatibility review, matching the restored design rather than approving an NH35 kit.
- Browser: silver → navy → Undo silver → Redo navy.
- Browser: Minute Hand diameter 8.82 → 10 persisted into Details. The change was subsequently restored from the checkpoint.
- Browser: Matte texture preview Apply produced “Applied ✓” and Details showed matte, without suppressing the red physical errors.
- Original verification checkpoint restored afterwards; silver dial / rose-gold presentation / 8.82 mm minute hand retained. In-app checkpoint left intact.
- Full suite: 400 tests passed; typecheck, lint, production build and diff whitespace verification passed. Non-failing bundle-size / third-party annotation / Three.js deprecation warnings remain.

## Explicit remaining work

The pre-existing NH05 design remains incompatible: several engineering rules still fall back to catalogue/default NH35 bore, reach, cavity and rehaut values even when the visible dimensions/variant have changed. This pass deliberately does not invent supplier fit evidence or alter those engineering facts to turn the build green. Next repair should unify those rules with actual selected-component engineering properties and distinguish measured, provisional and overridden dimensions.

Legacy nominal band readouts, project movement-note synchronization, placeholder Help pages, full measured CAD overlays and actual fabrication exports are not completed in this pass. Import/export/download, all lug/subdial variants and live external search results need separate end-to-end coverage. The existing GLB/colour work was preserved; no new GLBs were generated here.

All repository changes remain uncommitted.

Follow-up: see `REMAINING-MENU-REPAIR.md` for the completed NH05 data-source, legacy readout and Help repairs. The earlier remaining-work list above records the state of the first pass, not the follow-up status.
