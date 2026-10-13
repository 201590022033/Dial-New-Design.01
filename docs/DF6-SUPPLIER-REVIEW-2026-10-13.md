# DF6 — supplier review, local publication and pilot

Implemented locally on 13 October 2026, Africa/Johannesburg. No commit or push performed. Three independent workers delivered review/publication rules, review UI, and official supplier pilot records. The coordinator integrated the durable journal, current-capture checks, catalogue hydration, correction audit and acceptance tests. Existing unrelated work was retained.

## Delivered workflow

In **Suppliers → Supplier draft intake & local review queue**, expand a saved draft and **Review & local publication**. Enter a reviewer name and source-check reason. Check only recorded fields verified against retained evidence. Unknown and assumed values cannot be promoted. Approval requires the exact recorded variant and at least one source-backed measurement or attribute; commercial snapshots and image permission claims have separate explicit review paths.

**Approve checked fields** saves a revision-bound decision. **Publish to local catalogue** is a separate deliberate action. Publishing creates an isolated, stable exact-variant catalogue record and reviewed commercial snapshots, rather than overwriting the optional linked component. Offers retain dated source claims, unknown shipping and unverified status. They cannot order directly. Publication does not change the assembly or selected supplier and does not certify fit, sealing, installation or manufacturing.

**Reject capture** records a reason and prevents that review authorizing publication. A rejection does not silently withdraw an earlier publication; **Withdraw publication** explicitly suspends its local catalogue record/offers while retaining captures and the decision history. A newer capture needs a new review before publication. An earlier approved publication may remain active until updated or withdrawn; the UI names that distinction.

**Prepare correction** validates edited capture JSON before **Save corrected capture**. Original sources and raw captures must remain unchanged. Known exact-variant corrections append a new immutable queue version, with reviewer/reason and original entry/revision recorded in a new correction source. Resolving an ambiguous variant creates a linked new entry, preserving the original unknown identity rather than merging it. Changing an established supplier/product/exact variant requires a new intake record. Corrections do not reuse previous approval.

Review/publication/withdrawal history is durable in a separate IndexedDB journal. Restart revalidates decisions against exact queue revisions and recomputes publication payloads before restoring them to the existing catalogue store. A generation check rejects stale tab writes; the UI has **Load or reload review history** for recovery. No catalogue record is installed before its journal save succeeds. Corrupt or altered journal data is refused. Reviewer names are local audit annotations, not authenticated identities or digital signatures.

## Evidence and bounded scope

Only explicitly attested recorded fields acquire reviewed status. Unreviewed measurements and unknown interfaces remain explicit. Case exterior aliases never fill a mating seat. Stem height remains unknown until the shared datum exists. Package inclusion and fixed/replaceable interfaces stay separate. A product photo cannot establish fit. Image publication requires a documented permission claim plus review of its exact supporting source; unknown-use imagery is omitted, not edited to remove branding.

Case, hand and crown publications remain research-only because the broader application and mating chains are not implemented. Other slots need reviewed rendering dimensions before they become eligible for physical replacement. Legacy catalogue records require numeric display/manufacturing fields; missing display sizes use a zero sentinel with research-only protection, typed evidence retains unknowns, manufacturing defaults are explicitly unqualified and export is disabled. These placeholders must not be used as manufacturing limits or supplier claims. Fit-first matching remains the bounded DF3 engine.

Draft backups preserve captures and evidence assets. The review/publication journal is separate and is **not** restored by a draft backup. Cross-profile review-journal portability, authenticated review and damaged-storage repair remain follow-up integration work; no cloud sync, remote publishing or supplier account integration was added. Reloading review history refreshes another tab's publications; automatic cross-tab push updates are not provided.

## Two official-source supplier pilots

See [pilot research](research/df6-supplier-pilot-2026-10-13.md).

- [Namoki NMK931 Steel Finish](https://www.namokimods.com/products/nmk931-field-watch-case-bundle-steel-finish): recorded exterior dimensions and named package contents; exact checkout price/stock, shipping, caseback inclusion and mating interfaces remain unknown.
- [SeikoMods CT728 Oyster](https://www.seikomods.com/shop/ct728-homage-alpinist-case-set/): exact Oyster SKU/variation, dated GBP69/in-stock seller observation, bracelet/back/crowns included and crystal excluded. President is a distinct variant. Mating dimensions, South African shipping and tax remain unknown. Remote photo usage permission is unknown, so no product imagery was published.

Both import files are under docs/examples/df6-*-supplier-intake.json. They are real, unlinked source captures, not fixtures and not automatically approved. Browser acceptance imported both. A narrowly checked Namoki exterior/variant review was explicitly labelled **Codex pilot check**, published for testing, verified after reload in matching as Needs evidence, then withdrawn. That audit remains; no pilot publication remains active after acceptance. SeikoMods remains awaiting review. The earlier synthetic DF5 example remains isolated in the queue.

## Verification

- Full suite: **141 files / 1,273 tests passed**.
- New DF6 checks: **33 tests** across domain, durable journal/store, UI and pilot. An additional three DF5 UI regressions were included in final focused verification.
- Checks cover exact approval, stale captures, immutable/ambiguous corrections, rejection, restart publication hydration, withdrawal, failed persistence, cross-tab conflicts, journal tampering, source/variant/commercial/image gates, matching discovery, and unchanged assembly/sourcing.
- Repository lint, production build and diff whitespace check passed. Existing third-party annotation/bundle-size advisories remain.
- Browser: manual reviewer/reason and field checks, separate approval/publication, reload persistence, published case discovery as Needs evidence, blocked research-only Preview, and withdrawal were exercised. Keyboard activation and a short viewport were checked. No browser console errors observed. Original user tab was not reloaded; testing used a separate tab.
- Screenshots: workspace outputs/df6-review-2026-10-13.png and outputs/df6-short-window-2026-10-13.png. Logs: outputs/df6-*.log.
- Baseline backup: outputs/df6-checkpoint-20261013T064341Z, 116 hashed working files plus ZIP/HEAD patch. No GLBs changed.

## Human screen-reader checks

1. Find a saved draft and expand Review & local publication; hear current capture and publication status distinctly.
2. Reach reviewer/reason fields and each evidence checkbox; unknown fields must be announced as disabled, not approved.
3. Distinguish source transcription, commercial observations, image permission and physical fit.
4. Approve checked fields, then separately reach Publish; hear success, refusal and stale-capture recovery.
5. Prepare/save a correction; verify new-capture/linked-entry language and that old approval is not reused.
6. Reject and withdraw independently; understand whether a prior publication remains active.
7. Navigate retained history and reload controls at a short window height.
8. Confirm draft backup wording does not imply that review decisions were exported or restored.

Human screen-reader checks remain pending. DF5's normal-browser attachment/backup download delivery check also remains open. DF7 is next: final concept/known-case/incomplete-case journeys, Engineering/HD/BOM agreement, remaining fit/application scope, portable data/review reconciliation and release acceptance. The separate Blender realism task stays planned after DF7.
