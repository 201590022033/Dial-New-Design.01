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
7. In Dial Designer, select the matching physical component, open **Suppliers**, and import the JSON.

The import is intentionally unverified. It does not change component geometry and cannot establish compatibility by itself.

## Acceptance criteria for a supplier listing

- Canonical item URL and seller/store name.
- Exact selected variant.
- Item and shipping amounts stored separately.
- Destination and timestamp.
- Critical dimensions recorded or explicitly missing.
- No claim of verified compatibility without engineering evidence.
