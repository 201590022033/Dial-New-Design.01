# Manufacturing Suite

## Architecture

Manufacturing suite capabilities are implemented as additive services around existing validation/export flows.

Primary modules:

- src/domain/manufacturing/validationEngine.ts
- src/services/manufacturingSuiteService.ts
- src/services/exportService.ts
- src/services/exportGeometryService.ts

## Manufacturing Pipeline

1. Run geometry/manufacturing validations.
2. Build engineering SVG payload.
3. Run native SVG verification.
4. Run manufacturing report synthesis.
5. Export to SVG/DXF/PDF/PNG with metadata.
6. Preserve geometry and emit diagnostics only.

## Supported Profiles

- Laser
- Pad Printing
- UV Printing
- CNC
- Engraving
- Etching
- Photo Chemical Machining

Vendor calibration profiles are modeled as additive process compensation metadata.

## Engineering Decisions

- No silent geometry modification during export.
- Native SVG validation is explicit and reportable.
- DXF/PDF/PNG exports are generated through service boundaries and keep metadata traceability.

## Assumptions

- Process minima are conservative defaults for cross-vendor compatibility.
- Vendor calibration profiles provide compensation hints rather than mutating source geometry.

## Future Integration

- Machine-specific profile packs.
- Full standards-backed DXF entity expansion.
- Signed export verification manifests.
