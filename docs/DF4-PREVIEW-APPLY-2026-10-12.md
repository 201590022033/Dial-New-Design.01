# DF4 — deliberate catalogue matching and Apply

Implemented locally on 12 October 2026. No commit or push performed. The lead integrated three independent deliverables: pure replacement preparation, transient workflow store, and results UI. Existing unrelated changes were retained.

## Delivered

In Parts → select a component → Suppliers, **Design & fit intent** now provides **Find closest parts**. Search captures the shown preferences without needing to save them. Four native disclosure groups show counts, fit reasons and evidence: Fits recorded dimensions, Changes required, Needs evidence, Incompatible. Appearance scores compare catalogue metadata, not photographs. Missing measurements remain explicit.

An explicit Preview button, double-click, Enter or Space previews a candidate. Hover, scrolling and single-clicking its card never render a candidate. Preview shows actual before/after changes and eligible supplier offers, with No supplier yet as the default. Cancel clears only the workflow's preview. The centre banner directs Apply to matching results, where the change summary and supplier selection are available; its Cancel also handles a development reload's orphaned preview.

Apply rebuilds the candidate from the current canonical design rather than committing the earlier preview clone. It rechecks the original target, selected case, saved preferences, actual proposal, fit evidence, catalogue record, selected supplier offer, physical locks and style locks. Unrelated current edits survive. Changed proposals or critical evidence refuse Apply and explain the need to search/preview again. Research-only records, wrong slots, incompatible candidates and missing/zero measurements that would erase authored positive dimensions cannot be applied.

Canonical Apply marks the design dirty and records one Undo transaction. Undo/Redo restore both the assembly and affected supplier selections, including originally absent selection keys, while retaining unrelated sourcing. Procurement remains in its separate sourcing document. The legacy preview Apply cannot commit a matching preview clone.

## Scope and limits

Needs-evidence choices can be applied as **design choices** and retain their unverified status. Nothing certifies pressure resistance, sealing or physical installation. DF3's positive dimensional path remains limited to reviewed crystal diameter/depth checks; the broader mating checks in the DF3 checkpoint remain open. The existing catalogue therefore offers many useful exploratory choices without producing false fit approvals.

Preserve dimensions and appearance remain binding on actual changes, including visual asset changes. To explore a different appearance, clear Keep my design appearance before searching. Changes to several components or global case settings are currently refused by this single-component permission scope, even if the target is a hand set or case. The error names the additional scope. Extending that workflow requires an explicit multi-component change summary and permission model; this is tracked for DF7 rather than silently changing surrounding parts.

Saved preference and assembly/sourcing serialization formats are retained; transient results and previews are not saved. No supplier ingestion, publishing, image licensing or Blender/GLB work was included.

## Validation

- Final full regression: **134 files / 1,222 tests passed**. Focused DF4 transition/store/UI/history checks: **36 tests passed**. Repository lint, final integration lint and production build passed. Build retains the existing large-chunk advisory. Logs are in workspace outputs/df4-*.log.
- Engineering browser at 1280×800 and the user's normal short viewport: local dial search, explicit preview, keyboard preview, Cancel, Apply and Undo verified. Original canonical design restored after the check; temporary viewport override removed. No browser console errors observed.
- Screenshot: workspace outputs/df4-preview-2026-10-12.png; short viewport: outputs/df4-short-window-2026-10-12.png.
- Backup: workspace outputs/df4-checkpoint-20261012T190554Z contains 94 hashed files, ZIP, HEAD patch and manifest. Captured after delegated work began, not a pristine before-start snapshot.

## Human screen-reader checks still required

1. Reach Suppliers and Design & fit intent; hear preference labels and selected search target.
2. Search and hear the result count/status once; inspect all four groups and their expanded state.
3. Read missing, assumed and reviewed evidence without interpreting Needs evidence as fit approval.
4. Preview using Enter/Space; confirm focus moves to the preview heading and the changes are understandable.
5. Choose a supplier or No supplier yet; reach Apply and Cancel in a short window.
6. Cancel and confirm focus returns to the candidate; Apply then Undo/Redo and confirm design/sourcing announcements remain understandable.
7. Edit or lock a target during preview; hear the refusal and recovery instruction without losing the latest edit.

HD visual acceptance remains in DF7; this browser pass used the Engineering renderer.

DF5 is next: durable supplier drafts and evidence capture. DF6 reviews/publishes records. DF7 integrates the full journeys, expanded matching/application scope and final accessibility acceptance. The separate watch-realism task remains planned after DF7.
