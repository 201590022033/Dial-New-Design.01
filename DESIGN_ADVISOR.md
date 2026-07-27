# Design Advisor

## Mission

The Design Advisor acts as a professional engineering assistant built on top of the frozen framework.

It does not replace mathematical engines.

It interprets design state, asset metadata, and manufacturing warnings to provide contextual recommendations.

## Inputs

The advisor currently evaluates:

- selected scale characteristics,
- dial and chapter ring configuration,
- marker strategy,
- typography profile compatibility,
- manufacturing warning trace metadata,
- supplier profile capability data.

## Recommendation Classes

Recommendations are grouped by:

- authenticity,
- manufacturability,
- geometry,
- beauty.

Severity is communicated as info, opportunity, or warning.

## Example Behaviors

- Detects texture and dense-scale competition.
- Suggests chapter-ring width increases when typography is constrained.
- Flags typography below profile-specific printable minima.
- Advises when applied marker strategy mismatches supplier capability.
- Highlights multilayer risk for single-level supplier profiles.

## Why-first Output Style

Each recommendation should contain:

- what is wrong,
- why it matters,
- how to improve it.

The advisor should never degrade to unexplained pass/fail states.

## Data Coupling

Advisor quality depends on asset-library breadth:

- scale assets
- chapter ring assets
- marker assets
- hand assets
- material assets
- typography assets
- manufacturing rules
- supplier profiles

As those libraries grow, advisor recommendations become more specific without changing framework APIs.

## Future Growth

Next modules should add:

- hand-to-marker style compatibility scoring,
- logo complexity and process guidance,
- movement-aware complication placement,
- scale-family-specific authenticity scoring,
- supplier cost/volume trade-off suggestions.
