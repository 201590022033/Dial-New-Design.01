# NMK901 golden-sample measurement backlog

The controlled order preset now carries temporary `ESTIMATED_NOMINAL` baselines
for preview and ordering. These values are soft warnings only and remain blocked
from manufacturing approval until physical micrometer validation on Golden
Sample #1.

1. Spring-bar hole: 2.00 mm diameter; center 2.80 mm from lug tip / 1.20 mm from lower lug edge; uncertainty ±0.10 mm.
2. Dial seat depth: 1.20 mm; uncertainty ±0.08 mm.
3. Chapter-ring seat depth: 1.50 mm; uncertainty ±0.08 mm.
4. Crystal gasket groove geometry and axial gasket seat: 1.80 mm nominal; uncertainty ±0.10 mm.
5. Caseback thread verification by gauge and gasket groove width/depth.
6. Crown tube: M3.5 x 0.35 mm nominal thread, 2.10 mm bore; uncertainty ±0.05 mm.
7. Stem engagement: 1.80 mm nominal; uncertainty ±0.05 mm.
8. Installed top-of-seconds-hand to underside-of-crystal clearance: 0.65 mm nominal; uncertainty ±0.12 mm.

All estimated values use provenance `ESTIMATED_NOMINAL` and source
`AI Nominal Baseline Estimation (SKX007/NH35 standard)`. The hand-to-crystal
design target remains `>= 0.30 mm`, but the 0.65 mm baseline must be physically
checked and recorded before production-fit approval. Estimates must not be
emitted as verified CNC drawing dimensions.

## Preview attachment clearance — September 24

The displayed strap ends and spring bars now share the existing estimated lug-hole axes: Y = ±20.20 mm, Z = −1.725 mm. Case underside pockets begin at |Y| = 18.45 mm and extend up to Z = 0.025 mm; they are deliberately local to the strap interface, below the face stack. These recesses are preview construction, **not measured case geometry**.

`tools/blender/attachment_preview.json` records the shared `ESTIMATED_NOMINAL` allowance: 3.0 mm archetype strap thickness, 0.6 mm side clearance per lug, 1.05 mm eye radius, 0.95 mm spring-bar body radius, 0.85 mm tip radius and 0.9 mm tip engagement. The reference strap retains its existing 3.2 mm thickness. Confirm actual strap width, folded-end thickness, case relief, bar shoulders/tips and articulation on Golden Sample #1 before any assembly-fit claim. Wire/integrated lug attachments require their own design/validation.
