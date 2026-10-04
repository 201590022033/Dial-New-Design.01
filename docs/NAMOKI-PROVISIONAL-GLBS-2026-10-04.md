# NMK903 and 108 sector presentation assets

Two independent Blender GLBs now replace the procedural placeholders for the October 4 supplier batch. Supplier photos inspected on 2026-10-04; the existing price snapshot remains unchanged.

- `case-namoki-nmk903-black-38`: supplier external envelope 38 mm OD / 44.5 mm lug-to-lug / 20 mm strap gap. Connected, drilled lugs and 4h guards are photo-derived approximations. No crown is baked into this body-only product. The separate application crown receives a provisional -30-degree anchor (from 3h). The advertised 10 mm overall thickness does not establish internal seats or a full assembled stack.
- `dial-namoki-108-silver-285`: 28.5 mm OD, approximate railway track, fine outer divisions and 12/3/6/9 numerals. Silver radial brushing is embedded in the GLB roughness channel and remains when changing dial colour. Marking meshes support the existing marker colour control. Supplier logo omitted. Thickness 0.4 mm and centre opening are presentation assumptions; dial feet are not modelled.

Both entries remain draft/provisional, with manufacturing export disabled. Neither establishes case/dial/movement compatibility. Casebacks remain research-only pending thread and gasket dimensions; the Arabic NH36 variant remains research-only pending movement-workflow integration and variant verification.

Sources:
- https://www.namokimods.com/products/nmk903-skx013-watch-case-pvd-black-finish
- https://www.namokimods.com/products/watch-dial-108-minimal-tool-dial-sunburst-silver

Regenerate only these two assets with `--namoki-research-only` in `tools/blender/generate_component_variant_library.py`. Full-library generation also includes them. The validator imports every GLB and checks finite bounds, materials and connected lug roots.
