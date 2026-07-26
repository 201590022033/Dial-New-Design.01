# Collision Engine

## Overview

The Collision Engine is a reusable diagnostic framework for scale geometry and text layout.

It operates on generated ticks and labels and emits structured engineering diagnostics consumed by:

- Intelligent layout optimization
- Validation scoring
- Manufacturing warning surfacing
- Interactive hover/readout status

## Collision Classes

The framework currently reports:

- label-label
- tick-label
- tick-tick
- label-boundary
- boundary-overflow
- ring-ring
- cross-ring
- text-overflow
- curved-baseline-overflow

These map to validation issue codes such as ANGULAR_OVERLAP, OUTSIDE_BAND, RING_INTERFERENCE, and TEXT_OVERFLOW.

## Detection Algorithms

1. Circular angular delta

- Uses wrap-safe normalization across 0/360 boundaries
- Prevents false negatives when collisions straddle angular wrap

2. Label-to-label arc occupancy

- Estimates occupied angular width from text length and radius
- Compares neighboring labels for minimum angular clearance

3. Tick crowding

- Sorts ticks by angle
- Flags near-spacing thresholds for potential visual merge or print risk

4. Boundary and band envelope checks

- Verifies ticks and labels against ring inner/outer constraints

5. Multi-ring interference

- Detects radial ring-gap compression
- Counts cross-ring angular near-misses

6. Text-specific risk checks

- Long label overflow risk
- Curved-baseline overflow risk on inner radii

## Diagnostics Contract

Each issue includes:

- kind
- severity
- message
- ids (involved entities)

This contract is intentionally generic so future plugins inherit diagnostics without custom UI code.

## Engineering Assumptions

- Label width is approximated from character count for real-time performance
- Dense rings prefer warning-level diagnostics over auto-mutation
- Cross-ring interference is represented as near-miss density rather than exact polygon intersections

## Numerical Precision Notes

- Angle comparisons are circular and bounded by explicit thresholds
- Threshold values are conservative and can be tuned per manufacturing profile

## Performance Considerations

- Single-pass and local-neighbor checks are favored over global geometric SAT/intersection tests
- Cross-ring scans are capped to avoid quadratic blowups during interactive edits

## Future Extensions

- Font-metric-aware text bounds
- SVG path intersection checks for export-time deep validation
- Configurable collision policy bundles for aerospace/scientific scales
