# Watch Component System

## Geometry Ownership

The physical assembly is the single authority for radial geometry. It is derived from visible structural bands by `src/domain/assembly/physicalAssembly.ts`.

Only these objects own radial regions:

- Dial face
- Chapter ring
- Inner bezel
- Outer bezel

Their order is physical and center-out. `zIndex` controls paint order only and must never determine geometry, validation neighbors, or component containment.

Generators own artwork and style, not boundaries. Chapter markings, scales, indices, typography, and textures receive their usable region from the physical assembly. Project files persist structural bands as the canonical geometry; runtime hydration derives generator radii from those bands.

## Placeholder Integration

A placeholder becomes functional by attaching to an existing physical region. It does not become another concentric band unless it introduces a real manufactured radial boundary.

1. Keep its definition in the watch component registry.
2. Resolve its `linkedBandKind` through `resolveAttachmentRegion`.
3. Store component-local dimensions such as angle, offset, thickness, aperture size, or hand length on the component.
4. Generate artwork or manufacturing geometry within the resolved region.
5. Validate containment against that region and collisions against sibling attachments.
6. Export the component with its attachment metadata.

Examples:

- Hands, indices, text, logos, and complications attach to the dial-face region.
- Scales attach to the chapter-ring region and fall back to the dial face when no chapter ring exists.
- Crowns, pushers, lugs, and caseback metadata attach to the outer-bezel/case region but do not consume radial dial space.
- Crystals attach to the dial opening and use axial profile dimensions rather than creating a radial layer.

## Architecture

The Professional Watch Component System is an additive registry/store layer whose geometry attachments resolve through the physical assembly.

Primary modules:

- src/domain/watch-components/types.ts
- src/domain/watch-components/registry.ts
- src/domain/watch-components/factory.ts
- src/stores/watchComponentStore.ts

This keeps geometry/rendering/validation/export engines aligned while introducing first-class component objects for hands, indices, text, apertures, rings, case, and external hardware.

## Extension Points

- Add new component kinds in the watch component registry.
- Add process defaults through manufacturing metadata in factory.
- Add inspector behavior via schema IDs prefixed as watch-*.

## Engineering Decisions

- Components are additive object entities, not independent radial bands.
- Inspector remains object-centric and routes watch-* schema IDs through a complete generic watch component schema.
- Selection/highlighting/visibility/locking/isolation are stateful in watchComponentStore.

## Assumptions

- Component geometry is represented at engineering-object level and may map to one or more physical layers/bands.
- Export remains deterministic; component metadata augments diagnostics and release readiness.

## Plugin Lifecycle

1. Register component definition.
2. Instantiate default entity.
3. Bind inspector schema.
4. Validate with manufacturing constraints.
5. Export with metadata and diagnostics.

## Future Integration

- Physical simulation constraints for hands/apertures.
- Component-to-movement clearance checks.
- Parametric hardware family packs.
