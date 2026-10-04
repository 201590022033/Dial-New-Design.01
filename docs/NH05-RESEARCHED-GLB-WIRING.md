# NH05 researched preview assets

Implemented 4 October 2026. These are Blender-authored presentation assets, not supplier-exact manufacturing or fit models.

In an NH05 build, open **Parts** and use **Case options**, **Dial options** or **Main hand sets**. Select a Tandorio researched candidate, preview it and click Apply. The engineering selection and HD component overrides share the same assembly. Selecting the complete hand set updates all three central hands; subdial hands are unaffected. Switching back to the earlier hand set remains supported.

| Catalogue candidate | New asset | Basis and limitations |
| --- | --- | --- |
| Tandorio 34mm NH05 case | `case-tandorio-nh05-research-34.glb` | Published 34mm OD and nominal 12mm whole-case thickness. Body/face decomposition, lugs, shape, holder and hidden interfaces are provisional; the midcase mesh alone is not a 12mm-thick solid. Earlier case GLB is retained. |
| Tandorio 24.5mm white matte dial | `dial-nh05-white-matte-245.glb` | 24.5mm OD and matte white face. Centre opening, thickness, date aperture, date-card example 18 and baton markers are TMI-reference/presentation assumptions, not supplier measurements. |
| Tandorio NH05 luminous set | `hands-nh05-luminous-588.glb` | Centre-to-tip lengths 5/8/8mm recorded on Blender mesh extras. Baton outlines, widths, hub, lume relief and axial stack are provisional, not measured supplier profiles or tubes. |

Style colour controls recolour the existing meshes; finishes do not require duplicate GLBs. The new dial's metallic markers support custom colours. Matte face material and central-hand colour updates are live in HD. The date card is a static presentation example, not a running calendar simulation.

One purchased three-hand set is costed once despite the three engineering hand instances. Selecting the unknown-price RoseGold listing does not silently substitute the Black variant's checked price. Unknown shipping and fit status remain unknown.

Regenerate only these assets, without overwriting unrelated library work:

```text
blender --background --factory-startup --python tools/blender/generate_component_variant_library.py -- --output public/assets/3d/variants --nh05-research-only
```

The library manifest includes all three assets. The Blender validator checks mesh/material presence, bounded geometry and connected case lug roots. Regression tests cover selection, all three lengths, repeated switching, colour edits, real GLB metadata and hand-set pricing.

Fit verification remains governed by [the measurement checklist](NH05-FIT-VERIFICATION-CHECKLIST.md); adding a GLB does not promote these draft catalogue entries or unverified supplier listings.
