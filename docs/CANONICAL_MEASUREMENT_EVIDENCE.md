# Canonical measurement evidence register

This register separates supplier claims from engineering evidence. A value is
eligible for canonical use only when three independent confirmations agree at the
declared precision. A manufacturer page and that manufacturer's drawing are
separate documents, but not independent manufacturers; the source count and
independence are recorded explicitly.

## Current decision

The application may continue using the existing rounded movement templates for
preview and compatibility demonstrations. The three-confirmation gate now
allows selected movement envelope values to be promoted to specified canonical
inputs; case, stem, crown, pusher, dial-seat, hand-stack, crystal-clearance,
and water-resistance values remain provisional or unknown.

The supplier records currently in `src/domain/catalogue/supplierListingRegistry.ts`
are marked `synthetic-demonstration-seed`. Their AliExpress URLs and SKUs are
placeholders, not live supplier evidence, and must not be counted.

## Movement confirmations

### NH35A / NH35

| Measurement | Canonical preview value | Confirmations | Status |
| --- | ---: | ---: | --- |
| Movement outside diameter | 27.40 mm | 3 direct/derived supplier or manufacturer records | specified |
| Dial-holding spacer diameter | 29.36 mm | 1 manufacturer drawing | unknown |
| Overall movement height | 5.32 mm | 4 records | specified |
| Hour/minute/seconds hand bores | 1.50 / 0.89 / 0.21 mm at 0.01 mm precision | 4 records; one technical source reports finer values | specified at rounded precision |
| Pusher count | 0 | manufacturer function/specification | specified |

Sources checked:

1. [TMI NH35 product line](https://www.timemodule.com/en/product_line_up/mechanical/mechanical/mechanical_NH0_NH3/)
2. [TMI NH35A specification and drawing](https://www.timemodule.com/upload/category/24/spec_sheet/NH35_SS.pdf)
3. [TMI NH3 technical guide](https://www.timemodule.com/upload/category/24/technical_guide/NH35_TG.pdf)
4. [Star Time Supply NH35 listing](https://www.startimesupply.com/merchant2/merchant.mvc?Product_code=NH35&Screen=PROD)
5. [Perrin Supply NH35 listing](https://perrinwatchparts.com/en-us/products/automatic_watch_movement_sii_nh35)
6. [Spring & Dial NH35/NH38 comparison](https://springanddial.com/calibers/nh38-vs-nh35)

The library's current `1.50 / 0.90 / 0.20` values remain intentionally rounded
preview values; the specified evidence is not a license to substitute finer
manufacturing tolerances.

### VK63A / VK63

| Measurement | Manufacturer value | Confirmations | Status |
| --- | ---: | ---: | --- |
| Outside diameter | 30.80 x 29.10 mm | 2 official documents | provisional |
| Casing diameter | 29.00 mm | 1 official technical guide | provisional |
| Overall movement height | 5.10 mm | 3 official documents/pages | specified |
| Pusher count | 2 | official chronograph function | specified |
| Pusher angular positions | not stated in the checked manufacturer documents | 0 | unknown |

Sources checked:

1. [TMI VK product line](https://www.timemodule.com/en/product_line_up/quartz/chronograph/premium_chronograph_VK/)
2. [TMI VK63 product-code page](https://www.timemodule.com/en/product_code_search/?code=VK63)
3. [TMI VK63A specification and drawing](https://www.timemodule.com/upload/category/33/spec_sheet/VK63_SS.pdf)
4. [TMI VK6 technical guide](https://www.timemodule.com/upload/category/33/technical_guide/VK63_TG.pdf)
5. [TMI VK63 operation manual](https://www.timemodule.com/upload/category/33/operation_manual/VK63_OM.pdf)
6. [TMI VK63 parts list](https://www.timemodule.com/upload/category/33/parts_list/VK63_PL.pdf)

## Controlled 42 mm case set: NMK901

The current fixture (`tools/blender/test_case_42.json`) is now aligned to the
single controlled case set selected in the supplied evidence package:
`SKX007_SRPD_42mm_Case_Set_Reference.pdf` and
`SKX007_SRPD_42mm_Expanded_Engineering_Reference (1).pdf`. The package identifies
namokiMODS NMK901 as a matched SKX007/SRPD case, bezel and crown bundle.

These values are promoted to specified preview inputs, not manufacturing
approval. The PDFs are retailer/manufacturer-reference compilations rather than
toleranced NMK901 CAD, and the source package itself keeps the unmeasured
interfaces on hold.

| Measurement | Controlled value | Evidence status |
| --- | ---: | --- |
| Case diameter | 42 mm | specified for preview |
| Lug-to-lug | 46 mm | specified for preview |
| Case-only thickness | 10.2 mm | specified for preview |
| Inside lug / strap width | 22 mm | specified for preview |
| Case material | 316L stainless steel | published |
| Crystal diameter | 31.5 mm | published, family match |
| Crystal middle thickness | 5.1 mm | published, family match |
| NH35 movement envelope | 27.40 mm diameter / 5.32 mm height | specified |
| Crown head | 7.0 mm diameter x 4.9 mm depth | specified, CT208 class |
| Pusher interfaces | none | specified for NMK901 |

The controlled configuration is NH35 + 28.5 mm dial + SKX007/SRPD chapter ring.
The expanded reference records CT252 chapter-ring geometry (30.5 mm OD, 27.5 mm
ID, 2.3 mm height, 1.5 mm radial body), a 28.5 mm dial, SKX hand lengths of
8.5 / 13 / 13 mm, and nominal NH35-compatible hand bores of 1.50 / 0.90 /
0.20 mm. These hand values are nominal family-fit evidence; broach tolerances
are not manufacturing dimensions.

Still provisional or unknown: spring-bar hole center/diameter, dial-seat depth
and shoulder, chapter-ring seat depth, crystal gasket groove and axial seat,
caseback thread/gasket, crown tube thread/bore, stem engagement, and top-hand to
crystal clearance. The case remains a visual engineering reference.

## Historical mixed-case research (not used by NMK901 fixture)

The second pass added useful wiring candidates without promoting a mixed case
set to canonical:

- The [official Miyota 8215 page](https://miyotamovement.com/product/8215/) confirms a 5.67 mm movement height and shows
  3H and 6H date-window variants. The existing `miyota-8215` movement entry
  can therefore continue driving date-window presentation, while its dial-seat
  and hand-stack values remain provisional.
- [Timebalife](https://www.timebalife.com/watch-tools-parts/seiko-nh35-36-4r36a-movement-case.html) reports a 42 mm NH35 case with a 28.5 mm fitting diameter, 22 mm
  lug width, and approximately 13.5 mm thickness.
- [Horology Beats](https://horologybeats.com/products/skx-case-brushed-gunmetal) reports a different 42.4 mm case with 45.6 mm lug-to-lug,
  22 mm lugs, and 9.1 mm thickness excluding the case back.
- [iBenifit](https://ibenifit.com/products/spb185-spb187-42mm-diver-watch-case-fits-nh35-nh36-aged-bronze) and [Made-in-China](https://www.made-in-china.com/showroom/739e69819358d61c/product-detailGfdRwYWCXmrN/China-316L-Stainless-Steel-Watch-Case-with-Sapphire-Crystal.html) report additional 42 mm NH35-compatible cases,
  but their lug and thickness claims do not identify the same SKU as the
  current fixture.

These sources are now recorded as sourcing leads only. The adapter can safely
wire movement-declared date positions, subdial positions, hand sizes and
chronograph pusher counts into the visual/debug model; it must not infer case
seat, stem, crown, crystal or pusher-engagement geometry from these mixed
listings.

## Prior exact-SKU resolution attempt (superseded by supplied NMK901 package)

Before the supplied NMK901 package was available, the strongest case candidate
was Tandorio `SMC39815-G01`. Its conflicting 42 mm / 49 mm / 20 mm / 14 mm
values are retained here as historical sourcing research only and are not used
by the current fixture.

The earlier search found no manufacturer drawing, second retailer record, or
independent measurement for that exact SKU. Similar NH35 cases report conflicting values:
22 mm rather than 20 mm lugs, 45.6 mm lug-to-lug, 13.5 mm thickness, or
15.5 mm thickness. Those conflicts establish that the values cannot be merged
into the selected SKU. The exact-SKU evidence count therefore remains 1, and
the case set stays provisional.

The Tandorio product page was also checked for linked PDFs or drawing references;
it exposes the SKU variants and descriptive dimensions but no engineering-drawing
download. This historical result no longer blocks the NMK901 controlled preview,
but it remains relevant to the distinction between published dimensions and
manufacturer CAD.

## Next evidence action

The next measurement pass is now limited to the remaining NMK901 interfaces:
spring-bar hole center and diameter, dial/chapter-ring seat depths, crystal
gasket groove and axial seat, caseback thread/gasket, crown tube thread/bore and
stem engagement, and the assembled top-hand-to-crystal clearance. Until those
values are measured or supplied from a toleranced drawing, the application must
keep the corresponding checks provisional and must not claim production fit.
