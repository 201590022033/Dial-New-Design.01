# Part discovery and independent presentation colours

Implemented 2026-10-03. These are presentation and sourcing-discovery controls, not new fit evidence.

## Where to find the controls

Select a component in Engineering mode, then choose **Suppliers → Find this part online**. Saved listings also have **Find a cheaper alternative online**. The editable query includes the selected component size and applicable movement, colour and hand style. AliExpress, eBay and Google links open external searches; there is no scraping, paid search service, automatic purchase or supplier contact.

Search-open time is shown in the current discovery panel; it is not a price-check timestamp or a persisted research log. Imported price snapshots retain their own captured time and separate shipping amount in the supplier records. Use the existing `tools/aliexpress/capture-listing.js` helper / bookmarklet on an item page, then Import its JSON. Captures stay unverified; supplier onboarding is not required. Only HTTPS AliExpress URLs without credentials are accepted. Unknown shipping and unknown delivery lead time remain unknown, not zero / fourteen days. Compare the exact variant's item price plus shipping to South Africa, checkout discounts and any taxes/duties. Estimated Rand conversions are not guaranteed checkout quotes. Finding a cheaper advertisement does not approve compatibility.

Style's **Independent Colours & Bezel** controls separate dial surface, case/crown, bezel metal, main hand metal/custom colour, hour markers/numerals and generated scale ticks/numerals. Scale colour applies to both pilot slide-rule rings and survives program switches. The case and dial do not change size when colours change. Hand style selection remains separate from subdial hand style.

For a silver dial and rose-gold case, choose those colours independently. For an unadorned rose-gold case, restore the archetype bezel and choose rose-gold case / bezel metal. For silver diamond-set presentation, choose silver case and silver bezel metal, then Diamond-set bezel. The 34/42 mm authored gemstone GLB geometry is reused with isolated live PBR metal materials; a second identical silver GLB file is not required. Gemstones retain their dielectric material. Other diameters use scaled provisional presentation, not verified gemstone seating.

Custom hour-marker colour replaces marker lume appearance, not hand lume. Compact sterile NH05 dial assets have no baked marker meshes: a coloured-marker request uses a size-preserving procedural dial/marker preview. Other baked GLB indices/numerals are recoloured in isolated scene clones. Lettering/logo colour is not changed by marker colour.

## Verification

Regression coverage includes mixed independent metals, 34 mm NH05 / 24.5 mm dial search constraints, URL encoding, sterile ladies marker geometry and colour persistence across scale programs. Existing scale envelopes, main hand swapping and subdial tests remain in the full suite. Browser acceptance covered silver dial / rose case / silver diamond bezel / rose numerals, Mercedes → baton → Mercedes in HD, Engineering colours and component discovery.

Remaining scope: no automated live offer ranking or fetched supplier stock, no verified new supplier SKU, no physical plating/gemstone specification. Existing material/demand-rendering limitations and fit-evidence gates still apply. This implementation remains local until explicitly committed and pushed.
