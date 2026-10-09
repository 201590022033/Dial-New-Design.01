# M6 semantic appearance rendering — 9 October 2026

This implementation adds real region coverage, not a green tint described as an outline. It preserves the 22 audited GLB binaries. The canonical appearance document is resolved into Engineering, HD and procedural presentation; authored original palettes remain unchanged until an appearance document is created.

## Geometry and scope

- `handAppearanceRegions.ts` maps only reviewed node families: main hour/minute/central chrono seconds, movement-owned VK63 needle/baton/syringe registers, hubs, filled lume, and Mercedes metal rim/spokes. Unknown HAND-like names are not classified by a generic substring matcher.
- Filled uses the existing separate lume mesh. Off hides that mesh only. Outline derives small actual cylindrical boundary channels from that mesh's sharp boundary edges; it has an empty broad-face centre. The metal blade, hub, Mercedes spokes and original bore geometry remain separate and unchanged.
- Independent coloured tips are plane-clipped triangles from the actual selected blade surface. Zero extent produces no tip. Coverage is limited to each individual blade's original envelope and pivot, never stretched to satisfy a setting. Coincident face depth offset avoids moving the physical endpoint.
- Legacy centred blade geometry may use its translation to identify the distal direction. An asymmetric VK63 blade uses its own radial coordinates; the movement's register-centre translation must never reverse its tip. The reference-42 split BODY/TIP nodes share their complete reviewed endpoint rather than receiving two independent tips.
- Existing `DD_ROLE` values, including NH05 hour/minute/seconds, are retained. New `DD_REGION` and `DD_APPEARANCE_SCOPE` describe presentation regions. New tip children retain a separate coloured-tip extent field, not an edited `DD_TIP_LENGTH_MM` physical length.
- Runtime changes operate on isolated loader clones. Derived geometry and cloned materials are disposed when replaced; cached source geometry is not changed. Switching outline/filled/off and back starts from the original cached asset, not a progressively modified previous clone.

No Blender installation or new palette-specific binaries are required for these geometrically derived regions. There are no new `.glb` files in this checkpoint; the rendered regions are real Three.js mesh geometry attached to cloned authored assets. The earlier bezel artwork ownership repair remains in place.

## Capabilities and previews

The reviewed main-hand lume capability list admits archetype diver/pilot/field/chronograph, named luminous variants, compact NH05 luminous sets and reference-42. Dress, dauphine, skeleton and legacy Mercedes families without a complete reviewed main-hand lume contract do not advertise Filled/Outline. VK63 register hands have no separate lumen insert; their unsupported lume controls stay disabled. Main and register metal/tip settings remain independent.

Engineering adds movement-owned register centres and lengths from the same visual adapter. HD marker outlines use actual ring or four-wall inlay geometry; numeral outline coverage uses stroked glyphs. Procedural fallbacks receive the same resolved main/register/marker settings. Day/night is a session-only illustrative studio preview, not a material-performance simulation or saved physical property.

Engineering's 2D hand silhouettes and inlay proportions are schematic; HD keeps each authored silhouette. Shared colours, scope, physical reach and coverage modes are the agreement contract, not pixel-identical projections or factory machining drawings.

## Vector export boundary

Existing manufacturing exports contain bands, dial markers, typography and scales—not the assembled physical hands. Adding hand silhouettes to these files silently would add unintended engraving, so no hand manufacturing layer is introduced. HD still-image export contains the visible appearance. Project save/load retains the canonical region settings.

Marker SVG/PDF exports contain real filled or unfilled/stroked coverage, not screenshots. DXF emits closed physical-width polylines for geometric outline markers and filled SOLID coverage for filled markers. DXF `TEXT` cannot represent hollow numeral glyph coverage: outline-numeral export fails with a clear instruction to use SVG/PDF and outline text in the manufacturing application. It does not silently export filled text instead. Original slide-rule palettes and station geometry are untouched.

Physical print/laser proof, font outlining, manufacturing-layer preparation and supplier fit certification remain external acceptance requirements. These rendering changes cannot certify proprietary lume performance, gemstone settings or the material suitability of coloured hand tips.

## Focused verification

`appearanceRendering.test.ts` reconstructs positions and indices from all 22 actual audited binaries. It verifies explicit role coverage, 36 named lume meshes and 24 VK63 register blade/hub nodes; cache geometry and fitting metadata are unchanged; derived outline bounds remain within 0.03mm of the original inlay bounds; all derived tips stay inside their source physical geometry. Additional assertions cover main/register colour isolation, filled→outline→off→filled, true hollow coverage, reference-42 split tips and the translated VK63 register direction regression. The existing binary SHA-256/NH05 5/8/8mm/VK63 published-centre and bore assertions remain passing.

Seven rendering tests and four binary contract tests passed after the last geometry patch. Twenty scene-integration tests passed using a real React render to inspect the demand-driven Canvas contract; no production subscription was removed to satisfy the test. Final full-suite and browser evidence are recorded by the integration audit, not inferred from these focused checks.
