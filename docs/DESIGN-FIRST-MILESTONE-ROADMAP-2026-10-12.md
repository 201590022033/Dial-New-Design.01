# Design first, then find parts: milestone roadmap

Planning checkpoint: 12 October 2026, Africa/Johannesburg.

## Purpose and current status

Simplify component navigation, preserve creative design freedom, find compatible catalogue parts with explicit Preview/Apply, and prepare a reusable supplier onboarding workflow. The user requested independent agent work coordinated and checked by the lead agent. This document is the plan and progress ledger. DF0 completion and DF1 local implementation are recorded below; DF2 and DF3 are implemented locally; DF4 is implemented locally; DF5 is implemented locally; DF6 is implemented locally; DF7 is implemented as a software release candidate; manual release gates remain open. DF3 provides bounded dimensional screening; broader mating checks remain tracked in its checkpoint.

DF0 is **complete locally**. DF1 is **implemented locally** as of 12 October 2026; real screen-reader confirmation remains pending. DF2 and DF3 are **implemented locally**; DF4 is **implemented locally**; DF5 is **implemented locally**; DF6 is **implemented locally**; DF7 is **implemented as a software release candidate**; manual release gates remain open. DF3 is bounded dimensional screening, with broader mating checks still open. See [DF3 checkpoint](DF3-MATCHING-2026-10-12.md). See [DF2 checkpoint](DF2-DESIGN-INTENT-2026-10-12.md). See [DF1 navigation checkpoint](DF1-NAVIGATION-2026-10-12.md). See [DF0 foundation checkpoint](DF0-FOUNDATION-2026-10-12.md) for the protected baseline, contracts, ownership, migration rules and checks. No recurring automation or background implementation is started. Existing accessibility, direct-catalogue, crown and physical qualification work remains tracked in its existing documents. This roadmap coordinates the new workflow; it does not mark those other tasks complete or replace their evidence gates.

The local baseline includes recent slider, pilot markings, deliberate option preview and rehaut changes. The latest checks before this planning pass reported 113 test files / 1,069 tests passing, lint and production build. There are uncommitted changes. DF0 must record and protect the actual starting state before implementation; this plan does not authorize discarding it or publishing it.

## Product decisions

- Choose either **Concept design** or **Build around a selected case**. Concept dimensions are creative intent; a selected supplier case supplies recorded constraints.
- Case diameter alone never determines crystal seat, lugs, caseback, crown tube or package contents.
- Use two stacked component groups: **Design components** open by default and **Case & hardware** collapsed by default. Both headings remain visible.
- Keep every existing component reachable. Consolidate alternative families such as crystal shapes and index styles under their owning component rather than displaying every alternative as another primary row. Do not delete physical assembly records as a navigation shortcut.
- Treat fixed case interfaces, included parts, replaceable compatible parts and unknowns separately. A replaceable crystal is not uneditable just because its seat is fixed.
- Chapter rings and bezels have creative markings and physical interfaces. Provide one component entry with both sets of controls rather than duplicate entries in both groups.
- First matching release handles one component at a time. Whole-watch optimisation and automatic bundles are later work.
- Preserve the original design when matching. Show any proposed adjustment explicitly before Apply.
- Double-click or explicit Preview starts a preview; scrolling/hover does not rebuild HD. Apply commits; Cancel restores. Enter/Space and real screen-reader checks remain release requirements.
- Rank engineering fit before aesthetic similarity. Missing critical measurements stay unknown. AI confidence, a published record, a plausible image or a procedural preview is not fit evidence.

## Milestones

| ID | Outcome and bounded scope | Dependencies | Completion evidence | Status |
|---|---|---|---|---|
| DF0 | Record baseline and agree the shared contracts: case constraints, design brief, match result, field evidence and supplier draft identity. Document file ownership and migration approach. | None | Protected starting changes; sample known/incomplete/concept cases; typed contracts and fixtures; no duplicate catalogue or assembly store. | Complete locally · 12 October 2026 |
| DF1 | Simplify the left component navigator into Design components and Case & hardware, including family alternatives and clear included/fixed/unknown explanations. | DF0 | Every current component reachable once; selection, visibility, locks and Advanced still work; useful short-window layout; keyboard and screen-reader group navigation. | Implemented locally · human screen-reader check pending |
| DF2 | Evidence-aware case constraints and design brief. Distinguish authored wishes from recorded supplier interfaces; add preserve/change preferences and capture a search snapshot. | DF0 | Same-diameter cases can resolve differently; missing crystal/crown/lug data stays unknown; searching leaves assembly unchanged; intent survives save/load where appropriate. | Implemented locally · human screen-reader check pending |
| DF3 | Fit-first matching and explainable aesthetic ranking against the existing local catalogue. | DF2 | Four result groups: fits recorded dimensions / changes required / needs evidence / incompatible; wrong seat/hand bore cannot be promoted by appearance; stable ordering and plain reasons. | Implemented locally · bounded screening; broader mating chains open |
| DF4 | Find-parts screen and current-state Preview/Apply integration, explicit adjustments and sourcing association. | DF1, DF3 | Preview/double-click without hover rendering; visible change summary; current assembly revalidated at Apply; locks respected; stale results handled; Cancel changes nothing; Undo restores design and sourcing. | Implemented locally — single-component scope; human screen-reader checks pending |
| DF5 | Durable supplier drafts, evidence assets and AI-assisted capture into a review queue. Build on existing catalogue/offer schemas and capture format. | DF0; can run alongside DF1–DF4 after contracts settle | Exact source/product/variant; field values, units, unknown reason and evidence; repeat capture deduplicates; complete/incomplete fixtures; draft survives restart; no assembly mutation. | Implemented locally · 13 October 2026; human screen-reader/download delivery checks pending |
| DF6 | Review, publish and maintain supplier records; pilot with two representative suppliers, including case package contents and missing-interface cases. | DF3, DF5 | Corrections/rejection/history; review does not certify missing interfaces; published records reach matching; dated prices/shipping/stock; variants remain distinct; images have documented usage basis. | Implemented locally · 13 October 2026; bounded publication/application; human checks pending |
| DF7 | Integrate and release the complete design-to-parts workflow. Reconcile documentation and remaining backlog. | DF4, DF6 | Concept, known-case and incomplete-case journeys; Engineering/HD/BOM agree; import/export/Undo; relevant regression suite, lint/build; browser evidence and real screen-reader checklist; remaining physical uncertainties recorded. | Software release candidate · 13 October 2026; 1,299 tests/lint/build/browser passed; real screen-reader and physical qualification gates remain |

The useful first release is DF0–DF4. DF5–DF6 add supplier onboarding; DF7 closes the complete workflow. Each milestone ends with a reviewable result and an updated ledger. Dates are intentionally not promised before scope and evidence availability are known.

## Independent agent work and coordination

The lead agent owns contracts, sequencing, shared-file integration, acceptance and the user report. Each agent builds one distinct deliverable. No paired alternative implementations, agent-versus-agent comparison, or agent assigned to audit another agent.

Use at most three worker agents plus the lead at once. Dispatch only work whose input contract is ready. Prefer isolated managed worktrees for implementation if the repository is suitable; preserve the dirty baseline first, and never assume uncommitted changes are copied into a worktree. Agents return their patch/change identity, tests, limitations and handoff notes. The lead integrates sequentially and checks the assembled product.

| Wave | Worker A | Worker B | Worker C | Lead responsibility |
|---|---|---|---|---|
| Foundation | DF0 constraints/evidence definitions | DF0 design/search/result fixtures | DF0 supplier draft identity and persistence proposal | Protect baseline, resolve shared types and file boundaries |
| Navigation and intent | DF1 navigator | DF2 evidence-aware intent | DF5 draft storage against approved contracts | Check integration; prevent shared schema edits colliding |
| Search | DF3 fit evaluator | DF3 visual ranking | DF4 results UI against typed fixtures | Check fit priority; integrate services before enabling live UI |
| Apply and intake | DF4 current-state Apply/Undo | DF5 source capture/extraction | DF5 review UI and image evidence | End-to-end design flow; durable draft integration |
| Supplier release | DF6 review/publication rules | DF6 variant identity and freshness | DF6 bounded supplier pilot records | Verify source-to-match traceability and DF7 release journeys |

Schema/store changes belong to a named owner within each wave. Other workers consume typed interfaces and fixtures, submitting needed contract changes to the lead. They should not independently edit assemblyTypes.ts, catalogue types or configuratorUIStore.ts in parallel.

## Reuse the existing code

- Navigation: src/domain/configurator/componentNavigator.ts, ComponentNavigator.tsx and componentNavigatorActions.ts.
- Assembly/design persistence: assemblyTypes.ts, assemblySerialization.ts and projectFileService.ts. Extend the canonical model rather than introducing another assembly truth.
- Fit rules: src/domain/compatibility/compatibilityEngine.ts and compatibilityTypes.ts. Qualify assumptions before exposing a recorded-fit label.
- Preview/application: applyCatalogueVisualSelection.ts, configuratorUIStore.ts, bomApply.ts and applyBomSelection.ts. Rebuild every new matching transition against the current assembly rather than committing a stale preview clone.
- Supplier records: src/domain/catalogue/types.ts, catalogueStore.ts, src/domain/sourcing/aliexpressCapture.ts, snapshots.ts and partDiscovery.ts. Existing offer separation, draft/review states, provenance and capture formats are foundations, not a completed general ingestion service.
- Existing guides: SUPPLIER_ONBOARDING.md and roadmap/AUTONOMOUS_VISUAL_SUPPLIER_IMPLEMENTATION.md. Reconcile overlapping acceptance items instead of creating a second capture workflow.

## Skills and tools by task

| Need | Skill/tool | Use and boundary |
|---|---|---|
| Implement isolated modules | Coding agents, file/search tools, existing test runner | Distinct file ownership; targeted checks first; lead runs appropriate integration checks. |
| Verify real interactions | computer-use skill and in-app browser | Navigator, short-window scrolling, deliberate previews, HD, Apply/Cancel and focus. Browser automation does not substitute for a human screen reader. |
| Read supplier evidence | Web tools and official supplier/manufacturer pages | Record exact variant, source, retrieval date and missing fields; refresh unstable prices/stock when used. |
| Inspect dimensioned drawings | pdf skill when PDF diagrams require visual inspection | Check drawing revision and units; retain unknowns when the drawing cannot establish an interface. |
| Inspect/normalise catalogue exports | spreadsheets skill only for actual CSV/XLSX batches | Useful for batch supplier data; unnecessary for the basic app implementation. |
| Create explanatory artwork | Native SVG/code first; imagegen only for original bitmap illustrations | Label schematic/provisional assets. Generated pictures cannot prove a real SKU's appearance or fit. Removing branding does not establish image permission. |
| Review and track milestones | Saved Markdown roadmap and acceptance records | No new plugin, external account, message to suppliers or recurring automation is needed for this plan. |

Read a relevant skill when applying it to an implementation task; listing it here does not mean it has already been run.

## Lead acceptance checklist

1. Check the actual deliverable against its milestone, not against another agent's alternative.
2. Inspect changes to shared contracts, current-state Apply, evidence provenance and saved-project migration.
3. Run relevant tests and required lint/build checks; run GLB validation only if GLBs change.
4. Walk the complete relevant browser journey, including HD, keyboard operation and small-window layout. Record screenshots and actual limitations.
5. Give the user a real screen-reader checklist at navigation/results/review milestones. Record automated and human checks separately; do not call pending human checks passed.
6. Update this ledger with completion date, implementation/change identity, validation evidence, remaining tasks and the next milestone. Distinguish implemented locally from committed/pushed and from physically qualified.

## Deferred scope

Whole-watch automatic optimisation; destructive manufacturing remedies; purchasing; contacting suppliers; remote publishing; supplier account integrations; broad internet scraping; new scheduled monitoring; physical fit/pressure qualification. None is required to prove the first design-to-parts release. Any later addition needs its own bounded milestone.

## Resuming over time

Use a milestone ID to resume: “Go DF0”, “Go DF1”, or “Continue DF3 from the ledger”. The lead reads this roadmap and the actual repo state, dispatches the independent tasks for that milestone, integrates and checks them, then records the result. A milestone request authorizes its bounded implementation; commit/push and external actions follow the user's actual instructions rather than being inferred from this planning document.

Next recommended step: **complete the recorded human screen-reader, supplier/fit and long-session performance qualification**. The separate VR0–VR5 model realism delivery is complete locally; see the follow-on release below. DF7 software integration and acceptance are complete with 145 files / 1,299 tests, lint/build and HD/browser checks passing. See [DF7 release checkpoint](DF7-RELEASE-CHECKPOINT-2026-10-13.md) for the manual screen-reader/physical gates and remaining scope. DF6 review, corrections, local publication/history and two official-source pilots are implemented locally with 141 files / 1,273 tests passing; see [DF6 checkpoint](DF6-SUPPLIER-REVIEW-2026-10-13.md) for boundaries and remaining checks. DF5 durable drafts, evidence assets and intake queue are implemented locally with 137 files / 1,240 tests passing; see [DF5 checkpoint](DF5-SUPPLIER-DRAFTS-2026-10-13.md) for validation and remaining browser/human checks. DF4 grouped results and current-state Preview/Apply are implemented locally with 134 files / 1,222 tests, lint/build and browser checks passing; see [DF4 checkpoint](DF4-PREVIEW-APPLY-2026-10-12.md). Multi-component replacement permissions remain tracked for DF7. DF3 implemented locally with 130 files / 1,189 tests, lint/build and read-only catalogue acceptance passing. See [DF3 checkpoint](DF3-MATCHING-2026-10-12.md) for positive crystal-comparison scope and the explicit matching expansion backlog. DF7 software work is implemented; production qualification remains bounded by the recorded manual gates. Human screen-reader checks remain pending. The user requested committing and pushing the accumulated DF0–DF7 work at this release checkpoint; the associated Git commit and final report record completion. Earlier milestone notes retain their historical local-only status.

## Separate follow-on after DF7

[Watch model realism: VR0–VR5](WATCH-REALISM-WORK-PLAN-2026-10-14.md) is complete locally after the committed/pushed DF7 software release. The verified delivery contains 101 refined components, six standalone GLBs with editable scenes and 20 final PNG files, with passing application checks and bounded HD repeat-switch evidence. See the [release report](WATCH-REALISM-RELEASE-2026-10-14.md) for the gallery/package and preserved geometry/manual qualification limits. Git publication of this separate GLB release was authorized on 14 October 2026; the generated archive remains local and existing DF screen-reader and physical gates remain open.
