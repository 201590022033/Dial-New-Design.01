# P7: NMK901 controlled 42 mm reference review

The opt-in `reference-42-preview/v1` now uses the supplied NMK901 case-set
reference package for one controlled SKX007/SRPD configuration. The source PDFs
are `SKX007_SRPD_42mm_Case_Set_Reference.pdf` and
`SKX007_SRPD_42mm_Expanded_Engineering_Reference (1).pdf` from the user-supplied
evidence package. They are reference compilations, not manufacturer CAD or a
machine-shop release drawing.

## Controlled configuration

| Item | Controlled value | Application use |
| --- | ---: | --- |
| Case | 42 mm diameter / 46 mm lug-to-lug / 10.2 mm case-only thickness | case fixture and preview envelope |
| Lug interface | 22 mm inside-lug width; estimated 2.00 mm holes at 2.80 / 1.20 mm | strap interface evidence; hole geometry is `ESTIMATED_NOMINAL` ±0.10 mm |
| Movement | NH35, 27.40 mm diameter / 5.32 mm height | movement compatibility context |
| Dial | 28.5 mm | nominal family-fit reference |
| Chapter ring | 30.5 mm OD / 27.5 mm ID / 2.3 mm height | concentric layout reference |
| Crystal | 31.5 mm diameter / 5.1 mm middle thickness; estimated 1.80 mm axial seat | diameter reference plus `ESTIMATED_NOMINAL` seat ±0.10 mm |
| Crown | CT208 class, 7.0 mm diameter / 4.9 mm depth | crown head fixture |
| Pushers | none | NMK901 is non-chronograph |
| Hands | 8.5 / 13 / 13 mm; nominal bores 1.50 / 0.90 / 0.20 mm | regenerated nominal family-fit preview |

Temporary estimated nominal baselines are also recorded for the 1.20 mm dial
seat, 1.50 mm chapter-ring seat, M3.5 x 0.35 mm / 2.10 mm crown tube, 1.80 mm
stem engagement, and 0.65 mm hand-to-crystal clearance. Each uses provenance
`ESTIMATED_NOMINAL`, source `AI Nominal Baseline Estimation
(SKX007/NH35 standard)`, and remains subject to Golden Sample #1 micrometer
validation.

## What is supported

The application can now check or represent the published case envelope, the
22 mm strap gap, NH35 compatibility, 28.5 mm dial family, chapter-ring and
bezel/crystal concentric diameters, radial hand length, and nominal NH35 hand
family fit. The case, crown and hand GLBs were regenerated from the updated
fixtures; the published assets remain fixed-size preview assets.

Published asset hashes: regenerated `case.glb` SHA-256
`181E8DCE64BC54A40F1996FA1EA19B329D95463204355CCD7362F1063EDEB157`
(7 meshes / 3360 vertices, estimated seat steps, spring-bar holes and crown-tube bore), `crown.glb` SHA-256
`A66DFA85FAD5FAB586914E434A172A30A1CCFD38A5DB24FC693643C081D596A8`
(1 / 1538), and `hands.glb` SHA-256
`84D0A639097CD9B6F59A4F75155DF4ADD3F6D9212FAE2A314DC20EB6CA0BA904`
(15 / 2940). Blender 5.2.1 validated each asset and the combined review
assembly (23 meshes / 6174 vertices).

## What remains provisional

The supplied references do not publish or measure the listed interface values.
The application now uses estimated nominal baselines as engineering soft
warnings so ordering and preview generation can proceed. These values remain
provisional, are not manufacturing tolerances, and do not support production-fit
approval. Nominal hand bores are not broach-tolerance specifications.

The previous chronograph pusher geometry is retained as a separate capability
for VK fixtures; it is not part of this NMK901 reference.

See [CANONICAL_MEASUREMENT_EVIDENCE.md](CANONICAL_MEASUREMENT_EVIDENCE.md) for
the evidence register and the remaining measurement actions.
