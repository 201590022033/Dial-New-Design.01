# DF7 — integrated design-first release candidate

Software implementation and automated/browser acceptance completed on 13 October 2026, Africa/Johannesburg. This checkpoint accompanies the DF7 commit and push requested by the user. It includes the earlier pending slider, diver/pilot marking, deliberate-preview and navigator work that DF0–DF6 build upon. The separate watch-GLB refinement task has not started and no GLB files changed.

## Integration closed

- Concept, selected-case and incomplete-case search journeys pass through deliberate Preview, current-state Apply, supplier selection, Undo/Redo and .dial round-trip without promoting missing evidence or losing pilot scales/appearance.
- Undo/Redo and explicit document loading/import/reset end temporary component/archetype/version views. Losing ownership clears the matching ticket as well, so Engineering and HD cannot keep showing an old matching preview after history navigation. Current-state crown revalidation remains supported.
- Engineering component adapters consume the current catalogue. Supported supplier selections retain a validated display/reference snapshot in the design, so withdrawn or unavailable local catalogue entries do not make an authored component disappear on save/load. This snapshot is not catalogue registration or fit qualification.
- Published solid dial/crystal selections retain the authored legacy display width when no supplier width measurement exists; physical fitting evidence remains unknown. The visible printed dial aperture is correctly distinguished from the full physical dial blank.
- Complete supplier workspace backup includes drafts, exact captures, actual evidence blobs, review history and publication state. Preparation validates all references/content and shows counts before explicit restore. An identical backup is a no-op. Differing nonempty workspaces refuse replacement; use a clean workspace rather than implicitly merging or discarding decisions.
- Queue and review persistence now share one IndexedDB workspace. First use copies both earlier stores together, without deleting legacy databases. All future edits use the new workspace; restore commits both documents and evidence in one transaction with generation checks. Older-version tabs should be closed before migration; legacy databases are retained for recovery and are not live synchronization targets.
- Draft-only backup remains under a labelled legacy disclosure. It does not restore review decisions. Combined backup preserves ordered review annotations, which are not authenticated identities or digital signatures.

## Validation

**145 test files / 1,299 tests passed**, repository lint and production build passed. DF7 adds 26 checks across release journeys, combined backup validation, restore orchestration and backup UI. Existing bundle-size/third-party annotation advisories remain; no new failing checks.

Browser acceptance uses isolated tabs, keeping the user's original tab/design intact:

1. Existing three draft entries, evidence and three review/publication/withdrawal history entries migrated intact.
2. HD WebGL renderer loaded. Explicit keyboard Preview, Apply and Undo worked in HD without console errors; the baseline design was restored.
3. Complete backup downloaded successfully to Downloads/supplier-workspace-backup.json (84,968 bytes for the acceptance dataset).
4. Downloaded backup was prepared in a clean localhost origin, with drafts/evidence/history/publication counts shown before restore. Restore completed with 3 drafts, 7 evidence files and 3 history entries, with no active publications. Reload retained all records and the withdrawn-publication history; identical-backup protection is covered by automated and browser checks.
5. Desktop and short-window keyboard checks cover the backup confirmation and cancellation/restore controls.

Artifacts live in the chat workspace outputs/df7-*.log and df7-*.png. Baseline protection: outputs/df7-checkpoint-20261013T071515Z, 129 hashed working files plus ZIP and HEAD patch. Earlier unrelated work was retained.

## Release boundaries and remaining human checks

This is a software release candidate, not physical fit or manufacturing certification. Case/hand/crown supplier publications remain research-only; the positive fit path is still the reviewed crystal diameter/depth comparison. Broader mating chains, pressure/sealing tests, supplier trial orders, dated checkout/shipping confirmation and manufacturing measurements need real evidence. No case exterior diameter or product image fills those gaps.

Real screen-reader acceptance remains a manual release gate. Check:

- Design components/Case & hardware group state, family navigation, hide/show and locks.
- Intent fields, case evidence and target; search status and all four result groups.
- Keyboard Preview focus, change summary, supplier selection, Apply/Cancel and Undo/Redo.
- Draft intake unknown variant, source/date/units, evidence attachment, save/duplicate/reload announcements.
- Review field eligibility, commercial vs image permission checks, corrections, stale approval, rejection, publication/withdrawal and history.
- Complete-backup preparation counts, restored-publication warning, explicit Restore/Cancel, nonempty-workspace refusal and focus at a short window height.

Authenticated reviewer identities, arbitrary nonempty workspace merge, damaged-storage repair, automatic cross-tab push updates and cloud sync remain future scope. Normal complete-backup download/restore is now browser-verified; other export paths such as legacy per-file evidence/render packages should still be checked in the user's normal browser before relying on them.

## Next: separate watch-model realism task

The preserved user brief is docs/briefs/WATCH-REALISM-USER-BRIEF-2026-10-12.txt, planned in WATCH-REALISM-PLANNED-AFTER-DF-2026-10-12.md as VR0–VR5. Start VR0 only after the DF7 commit/push is confirmed. Do not treat that work as another DF milestone or regenerate GLBs during this release checkpoint.
