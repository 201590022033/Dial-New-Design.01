# Implementation Audit

Date: 2026-07-26

## Scope

This audit reflects the current codebase implementation status without adding new functionality.

Primary evidence sources include:

- src/domain/scales/plugins/builtInPlugins.ts
- src/domain/scales/plugins/createCircularPlugin.ts
- src/domain/scales/scaleRegistry.ts
- src/services/scaleEngineService.ts
- src/domain/manufacturing/validationEngine.ts
- src/services/exportGeometryService.ts
- src/components/layout/RightInspector.tsx
- src/features/shared/objectInspectorSchemas.ts
- src/components/layout/RightFeatureStack.tsx
- src/domain/extensions/helpDocs.ts
- src/domain/extensions/placeholderFeatures.ts
- src/domain/bands/bandRegistry.ts

## Watch Components

| Feature | Status | Completion | Recommendation |
|----------|---------|------------|----------------|
| Case | Partial (parameterized, not object component) | 35% | Introduce explicit case component schema and rendering layer metadata while reusing existing geometry params. |
| Crystal | Placeholder/Not implemented | 5% | Add crystal component schema first, then non-export visual layer in renderer overlay pipeline. |
| Bezel | Partial (inner/outer bands + bezel generator + inspector sections) | 72% | Add dedicated bezel-specific scale semantics and manufacturing checks by bezel type. |
| Outer Slide Rule | Partial (schema + generic scale plugin usage) | 45% | Implement dedicated logarithmic slide-rule math plugin and bezel coupling constraints. |
| Inner Slide Rule | Partial (schema + generic scale plugin usage) | 45% | Implement reciprocal/coupled slide rule behavior and validation against outer scale. |
| Chapter Ring | Partial-to-Strong (chapter generator + markers + inspector + export) | 78% | Add chapter-ring-specific collision and typography packing validation. |
| Minute Track | Partial (schema + chapter style support) | 60% | Add dedicated minute-track generator mode with per-minute tick density rules. |
| Hour Markers | Partial (marker engine + schema) | 58% | Add marker-family constraints and applied-marker process metadata. |
| Dial Face | Strong (dial generator + texture + typography + export overlay) | 82% | Add crystal/print stack context and finite layer compositing rules. |
| Hands | Placeholder (band + placeholder schema, no hands generator) | 22% | Add hands geometry generator and hand-stack clearance validation. |
| Logo | Placeholder (band + placeholder schema) | 20% | Add logo placement constraints and manufacturing print/engrave modes. |
| Date Window | Partial heuristic only (collision warnings) | 18% | Add explicit date-window component with geometry + movement alignment logic. |
| Complications | Placeholder (band + placeholder schema) | 20% | Add complications layout engine and movement-safe zones. |

## Scale Types

Legend: Y = implemented, P = partial/generic, N = not implemented.

| Scale | UI | Math Engine | Tick Gen | Label Placement | Collision Detection | Validation | Manufacturing Export | Completion |
|-------|----|-------------|----------|-----------------|---------------------|------------|----------------------|------------|
| Linear | Y | Y (generic linear) | Y | Y | P | Y | P | 78% |
| Logarithmic | Y | Y (generic log mapping) | Y | Y | P | Y | P | 72% |
| Circular Slide Rule | Y | P (generic logarithmic plugin) | Y | Y | P | Y | P | 55% |
| Tachymeter | Y | P (registered, generic circular plugin) | Y | Y | P | Y | P | 52% |
| Telemeter | Y | P (registered, generic circular plugin) | Y | Y | P | Y | P | 50% |
| Pulsometer | Y | P (registered, generic circular plugin) | Y | Y | P | Y | P | 50% |
| Decimal Minutes | N | N | N | N | N | N | N | 0% |
| Countdown | Y | P (generic linear model) | Y | Y | P | Y | P | 55% |
| Elapsed Timer | N | N | N | N | N | N | N | 0% |
| GMT | N (not in scale registry) | N | N | N | N | N | N | 0% |
| Compass | Y | P (angular model label only) | Y | Y | P | Y | P | 50% |
| Dive Bezel | N (as dedicated scale type) | N | N | N | N | N | N | 0% |
| Fuel Computer | N (fuel generic only) | N | N | N | N | N | N | 0% |
| Wind Correction | N | N | N | N | N | N | N | 0% |
| Density Altitude | N (altitude generic only) | N | N | N | N | N | N | 0% |
| Custom Scale | Y | P (generic circular) | Y | Y | P | Y | P | 60% |

### Scale Audit Notes

- Many named scales are registered in builtInScalePlugins but currently created via one generic factory (createCircularPlugin).
- Plugin help text is placeholder for all generated plugins.
- Validation is generic and does not provide scale-specific engineering rules beyond structural checks.
- Export includes tick/label geometry, but format-specific manufacturing semantics are pseudo for DXF/PDF/PNG wrappers.

## Manufacturing Audit

| Feature | Status | Completion | Recommendation |
|----------|---------|------------|----------------|
| SVG Export | Implemented | 88% | Add layer metadata schema versioning and process profile presets. |
| DXF Export | Partial (pseudo DXF output) | 48% | Replace pseudo entities with standards-compliant DXF writer. |
| PDF Export | Partial (pseudo wrapper) | 30% | Implement real vector PDF generation pipeline. |
| PNG Export | Partial (currently SVG payload with PNG mime wrapper) | 25% | Add rasterization pipeline (canvas or headless renderer). |
| Laser | Partial validation rules | 45% | Add process-specific kerf compensation and min feature checks per material. |
| CNC | Documentation/placeholder | 20% | Add cutter-radius-aware geometry validation and toolpath-ready constraints. |
| UV Printing | Partial validation (line width warnings) + docs | 35% | Add ink spread and layer stacking constraints. |
| Engraving | Partial estimate only | 28% | Add depth/width/process checks and engraving-specific export profiles. |

## Inspector Audit

| Area | Status | Completion | Recommendation |
|------|--------|------------|----------------|
| Object-centric schema routing | Implemented | 85% | Keep schema map as extension registry source for future plugin sections. |
| Dial Face inspector sections | Implemented | 80% | Add component-specific validation summary blocks. |
| Chapter/Slide/Bezel sections | Partial | 62% | Add true per-component control semantics beyond shared generic controls. |
| Hands/Logo/Complications | Placeholder | 20% | Add geometry generators before advanced inspector controls. |

## Export Audit

| Area | Status | Completion | Recommendation |
|------|--------|------------|----------------|
| Export target scoping | Implemented | 85% | Add strict selected-component export mapping. |
| Preview summary | Implemented (basic) | 70% | Add process-specific cost/time estimators and failure diagnostics. |
| Manufacturing package | Partial | 55% | Add actual packaged assets and manifest checksums. |

## Help Audit

| Area | Status | Completion | Recommendation |
|------|--------|------------|----------------|
| Help center UI | Implemented | 80% | Add deep links from inspector sections to docs. |
| Help document content | Documentation + placeholders mixed | 45% | Replace placeholder sections with engineering-grade formulas and references. |
| Engineering help index mapping | Implemented | 65% | Add validation that all active features map to at least one help entry. |

## Plugin System Audit

| Plugin Area | Status | Completion | Recommendation |
|-------------|--------|------------|----------------|
| Scale Plugins | Implemented registry + runtime plugin API | 78% | Add per-scale specialized plugin implementations and metadata capability flags. |
| Inspector Plugins | Not implemented (schema file is internal map, not plugin-extensible) | 25% | Define inspector-section contribution API keyed by component id. |
| Export Plugins | Not implemented | 10% | Add format adapter interface for real SVG/DXF/PDF/PNG backends. |
| Manufacturing Plugins | Not implemented | 12% | Add process profile plugin interface for validation and output constraints. |
| Movement Plugins | Not implemented (library exists, no plugin host) | 18% | Add movement profile provider interface and compatibility checks. |

## Engineering Readiness (Part C)

Future mathematical implementations should integrate as additive plugin modules under the existing Scale Engine and plugin registry.

### Recommended Extension Points

| Capability | Primary Integration Point | Supporting Files | Notes |
|-----------|----------------------------|------------------|-------|
| Circular logarithmic scale generator | New dedicated plugin in src/domain/scales/plugins | src/domain/scales/math.ts, src/domain/scales/tickGenerator.ts, src/domain/scales/validation.ts | Avoid generic factory for this plugin; keep registry contract unchanged. |
| Tachymeter generator | Dedicated tachymeter plugin module | src/domain/scales/plugins/builtInPlugins.ts, src/services/scaleEngineService.ts | Keep tick/label API stable; replace generic model with speed-distance formula mapping. |
| Telemeter generator | Dedicated telemeter plugin module | same as above | Introduce distance-of-sound model with config fields in inspectorConfiguration. |
| Pulsometer generator | Dedicated pulsometer plugin module | same as above | Add pulse-baseline parameter and validation rule set. |
| Compass generator | Dedicated compass plugin module | src/domain/scales/labelGenerator.ts, src/domain/scales/validation.ts | Add cardinal label presets and rotational normalization rules. |
| Aviation slide rule | Paired outer/inner slide-rule plugin set | src/features/shared/objectInspectorSchemas.ts, src/stores/scaleStore.ts | Keep independent plugins but add coupling metadata for joint validation. |
| Tick generation engine | Extend tick generator with strategy interface | src/domain/scales/tickGenerator.ts | Strategy by scale kind while preserving plugin tickGenerator signature. |
| Label collision engine | Add scale-label collision module + invoke in validateScale | src/domain/scales/validation.ts, src/domain/geometry/collisionEngine.ts | Keep component collision engine separate; feed summarized warnings into scale validation. |
| Manufacturing validation | Extend process-aware rules under existing validation engine | src/domain/manufacturing/validationEngine.ts | Add process profile inputs; do not modify store contracts. |

### Integration Guidance

- Keep ScalePlugin contract unchanged where possible; add optional capability fields rather than breaking signatures.
- Register new mathematical plugins through scaleRegistry only.
- Route UI visibility through existing inspector schema sections and scaleStore selection logic.
- Keep manufacturing checks in domain/manufacturing to preserve UI-engine separation.
- Use current export service boundaries to avoid coupling plugin logic into renderer code.

## Overall Summary

- Core architecture is sound and extensible.
- UI workflow and object-centric structure are present.
- Most advanced engineering features are currently genericized or placeholder-backed rather than domain-specific implementations.
- Highest-value next work is scale-specific mathematics + process-realistic export/manufacturing backends.
