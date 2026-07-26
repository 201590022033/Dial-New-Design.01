# Generalized Logarithmic Engine

## Overview
This document describes the generalized logarithmic scale architecture introduced in ECR-012.

Goals:
- Keep logarithmic mathematics domain-driven.
- Support one or more decades without hardcoded single-decade loops.
- Separate placement math from display formatting.
- Reuse the same engine for scientific and aviation-oriented ring profiles.

## Architecture Layers

### 1. Domain Mathematics
Inputs:
- Domain Start (`startValue`)
- Domain End (`endValue`)
- Logarithmic Base (`logarithmicBase`)
- Direction (`direction`)
- Rotation (`rotationOffsetDeg`)
- Number of Decades (`logarithmicDecades`, optional clamp)

Responsibilities:
- Validate positive, increasing logarithmic domain.
- Compute base-aware normalized domain bounds.
- Resolve decade range for generation.

Reference:
- `src/domain/scales/framework/logarithmicDomainEngine.ts`
- `src/domain/scales/framework/circularLogarithmicMath.ts`

### 2. Tick Generation
Responsibilities:
- Generate primary/secondary/tertiary/micro ticks over intersecting decade intervals.
- Respect density profile and explicit density controls.
- Operate across arbitrary domain span (single decade, multi-decade, sub-decade).

Properties:
- `tickDensityProfile`
- `logMajorTickDensity`
- `logMinorTickDensity`
- `logMicroTickDensity`
- `tickDirection`
- `majorTickLengthMm`, `minorTickLengthMm`
- `majorTickWidthMm`, `minorTickWidthMm`

Reference:
- `src/domain/scales/framework/logarithmicTickEngine.ts`

### 3. Label Formatting
Responsibilities:
- Convert numeric tick values into display strings.
- Keep formatting independent from geometric placement.

Formats:
- Engineering
- Scientific
- Navitimer
- Slide Rule
- Custom

Styles:
- Value
- Mantissa
- Scientific

Properties:
- `logarithmicDisplayMultiplier`
- `logarithmicDisplayFormat`
- `logarithmicLabelStyle`
- `labelFrequency`
- `includeMinorLabels`

Reference:
- `src/domain/scales/framework/logarithmicDisplayFormatter.ts`
- `src/domain/scales/framework/logarithmicLabelEngine.ts`

### 4. Presentation Layer
Responsibilities:
- Use ticks + labels + metadata only.
- Perform no logarithmic math in renderer.

Reference:
- `src/services/scaleEngineService.ts`
- `src/components/layout/CentreCanvas.tsx`
- `src/renderer/svgRenderer.ts`

## Normalization
Given base `b`, start `s`, end `e`, value `v`:

- `normalized = (log_b(v) - log_b(s)) / (log_b(e) - log_b(s))`
- `angle = projection(normalized, direction, startAngleDeg, endAngleDeg, rotationOffsetDeg)`

This is invariant across display formatter choices.

## Decade Generation Strategy
- Resolve decade span intersecting domain.
- For each decade interval, generate primary and subdivision ticks.
- Filter by domain bounds and sort by angle.
- Deduplicate by value+tier key.

No hardcoded `for i = 1..9` domain assumption remains in control flow.

## Engineering Assumptions
- Domain values are strictly positive for logarithmic projection.
- `logarithmicBase > 1`.
- Presets tune density/readability but do not alter foundational normalization.

## Extension Strategy
Future ring profiles are configuration profiles over this engine:
- C, D, CI, DI
- A, B, K, L, LL
- Aviation slide-rule profiles
- Custom domain/formatter profiles

Ring profile intent is encoded via configuration (`logarithmicRingType`), not by duplicating math engines.

## Future Slide-Rule Compatibility
The generalized logarithmic domain/tick/label layers are reusable inputs for coupled-ring slide-rule plugins.
Renderer and export flows remain unchanged.
