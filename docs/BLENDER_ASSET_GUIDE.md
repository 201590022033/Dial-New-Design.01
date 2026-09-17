# Blender asset guide

Blender is also the canonical reference environment for future parameter-driven
case and hand generators. Scripts must derive meshes from versioned parameters,
keep units explicit, and emit validation metadata. A generated GLB is an output
artifact, not a replacement for the parameter set.

Browser visual assets are authored in Blender and exported as optimized `.glb` files. Blender is not a browser runtime dependency.

## Coordinate convention

- Use metric units with 1 Blender unit representing 1 millimetre at authoring scale.
- Centre the watch on the global Z axis; X/Y are the dial plane and positive Z points toward the crystal.
- Put the object origin on the watch radial centre and at its engineering seat height.
- Keep radial parts concentric with the watch axis and use the registry `anchor` to describe `watch-axis`, `dial-seat`, or `hand-stack` placement.
- The browser adapter owns any domain-millimetre to Three.js-unit conversion.

## Authoring and export

- Apply transforms, remove hidden geometry, recalculate outward normals, and triangulate only at export.
- Use stable names such as `case_round_40mm_v1`, `bezel_diver_40mm_v1`, and `hands_mercedes_v1`.
- Prefer bevels with 1–2 segments; avoid unapplied subdivision and dense booleans.
- Keep case assets below 50k triangles, bezels below 20k, crystals below 5k, and hand sets below 10k total.
- Use reusable materials where possible; do not bake every finish into a separate mesh.
- Keep textures at 1K by default and 2K only when visibly justified. Do not ship 4K/8K textures.
- Export GLB with selected objects, applied transforms, compressed geometry where available, and embedded or relative textures validated against the public asset path.

The visual registry is the integration point. A routine new part should add a catalogue reference, one registry descriptor, and one file under `public/assets/3d/` without a new React component.

## Parametric hand generator v1

[`tools/blender/parametric_hand_v1.py`](../tools/blender/parametric_hand_v1.py) consumes `parametric-hand/v1` or `parametric-hand-set/v1` JSON. It creates separate hub, body, tip, tail, and lume regions in `DD_PARAMETRIC_HANDS`, uses a real boolean pinion bore, and assigns reusable `HAND_METAL`/`HAND_LUME` materials. The demo fixture is `tools/blender/test_hand_set_v1.json`.

```text
blender --background --python tools/blender/parametric_hand_v1.py -- --params tools/blender/test_hand_set_v1.json --quality normal
blender --background --python tools/blender/parametric_hand_v1.py -- --params tools/blender/test_hand_set_v1.json --quality high --output public/assets/3d/generated/hands/hand-set.glb
```

Quality is a presentation setting (`preview`, `normal`, `high`), and Z positions in the hand-set demo are reference placement values rather than movement-specific stack dimensions. Unknown required dimensions fail clearly; no generic bore is substituted.

## Parametric case generator v1

The reference generator is [`tools/blender/parametric_case_v1.py`](../tools/blender/parametric_case_v1.py). It consumes the `parametric-case/v1` field names and treats Blender units as millimetres. The named reference values are embedded as an explicit demo preset; unknown required production values fail clearly rather than receiving defaults.

Run in Blender's Scripting workspace, or headlessly:

```text
blender --background --python tools/blender/parametric_case_v1.py -- --quality normal
blender --background --python tools/blender/parametric_case_v1.py -- --params case.json --quality high --output public/assets/3d/generated/cases/case.glb
```

Quality controls radial sampling (`preview`, `normal`, `high`) and is not part of the physical case schema. The generator creates/rebuilds only `DD_PARAMETRIC_CASE`, including a smooth revolved mid-case, four tapered lugs, and embedded crown boss/tube source objects. Re-running is idempotent. GLB export is optional and selection-scoped.
