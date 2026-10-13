# DF0 foundation checkpoint

Date: 12 October 2026, Africa/Johannesburg.

## Scope and result

DF0 establishes transport contracts and synthetic examples for the design-first roadmap. It does not change application screens, register supplier products, implement matching, run supplier capture or add another assembly/catalogue store. The next screen changes belong to DF1; live extraction and evidence-aware constraints belong to DF2.

Three independent agent deliverables were coordinated by the lead: case constraints, design briefs/results, and supplier drafts. The lead owns shared evidence, public exports, cross-contract acceptance, baseline protection and this checkpoint. Agents did not compare competing implementations or audit one another.

## Protected baseline

- Repository: C:/Users/Deon/Documents/GitHub/Dial-New-Design.01
- Starting HEAD: 8a15a9febafc6ba3168a172535bb3d31cd58c431
- Snapshot directory: C:/Users/Deon/Documents/Codex/2026-10-09/project-crown-and-namokimods/outputs/df0-baseline-20261012T141211Z
- 52 changed/non-ignored untracked files were copied, hashed and verified against the ZIP contents before implementation.
- Archive SHA-256: b30b7c1892944d20c7db7c1dc0acba970ba5a22fa8d6de55607701ac732f5d6b
- Recovery material: manifest.json, working-files.zip, working-tree.patch (relative to HEAD), index.patch and status-porcelain.bin. RECOVERY.md explains inspection and selective restoration.
- Ignored assets/dependencies and browser-local project data are outside this filesystem snapshot. No ignored assets were changed by DF0.
- All 52 original files matched their hashes after contract implementation, before the planned roadmap status updates. This checkpoint and new contract files were added separately.
- No reset, clean, stash, commit, push or remote publication was performed.

## Agreed contracts

| Module | Contract | Purpose and boundary |
|---|---|---|
| src/domain/design-first/evidence.ts | EvidenceField<T>, EvidenceSource, DesignPartSlot, NavigatorGroup | Recorded values carry source and review state; assumed values carry a reason; unknown values have a reason and no fabricated numeric value. A valid field is not a fit certificate. |
| caseConstraints.ts | CaseConstraintsV1, case-constraints/v1 | Concept or identified selected-case; explicit seat/cavity/lug/stem measurements; package inclusion and fixed interface are independently evidenced. No interface derives from exterior diameter. |
| designBrief.ts | DesignBriefV1, DesignMatchResultV1, version 1 | Assembly/project identity and opaque content token; existing part/catalogue refs; desired dimensions/styles; preserve/change permissions and locks; four result groups, explicit adjustments and separate supplier offer IDs. |
| supplierDraft.ts | SupplierDraft, dial-designer/supplier-draft/v1 | Exact supplier/product/variant; versioned evidence-bearing draft; engineering identity separated from commercial offers; package and image-use evidence; AI confidence separate from fit qualification. |
| index.ts | Public module exports | Contracts and validators only. Synthetic fixture modules are intentionally not exported into this entry point. |

### Contract interpretation

1. A selected-case constraint must name its catalogue case. A concept has no selected catalogue/listing refs. A selected-case design brief references both case instance and catalogue identity; concept briefs reject a selected-case reference.
2. Measurements named *Mm use millimetres. Diameters and physical sizes must be finite and positive. Stem height is a datum coordinate and can be zero; DF2 must establish the datum before comparing it. Supplier CanonicalMeasurement mm currently represents positive sizes, not arbitrary coordinates or zero-clearance geometry; those need explicitly typed future fields. Zero is never an unknown marker.
3. Case inclusion is included/optional/not-included with evidence, or unknown. Fixed interface is separate from inclusion. Neither means a replacement candidate fits. An included crystal can remain replaceable while its seat is constrained.
4. Search brief identity tokens are opaque caller-provided values in DF0. DF2 must generate a meaningful content/revision identity; timestamps alone are insufficient. DF4 must compare with current state, revalidate and rebuild before Apply. A stored preview clone must not overwrite intervening edits.
5. Permission and adjustment properties use canonical scoped paths, such as target.dimensions.diameterMm. DF4 must validate them against the actual target, locks and allowed changes. The DF0 contract never executes a property edit.
6. Result groups are fits-recorded-dimensions, changes-required, needs-evidence and incompatible. Visual score is optional 0–1 and cannot change fit group. Schema validation does not run dimensional rules or prove a complete set of interfaces. DF3 must provide the actual fit evaluator.
7. Fits-recorded results require reviewed nonsynthetic recorded reason evidence and no adjustments. Needs-evidence includes unknown, assumed, unreviewed or synthetic evidence. Synthetic examples cannot be promoted to real fit claims.
8. Supplier draft status reuses existing draft/ai-extracted/reviewed states. Every draft has fitQualification=not-assessed. Reviewing extraction or raising AI confidence does not qualify hardware. Exact variant identity cannot be invented from unknown or assumed variant data.
9. Multiple supplier offer references can point at one engineering identity. Matching/publication must resolve IDs through the existing catalogue and sourcing model; DF0 validates transport shape, not registry existence or commercial availability.
10. Sources within a supplier draft must be consistently synthetic or real. Mixed fixture/real evidence is rejected regardless of the fixture flag. Real images require documented usage basis before the later UI uses them; an image record whose usage is unknown grants no permission.

## Examples and checks

- caseConstraintFixtures.ts: identified synthetic cases with the same 40 mm exterior and different crystal seats; incomplete selected case; concept with assumed diameter and unknown interfaces. All fixture sources are synthetic and unreviewed.
- designBriefFixtures.ts: concept and selected-case request examples; unknown, adjustment and incompatible results. There is deliberately no synthetic supplier-fit-approved example.
- supplierDraftFixtures.ts: two exact variants of a fictional case, multiple offer refs, high extraction confidence, unknown crystal seat and unknown image-use permission. None enters the catalogue.
- designFirstEvidence, designFirstCaseConstraints, designFirstBrief, designFirstSupplierDraft and designFirstContracts tests cover malformed/versioned inputs, explicit unknowns, source isolation, units/zero, stale refs and token comparisons, JSON round trips, visual-score independence, distinct variants, and no mutation of the current assembly/catalogue during contract validation.

## File ownership for the next milestones

| Owner | Exclusive starting files/modules | Coordination rule |
|---|---|---|
| Lead | shared evidence.ts, index.ts, roadmap/checkpoint, cross-contract tests | Approves contract changes and integrates sequentially. |
| Navigation worker, DF1 | componentNavigator.ts, ComponentNavigator.tsx, componentNavigatorActions.ts | Consume case constraints as a projection; no assembly deletion or alternate supplier store. |
| Case/intent worker, DF2 | case constraint adapters, design brief extraction; explicit serialization integration if needed | Own the shared assembly/design intent schema changes during this wave. Coordinate any catalogue changes with the lead. |
| Matching worker, DF3 | new matching service using compatibilityEngine and agreed result contracts | Do not rewrite navigation or Apply stores. Qualify recorded evidence before describing a fit. |
| Results/Apply worker, DF4 | results UI and coordinated configuratorUIStore/bomApply integration | One owner for Apply/store edits at a time. Revalidate current assembly and sourcing together. |
| Supplier worker, DF5/DF6 | draft persistence/capture/review adapters | One owner for catalogue types/persistence changes; preserve engineering/offer separation and existing capture imports. |

Future worker tasks should include allowed files, contract version, acceptance fixtures, dependency inputs and explicit exclusions. The lead checks their changes and the integrated workflow. Use at most three workers plus the lead; tasks that need an unsettled contract wait for it. Shared dirty checkout changes were not copied into new worktrees during DF0; agents worked only in disjoint new files.

## Saved projects and migration rules

DF0 does not modify WatchAssembly, project file schemas or existing imports/exports. New contracts are additive and unconnected to the running app.

DF2 should derive case constraints from actual selected catalogue/interface evidence, not save a stale second copy of case geometry. User-authored preserve/change preferences may receive an optional versioned canonical designConfig field when implemented. Transient search results, identity tokens and preview UI stay out of the canonical assembly. Reopening older projects without the optional preferences must retain all existing parts and use explicit defaults without erasing authored work.

DF5 will provide durable supplier draft storage outside the canonical watch assembly. Drafts only enter the existing engineering catalogue and supplier offers through the reviewed publication workflow. There is no automatic publication or geometry mutation from a capture.

Legacy evidence must be mapped conservatively: existing crown EvidenceValue known/unknown is not replaced by DF0. A visual approximation maps to assumed; known supplier wording remains unreviewed recorded evidence only when the necessary source/capture provenance is actually available. Missing dates/sources cannot be invented to satisfy a schema. Missing legacy dimensions represented by zero may become explicit unknown only when their original semantics establish missing data; genuine zero coordinates must survive. Coordinate frames, thread geometry and supplier-specific interfaces continue to use their existing specialist types until a deliberate versioned adapter is implemented.

## Validation

Final validation passed. Browser and real screen-reader acceptance of the future navigation/results/review interfaces remains DF1/DF4/DF6/DF7 work; DF0 changes no screen, so those checks are not claimed here.

- Contract suite: 5 files / 40 tests passed (outputs/df0-contract-tests.log in the project workspace).
- Full suite: 118 files / 1,109 tests passed (outputs/df0-full-tests.log).
- Production build and full repository lint passed (outputs/df0-build.log and outputs/df0-lint.log). Build retains the existing large-chunk advisory.
- Baseline preservation: all original source/component/test files unchanged; only the two planned roadmap documents updated from their snapshot.
- Diff whitespace and new-file whitespace checks passed.
- Implementation remains local and uncommitted.

## Next step

DF1 can now simplify navigation against these contracts; DF2 can independently implement evidence-aware case/intent adapters. They must agree any shared-file ownership before concurrent edits. DF3 waits for DF2 evidence adapters. DF5 may start from these contracts when separately scheduled. This checkpoint does not automatically start another milestone.
