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

## Canonical 42 mm case set

The current 42 mm fixture (`tools/blender/test_case_42.json`) is a visual
reference, not a supplier-specific case set. One real vendor listing reports a
42 mm diameter, 49 mm lug-to-lug, 20 mm lug width, 14 mm thickness, and 32 mm
dial for a particular NH35 case, but comparable cases from other vendors use
different dimensions. They cannot be merged into one canonical case without a
matching SKU and drawing.

| Measurement | Candidate value | Confirmations | Status |
| --- | ---: | ---: | --- |
| Case diameter | 42 mm | 1 vendor listing | unknown |
| Lug-to-lug | 49 mm | 1 vendor listing | unknown |
| Lug width | 20 mm | 3 unrelated case listings | unknown |
| Case thickness | 14 mm | 1 vendor listing | unknown |
| Dial diameter | 32 mm | 1 vendor listing | unknown |
| Crown tube, stem, gasket, pusher engagement | not published | 0 | unknown |

Case listing checked: [Tandorio 42 mm NH35 case set](https://tandoriowatch.com/products/42mm-nh35-stainless-steel-seamaster-watch-case).
The differing case listings are useful sourcing leads only; they are not
evidence for the current Blender fixture.

## Second-pass supplier and component research

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

## Exact SKU resolution attempt

The strongest case candidate is Tandorio `SMC39815-G01`, the 42 mm Seamaster
case listing. Its page reports 42 mm case diameter, 49 mm lug-to-lug, 20 mm
lug width, 14 mm thickness, 32 mm dial, 39.8 x 31.5 mm bezel insert, and
50 m water resistance. The page also lists neighboring variant SKUs; those
are not treated as confirmations of `SMC39815-G01`.

The search found no manufacturer drawing, second retailer record, or independent
measurement for that exact SKU. Similar NH35 cases report conflicting values:
22 mm rather than 20 mm lugs, 45.6 mm lug-to-lug, 13.5 mm thickness, or
15.5 mm thickness. Those conflicts establish that the values cannot be merged
into the selected SKU. The exact-SKU evidence count therefore remains 1, and
the case set stays provisional.

The Tandorio product page was also checked for linked PDFs or drawing references;
it exposes the SKU variants and descriptive dimensions but no engineering-drawing
download. The public NH35 PDFs found in the search are movement drawings, not
drawings of the Tandorio case.

## Next evidence action

To make the fixture connectable, obtain the exact case-set SKU and its technical
drawing, then collect two additional confirmations for the same SKU or perform
two repeat measurements on the same physical reference using calibrated tools.
Until then, the evidence gate must remain provisional and compatibility must
continue to report unknown or conflict rather than green fit approval. The
three-confirmation threshold applies only when the confirmations refer to the
same SKU or the same manufacturer specification; unrelated case listings are
not interchangeable confirmations.
