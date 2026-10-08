# Milestone 4 visual exception reconciliation

8 October 2026. Milestone 4 checkpoint published as `531bf2f`; its continuation schedule was deleted at the user's request. This follow-up does not start Milestone 5.

## Repairs

- Engineering band validation now retains the canonical physical assembly projection rather than rechaining purchased parts from stale global width defaults. Dial printing is constrained by both the actual blank and chapter opening; visibility, colour and locks follow their components.
- Marker synchronization preserves authored inset and clamps inward only when necessary. Conservative numeral bounds stay inside the dial; date-overlapping hour glyphs are omitted without moving angular stations.
- Shared automatic dark/light marker contrast preserves explicit user colours and reference scale inks. The inspector displays the resolved automatic colour and explains how a custom override is created.
- HD replaces baked hour markings with current canonical hour artwork below the crystal, avoiding duplicates and allowing live shape/colour updates. Non-glyph indices remain physical meshes; date artwork is shared. Painted minute markings are no longer reflective silver metal that washes out a dark tint.
- HD date apertures use in-plane dimensions, not axial part thickness; clock positions use north=0 degrees. Unsupported day-window placeholders are excluded on date-only movements, while explicit part visibility is retained.
- Shared Engineering/HD grain uses bounded illustrative roughness/micro-bump. It is not a measured factory surface or a new GLB.
- Versions now persist validated design/sourcing snapshots in browser storage, with bounds, safe failure warnings and newest-eight automatic retention. Live Save/reload confirmed the record remains present. Project export remains the portable backup.
- Export SVG rings now have true transparent annular holes instead of repainting the dial with a dark background. Actual dial fill, hour glyph geometry/contrast and typography are shared by SVG/PDF/DXF. DXF contains physical-mm text/entities, not automatically outlined fonts.
- Microscopically adapted reference text below 0.10 mm is refused; practical selected line-profile readability warnings remain visible. Colliding unit captions search for a safe radial position within the physical annulus, preserving calibrated angles and ticks; impossible caption fit refuses export.

## Actual-file verification

`export-qa.html` is a developer-only page using production SVG, DXF and PDF functions, without mutating the active project. `scripts/export-qa-collector.mjs` temporarily accepts bounded, fixed-name blobs on loopback only. Retained QA fixtures are under `output/pdf/`: 42 mm pilot Navitimer, 42 mm pilot Citizen, and 34 mm ladies Simplified dress artwork. PDF pages are 60 x 60 mm; Poppler inspection checks the actual vector files, not screenshot exports. The inappropriate 34 mm Citizen fixture is retained only as ignored negative evidence in `tmp/pdfs/negative-fixtures/`.

Final integration verification: **683 tests across 89 files pass**; TypeScript checks, lint, production build and whitespace checks pass. Existing non-blocking dependency annotation/deprecation and bundle-size warnings remain. Poppler reports an unavailable standard Symbol display font, but the used glyphs render visibly in the inspected QA pages.

Live browser acceptance covered normal Engineering and Advanced geometry, pilot HD, silver-to-dark dial colour changes, explicit rose-gold numerals, restoration of automatic dark silver-dial numerals, brushed direction 0/90 and sunburst controls, and saved-version reload. The final HD screenshot shows both physical scale rows, dark canonical hour numerals and one readable date window rather than the thin aperture or duplicate boxes. Silver finish grain remains subtle through sapphire lighting; the inspector close-up is illustrative, not a promise of photographic factory surface fidelity. Cross-archetype geometry and date capabilities are covered by regression tests, not claimed as an exhaustive new live audit of every possible combination.

## Limits that are not software defects

Supplier fit, laser/material/kerf trials and 1:1 readability remain physical verification steps. Substitute fonts require outlining in the manufacturing application. Reference radial caption adaptation is disclosed, not factory reproduction. Illustrative HD finishes are not measured roughness. No supplier certification, new procurement research or Blender asset regeneration is claimed.
