# DF5 — durable supplier intake and evidence queue

Implemented locally on 13 October 2026, Africa/Johannesburg. Started on 12 October. No commit or push performed. Existing work was retained. Three independent agents wrote intake, persistence/store, and UI deliverables; the coordinator finished integration, corrected boundary and UI issues, and performed acceptance after the worker sessions ended before verification.

## Using it

Open a component's **Suppliers** tab and expand **Supplier draft intake & local review queue**. Create a manual draft, import the existing AliExpress capture JSON file, or paste/import an externally AI-extracted intake record. The section, manual form and import form use native disclosures to keep the tray compact.

Manual entry records supplier/product identity, an exact variant or explicit unknown, HTTPS source, capture date, component type, source text and optional measurements/commercial amounts. Catalogue association is optional and deliberate; changing component type clears it. **Extract suggestions from pasted text** proposes only explicitly labelled numeric measurements. This is offline parsing, not an AI model. Suggestions require selection and conflicting values require clarification.

**Prepare** shows the unverified record before **Save draft** writes it. Drawings and PNG/JPEG/WebP photos can be attached to an explicitly selected retained source. Source text and raw JSON are also saved as evidence files. New captures do not alter the assembly, sourcing selection or live catalogue. The old immediate AliExpress listing/selection importer now routes through this queue; existing saved offers remain available.

The queue displays exact identity, field values with units, unknown reasons, dated sources, package inclusion, price and shipping separately, raw source captures, attachment metadata and earlier capture versions. Image-use permission stays unknown unless a documented claim is supplied; claims remain quarantined for review. Remote images are not fetched. AI confidence and imported review claims cannot establish fit or publish a part.

## Identity, validation and persistence

The existing SupplierDraft v1 contract remains unchanged. Intake wraps it with separate commercial snapshots and raw captures, rather than creating another catalogue or assembly truth. Incoming fields are unreviewed and fit qualification is not assessed. Commercial snapshots are unverified and cannot order directly. References, dated sources, offer associations, fixture isolation, positive dimensions and supported units are checked. AliExpress URL product ID must match the captured product ID.

Known exact supplier/product/variant identities retain capture revisions. Different variants and seller identities stay distinct. Unknown variants and generic marketplace seller identities only deduplicate identical normalized captures; no variant is guessed. Synthetic examples have a separate identity namespace. Identical reimport does not add a version or drop previously attached evidence. New evidence on the same capture is retained in a new revision.

IndexedDB stores queue records and actual Blob assets in one transaction. A generation comparison rejects stale writes from another tab. Operations are serialized within a store. State changes only after persistence succeeds; unavailable storage, quota failures, invalid evidence or corrupt hydration cannot claim a successful save. **Reload saved queue** permits recovery after another tab saves. Corrupt storage is retained and blocks writes; automated repair of damaged storage is not included.

Storage belongs to this browser profile and app origin, independently of .dial project files. **Export draft backup** includes actual evidence bytes; restoring merges validated drafts and assets without publishing. A backup can be restored into another clean profile/site. Clearing browser data removes local drafts, so export provides portability; this is not cloud sync.

Bounds: 10 MB per evidence file, 40 MB per capture, 100 MB total evidence, 200 identities, 100 captures per identity. Unsupported executable/vector image formats are refused. Capture-file import is limited to 2 MB and backup-file import to 150 MB.

## AI-assisted capture and examples

Externally produced structured extraction can use the existing SupplierDraft shape or an intake envelope `{ draft, offers, captures }`. Preserve the actual source text/JSON and exact dated evidence source for every recorded field. Missing measurements need unknown states and reasons; photos cannot prove physical interfaces. Include offer snapshot bodies for all draft offer references. Unlinked commercial data remains in raw captures rather than inventing a catalogue component.

Examples under docs/examples:

- df5-recorded-supplier-intake.json: illustrative recorded fields, still unreviewed and not fit assessed.
- df5-incomplete-supplier-intake.json: unknown exact variant, dimensions and package contents.

Both are explicitly synthetic and must not qualify or publish a real product. No model endpoint, supplier account, broad scraper or remote extraction service is configured by DF5.

## Verification and limits

- Full regression: **137 files / 1,240 tests passed**. Focused DF5 tests: **18 passed**, covering capture/identity/units, source and offer rejection, persistence restart, asset bytes, dedup/revisions/variants, backup round-trip/tampering, failed writes, corrupt hydration, concurrent writes and unchanged assembly/sourcing/catalogue.
- Repository lint and production build passed; the existing bundle-size advisory remains.
- Browser: imported the incomplete synthetic JSON through a file chooser, attached a 68-byte test PNG, saved, reloaded the isolated test tab and found the draft with its text, JSON and image evidence. Reimport retained one version and all three assets. Manual draft preparation without a price/currency and keyboard disclosure/activation were checked. No browser console errors observed.
- The in-app browser download event did not complete during the individual evidence download check. End-user attachment/backup download delivery remains to confirm in a normal browser; actual asset and backup byte round-trips pass in automated tests. The test session was recovered without changing the user's original design tab.
- One clearly labelled synthetic incomplete example remains in the local queue from acceptance. No real supplier records were published.
- Desktop screenshot: workspace outputs/df5-review-queue-2026-10-13.png. Short-window evidence: outputs/df5-short-window-2026-10-13.png. Logs: outputs/df5-*.log.
- Baseline backup: outputs/df5-checkpoint-20261012T192018Z, 104 hashed files plus ZIP/HEAD patch. Captured shortly after dispatch, before the new implementation files were written. No GLBs changed.

## Human screen-reader checklist

1. Expand Supplier draft intake; hear saved-count/loading/error status and the local-storage explanation.
2. Reach manual and import disclosures; hear exact-variant unknown state and disabled variant field correctly.
3. Prepare a draft and read units, unknown reasons, source/date and unverified status.
4. Select a source for attachments, choose a file, and hear Save success or a storage error.
5. Navigate saved drafts and earlier versions; distinguish synthetic examples from supplier evidence.
6. Read price separately from shipping; unknown shipping must not sound like free shipping.
7. Reimport and hear duplicate feedback; reload and confirm the draft persists.
8. Reach evidence download, backup export/restore and queue reload controls at a short window height.

Real screen-reader confirmation remains pending. DF6 is next: reviewed corrections/rejection/publication/history and a bounded supplier pilot. DF7 retains integration, expanded fit/application scope and final accessibility/HD acceptance. The Blender realism task remains planned after DF7.
