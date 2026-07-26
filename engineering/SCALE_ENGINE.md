# Scale Engine Framework

## Purpose

This document defines the additive foundation introduced by ECR-004.

The system extends the existing plugin architecture with reusable mathematical and engineering primitives while preserving compatibility with all current scale plugins.

## Lifecycle

Each scale follows a consistent pipeline:

Scale Mathematics

-> Tick Generator

-> Major and Minor Tick Resolution

-> Label Generator

-> Validation

-> Manufacturing Output

## New Framework Modules

Core contracts live in src/domain/scales/framework/interfaces.ts:

- MathematicalScale
- TickGenerator
- LabelGenerator
- ScaleValidator
- CollisionDetector
- ScaleExporter

Base mathematical implementations live in src/domain/scales/framework/baseMathematics.ts:

- LinearScaleMathematics
- LogarithmicScaleMathematics
- RatioScaleMathematics
- TimeScaleMathematics
- DistanceScaleMathematics

Reusable engines:

- Tick generation: src/domain/scales/framework/tickEngine.ts
- Label placement: src/domain/scales/framework/labelEngine.ts
- Validation: src/domain/scales/framework/validationEngine.ts
- Collision hooks: src/domain/scales/framework/collisionFramework.ts
- Manufacturing export metadata: src/domain/scales/framework/exporter.ts

## Reference Plugin

The built-in linear scale has been upgraded to a complete engineering implementation:

- Plugin file: src/domain/scales/plugins/linearEngineeringPlugin.ts
- Registry entry: src/domain/scales/plugins/builtInPlugins.ts

This plugin uses the full framework pipeline and provides manufacturing metadata through an additive optional plugin method.

## Compatibility

No existing plugin contract fields were removed.

Compatibility strategy:

- Existing plugin methods remain required.
- New manufacturing metadata output is optional.
- Existing circular and specialty plugins continue to run via the original circular factory.

## Collision Framework Status

Collision detection is intentionally provided as a framework hook only.

Current behavior:

- Interface contract is defined.
- Engine returns empty results.
- Validation consumes collision issues when concrete detectors are added.

Future implementation can be added without changing plugin public APIs.

## Example Integration

Minimal plugin assembly pattern:

1. Choose a mathematical model (for example LinearScaleMathematics).
2. Generate ticks using createTickGenerationEngine.
3. Generate labels using createLabelPlacementEngine.
4. Validate with createScaleValidationEngine.
5. Export SVG and manufacturing metadata via createScaleExporter.

## Extension Guidance

For new professional scales (logarithmic, ratio, distance, timing families):

1. Keep plugin entrypoints compatible with ScalePlugin.
2. Use framework contracts instead of hard-coded per-plugin logic.
3. Add scale-specific domain validation in the selected mathematical model.
4. Provide manufacturing metadata for process planning and audit readiness.
5. Add dedicated test coverage in src/tests.
