# Milestone 3B — Classic Navitimer runtime checkpoint

Implemented 8 October 2026, after publishing Citizen Milestone 3A as `fdb5de20f4e4bc2fa6a6ae4727e98bb39c2be8ec` on `main`.

## Delivered

- The selected reference is `navitimer-booklet-training-disc-2026-10-07`: the instruction booklet's viewer-page-2 training disc, not the 1967 AOPA cover or a modern Navitimer model.
- Independent compact runtime inventory matches all 420 verified graduation records (210 per ring), including source tick classes, directions, profiles and 55 literal numeral strings. Four pointer-owned stations yield 416 radial strokes; no duplicate black stroke is invented below the red outer10/60 footprints.
- Nine reference pointers: fixed red10, black MPH60, red36 seconds, KM/NAUT./STAT.; rotating red10/60 and the unlabelled near36 reference. Inner70/80/90 print as7/8/9; no inner60 numeral or fabricated HH:MM row.
- Nominal KM61 uses exact statute/nautical distance ratios. The measured61.205 source fit remains evidence, not false factory precision. Outer rotation moves only the rotating row; fixed pointers remain fixed.
- Separate immutable scan-derived palette with16 editable ink/substrate roles. Original ignores custom overrides; Custom, Reset, visibility, typography dimensions and rotation use shared Engineering/HD/export artwork.
- Source-derived proportions are adapted to the two bound physical annuli. Overflow and numeral crowding block export without dropping or relocating individual calibrated graduations. MPH/KM captions use disclosed smaller substitute typography and glyph-centre clearance without changing pointer calibration.
- Citizen/Navitimer/Simplified state is independently saved per band. Disabled bands remember their last selected inspector design. Active saved references must have matching canonical reference identity and plugin design; generic payloads cannot claim original reference artwork.
- Both reference choices are enabled as disclosed reconstructions. Hex edits now support ordinary partial typing and commit after validation on Enter/blur.

## Verification and visual evidence

Final verification:591 tests in79 files pass; typecheck, lint, production build and `git diff --check` pass. Build retains existing dependency-annotation/large-bundle warnings; tests retain the existing Three CJS deprecation warning. Focused tests cover exact packet inventory, envelopes, palette roles, rotations, source exclusions, SVG/DXF, actual HD canvas paint, three-design switching, reset, save/load, Undo/Redo and disabled per-band reopening.

Browser acceptance used the isolated local pilot42mm fixture: left-side mutual selection, Citizen-to-Navitimer and reverse HD switching, inner-row visibility, outer rotation25/reset, Custom MPH hex `#123456` (confirmed in the rendered SVG), Original reset, Simplified switching and untick/re-enable. Both Engineering and fully loaded HD show the two source-specific scale rows. A first HD loading frame was blank before texture completion; the subsequent saved/inspected render contained both rows, and actual canvas regression tests confirm their inventories and colours. This was not treated as a proven production rendering defect or hidden by a speculative patch.

- [Engineering controls](research/slide-rules/acceptance/navitimer-engineering-controls.jpg)
- [HD controls](research/slide-rules/acceptance/navitimer-hd-controls.jpg)
- [Source verification](NAVITIMER-VERIFICATION-2026-10-08.md)

## Explicit limitations and next milestone

The low-resolution skewed JPEG does not establish factory fonts, calibrated inks or orthographic millimetre dimensions. Seconds/unlabelled outer-reference red are explicitly reconstructed using the KM-red sample; the unsampled blue-grey divider is not invented as a factory colour. Caption font size/baseline spacing remain reconstruction choices. The source's photographed outer phase is not imposed as the user's operational zero.

Small physical chapter rings produce small lettering. Valid containment is not proof of useful1:1 readability, supplier fit, sapphire clearance or manufacturing approval. HD lighting changes apparent colour and can make tiny labels harder to read. PDF/DXF font substitution remains the shared export limitation; outline chosen fonts before manufacture. No new GLBs, supplier listings or purchased-part dimensions were changed for3B.

The functional3B wiring is complete. On8 October2026 the user explicitly accepted substitute fonts and a reference-inspired design rather than perfect factory reproduction. Exact-font/ink fidelity is therefore not a blocking gate and must not repeatedly reopen this milestone. The remaining production checks concern actual geometry, legibility and export integrity, not brand-identical typography. Full cross-archetype34/42/46mm acceptance remains Milestone7 work; the hybrid layout is Milestone4 and new decimal-hour/knots-mph programs are Milestone5.

For SVG laser preparation, export at1:1 millimetres, convert text to paths using the chosen substitute font in the manufacturing application, recheck glyph fit after conversion, explicitly assign engraving/cutting operations and test kerf/material settings on a sample. SVG text is currently editable text, not automatically outlined paths; coloured substrate fills are visual artwork, not instructions to engrave the whole annulus. Do not interpret successful software validation as a physical laser-process certificate.

The user authorised committing this3B checkpoint after accepting the above standard. No additional functional blocker was found in the final review; exact font reproduction was not a runtime/export gate. This request authorises a local commit, not a further push.
