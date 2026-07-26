# General Circular Slide Rule Engine

## Purpose

ECR-006 introduces a reusable General Circular Slide Rule Engine built on the circular logarithmic foundation from ECR-005.

The engine is configuration-driven and intentionally watch-agnostic.

Target applications include:

- Aviation navigation
- Speed-distance-time relationships
- Fuel and consumption ratios
- Unit conversions
- Multiplication and division
- Scientific and engineering circular calculators

## Architecture

Core framework module:

- src/domain/scales/framework/slideRuleEngine.ts

Engineering plugin:

- src/domain/scales/plugins/slideRuleScalePlugin.ts

Supporting modules reused:

- src/domain/scales/framework/circularLogarithmicMath.ts
- src/domain/scales/framework/logarithmicTickEngine.ts
- src/domain/scales/framework/logarithmicLabelEngine.ts
- src/domain/scales/framework/collisionFramework.ts
- src/domain/scales/framework/validationEngine.ts
- src/domain/scales/framework/exporter.ts

## Mathematical Flow

For each ring, value mapping is:

normalized(v) = (log_b(v) - log_b(v_start)) / (log_b(v_end) - log_b(v_start))

theta(v) = theta_start +/- normalized(v) * span + globalRotation + ringRotation

The plus or minus branch is selected by clockwise or counter-clockwise direction.

Both rings share the same logarithmic model and differ by:

- radius
- ring rotation offset
- optional synchronization mode

## Coupled Ring Model

The engine supports:

- independent movement
- locked movement
- outer drives inner
- inner drives outer

Each mode is resolved through rotation propagation without changing mathematical equations.

## Inverse Projection

Inverse projection path:

screen sample -> polar sample -> angular position -> normalized logarithmic position -> value

This allows interaction and readout to be computed from geometry rather than from export artifacts.

## Calculation Services

Reusable operation service supports:

- multiplication
- division
- ratio
- proportion
- synchronization delta

These are exposed as mode-based computations and are not tied to any specific watch layout.

## Cursor Model

Cursor abstraction supports:

- transparent cursor
- fixed cursor
- rotating cursor
- bezel cursor placeholder

Cursor state influences readout and reference alignment while keeping scale mathematics untouched.

## Interaction Model

Canvas hover uses inverse projection for live engineering readout.

Displayed diagnostics include:

- ring identity
- projected value
- normalized position
- angular position
- radius
- nearest generated tick
- nearest generated label

This overlay is for design validation only and is not exported.

## Collision Integration

Collision diagnostics now include:

- label-label overlap risk
- tick-label proximity
- label boundary overflow
- tick boundary overflow

The system reports diagnostics and does not auto-reposition geometry.

## Manufacturing Validation

Slide-rule metadata extends baseline output with:

- minimum engraving spacing
- ring density warnings
- small text warnings
- process suitability gating for laser, UV, and CNC

## Engineering Presets

Implemented presets configure geometry and behavior without duplicating mathematics:

- Generic Circular Calculator
- Generic Aviation Slide Rule
- Scientific Calculator
- Engineering Calculator
- Navitimer-style Layout (geometry)
- E6B-style Layout (geometry)

## Extension Points

Planned extension points for ECR-007 and beyond:

1. Multi-cursor workflows and crystal overlays.
2. Additional logarithmic family scales (C, D, A, B, K variants).
3. Domain-specific operation bundles (aviation and marine).
4. Constraint-aware auto-suggestions for ring density and label strategies.
