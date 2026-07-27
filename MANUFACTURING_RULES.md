# Manufacturing Rules

## Scope

This library defines manufacturing intelligence as structured data and keeps application behavior traceable.

Every rule is documented with:

- unique rule id,
- code,
- source classification,
- supporting supplier category,
- applicable processes,
- confidence level,
- configurable thresholds,
- revision and version.

## Classification Model

- Verified manufacturer capability: directly grounded in published capability ranges.
- Industry best practice: broad production guidance used across professional watchmaking workflows.
- Engineering assumption: configurable placeholder where published evidence is limited.

## Source Categories Incorporated

Current rule set includes supplier categories such as:

- Custom dial manufacturers
- Applied index manufacturers
- Pad-print specialists
- Laser engraving specialists
- UV printing specialists
- OEM watch manufacturers

These categories are stored in data and surfaced in UI diagnostics.

## Rule Coverage Areas

Current structured rules cover:

- minimum printable line width,
- minimum text height,
- marker spacing,
- chapter-ring clearance,
- applied-index clearance,
- lume application area assumptions,
- engraving depth assumptions,
- laser kerf constraints,
- UV print stroke limits,
- brass thickness guidance,
- multilayer dial compatibility.

## Runtime Integration

Rules are loaded from [src/domain/asset-library/data/manufacturingRules.json](src/domain/asset-library/data/manufacturingRules.json) and consumed by:

- [src/domain/manufacturing/ruleLibrary.ts](src/domain/manufacturing/ruleLibrary.ts)
- [src/domain/manufacturing/validationEngine.ts](src/domain/manufacturing/validationEngine.ts)
- [src/services/manufacturingSuiteService.ts](src/services/manufacturingSuiteService.ts)

Warnings generated at runtime include traceability metadata so export diagnostics are explainable.

## Change Policy

Manufacturing rule updates should be data-first:

1. Update structured data.
2. Keep framework APIs stable.
3. Add or update tests for rule behavior.
4. Bump revision/version fields.
