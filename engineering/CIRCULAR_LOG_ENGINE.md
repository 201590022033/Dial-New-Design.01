# Circular Logarithmic Mathematics Engine

## Purpose

ECR-005 introduces a reusable engineering subsystem for circular base-10 logarithmic scales.

The goal is to provide mathematical infrastructure that can be reused by future plugins including:

- Aviation slide rules
- Navitimer-style calculator rings
- Circular scientific calculators
- Tachymeter extensions

## Mathematical Derivation

For a value v in domain [v_start, v_end] with base b:

normalized(v) = (log_b(v) - log_b(v_start)) / (log_b(v_end) - log_b(v_start))

with:

log_b(x) = ln(x) / ln(b)

Given angular context [theta_start, theta_end], span = theta_end - theta_start.

Clockwise projection:

theta(v) = theta_start + normalized(v) * span + rotationOffset

Counter-clockwise projection:

theta(v) = theta_start - normalized(v) * span + rotationOffset

Cartesian projection at radius r:

x = r * cos((theta - 90) * pi / 180)

y = r * sin((theta - 90) * pi / 180)

## Worked Example

Domain: 1 to 10

Base: 10

Arc: 0 to 360 degrees

Value v = 2:

normalized(2) = log10(2) ~= 0.3010299957

theta(2) ~= 108.370798452 degrees

This value is used directly by the projection engine and is covered by unit tests.

## Projection Engine

The reusable projection module provides:

- Normalized angle generation
- Radius projection for tick, label, and text rings
- Cartesian conversion for future multi-ring layouts

Implementation: src/domain/scales/framework/circularProjection.ts

## Tick Classification Strategy

The logarithmic tick engine classifies ticks into tiers:

- Primary: integer values 1 through 10
- Secondary: half-step values n + 0.5
- Tertiary: values n + {0.2, 0.4, 0.6, 0.8}
- Micro: values n + {0.1, 0.3, 0.7, 0.9}

Adaptive density profiles:

- sparse
- balanced
- dense

Density is applied per logarithmic segment using angular spacing thresholds.

Implementation: src/domain/scales/framework/logarithmicTickEngine.ts

## Label Strategy

Logarithmic labels use the existing framework label engine.

- Major labels are generated from primary ticks.
- Optional minor labels are generated from secondary ticks.
- Orientation supports radial, horizontal, and curved (tangential behavior).

Implementation: src/domain/scales/framework/logarithmicLabelEngine.ts

## Validation Strategy

Validation combines generic and logarithmic-specific checks.

Generic checks:

- Range validity
- Tick spacing
- Manufacturing width constraints
- Band bounds

Logarithmic checks:

- Domain validity (positive values, valid base)
- Monotonic angular ordering
- Projection continuity
- Numerical stability
- Duplicate generated values

Implementation:

- Generic engine: src/domain/scales/framework/validationEngine.ts
- Plugin-level checks: src/domain/scales/plugins/circularLogarithmicScalePlugin.ts

## Plugin Lifecycle

CircularLogarithmicScalePlugin execution flow:

1. Apply engineering preset to config
2. Normalize logarithmic values
3. Generate tiered ticks using adaptive density
4. Generate labels with existing label framework
5. Validate mathematical and manufacturing constraints
6. Produce SVG/export metadata

Implementation: src/domain/scales/plugins/circularLogarithmicScalePlugin.ts

## Engineering Assumptions

- Default base is 10.
- Domain is expected to be [1, 10] for the reference plugin.
- Projection continuity is evaluated on ordered generated values.
- Dense profile may be unsuitable for very narrow printable bands.

## Future Extension Strategy

ECR-006 should add:

1. Dedicated two-ring coupling for aviation slide-rule C/D scales.
2. Collision solver implementation for label-label and label-boundary conditions.
3. Inverse projection helpers for interactive snapping and hit-testing.
4. Manufacturing profile presets per process (pad print, laser, CNC).
5. Configurable subdivision tables per plugin family.
