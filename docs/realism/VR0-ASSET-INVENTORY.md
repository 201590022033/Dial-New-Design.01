# VR0 asset inspection — 14 October 2026

All 114 originals imported successfully and have verified SHA-256 backup copies. No source GLB was changed by inspection.

Total: 40,814,872 bytes; 730,050 triangulated imported faces; 6,726 imported objects.

The full local `inventory.json` records every object/mesh/material name, parent, local/world matrix, scale, dimensions, bounds, UV layer/hash, geometry hashes, raw glTF node/mesh/accessor/material data and animation declarations. It is under `.artifacts/blender-review/realism/vr0-2026-10-13/`, next to immutable `backup/` and `backup-manifest.json`. The compact [input manifest](VR0-INPUT-MANIFEST.json) records exact source hashes and eligibility.

## Component identities and deviations

- `DD_CASE_MIDCASE` is the case; `DD_CASE_LUG_*` are lugs. Crown boss/tube objects belong to the case interface, not the separately selected crown head. Preserve those interfaces.
- `DD_HAND_HOUR_*`, `DD_HAND_MINUTE_*`, `DD_HAND_SECONDS_*` directly identify main hand parts; shared hubs are not independently posed blades. Archetype builder order resolves `DD_ARCH_HAND_0/1/2` to hour/minute/seconds. Its chronograph central seconds has its own `DD_ARCH_CHRONO_SECONDS` name; VK63 objects are register hands/hubs.
- `DD_ARCH_STRAP_6/12` are equal-length leather/rubber/canvas/racing previews. The user approved treating 6 as the adjustment tail and 12 as the buckle side without changing dimensions. Reference rubber already has buckle/tang/keepers on side 12; do not duplicate them.
- Archetype straps are nominal 22→18 mm, 58 mm per side, 3 mm thick; imported width is 20.8 mm at the attachment after clearance. Reference rubber previews are only ~19 mm per side and 3.2 mm thick. Do not impose generic brief measurements or seven leather holes on these short rubber previews.
- Source `DD_ARCH_TACHY_*`, coin-edge, orientation, hour-marker and register-assembly names denote scale/edge/marker/register detail as established by the existing builder. Preserve their role and artwork. These were conservative `unidentified` candidates in the automated name scan; they are not unidentified whole-watch parts.
- `face-review/` has 13 unregistered demonstration assets, including three animation-bearing files and generic labels/flutes/applied markers. They stay backed up and outside production promotion. Most input files are separate components, not complete watches.
- Numeric coordinates are authored millimetres and exported Y-up under the existing app registry contract. Blender fresh-import scenes report unit system NONE and scale 1; this is not permission to reinterpret the component as metres or apply a conversion. No nonuniform/negative imported object scales were found.
- Some metal/hand detail meshes have no UVs. Preserve existing dial/scale UV0; use added secondary UVs only on non-artwork surfaces if needed. Do not pretend every mesh already has bake-ready UVs.
- Existing texture images occur in the Namoki silver dial and five face-review assets. Preserve those images/UV relationships; generate neutral new material maps rather than baking a fixed strap hue.
- The two pilot rings already total 103,272 triangles. Microdetail should be baked and draw-call/texture costs measured before increasing this workload.

## Per-file inventory

The detailed object and mesh names are available in the linked local full inventory. Here bytes, triangles and material names make per-file differences reviewable.

| GLB path under public/assets/3d | Objects | Triangles | Bytes | Materials | Workload |
|---|---:|---:|---:|---|---|
| `archetypes/bezel-chronograph.glb` | 18 | 22,204 | 615,296 | archetype bezel steel; archetype bezel insert; archetype bezel marking | Refine / explicit no-op record |
| `archetypes/bezel-diver.glb` | 63 | 3,288 | 206,140 | archetype bezel steel; archetype bezel insert; archetype bezel marking | Refine / explicit no-op record |
| `archetypes/bezel-dress.glb` | 1 | 1,280 | 55,008 | archetype bezel steel | Refine / explicit no-op record |
| `archetypes/bezel-field.glb` | 1 | 1,280 | 55,008 | archetype bezel steel | Refine / explicit no-op record |
| `archetypes/bezel-pilot.glb` | 162 | 52,708 | 1,596,400 | archetype bezel steel; Pilot logarithmic printing surface; Pilot ivory logarithmic marks | Refine / explicit no-op record |
| `archetypes/chapter-ring-pilot.glb` | 89 | 50,564 | 1,416,880 | Pilot fixed chapter scale surface; Pilot ivory logarithmic marks | Refine / explicit no-op record |
| `archetypes/dial-chronograph.glb` | 6 | 46,308 | 1,260,932 | applied polished marker; archetype dial accent; archetype dial surface; chronograph register | Refine / explicit no-op record |
| `archetypes/dial-diver.glb` | 74 | 1,508 | 162,008 | archetype dial surface; archetype dial accent | Refine / explicit no-op record |
| `archetypes/dial-dress.glb` | 13 | 780 | 56,536 | archetype dial surface; applied polished marker | Refine / explicit no-op record |
| `archetypes/dial-field.glb` | 74 | 24,992 | 745,116 | archetype dial surface; archetype dial accent | Refine / explicit no-op record |
| `archetypes/dial-pilot.glb` | 74 | 24,992 | 745,104 | archetype dial surface; archetype dial accent | Refine / explicit no-op record |
| `archetypes/hands-chronograph-baton.glb` | 12 | 768 | 51,924 | VK63 register hand; archetype hand metal; archetype hand lume | Refine / explicit no-op record |
| `archetypes/hands-chronograph-needle.glb` | 12 | 756 | 51,476 | VK63 register hand; archetype hand metal; archetype hand lume | Refine / explicit no-op record |
| `archetypes/hands-chronograph-syringe.glb` | 12 | 780 | 52,396 | VK63 register hand; archetype hand metal; archetype hand lume | Refine / explicit no-op record |
| `archetypes/hands-chronograph.glb` | 12 | 756 | 51,476 | VK63 register hand; archetype hand metal; archetype hand lume | Refine / explicit no-op record |
| `archetypes/hands-diver.glb` | 6 | 312 | 24,152 | archetype hand metal; archetype hand lume | Refine / explicit no-op record |
| `archetypes/hands-dress.glb` | 4 | 288 | 20,488 | archetype hand metal | Refine / explicit no-op record |
| `archetypes/hands-field.glb` | 6 | 312 | 24,156 | archetype hand metal; archetype hand lume | Refine / explicit no-op record |
| `archetypes/hands-pilot.glb` | 6 | 312 | 24,160 | archetype hand metal; archetype hand lume | Refine / explicit no-op record |
| `archetypes/pushers-chronograph.glb` | 6 | 2,280 | 119,372 | chronograph pusher steel | Refine / explicit no-op record |
| `archetypes/strap-canvas.glb` | 10 | 1,808 | 105,044 | canvas strap detail; spring bar steel | Refine / explicit no-op record |
| `archetypes/strap-leather.glb` | 10 | 1,808 | 105,044 | leather strap detail; spring bar steel | Refine / explicit no-op record |
| `archetypes/strap-racing.glb` | 40 | 7,448 | 409,520 | racing strap detail; spring bar steel | Refine / explicit no-op record |
| `archetypes/strap-rubber.glb` | 10 | 1,808 | 105,044 | rubber strap detail; spring bar steel | Refine / explicit no-op record |
| `bezels/bezel_diver_40mm_v1.glb` | 2 | 6,524 | 453,120 | bezel insert; polished steel | Refine / explicit no-op record |
| `bezels/bezel_knurled_42mm_v1.glb` | 98 | 3,712 | 252,272 | knurled bezel steel; black ceramic bezel insert | Refine / explicit no-op record |
| `cases/case_round_40mm_v1.glb` | 7 | 2,856 | 78,036 | DD Polished Steel; DD Brushed Steel | Refine / explicit no-op record |
| `crowns/crown-coarse-fluted.glb` | 1 | 6,400 | 116,528 | DD Crown neutral steel.002 | Refine / explicit no-op record |
| `crowns/crown-compact-dress.glb` | 1 | 6,400 | 116,532 | DD Crown neutral steel.005 | Refine / explicit no-op record |
| `crowns/crown-fine-fluted.glb` | 1 | 6,400 | 116,528 | DD Crown neutral steel.001 | Refine / explicit no-op record |
| `crowns/crown-knurled.glb` | 1 | 6,400 | 116,528 | DD Crown neutral steel.003 | Refine / explicit no-op record |
| `crowns/crown-onion.glb` | 1 | 6,400 | 116,456 | DD Crown neutral steel.004 | Refine / explicit no-op record |
| `crowns/crown-smooth.glb` | 1 | 6,400 | 116,464 | DD Crown neutral steel | Refine / explicit no-op record |
| `crystals/crystal_domed_32mm_v1.glb` | 2 | 6,332 | 445,632 | sapphire | Refine / explicit no-op record |
| `dials/dial_face_40mm_layout_v1.glb` | 21 | 6,040 | 398,432 | dial textured surface; luminous marking; aperture interior; applied marking metal | Refine / explicit no-op record |
| `face-review/assembly-animated.glb` | 1329 | 43,088 | 4,527,672 | steel; ivory printing; charcoal ceramic; dial-guilloche.001; lume visual swatch | Review only |
| `face-review/bezel-minutes.glb` | 195 | 12,016 | 719,452 | steel; ivory printing; charcoal ceramic | Review only |
| `face-review/bezel-slide.glb` | 585 | 14,944 | 1,266,844 | steel; ivory printing; charcoal ceramic | Review only |
| `face-review/bezel-tachy.glb` | 150 | 17,228 | 866,896 | steel; ivory printing; charcoal ceramic | Review only |
| `face-review/chapter-minutes.glb` | 73 | 9,040 | 451,196 | charcoal ceramic; ivory printing | Review only |
| `face-review/chapter-slide.glb` | 463 | 11,968 | 997,488 | charcoal ceramic; ivory printing | Review only |
| `face-review/chapter-tachy.glb` | 29 | 14,252 | 601,764 | charcoal ceramic; ivory printing | Review only |
| `face-review/crystal-domed.glb` | 1 | 19,200 | 1,337,588 | sapphire-transmission.001 | Review only |
| `face-review/crystal-flat.glb` | 1 | 1,536 | 84,320 | sapphire-transmission | Review only |
| `face-review/dial-chrono-guilloche.glb` | 281 | 16,176 | 2,293,396 | steel; dial-guilloche; ivory printing; lume visual swatch; charcoal ceramic | Review only |
| `face-review/dial-date3-sunburst.glb` | 86 | 4,516 | 1,793,692 | steel; ivory printing; dial-sunburst; charcoal ceramic; lume visual swatch | Review only |
| `face-review/dial-date6-linen.glb` | 86 | 4,532 | 1,035,576 | steel; ivory printing; dial-linen; charcoal ceramic; lume visual swatch | Review only |
| `face-review/dial-daydate-sunburst.glb` | 86 | 5,008 | 1,812,916 | steel; ivory printing; dial-sunburst.001; charcoal ceramic; lume visual swatch | Review only |
| `hands/hands_mercedes_42mm_v1.glb` | 5 | 6,560 | 457,832 | hand steel; lume | Refine / explicit no-op record |
| `hands/hands_mercedes_v1.glb` | 5 | 6,560 | 457,856 | hand steel; lume | Refine / explicit no-op record |
| `lug-cases/case-lugs-curved.glb` | 7 | 7,032 | 215,872 | DD Polished Steel; DD Brushed Steel | Refine / explicit no-op record |
| `lug-cases/case-lugs-drilled.glb` | 7 | 7,032 | 215,904 | DD Polished Steel; DD Brushed Steel | Refine / explicit no-op record |
| `lug-cases/case-lugs-faceted.glb` | 7 | 7,032 | 215,876 | DD Polished Steel; DD Brushed Steel | Refine / explicit no-op record |
| `lug-cases/case-lugs-hooded.glb` | 9 | 7,056 | 219,576 | DD Polished Steel; DD Brushed Steel | Refine / explicit no-op record |
| `lug-cases/case-lugs-integrated.glb` | 5 | 6,548 | 151,484 | DD Polished Steel; DD Brushed Steel | Refine / explicit no-op record |
| `lug-cases/case-lugs-skeleton.glb` | 7 | 7,416 | 235,032 | DD Polished Steel; DD Brushed Steel | Refine / explicit no-op record |
| `lug-cases/case-lugs-straight.glb` | 7 | 7,032 | 215,868 | DD Polished Steel; DD Brushed Steel | Refine / explicit no-op record |
| `lug-cases/case-lugs-teardrop.glb` | 7 | 7,032 | 215,896 | DD Polished Steel; DD Brushed Steel | Refine / explicit no-op record |
| `lug-cases/case-lugs-twisted.glb` | 7 | 7,060 | 217,612 | DD Polished Steel; DD Brushed Steel | Refine / explicit no-op record |
| `lug-cases/case-lugs-wire.glb` | 5 | 8,252 | 187,276 | DD Polished Steel; DD Brushed Steel | Refine / explicit no-op record |
| `reference-42/bezel.glb` | 64 | 3,476 | 219,256 | 316L brushed steel; black ceramic; reference lume; 316L polished steel | Refine / explicit no-op record |
| `reference-42/case.glb` | 7 | 7,032 | 214,628 | DD Polished Steel; DD Brushed Steel | Refine / explicit no-op record |
| `reference-42/caseback.glb` | 2 | 1,916 | 90,784 | 316L brushed steel; 316L polished steel | Refine / explicit no-op record |
| `reference-42/chapter-ring.glb` | 61 | 2,000 | 160,776 | black ceramic; reference lume | Refine / explicit no-op record |
| `reference-42/crown.glb` | 1 | 1,536 | 66,284 | DD Crown Steel | Refine / explicit no-op record |
| `reference-42/crystal.glb` | 1 | 636 | 36,036 | sapphire | Refine / explicit no-op record |
| `reference-42/dial.glb` | 23 | 21,532 | 613,100 | warm white date card; 316L polished steel; date ink; date aperture recess; navy dial; silver dial print; reference lume | Refine / explicit no-op record |
| `reference-42/hands.glb` | 15 | 2,808 | 161,440 | HAND_METAL; HAND_LUME | Refine / explicit no-op record |
| `reference-42/strap.glb` | 15 | 2,160 | 126,416 | 316L polished steel; rubber strap relief | Refine / explicit no-op record |
| `variants/bezels/bezel-diamond-rose-gold-34.glb` | 142 | 9,578 | 636,676 | DD_ROSE_GOLD; DD_DIAMOND | Refine / explicit no-op record |
| `variants/bezels/bezel-diamond-rose-gold-42.glb` | 175 | 11,580 | 771,540 | DD_ROSE_GOLD; DD_DIAMOND | Refine / explicit no-op record |
| `variants/bezels/bezel-dive-coin-edge-42.glb` | 134 | 3,632 | 309,640 | DD_BEZEL_STEEL; DD_BEZEL_INSERT; DD_BEZEL_MARKINGS | Refine / explicit no-op record |
| `variants/bezels/bezel-dive-scalloped-42.glb` | 110 | 3,344 | 268,384 | DD_BEZEL_STEEL; DD_BEZEL_INSERT; DD_BEZEL_MARKINGS | Refine / explicit no-op record |
| `variants/bezels/bezel-dress-fluted-42.glb` | 73 | 1,888 | 167,436 | DD_BEZEL_STEEL | Refine / explicit no-op record |
| `variants/bezels/bezel-gmt-42.glb` | 122 | 3,488 | 287,032 | DD_BEZEL_STEEL; DD_BEZEL_INSERT; DD_BEZEL_MARKINGS | Refine / explicit no-op record |
| `variants/bezels/bezel-pilot-smooth-42.glb` | 1 | 1,024 | 44,244 | DD_BEZEL_STEEL | Refine / explicit no-op record |
| `variants/bezels/bezel-slide-rule-42.glb` | 218 | 4,640 | 454,612 | DD_BEZEL_STEEL; DD_BEZEL_MARKINGS; DD_BEZEL_INSERT | Refine / explicit no-op record |
| `variants/bezels/bezel-tachymeter-fixed-42.glb` | 110 | 3,344 | 267,728 | DD_BEZEL_STEEL; DD_BEZEL_INSERT; DD_BEZEL_MARKINGS | Refine / explicit no-op record |
| `variants/cases/case-feiyashi-samurai-438.glb` | 8 | 2,216 | 110,776 | DD_CASE_BODY; DD_CASE_CAVITY | Refine / explicit no-op record |
| `variants/cases/case-namoki-nmk903-black-38.glb` | 8 | 2,504 | 129,224 | DD_CASE_PVD_MATTE_BLACK; DD_CASE_CAVITY | Refine / explicit no-op record |
| `variants/cases/case-namoki-nmk920-offaxis-v1.glb` | 8 | 4,264 | 222,680 | DD_CASE_BODY; DD_CASE_CAVITY | Refine / explicit no-op record |
| `variants/cases/case-namoki-nmk920-tuna-47.glb` | 8 | 2,216 | 110,608 | DD_CASE_BODY; DD_CASE_CAVITY | Refine / explicit no-op record |
| `variants/cases/case-nh05-ladies-dress-34.glb` | 7 | 2,120 | 105,768 | DD_CASE_BODY; DD_CASE_CAVITY | Refine / explicit no-op record |
| `variants/cases/case-tandorio-bronze-diver-44.glb` | 8 | 2,888 | 138,852 | DD_CASE_BODY; DD_CASE_CAVITY | Refine / explicit no-op record |
| `variants/cases/case-tandorio-nh05-research-34.glb` | 7 | 2,120 | 105,792 | DD_CASE_BODY; DD_CASE_CAVITY | Refine / explicit no-op record |
| `variants/cases/case-tandorio-pilot-40.glb` | 7 | 2,120 | 105,800 | DD_CASE_BODY; DD_CASE_CAVITY | Refine / explicit no-op record |
| `variants/cases/case-tandorio-tuna-465-offaxis-v1.glb` | 8 | 4,264 | 222,984 | DD_CASE_BODY.001; DD_CASE_CAVITY.001 | Refine / explicit no-op record |
| `variants/cases/case-tandorio-willard-41.glb` | 8 | 2,632 | 128,072 | DD_CASE_BODY; DD_CASE_CAVITY | Refine / explicit no-op record |
| `variants/cases/case-wr-skx-sandblasted-42.glb` | 7 | 2,120 | 105,772 | DD_CASE_BODY; DD_CASE_CAVITY | Refine / explicit no-op record |
| `variants/dials/dial-chronograph-285.glb` | 64 | 2,112 | 181,136 | DD_DIAL_MARKINGS; DD_DIAL_RECESS; DD_DIAL_FACE | Refine / explicit no-op record |
| `variants/dials/dial-diver-285.glb` | 73 | 1,500 | 159,960 | DD_DIAL_MARKINGS; DD_DIAL_FACE | Refine / explicit no-op record |
| `variants/dials/dial-dress-sector-285.glb` | 74 | 2,524 | 203,976 | DD_DIAL_MARKINGS; DD_DIAL_FACE | Refine / explicit no-op record |
| `variants/dials/dial-field-285.glb` | 73 | 1,500 | 159,648 | DD_DIAL_MARKINGS; DD_DIAL_FACE | Refine / explicit no-op record |
| `variants/dials/dial-gmt-285.glb` | 97 | 1,788 | 200,732 | DD_DIAL_MARKINGS; DD_DIAL_FACE | Refine / explicit no-op record |
| `variants/dials/dial-namoki-108-silver-285.glb` | 380 | 19,452 | 1,251,772 | DD_DIAL_SECTOR_INK; DD_DIAL_FACE_SUNBURST_SILVER | Refine / explicit no-op record |
| `variants/dials/dial-nh05-black-sunburst-245.glb` | 1 | 636 | 35,900 | DD_DIAL_FACE | Refine / explicit no-op record |
| `variants/dials/dial-nh05-champagne-sunburst-245.glb` | 1 | 636 | 35,904 | DD_DIAL_FACE | Refine / explicit no-op record |
| `variants/dials/dial-nh05-mother-of-pearl-245.glb` | 1 | 636 | 35,900 | DD_DIAL_FACE | Refine / explicit no-op record |
| `variants/dials/dial-nh05-silver-roman-245.glb` | 74 | 2,524 | 204,356 | DD_DIAL_MARKINGS; DD_DIAL_FACE | Refine / explicit no-op record |
| `variants/dials/dial-nh05-white-matte-245.glb` | 14 | 2,268 | 125,404 | DD_DATE_CARD; DD_DATE_NUMERAL; DD_DIAL_MARKINGS; DD_DIAL_FACE | Refine / explicit no-op record |
| `variants/dials/dial-pilot-a-285.glb` | 74 | 1,508 | 161,436 | DD_DIAL_MARKINGS; DD_DIAL_FACE | Refine / explicit no-op record |
| `variants/dials/dial-pilot-b-285.glb` | 74 | 1,508 | 161,436 | DD_DIAL_MARKINGS; DD_DIAL_FACE | Refine / explicit no-op record |
| `variants/dials/dial-sterile-285.glb` | 1 | 636 | 35,888 | DD_DIAL_FACE | Refine / explicit no-op record |
| `variants/hands/hands-baton-42.glb` | 6 | 324 | 23,764 | DD_HAND_STEEL; DD_HAND_LUME | Refine / explicit no-op record |
| `variants/hands/hands-baton-nh05-34.glb` | 6 | 324 | 23,820 | DD_HAND_STEEL; DD_HAND_LUME | Refine / explicit no-op record |
| `variants/hands/hands-broad-arrow-42.glb` | 6 | 348 | 24,736 | DD_HAND_STEEL; DD_HAND_LUME | Refine / explicit no-op record |
| `variants/hands/hands-cathedral-42.glb` | 6 | 348 | 24,720 | DD_HAND_STEEL; DD_HAND_LUME | Refine / explicit no-op record |
| `variants/hands/hands-dauphine-42.glb` | 4 | 288 | 19,484 | DD_HAND_STEEL | Refine / explicit no-op record |
| `variants/hands/hands-mercedes-42.glb` | 11 | 1,172 | 66,428 | DD_HAND_STEEL; DD_HAND_LUME | Refine / explicit no-op record |
| `variants/hands/hands-nh05-luminous-588.glb` | 6 | 324 | 23,860 | DD_HAND_STEEL; DD_HAND_LUME | Refine / explicit no-op record |
| `variants/hands/hands-pencil-42.glb` | 6 | 324 | 23,776 | DD_HAND_STEEL; DD_HAND_LUME | Refine / explicit no-op record |
| `variants/hands/hands-skeleton-42.glb` | 4 | 300 | 19,936 | DD_HAND_STEEL | Refine / explicit no-op record |
| `variants/hands/hands-sword-42.glb` | 6 | 324 | 23,768 | DD_HAND_STEEL; DD_HAND_LUME | Refine / explicit no-op record |
| `variants/hands/hands-syringe-42.glb` | 6 | 348 | 24,700 | DD_HAND_STEEL; DD_HAND_LUME | Refine / explicit no-op record |
