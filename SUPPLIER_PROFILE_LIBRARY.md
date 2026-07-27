# Supplier Profile Library

## Scope

Supplier capabilities are modeled as editable data assets, not hard-coded logic.

Profiles are stored in [src/domain/asset-library/data/supplierProfiles.json](src/domain/asset-library/data/supplierProfiles.json).

## Current Supplier Archetypes

- Balanced Prototyping Studio
- Precision Applied Index House
- Instrument Print Specialist
- Micro Batch Artisan Dial

These represent supplier categories and regional capability patterns rather than direct endorsements of a single vendor.

## Profile Fields

Each profile defines:

- region,
- supported manufacturing methods,
- supported materials,
- finishing capabilities,
- dimensional tolerances,
- minimum line widths,
- minimum font sizes,
- multilayer capability,
- applied-index capability,
- recommended production volume,
- notes,
- references,
- evidence classification,
- color limitations.

## Integration

Profiles are loaded through:

- [src/domain/manufacturing/supplierProfiles.ts](src/domain/manufacturing/supplierProfiles.ts)

And consumed by:

- [src/domain/manufacturing/validationEngine.ts](src/domain/manufacturing/validationEngine.ts)
- [src/services/designAdvisorService.ts](src/services/designAdvisorService.ts)
- [src/services/manufacturingSuiteService.ts](src/services/manufacturingSuiteService.ts)

## Selection Strategy

The advisor uses profile-aware heuristics:

- Dense professional scales prefer instrument-print capabilities.
- Applied furniture prefers applied-index specialist capabilities.
- Baseline work defaults to balanced prototyping profiles.

## Extension Workflow

To add a new supplier profile:

1. Add a profile entry to the JSON data file.
2. Provide source-category references and evidence classification.
3. Validate thresholds through existing tests.
4. Avoid changing frozen framework contracts.
