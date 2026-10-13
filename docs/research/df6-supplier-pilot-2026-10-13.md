# DF6: bounded official supplier intake pilot

Captured on 13 October 2026 at 06:51:05 UTC (08:51:05 Africa/Johannesburg). These are two real supplier research records for manual import into the local review queue. They are unlinked, unreviewed drafts with `offers: []` and `fitQualification: not-assessed`; nothing is inserted into the live catalogue, assembly or sourcing plan. No supplier was contacted and no purchase was made.

## Namoki: NMK931, Steel Finish

[Official product page](https://www.namokimods.com/products/nmk931-field-watch-case-bundle-steel-finish) · [Import record](../examples/df6-namoki-nmk931-steel-supplier-intake.json)

The page identifies a steel 38 mm field case with 20 mm lugs. It names a sapphire crystal, crown, integral stationary bezel/rehaut, back gasket and spring bars. A back gasket does **not** establish that the caseback itself is supplied; that inclusion remains unknown. The 9.2 mm thickness excludes the back. No mating-seat tolerances were established.

S$118 appears on this product-specific page, but exact SKU/checkout pricing was not confirmed; the normalized purchase price remains unknown. Backorder text appears alongside a purchase control, so availability remains unknown. South African shipping/tax remain unknown; a shipping threshold is not a destination quote. The official JSON endpoint required connection verification; it was not bypassed. No verified direct photo URL was retained.

## SeikoMods: CT728, Oyster bracelet variant

[Official product page](https://www.seikomods.com/shop/ct728-homage-alpinist-case-set/) · [Import record](../examples/df6-seikomods-ct728-oyster-supplier-intake.json)

This 39.5 mm case excludes crown/guards from that diameter. The package contains a back, two crowns, fitted rotating compass ring and Oyster bracelet. Crystal, dial, hands and movement are separate. Nominal 28.5 mm dial and 32 mm crystal recommendations are recorded as recommendations, **not measured seats**. Thickness assumes a separately purchased flat crystal.

Official embedded variant data identifies `CT728OYSTER`, variation `618364`, at GBP69 with an in-stock flag. These are dated seller observations, not a reserved order or landed quote. Shipping/tax remain unknown. The President alternative is separately identified as `CT728PRESIDENT`, variation `618365`, with an out-of-stock flag; it must not merge with Oyster.

## Evidence, imagery and remaining checks

Both records explicitly leave crystal/dial seats, cavity, stem height, tube/back threads, gasket seats and bezel interfaces unknown. Case outside diameter cannot fill those gaps. Package inclusion does not establish interchangeability. Seller water-resistance statements were not converted into assembled-watch certification.

The CT728 official photo is retained only as a remote URL with unknown usage permission. No image bytes were downloaded, edited or published, and no logo was removed. Permission/restrictions require documented review before imagery is published. The Namoki record has no image reference rather than an invented asset.

The imports retain dated source references, concise research paraphrases and raw commercial observations. Explicit field correction/rejection and commercial review belong to the review workflow. To qualify physical fit, obtain exact variant drawings or measured samples for all relevant mating interfaces; confirm delivery terms and current availability before procurement. These pilot files are not automatically approved examples.
