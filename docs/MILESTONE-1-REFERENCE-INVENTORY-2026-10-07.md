# Milestone 1: original-reference research checkpoint

7 October 2026. **Partial; full graduation/typography gate NOT passed.** Research and documentation only. No application rendering, supplier catalogue, GLB or runtime state changes were made in this milestone. Preserve Milestone 0's five uncommitted source/test edits.

## Durable deliverables

- [Reference manifest](research/slide-rules/reference-manifest.json): selected identities, URLs, PDF fingerprints, page numbering, confirmed facts and unresolved details.
- [Machine-readable research inventory](research/slide-rules/graduation-inventory.json): 122 records (106 numerical labels, 9 reference identities, 7 excluded annotation identities), plus 108 consecutive interval-review sectors covering all four main rings from 10 to the single 100/10 seam.
- [Research validator](research/slide-rules/validate-inventory.mjs): unique identities, valid sources, decade/seam handling, full sector-review coverage, abbreviated labels, exclusion flags and mathematical consistency. This does NOT validate every pictured tick.

This is not a complete graduation inventory: minor/intermediate ticks, independent interval counts and physical typography metrics remain unverified. Unknowns are deliberately `null`; none may silently become generic subdivisions, zero dimensions or runtime defaults. The application does not import these files.

## Selected originals and differences

| Detail | Citizen Skyhawk | Classic Navitimer |
| --- | --- | --- |
| Single chosen identity | JY8078-01L, Canada official front artwork; exact same model's official Spain image corroborates legibility | Coloured training-disc illustration, viewer page 2 of the exact user-selected booklet. This is an identified illustrated layout, NOT a verified named production watch |
| Main outer printed numbers | 10-25 by ones; 30,35,40,45,50,55,60,70,80,90 | 10-25 by ones; 30,35,40,45,50,55,60,65,70,75,80,85,90,95 |
| Main inner printed numbers | 10-25 by ones; 30,35,40,45,50,55,70,80,90; rate reference replaces an ordinary printed 60 | 10-25 by ones; 30,35,40,45,50,55; 7,8,9 represent 70,80,90; MPH at underlying 60. NO printed inner 65 |
| Unit/reference colour observations | Inner 10 yellow; outer 10 dark text in a light box; most ordinary numbers light on dark substrate | Inner 10, outer 10 and outer 60 red; ordinary numbers/ticks black on light substrate |
| Distance writing versus pointer | NAUT./STAT. light lettering with red pointers in selected 01L front image; KM. light lettering beside a light outlined top pointer | Black distance lettering. Manufacturer text confirms red KM pointer just right of MPH; MPH shape/colour still needs independent review. Do not colour all reference pointers red |
| Typography | Curved tangent-following rows; bottom labels follow the ring rather than being automatically flipped upright | Same broad tangent-following principle, independently transcribed numbers and abbreviations; no font identity proven |
| Time conversion row | Absent from selected JY8078 front layout, corroborated by clearer official Thailand photograph. Generic U680 Model 2 has it; do not borrow it | No HH:MM row on selected training disc. Newly recovered 1967 AOPA watch layout DOES have it; keep layouts separate |
| 36-seconds reference | Not verified on selected artwork | Confirmed by booklet viewer 12 / printed 16; separate fixed reference, not an elapsed 36-second chronograph graduation |
| Original dimensions | Official case 45mm, lug width 22mm; neither gives printable annulus sizes | No original physical disc/print dimensions recovered |
| Exact fonts/hex | Not specified by retrieved source; not claimed | Not specified by scan; not claimed |

Printed numeral schedules are NOT tick subdivision schedules. A labelled 50-to-55 sector does not prove five intervals. All 108 sector counts remain pending independent source review. The original long/medium/short tick widths and lengths cannot be recovered exactly from a resized screenshot.

### Avoiding a concrete model-mixing error

Citizen's global `design-1.jpg` shows a bracelet variant with a dark fixed graduation strip and yellow distance pointers. The selected JY8078-01L front images show a white graduation strip and red distance pointers. That alternate image was inspected and **rejected as colour/tick evidence** for the selected preset. Do not merge its palette into JY8078-01L.

The adjacent RX/NO writing and H/M/L graphics are watch-function graphics, not instructions to add new calculator reference captions. They must not be copied with the slide-rule feature. Logos, wings, digital displays, subdials and hour-dial artwork stay outside scope.

## Sources and page correspondence

1. [Citizen Canada selected model](https://www.citizenwatch.com/ca/en/product/JY8078-01L.html), inspected live in the in-app browser. Main supplied photograph is only 500x625 pixels.
2. [Citizen Spain exact-model page](https://citizen.es/colecciones/radiocontrol/jy8078-01l/jy8078-01l/) and its [900x900 front photograph](https://citizen.es/wp-content/uploads/2022/07/JY8078-01L.jpg), inspected at native size. Still a perspective photograph, not vector art or a measurement drawing.
3. [Citizen U680 manual](https://www.citizenwatch-global.com/support/pdf/u680/e.pdf): printed 81-91 = zero-based indices 81-91 = viewer 82-92. All eleven relevant pages were text-extracted and visually inspected. These are generic **Model 2** operational examples, not evidence of this model's exact layout.
4. [User-selected Breitling booklet](https://www.breitlingsource.com/images/manuals/slide-rule.pdf): cached 17-page manufacturer-booklet scan. Cover viewer 1; selected coloured disc viewer 2; alternative operational ring illustrations viewers 3-4. Relevant English operational pages were visually inspected; viewer 12 / printed 16 defines seconds index 36; viewers 16-17 / printed 24-26 explain distance references. The disc's embedded image is only **600x525 pixels**; enlarging does not create detail. Fresh web retrieval failed; the local source fingerprint is recorded, not claimed freshly downloaded.
5. [Official Breitling indexed instructions](https://www.breitling.com/media/document/2/archive-archive-archive-archive-archive-archive-archive-archive-archive-archive-archive-archive-archive-navitimer_slide_rule.pdf) corroborate unit/hour operation in the search index; direct PDF retrieval failed. No modern model artwork was used to fill the chosen classic layout's gaps.

Local PDFs remain in the chat workspace's `tmp/pdfs` with SHA256 fingerprints in the manifest. Saved exact-model browser capture: `milestone-1-evidence/citizen-official-900.jpg` in that workspace. Do not treat display pixels as original ink hex specifications.

## Operational and geometry findings

Citizen's manual verifies time/distance/speed, fuel rate/quantity/endurance, distance conversion, multiplication/division, ratios and square roots. Dedicated fuel/volume conversion writing is not needed for ordinary consistent-unit rate arithmetic.

- Both main calculation rings must use the same logarithmic value mapping. Their reference origins and physical radii remain separate from mathematically derived angular offsets.
- `360*log10(2)` = approximately 108.370798 degrees: 20-to-40 and 30-to-60 match, not 180 degrees.
- HH:MM in Model 2 means true minutes (70,80,90,150,180), not decimal values 1.20 or 2.30. Its verified operation does not prove that row exists on JY8078.
- Exact distance ratios are 1.609344km/statute mile and 1.852km/nautical mile. Geometry can preserve these ratios while the group's absolute source anchor remains unresolved. Do not guess clock positions.
- Removing LBS/LB/KG, gallon/litre variants, FUEL LBS and OIL LBS removes dedicated annotations/pointers only. Ordinary co-located 35 or other numerical graduations survive unchanged. No gap filling or redistribution.

## Remaining acceptance work, in order

1. Obtain a sufficiently clear exact-model full-circle source and higher-resolution original training-disc artwork, or explicitly replace the latter with another single well-evidenced classic reference. Do not combine references to disguise a gap.
2. Count BOTH rings independently, sector by sector. Enter each minor/intermediate graduation, value/class, measured proportion and transition. The current inventory contains review sectors, not invented tick counts.
3. Measure numeral/pointer bounds and source-local coordinates: baseline/cap-height, gap to tick endpoint, radius, rotation, alignment, width/weight and spacing. Full-image region locators in the current JSON are coarse evidence locators, NOT measured anchors.
4. Keep confirmed time-row variants separate. Measure separate Citizen rate/KM/RX shapes and Navitimer MPH/KM pointer geometry and absolute distance anchor; relative KM position is now confirmed.
5. Record disclosed colour/font approximations if specifications cannot be found. Missing exact ink/font specifications need not stop verified implementation, but unresolved subdivision/layout gaps prevent a faithful-preset claim.

Milestone 2 may later implement the verified shared mathematical/state foundation without pretending these incomplete original inventories are accepted. Branded artwork must remain gated until the critical inventory gaps are closed. Simplified stays separate and unchanged.

## Verification and restart checkpoint

Actual checks: `node docs/research/slide-rules/validate-inventory.mjs` passed (122 records, 106 numerical labels, 108 uncounted review sectors; equal-ratio angle 108.370798439 degrees). Distance results were 26.069287257 NM / 48.28032km for 30 statute miles and 52.138574514 NM / 96.56064km for 60. `git diff --check` passed with only existing LF-to-CRLF notices. New research documents were also checked independently because ordinary Git diff does not cover untracked files. These are documentation/research checks only; this turn does not re-run or supersede Milestone 0's 445-test/typecheck/lint/build baseline.

Initial direct retrieval of the official Breitling PDF returned HTTP 403. Subsequent source recovery below recovered useful alternate manufacturer-text evidence without bypassing a security warning. No replacement modern artwork was substituted.

## Additional source recovery: 7 October 2026

The computer and PDF skills were used to inspect new sources, rather than infer missing artwork from a generic renderer. Changes remain research-only.

- **Citizen exact model:** [Thailand product page](https://www.citizen.co.th/html/en/products/promaster/sky/jy8078-01l.html) exposes an [856x1284 image](https://www.citizen.co.th/filebase2/022/003/0-510735-01e51ccb054533b18c2957fec39f92ae.png?md5=d84918b4b08b5dd321f0d498fa71eba2). Inspected directly in the browser at native zoom. The pictured fixed calculator ring has no HH:MM row. The hollow KM pointer on the dark inner ring is separate from RX on the white graduation strip; RX/NO are not calculator captions. This corroborates the chosen exact model, not the different bracelet image. Thailand lists case diameter 45.4mm versus Canada's rounded 45mm; neither supplies printable ring dimensions. Small print and perspective still prevent a reliable complete tick/width inventory.
- **Alternate Breitling booklet:** [manufacturer booklet copy](https://manuals.plus/m/b6d5d1d60ac6235a1e6800bfdb207105500ca0e512cbff28d725cda7e780c948) downloaded through the browser's normal Download PDF link. Shell retrieval was challenged; no bypass attempted. English viewer **10 / printed 16-17**, rendered and visually inspected, explicitly identifies **KM as the red mark just right of MPH on the fixed scale**. This resolves pointer identity/qualitative colour, not exact shape, hex or angular anchor. The 92-page file includes duplicated/unrelated material; its ring diagrams are only 84x84 raster pixels and do NOT improve tick evidence. Do not adopt the hosting page's model label as the selected original.
- **1967 AOPA Navitimer booklet:** [manufacturer scan hosted by BreitlingSource](https://www.breitlingsource.com/images/manuals/navitimer-aopa-1967-sliderule.pdf). Cover and viewers 2-6 were rendered and visually inspected. Viewer **3 / printed 6-7** describes the additional time scale; viewer **4 / printed 8-9** shows HH:MM labels from 1:10 onward. The cover also visibly shows it. This resolves why some classic Navitimer references have a time row while our selected coloured training disc does not. It is a distinct reference layout, not permission to mix its black-ring palette or rows into the selected disc.
- [Citizen's generic calculation guide](https://www.citizenwatch-global.com/support/exterior/calculation.html) cautions that some models reverse inner/outer scale arrangements. Operational formulas therefore cannot establish model-specific typography or palette.

New PDF fingerprints, page counts and source roles are recorded in the manifest. Local files: alternate booklet in `C:/Users/Deon/Downloads/b6d5d1d60ac6235a1e6800bfdb207105500ca0e512cbff28d725cda7e780c948_optim.pdf`; AOPA scan in this chat workspace's `tmp/pdfs/navitimer-aopa-1967.pdf`. Rendered review images remain scratch evidence, not artwork exports.

**Resolved:** selected Citizen time-row absence; classic watch versus training-disc time-row distinction; Navitimer red KM pointer identity and relative MPH relationship. **Still unresolved:** all independent tick counts, measured glyph/tick anchors and widths, exact fonts/ink colours, printable annulus dimensions. Fidelity gate remains false. A separate classic 1967 layout is a viable later option, but has not silently replaced the selected training disc.

No commit or push authorised for this milestone. No GLBs changed. Application/dashboard state was not changed; research tabs and the existing restored dashboard were retained for continuation. Stop here rather than start Milestone 2 automatically.

Subsequent authorised continuation: [1967 variant plan](research/slide-rules/navitimer-1967-variant-plan.json) records a distinct cover-layout identity and provisional outer 12-to-13 count from a rendered PDF detail. It does not replace the selected training disc or promote its counts into either primary inventory. All 108 primary interval counts remain unaccepted. The source has visible detail but not a sufficiently clear independently corroborated full-ring table; reference fidelity gate remains false. Milestone 2 was subsequently explicitly authorised to start; see its separate checkpoint.
