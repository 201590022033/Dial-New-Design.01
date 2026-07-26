# Watch Component System

## Architecture

The Professional Watch Component System is an additive registry/store layer that coexists with the existing band-based geometry architecture.

Primary modules:

- src/domain/watch-components/types.ts
- src/domain/watch-components/registry.ts
- src/domain/watch-components/factory.ts
- src/stores/watchComponentStore.ts

This keeps geometry/rendering/validation/export engines intact while introducing first-class component objects for hands, indices, text, apertures, rings, case, and external hardware.

## Extension Points

- Add new component kinds in the watch component registry.
- Add process defaults through manufacturing metadata in factory.
- Add inspector behavior via schema IDs prefixed as watch-*.

## Engineering Decisions

- Components are additive object entities, not replacements for current band entities.
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
