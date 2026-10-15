# Next step: supplier pilot and small usability improvements

Proposed 14 October 2026, Africa/Johannesburg. Repository baseline: `284ba87397b33d0f7ceff7d8c905fe4f423214d4`. This is a plan and research checkpoint; no application code, supplier publication or watch design was changed.

## Recommended outcome

Take one exact supplier product through capture, local review, catalogue discovery and the supported Preview/Apply/Undo path. Use the result to choose one small improvement. Once that works, expand to a useful batch of roughly five to ten exact products or variants with good source information.

The existing DF5–DF7 intake, evidence, review, local publication and complete-backup workflow should be reused. The current bottleneck includes both missing supplier measurements and incomplete software fit assessments. Crystal diameter/depth comparison is the most complete positive dimensional path. Other parts have additional unresolved checks; case, hand and crown supplier publications remain research-only. A preview or an applied design selection does not by itself establish physical fit.

## Milestones

| ID | Work | Evidence of completion |
|---|---|---|
| SO0 | Inspect the supplied listing: exact product/shop/variant, overlap with existing records, available dimensions/drawings, package contents and usefulness to the current design. | A concise coverage assessment with every unknown explicit; choose the first exact product and identify missing data separately from missing software checks. |
| SO1 | Prepare and validate the first real intake draft using the current import format. Retain source URLs/text and date; keep dimensions, material, package inclusion, price, shipping and stock distinct. | An importable draft with source-backed fields, no invented dimensions or merged variants, and a duplicate/reload check. Image references retain their documented use basis. |
| SO2 | Review eligible source-backed fields through the existing local workflow, then test catalogue discovery and whichever Preview/Apply/Undo steps that product supports. Confirm BOM and save/reload/backup behaviour. | One demonstrated journey, or an exact explanation of its blocker and a bounded next data/code task. Expand the supplier batch after this first journey works. |

Research can start without changing the selected watch. Capture the actual current design before testing a replacement. Keep tests isolated until a deliberate product application is appropriate. Supplier identity comes from the exact shop/product/variant, not a generic marketplace name.

## First supplied link

- User supplied: `https://a.aliexpress.com/_ExL2EIm`.
- The browser tool reported destination `https://www.aliexpress.com/item/1005010782647157.html`, but its site-safety policy blocked access. The product page was not read.
- Product title, shop, selected variant, component category, measurements, price and availability remain unknown. No supplier draft or publication has been fabricated from the link alone.
- Safe next input: pasted listing title/shop/variant/specification text, or user-provided screenshots/saved PDF. Record the supplied capture as the source, with its date; do not claim independent live-page verification.

## Small improvement queue

Pilot update, 15 October 2026: the user supplied a screenshot and selected **Rose Gold 33mm**. The [LUOJIANI pilot checkpoint](research/so1-luojiani-33-rose-gold-2026-10-15.md) records selected option A2, screenshot-based SO0 findings and a schema-valid SO1 import draft. In-app import and SO2 remain pending because the browser tool rejected local dashboard access. No live listing verification or fit approval is claimed.

1. **A clear next action for blocked parts.** If the pilot exposes confusing result text, show whether a supplier measurement is missing or a software check is unsupported, and state the specific next step. Preserve the existing evidence rules and four matching groups.
2. **Smaller production delivery.** Exclude the 28.2 MB development-only `face-review` folder from production copying while retaining its source files and historical backups. The measured 73.4 MB build would become approximately 45.2 MB. Verify runtime models and saved bindings before treating this as complete.
3. **Chronograph date layout.** Plan a separate default-layout fix for the existing date/right-subdial overlap, preserving saved designs and making any new layout explicit. This does not block the supplier pilot.

A supplier pilot should determine the next matching expansion. Add one complete, evidence-supported component assessment at a time; avoid another broad catalogue or rendering overhaul.

## Existing foundations

- [DF7 integrated release and combined supplier backup](DF7-RELEASE-CHECKPOINT-2026-10-13.md)
- [DF6 local review and publication](DF6-SUPPLIER-REVIEW-2026-10-13.md)
- [DF5 durable intake](DF5-SUPPLIER-DRAFTS-2026-10-13.md)
- [DF3 matching limits](DF3-MATCHING-2026-10-12.md)

The earlier checkpoint documents retain their historical milestone status; the current roadmap records the subsequent commits and completed GLB work. Real screen-reader, physical-fit and long-session performance qualification remain separately tracked.
