# Mathematical Projection Engine

## Overview
This document describes the additive projection architecture introduced in ECR-013.

The objective is to decouple scale generation from scale-specific mathematics by composing four independent layers:

1. Projection mathematics
2. Formatter behavior
3. Engineering profile defaults
4. Rendering and export consumers

## Design Philosophy
- Projection contracts are pure mathematics.
- Formatters are display-only and never change geometric placement.
- Engineering profiles are configuration packs, not mathematical engines.
- Renderer, SVG, export, and manufacturing systems remain unchanged and consume the same tick/label outputs.

## Projection Contract
Each projection implementation exposes:

- Forward(value, config)
- Inverse(mappedValue, config)
- Normalize(value, config)
- Denormalize(position, config)
- InverseFromAngle(angle, config, context)
- ValidateDomain(config)
- GenerateMetadata(config)

No projection includes rendering, plugin, or inspector logic.

## Initial Projection Set
The registry includes:

- Identity
- Linear
- Logarithmic
- Reciprocal Logarithmic
- Square
- Square Root
- Cube
- Cube Root
- Natural Log
- Log-Log
- Exponential
- Custom

## Forward/Inverse Mapping Notes
- Logarithmic: preserves existing logarithmic domain assumptions.
- Reciprocal logarithmic: applies 1/x mapping before normalization.
- Natural log: enables linear-log profile behavior for L scales.
- Log-log: supports LL family style mappings for strictly > 1 domains.
- Custom: uses configurable exponent, scale, and offset.

## Engineering Profiles
Profiles are independent from projection internals.
Profiles configure projection, formatter defaults, density, minor labels, and optional decade/ring hints.

Classical profile examples:

- C and D: logarithmic + slide-rule formatter
- CI: reciprocal-logarithmic + slide-rule formatter
- A and B: logarithmic + two decades
- K: logarithmic + three decades
- L: natural-log + scientific formatter
- LL0–LL3: log-log + scientific formatter

## Formatter Separation
Formatting is selected by formatter kind:

- Engineering
- Scientific
- Slide Rule
- Navitimer
- Mantissa
- Decimal
- Custom

Formatters transform label strings only and do not influence normalized position or angle.

## Mathematical Assumptions
- Projection domain bounds must be finite and non-identical.
- Logarithmic and reciprocal-logarithmic domains require positive values.
- Log-log domains require values > 1.
- Square-root domains require non-negative values.

## Extension Strategy
To add a new scale family:

1. Select an existing projection from registry.
2. Select or define formatter strategy.
3. Define an engineering profile that sets defaults.
4. Reuse existing plugin orchestration and renderer pipeline.

A new mathematical implementation is only required when none of the existing projection contracts represent the desired mapping.

## Examples
- CI scale: select reciprocal-logarithmic projection + slide-rule formatter + CI profile.
- LL2 scale: select log-log projection + scientific formatter + LL2 profile.
- Custom aviation calculator: select logarithmic projection + navitimer formatter + aviation profile.
