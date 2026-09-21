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
family fit. The case, crown, hands, dial, chapter ring, bezel/insert, crystal,
caseback and short strap-preview GLBs were generated at the `high` presentation
quality and registered independently in the central 3D view. The published
assets remain fixed-size previews rather than manufacturing CAD.

Published high-quality asset hashes: `case.glb` SHA-256
`813D870160AC69548A1C9C9AE841A9F3D106DE5285934D0683C9962E376A27C6`
(7 meshes / 4128 vertices, estimated seat steps, spring-bar holes and
crown-tube bore), `crown.glb` SHA-256
`8A0717DA056A9A747E130853160B6B91C29CE8FED35C29E66688B2A224E09207`
(1 / 2306), and `hands.glb` SHA-256
`64AA7A04E3D093F2A459A2E3F2A8E5D55F0C134738D1ACF52736E79D32A998D7`
(15 / 4284). Blender 5.2.1 validated each asset and the combined high-quality
original three-part review assembly (23 meshes / 10718 vertices).

The six added GLBs are `dial.glb` (14 meshes / 3168 vertices),
`chapter-ring.glb` (61 / 3360), `bezel.glb` (62 / 5280), `crystal.glb`
(1 / 960), `caseback.glb` (2 / 2880), and `strap.glb` (6 / 144). Their
SHA-256 hashes are, respectively,
`06CC5EE6C2A0BDD1B72E1BF9903E17B03DBF5C362CB43D49B58AF6DB8FBC3D94`,
`DDEB1DF293AEFA1983C88AA8DDCA63F40FAB5EE0184CAE356EA5C8642F169E39`,
`7D49F581D201166BCC1427800D7FAAE792709C3E270A2744D850BE74C9139E5F`,
`7A7288230BD9520F18E15E1FB19B86E67A4AE9512B0147B1055FFF8AB7DC8055`,
`733B63184F8E80BF5876388A2A62CFC9B9E70A7E9414D2A4D24E978C7278C89B`,
and `D22F0D56D020816FACB2A5C17C59B8072638F3FD7DD4A1DB3D73A9149712AAD4`.
Blender 5.2.1 validated the polished assembly at 169 meshes / 26510 vertices.
The earlier complete-assembly top, front, side and three-quarter review renders
remain the visual baseline for this presentation-only refinement.

## What remains provisional

The supplied references do not publish or measure the listed interface values.
The application now uses estimated nominal baselines as engineering soft
warnings so ordering and preview generation can proceed. These values remain
provisional, are not manufacturing tolerances, and do not support production-fit
approval. Nominal hand bores are not broach-tolerance specifications.
The 41.0 mm bezel carrier envelope, 1.5 mm visual crystal thickness, 35.5 x
1.8 mm caseback exterior and 19 mm-per-side strap preview profile are
presentation baselines only; their published mating interfaces remain recorded
separately and Golden Sample #1 must replace these exterior assumptions.

The previous chronograph pusher geometry is retained as a separate capability
for VK fixtures; it is not part of this NMK901 reference.

See [CANONICAL_MEASUREMENT_EVIDENCE.md](CANONICAL_MEASUREMENT_EVIDENCE.md) for
the evidence register and the remaining measurement actions.
