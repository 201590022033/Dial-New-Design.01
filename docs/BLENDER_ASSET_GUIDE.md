# Blender asset guide

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
