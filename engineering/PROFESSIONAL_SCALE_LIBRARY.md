# Professional Scale Library

## Overview

The Professional Scale Library provides first-class engineering plugins that replace generic placeholders for production-grade use cases.

Each plugin is implemented as a native Scale Plugin and composes existing shared framework engines rather than creating parallel architecture.

## Implemented Professional Plugins

- Professional Tachymeter
- Professional Telemeter
- Professional Pulsometer
- Professional Compass Ring
- Professional Countdown Ring
- Professional GMT Ring
- Engineering Conversion Ring

## Per-Plugin Engineering Scope

Every plugin includes:

- Mathematics mapping function
- Tick generation
- Label generation
- Validation integration
- Inspector schema support
- Manufacturing metadata
- SVG export compatibility
- Unit test coverage

## Shared Runtime Features

Professional plugins inherit the generic Intelligent Layout Engine:

- Adaptive density profiles
- Collision detection and conservative optimization
- Readability and engineering score synthesis
- Manufacturing spacing diagnostics

Because these behaviors are framework-level, future custom plugins inherit them automatically.

## Plugin Lifecycle

1. Resolve plugin config and defaults
2. Resolve adaptive density profile from geometric context
3. Generate mathematically correct ticks
4. Generate labels and apply plugin formatter
5. Run collision diagnostics
6. Optionally run layout optimization (no value remapping)
7. Re-run collision diagnostics
8. Merge manufacturing diagnostics into validation
9. Emit health report and export payloads

## Professional Plugin Notes

1. Tachymeter

- Reciprocal time mapping for speed scale spacing

2. Telemeter

- Distance via sound-delay mapping
- Configurable label units (km/mi)

3. Pulsometer

- Reciprocal BPM mapping
- Configurable beat sample count and calibration window

4. Compass Ring

- Full bearing projection with cardinal emphasis
- Compatible with rotation/orientation controls

5. Countdown Ring

- Reverse-direction time mapping
- Works for clockwise/counter-clockwise modes

6. GMT Ring

- 24-hour projection
- Multiple label formats (24h, 24h UTC, 12h)

7. Conversion Ring

- Metric/imperial and imperial/metric presets
- Custom source/target mappings with conversion factor

## Engineering Assumptions

- Professional scales are generic engineering tools, not watch-model-specific hardcoding
- Layout optimization must preserve mathematical value-angle correctness
- Label formatting may compact typography but cannot alter mapped values

## Numerical Precision Notes

- Reciprocal mappings clamp unsafe inputs to prevent division singularities
- Label output is rounded for readability while underlying values remain numeric
- Health report values are deterministic and bounded

## Performance Considerations

- Plugin generators remain stateless and cache-friendly via Scale Engine service
- Collision/optimization are lightweight enough for inspector-driven live preview
- Manufacturing diagnostics avoid expensive geometric solvers in interactive mode

## Future Extensions

- Aviation packs (wind correction, TAS, fuel burn overlays)
- Scientific packs (notation layers, SI-prefix helpers)
- Persisted user-defined conversion schemas
- Process-specific manufacturing calibration profiles
