# DF3 matching checkpoint

Date: 12 October 2026. Implemented locally as bounded dimensional screening; no commit or push.

## Result and scope

The read-only local catalogue matcher consumes a current DF2 search brief, screens same-slot candidates, retains separate supplier offer references, and orders four groups: fits recorded dimensions, changes required, needs evidence, incompatible. Appearance ranks candidates only within their group. A wrong listed seat or hand bore cannot be promoted by a better-looking image, descriptive metadata or published catalogue status.

This milestone supplies domain services. The dashboard still captures briefs; the results screen and deliberate Preview/Apply/Cancel are DF4. No new search button, hover preview, supplier ingestion or catalogue publication is enabled by DF3.

Three independent worker deliverables were coordinated and checked by the lead: fit screening, appearance ranking, and search orchestration. The lead added exact-item measurement evidence, public exports, shared slot resolution and cross-service acceptance tests.

## Rules implemented

- Search validates assembly/catalogue/intent content identity and reconstructs the current captured brief. Changed geometry, locks, references, preferences, dimensions or permissions require recapture. Duplicate catalogue/offer IDs are rejected as ambiguous. Search does not modify assembly, catalogue, sourcing or brief.
- Candidate dimensions use optional versioned ComponentCatalogueItem.fitEvidence with per-field source and review. Explicit legacy values remain assumed. Missing/invalid dimensions, conflicting evidence, unreviewed records and synthetic sources cannot produce a positive recorded match. No actual supplier record was promoted or invented.
- Crystal comparison uses stated diameter against case seat (0.05 mm screening tolerance) and thickness against recorded seat depth. It is a scoped dimensional match, never pressure, sealing, retention or installation certification.
- Wrong explicit hand role or bore is incompatible. Bore screening tolerance is 0.02 mm and cannot be enlarged by the project's general manufacturing tolerance. Movement-library bore values remain assumed.
- Negative dimensional checks cover dial/chapter-ring seats, strap width, explicit bezel/caseback mounting dimensions, and available case cavity/dial-seat data. Internal bezels never use an external carrier as their interface.
- Overall bezel/caseback diameters are not mounting dimensions. Only explicit mountingDiameterMm or mountingInner/OuterDiameterMm evidence can supply those surfaces.
- Locks and preserved known dimensions/appearance prevent conflicting replacements. Allowed authored changes are listed before/after with reversible intent paths; no hardware resize or destructive remedy is executed.
- Provisional checks reuse the existing compatibility engine for relevant candidate diagnostics. Its generic green results never establish reviewed fit; unrelated existing assembly failures do not poison a scoped candidate match.
- Appearance compares descriptive material, texture, colour and available style metadata. Missing appearance metadata earns no credit. Style-note word overlap contributes at most 15%; it does not understand meaning or negation. It is not image similarity or AI assessment.

## Checks still to implement, separate from missing supplier evidence

The current positive path covers crystal diameter/depth only. Other component groups remain conservative until their full assessment chains and source fields exist. These are explicit implementation limits, not merely absent measurements:

| Component | Remaining assessment |
|---|---|
| Dial | Feet/calibre mapping, axial seat and hand clearance |
| Hands | Source-qualified movement pinions, complete set/role mapping, reach and stack clearance |
| Crown | Complete positive specialist chain; existing explicit specialist contradictions still reject |
| Chapter ring | Axial seating, dial opening and retention |
| External bezel | Retention, rotation, axial clearance and insert seating |
| Internal bezel | Internal seat, drive crown, retention and axial interfaces |
| Caseback | Thread/snap geometry, gasket and closure |
| Strap | End-link shape, spring bars and fastening |
| Replacement case | Complete movement height/stem and surrounding component chain |

Track these as matching expansion work before DF7 release; DF4 can expose bounded screening with these limits visible. Do not rename an unsupported assessment as a verified fit. Supplier evidence onboarding remains DF5–DF6; physical qualification remains separate.

## Validation

- Full suite: 130 test files / 1,189 tests passed (45 new DF3 checks).
- Lint and production build passed; existing production chunk-size advisory remains.
- Integrated test: two cases with the same 40 mm outer diameter and different recorded crystal seats yield different groups for the same crystal.
- Four groups, explicit adjustments, wrong seat/bore, preservation/locks, incomplete/synthetic/conflicting evidence, stale/tampered brief rejection, deterministic ordering and frozen-input preservation are checked.
- Six actual starter archetypes are checked against the application catalogue. A separate 54-journey local report screened 408 candidates: 378 needs evidence, 30 incompatible, zero recorded fits or changes-required. Preferences allowed dimension and appearance changes. This is the expected conservative result for current records, not proof that all those products are physically incompatible.
- Logs and catalogue report are under the Codex workspace outputs: df3-tests.log, df3-lint.log, df3-build.log, df3-catalogue-report.json.
- Checkpoint: outputs/df3-checkpoint-20261012T185224Z, 87 files preserved after work began; not a pristine DF3 starting snapshot. Existing dirty work remains intact.
- No UI/GLB changes were required. DF2 browser evidence and pending real screen-reader checklist still apply. New results interaction and screen-reader acceptance belong to DF4/DF7.

## Next milestone

DF4: show the grouped results and explanations, then implement deliberate current-state Preview/Apply/Cancel/Undo with explicit changes, retained locks and sourcing association. The matching expansion table above remains open and must be reconciled before release. The separate Blender realism task remains planned after DF7.
