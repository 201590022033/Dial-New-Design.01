# Asset Library Architecture

## Version 3 Intent

Version 3 shifts differentiation from framework construction to professional watchmaking knowledge encoded as reusable assets.

The framework remains stable.

The asset libraries become the primary source of domain value.

## Frozen Systems

The following systems remain unchanged and are consumed as-is:

- Projection and profile infrastructure
- Mathematical engines
- Scale plugin framework
- Renderer and SVG pipeline
- Manufacturing validation framework
- Intelligent layout engine
- Export pipeline
- Watch component registry
- Object inspector architecture
- Zustand store architecture

## New Knowledge Layers

Data-driven libraries are stored in [src/domain/asset-library/data](src/domain/asset-library/data):

- scaleAssets.json
- chapterRingAssets.json
- markerAssets.json
- handAssets.json
- materialAssets.json
- typographyAssets.json
- manufacturingRules.json
- supplierProfiles.json

These datasets are loaded by typed adapters in [src/domain/asset-library/loaders.ts](src/domain/asset-library/loaders.ts).

## Integration Pattern

1. Asset data defines authentic watchmaking semantics.
2. Loaders expose typed objects to services.
3. Services map assets to existing framework contracts.
4. Existing stores and UI consume service outputs.
5. Export and validation report traceable manufacturing evidence.

No mathematical engine duplication is introduced.

## Manufacturing Intelligence Integration

Manufacturing rules and supplier profiles are separate from application logic.

Rules include:

- stable rule id
- source classification
- supplier category linkage
- confidence level
- configurable thresholds
- revision and version

Runtime validation attaches this metadata to warnings so exported diagnostics are explainable.

## Advisor Integration

The design advisor reads:

- current design-engine state
- manufacturing warnings
- typography presets
- supplier profiles

It emits actionable recommendations grouped across authenticity, geometry, manufacturability, and visual quality.

## Extensibility

Adding a new profile or asset should be data-first:

1. Add entry to the relevant JSON library.
2. Reuse existing loader and service interfaces.
3. Add tests for expected behavior.

Framework APIs should only change for verified defects.
