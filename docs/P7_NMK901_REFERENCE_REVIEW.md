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
fixtures at the generator's `high` presentation quality; the published assets
remain fixed-size preview assets rather than manufacturing CAD.

Published high-quality asset hashes: `case.glb` SHA-256
`813D870160AC69548A1C9C9AE841A9F3D106DE5285934D0683C9962E376A27C6`
(7 meshes / 4128 vertices, estimated seat steps, spring-bar holes and
crown-tube bore), `crown.glb` SHA-256
`8A0717DA056A9A747E130853160B6B91C29CE8FED35C29E66688B2A224E09207`
(1 / 2306), and `hands.glb` SHA-256
`64AA7A04E3D093F2A459A2E3F2A8E5D55F0C134738D1ACF52736E79D32A998D7`
(15 / 4284). Blender 5.2.1 validated each asset and the combined high-quality
review assembly (23 meshes / 10718 vertices). The deterministic review render
was checked in top, front, side and three-quarter views.

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
