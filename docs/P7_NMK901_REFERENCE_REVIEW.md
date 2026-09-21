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
| Lug interface | 22 mm inside-lug width | strap interface evidence; hole geometry remains unknown |
| Movement | NH35, 27.40 mm diameter / 5.32 mm height | movement compatibility context |
| Dial | 28.5 mm | nominal family-fit reference |
| Chapter ring | 30.5 mm OD / 27.5 mm ID / 2.3 mm height | concentric layout reference |
| Crystal | 31.5 mm diameter / 5.1 mm middle thickness | diameter-only preview reference |
| Crown | CT208 class, 7.0 mm diameter / 4.9 mm depth | crown head fixture |
| Pushers | none | NMK901 is non-chronograph |
| Hands | 8.5 / 13 / 13 mm; nominal bores 1.50 / 0.90 / 0.20 mm | regenerated nominal family-fit preview |

## What is supported

The application can now check or represent the published case envelope, the
22 mm strap gap, NH35 compatibility, 28.5 mm dial family, chapter-ring and
bezel/crystal concentric diameters, radial hand length, and nominal NH35 hand
family fit. The case, crown and hand GLBs were regenerated from the updated
fixtures; the published assets remain fixed-size preview assets.

Published asset hashes: `case.glb` SHA-256
`490111EF09AC04610A862F141E5EE921ADFFC0157A16E81F48D0E8FB2FE27B16`
(7 meshes / 1696 vertices), `crown.glb` SHA-256
`A66DFA85FAD5FAB586914E434A172A30A1CCFD38A5DB24FC693643C081D596A8`
(1 / 1538), and `hands.glb` SHA-256
`84D0A639097CD9B6F59A4F75155DF4ADD3F6D9212FAE2A314DC20EB6CA0BA904`
(15 / 2940). Blender 5.2.1 validated each asset and the combined review
assembly (23 meshes / 6174 vertices).

## What remains provisional

The supplied references do not publish or measure spring-bar hole center and
diameter, dial-seat depth and shoulder, chapter-ring seat depth, crystal gasket
groove or axial seat, caseback thread/gasket, crown tube thread/bore, stem
engagement, or top-hand-to-crystal clearance. Nominal hand bores are not
broach-tolerance specifications. These interfaces remain provisional and do
not support production-fit approval.

The previous chronograph pusher geometry is retained as a separate capability
for VK fixtures; it is not part of this NMK901 reference.

See [CANONICAL_MEASUREMENT_EVIDENCE.md](CANONICAL_MEASUREMENT_EVIDENCE.md) for
the evidence register and the remaining measurement actions.
