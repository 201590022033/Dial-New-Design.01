# Pilot dial decimal hours and Simplified subdivisions - 12 October 2026

- Decimal-hour artwork is restricted to band-dial-face. The UI offers only Dial Face; store write guards and artwork validation reject bezel/chapter placements.
- Defaults reserve a writing annulus inside the dial, with a 2.5 mm inset from its outer edge. A configurable 0-10 mm inset lets the user clear hour indices and lettering without changing part dimensions or calibrated angles. Fit validation remains authoritative; visual overlap must still be reviewed for the chosen dial composition.
- Existing saved decimal-hour layers are migrated to the dial face on assembly load/save and .dial load/save, retaining their enabled state, colour, font size and angular origin. Old layers without an inset use the new 2.5 mm default.
- Dial part and tray locks are enforced. Canonical history retains the existing Undo/Redo behavior.
- Simplified aviation uses the same Navitimer subdivision schedule: 0.1 units from 10 to 15, 0.2 from 15 to 25, 0.5 from 25 to 60, and 1 from 60 to 100, excluding duplicate seam/end marks. There are 210 stations per row, 420 across both rows.
- The station values come from the existing audited Navitimer inventory. Simplified retains its own origin, lettering, colours and numerical calculations. It does not copy reference captions, branding, conversion pointers or substrate colours.
- Advanced's Graduation detail selector defaults to Navitimer subdivisions. The former coarse/fine/extra-fine profiles remain explicit custom-density options, separate from numeral detail.
- Resolved artwork is shared by engineering SVG, 3D textures and manufacturing export. Tick positions are never shifted to avoid text; numeral auto-fit remains independent.

## Verification

111 test files / 1,060 tests passed. Production build passed. Browser checks verified 420 slide-rule ticks plus 100 enabled decimal-hour ticks; switching to Coarse produced 150 plus 100, then switching back restored 520. Dial-only targeting and inset adjustment were checked against rendered DOM and screenshots. Pilot 3D preview displayed the dial scale and fine bezel artwork with no console errors. Lint was rerun after correcting a test-only unsafe JSON access.

All changes are local and uncommitted, alongside prior slider and diver refinements. Physical manufacture and real screen-reader acceptance remain separate.
