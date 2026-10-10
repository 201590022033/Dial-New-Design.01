# C0 crown asset and axis inventory

Inspected 9 October 2026. Repository `C:/Users/Deon/Documents/GitHub/Dial-New-Design.01`, main HEAD `6931131420adb5606323f8c8db54dc4c76604f8d`. Read the four planning documents and live ledger; the ledger records C0 approval followed by C1. This bounded inventory changes documentation only. No applicable AGENTS.md was found in the repository or searched workspace parent trees. No browser, supplier research, production edits, generation, application tests, commits or pushes performed.

## Method and coordinates

Decoded actual GLB JSON and binary POSITION accessors, composed node TRS/matrices along active-scene hierarchy, and bounded every transformed vertex. Values below are millimetres in exported GLB Y-up coordinates, before application placement or scene scaling (MM_TO_SCENE = 0.1). Thus Blender (x,y,z) exports as (x,z,-y); the case face occupies XZ and thickness occupies Y. Values rounded to 0.001 mm below describe digital meshes, not measurement accuracy. Scratch inspection script is retained under the projectless workspace `work/c0-inventory/inspect.py` and uses only Python standard libraries.

## Eight removable embedded preview heads

All eight contain exactly one node named `DD_CASE_CROWN_PREVIEW`, index 0, with provisional-presentation extras. The generator creates this node as a separate cylinder (diameter 5.8 mm above 36 mm case OD, otherwise 4.2 mm; axial length 3.2 mm), rotates it onto +X and places its centre at caseDiameter/2 + 1.4. The actual binary bounds agree. These are removable presentation heads, not structural tubes/bosses/guards. Each asset ID below maps to catalogue ID `cat-` plus that asset ID, and path `public/assets/3d/variants/cases/<asset ID>.glb`.

| Exact asset ID | Transformed minimum XYZ | Transformed maximum XYZ | SHA256 |
| --- | --- | --- | --- |
| case-feiyashi-samurai-438 | (21.700,-2.900,-2.900) | (24.900,2.900,2.900) | `a3e7a65412d2905a690c85a496a804e632585ddb7c18e88600d19cbb6062185e` |
| case-namoki-nmk920-tuna-47 | (23.300,-2.900,-2.900) | (26.500,2.900,2.900) | `9c1953a15a347058de58fb44d6b66796417b884a415d864b592d09e5802a087b` |
| case-nh05-ladies-dress-34 | (16.800,-2.100,-2.100) | (20.000,2.100,2.100) | `0fdfd8fe2e4d550eae0b8a19e32fbbbe24cdafe556ede224890381a738c129cf` |
| case-tandorio-bronze-diver-44 | (21.800,-2.900,-2.900) | (25.000,2.900,2.900) | `e7cd4fdf50df3b26aa02b847878ce1e047eb00a9d1d9d2b703228a675beae4d5` |
| case-tandorio-nh05-research-34 | (16.800,-2.100,-2.100) | (20.000,2.100,2.100) | `de31d496ba6636d17719e9be802f5e8a8adbad20632edd186b9223478cc0d1c4` |
| case-tandorio-pilot-40 | (19.900,-2.900,-2.900) | (23.100,2.900,2.900) | `ce2cd4305dfdf6678983c12fe3efe1ab587ba764fb641efedf41d70880b682a7` |
| case-tandorio-willard-41 | (20.300,-2.900,-2.900) | (23.500,2.900,2.900) | `9c4e3b99b5698b8e2027a631498702412c2ea50474311ef0c4c752ee4275507b` |
| case-wr-skx-sandblasted-42 | (20.800,-2.900,-2.900) | (24.000,2.900,2.900) | `3d04571f9152933e0e93195954dc0388f30282da487411b0d5e73585656986d4` |

Preserve `DD_CASE_MIDCASE`, `DD_CASE_FLOOR`, and four lugs `DD_CASE_LUG_1_1`, `DD_CASE_LUG_1_-1`, `DD_CASE_LUG_-1_1`, `DD_CASE_LUG_-1_-1` in every listed asset. Also preserve `DD_CASE_FACETED_SHOULDER` in Samurai/Willard, `DD_CASE_TURTLE_SHOULDER` in bronze diver, and `DD_CASE_TUNA_SHROUD` in NMK920. These eight binaries contain no separately named crown tube/boss/guards; that absence does not certify the physical case interface. Future suppression must target the exact reviewed head only and use source hashes to detect asset changes.

The ninth variant `case-namoki-nmk903-black-38` has no preview head. SHA256 `21506d16844076426628988965c996391b9fdd6b3a1d0222f20fa8ad62e1ebe4`. Preserve structural nodes `DD_CASE_CROWN_GUARD` (index 0; min (12.408,-2.350,9.821), max (16.588,2.150,13.800)) and `DD_CASE_CROWN_GUARD.001` (index 1; min (15.404,-2.350,4.982), max (19.551,2.150,8.319)). The generator explicitly removes its generic preview head before adding these two guards. Broad CROWN-name deletion would remove legitimate structure.

## Reference assets and legacy core/envelope

`public/assets/3d/reference-42/crown.glb` exists, SHA256 `8a0717da056a9a747e130853160b6b91c29ce8fed35c29e66688b2a224e09207`. Single node `DD_CROWN_HEAD`, index 0; transformed min (0,-3.7,-3.7), max (4.9,3.7,3.7). Binary extras retain parametric-crown/v1: headDiameterMm 7, gripDepthMm 0.2, gripCount 32, headLengthMm 4.9, socketDiameterMm 3.2, socketDepthMm 1.8, attachment axialGapMm 0, and explicitly unknown stemThreadPitchMm. Provenance says visual review fixture only, not measured/manufacturing approved. The generator formula adds grip radially; 7 mm core means 7.4 mm maximum envelope. Preserve this meaning in migration.

`public/assets/3d/reference-42/case.glb` SHA256 `9c09e94c5370812ec380c5bfd267bae2ab58b08bcb82f022b839ff98f38f4feb`. Preserve `DD_CASE_CROWN_BOSS` index 0, bounds (18.8,-2.1,-2.1) to (20.3,2.1,2.1), and `DD_CASE_CROWN_TUBE` index 1, bounds (19.5,-1.75,-1.75) to (21.8,1.75,1.75). These belong to the case, while the reference crown is a separate removable asset. Preserve midcase and four named 6/12 o'clock lugs too.

`src/visual3d/visualAssetRegistry.ts` registers `reference-42-crown-preview` at the existing reference file. It also registers `crown-reference-v1` at `/assets/3d/generated/crowns/crown-v1.glb`; direct filesystem existence check returned false. Inventory does not fix or retire that missing entry.

## Current axis precedence and NMK920 discrepancy

`src/visual3d/assemblyAnchors.ts` currently resolves:

1. Default crown at (case radius,0,0), zero rotation, provisional schematic placement.
2. Case customProperties.visualCrownAngleDeg, only when no valid parametric tube endpoint exists. Position (r cos a,r sin a,0), rotation (0,0,a) in engineering/Blender convention; negative angles move clockwise from 3h toward 4h.
3. Valid parametric-case/v1 tube endpoint overrides the angle: (caseDiameter/2 - crownTubeEmbed + crownTubeLength,0,0), zero rotation.
4. Valid saved designConfig.assemblyAnchors override the preceding results last.

`applyCatalogueVisualSelection.ts` copies visual.crownAngleDeg to customProperties.visualCrownAngleDeg. `movementLibrary.ts` supports only coarse stemPosition '3h'/'4h'/'9h'. These are existing contracts, not an exact axis or installation certification.

`tools/blender/generate_component_variant_library.py` defines NMK920 as 47 mm OD, 11.3 mm thick, 22 mm lugs, 46.5 mm lug-to-lug, shape tuna; generic build_case places its head centre at (24.9,0,0), i.e. 3h. Actual binary confirms it. Shroud bounds are (-23.5,-2.862,-23.5) to (23.5,2.562,23.5); midcase bounds (-23.5,-3.503,-23.5) to (23.5,3.503,23.5). Neither binary nor catalogue establishes the actual supplier crown angle. Catalogue text/tags assert a dimension drawing, but this repository inventory does not recover or validate that source. Do not promote the generic 3h mesh to supplier evidence.

## Limits and handoff

This completes the bounded binary/node inventory. It does not complete the entire C0 gate: actual baseline front/side Engineering/HD screenshots, manufacturer drawing/revision checks, supplier package contents and physical interface evidence remain coordinator-owned. No physical stem/thread/closure/sealing values were inferred. C1 should freeze explicit axis precedence and core/envelope/ownership semantics while preserving saved anchors and legacy data; C3/C7 later own mesh changes under separate approval.

Changed repository file: this new inventory only. Verification: read-only GLB decoding and bounds inspection, source searches, HEAD/status and missing-path check. No application test claim is made.
