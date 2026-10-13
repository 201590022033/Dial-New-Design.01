# Diver bezel and Advanced controls - 12 October 2026

Implemented locally alongside the existing uncommitted slider refinements.

- Diver-only 15/20-minute fine graduation section; five-minute major marks continue around the remaining ring.
- Separate fine-section colour and optional first-five-minute highlight, red by default. Main ink remains independently configurable.
- Ten-minute numeral hierarchy, inward zero triangle, exact six-degree minute spacing. No random calibration jitter.
- External bezel or internal-ring target; rotation slider, one-minute nudges, reset, test hand and zero alignment.
- Internal operation diagram includes a draggable four-o'clock control with arrow-key/Home operation. It simulates operation; no secondary crown, sealed case or supplier hardware qualification is added.
- Shared resolved ticks, labels and pointer feed engineering SVG, 3D textures and exports. Canonical scale binding saves active rotation, colours and target; diver section settings also remain in designConfig. Undo/Redo uses existing canonical history.
- Guards enforce Diver-only special markings even with cross-archetype overrides, and both source and destination component locks.
- Import/save validates new settings in canonical assembly and .dial formats.
- Advanced's bezel block now precedes general CAD controls. Citizen/Navitimer/Simplified selectors moved from the narrow left rail into this block; reference controls remain independent.
- Newly applied scale programs replace the default technical mono with clean sans lettering; existing custom type remains available. Live 3D artwork uses matte non-metallic ink. Reference-specific artwork and fonts remain intact.

## Physical limit

The starter inner bezel is only 0.25 mm wide. It cannot hold these numerals and line widths. Internal operation can be explored in the labelled illustrative diagram, but the actual part remains constrained to its geometry, displays fit errors and blocks manufacturing export. A wider physically suitable internal ring/case needs to be selected/designed and qualified separately. Pilot fixed-bezel placement is preserved; only circular internal-diver artwork uses the under-crystal plane.

## Verification

Browser-tested on an isolated local preview to preserve the user's main design: 15/20-minute selection, colours/highlight, zero alignment, external range drag, internal control drag and keyboard rotation, pilot reference controls. Automated calibration, fit, exclusivity, destination locks, serialization, Undo/Redo and Advanced ordering checks added in diverBezel.test.tsx. See local outputs for full check logs and screenshots.

Real screen-reader operation and qualified physical internal-ring hardware remain separate acceptance work.
