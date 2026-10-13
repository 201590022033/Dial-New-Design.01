# Compact supplier onboarding and price-capture plan

## Operating principle

Keep **components**, **visual assets**, **suppliers**, and **commercial offers** separate:

- A component is stable engineering data: dimensions and compatibility.
- A visual asset is a reviewed GLB or procedural representation.
- A supplier profile records who can supply which broad categories.
- A supplier listing is a timestamped commercial snapshot for one component.

This prevents the catalogue becoming a copy of every storefront. The app keeps a small supplier directory and captures only representative, selected, or build-critical offers.

## Affordability model

Prices are guidance, not quotations. Every offer stores item price, currency, shipping destination, shipping price (or explicitly unknown), variant, and capture time. Display:

1. Item price in its original currency and approximate Rand.
2. Known shipping separately.
3. Estimated import VAT reserve separately.
4. Product-specific duty and handling as unknown until confirmed.
5. A stale badge after 14 days; re-check before ordering.

Rank affordability by **known landed subtotal**, never by AliExpress teaser price alone. An offer with unknown shipping must rank below a similarly priced offer with confirmed reasonable shipping.

## Small initial supplier cohort

Maintain roughly three to five active profiles:

- AliExpress marketplace: budget discovery across all categories.
- NamokiMODS: broad compatibility reference and fallback.
- DLW Watches: style breadth.
- Crystaltimes / SeikoMods: cases, crystals and interfaces.
- Lucius Atelier: distinctive dials, hands and cases.

Profiles are candidates until a trial order or sufficient evidence confirms communication, delivered quality, packaging, dimensional accuracy and after-sales handling. Do not bulk-import their catalogues.

## Onboarding stages

1. **Candidate:** record storefront, coverage and typical price position.
2. **Evidence capture:** save two or three representative offers per useful category.
3. **Compatibility review:** verify drawings and critical interfaces.
4. **Trial:** place a small order and record actual landed cost and delivery time.
5. **Approved:** retain only useful offers; archive stale or discontinued listings.

## AliExpress capture workflow

1. Run `node tools/aliexpress/build-bookmarklet.mjs` once.
2. Create a browser bookmark named **Capture for Dial Designer**.
3. Paste the contents of `tools/aliexpress/capture-listing.bookmarklet.txt` into the bookmark URL field.
4. On an AliExpress item page, select the exact variant and set delivery to South Africa.
5. Click the bookmark. Confirm item price, currency, variant and shipping.
6. The helper downloads a timestamped JSON file and also attempts to copy it.
7. In Dial Designer, open **Suppliers → Supplier drafts**, confirm the component type, and import the JSON into the local review queue.

DF5 routes new captures into a durable local review queue. Import no longer adds a live commercial listing or selects it for the watch. Existing saved listings remain available. Drafts retain the source, capture date, exact variant or explicit unknown, commercial snapshot and missing engineering measurements. DF6 handles review and publication; import cannot establish compatibility.

Manual entry and validated externally AI-extracted draft JSON feed the same queue. Offline text suggestions are transcription aids, not an AI model or a fit assessment. Repeated exact captures are deduplicated; later evidence for the same exact variant is retained as another capture revision. Unknown variants are not guessed or merged across different captures.

Drafts and evidence attachments belong to this browser profile and app origin, independently of any .dial project. Export a supplier-queue backup to move them or protect against browser-data removal. Local saving is not cloud synchronisation. Image permission must have its own evidence; a saved image or removed branding does not establish permission.

## Acceptance criteria for a supplier listing

- Canonical item URL and seller/store name.
- Exact selected variant.
- Item and shipping amounts stored separately.
- Destination and timestamp.
- Critical dimensions recorded or explicitly missing.
- No claim of verified compatibility without engineering evidence.


## DF6 local review and publication

Saved draft entries now provide explicit field review, immutable corrections, rejection, local publication and withdrawal, with reviewer/reason and dated capture history. Publication never certifies missing interfaces and never selects a supplier for the watch. Commercial and image permission claims require separate checks; unknown-use imagery is omitted. A newer capture requires a fresh review.

Review/publication decisions persist in a separate local journal and restore into the existing catalogue on startup. Draft backups contain capture/evidence data, not review decisions; they do not automatically publish records when restored. Use the [DF6 checkpoint](DF6-SUPPLIER-REVIEW-2026-10-13.md) for current limitations and real screen-reader checks. The bounded [official supplier pilot](research/df6-supplier-pilot-2026-10-13.md) covers Namoki NMK931 Steel and SeikoMods CT728 Oyster without treating case outside diameter or package contents as mating evidence.


## DF7 complete workspace backup

**Supplier workspace backup & restore** now exports drafts, retained captures, evidence bytes, review history and local publication state together. Prepare and inspect counts before explicitly restoring. Restore supports an empty workspace or an exact duplicate; different nonempty data is retained and replacement refused. The legacy draft-only export remains available separately. Data automatically migrates into a single local database; earlier databases are retained for recovery. See the [DF7 checkpoint](DF7-RELEASE-CHECKPOINT-2026-10-13.md) for validation, release boundaries and manual checks.
