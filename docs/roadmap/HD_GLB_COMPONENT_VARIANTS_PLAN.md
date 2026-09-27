# HD GLB component-variant plan

Status: proposed implementation plan, started 2026-09-26.

## Goal

Make hands, bezels, and dials independently selectable HD components without baking an entire watch archetype into one inseparable GLB. Every authored asset must preserve engineering scale, anchors, materials, and procedural fallback behaviour.

## Phase 1 — contracts and review harness

- Freeze one component contract per category: units in millimetres, Z-up runtime orientation after import, origin/anchor, authored case diameter, bounding box, material slots, and naming rules.
- Extend the asset manifest with `variantFamily`, `styleId`, `referenceCaseDiameterMm`, compatible movement/hand-stack or case/bezel interfaces, source/evidence status, and review-render path.
- Add automated checks for finite transforms, expected bounds, missing materials, scale mismatch, anchor mismatch, and duplicate IDs.
- Produce the same front, three-quarter, side, and macro review renders for every GLB before registration.

## Phase 2 — hand families

Initial families: baton, Mercedes, sword, dauphine, syringe, cathedral, pencil, broad-arrow, and skeleton.

- Keep hour, minute, and seconds meshes separable, even when shipped in one GLB.
- Record hole diameters, visible length, total length, tube height, material, lume regions, and counterweight envelope.
- Bind hand selection to a new `handStyleId`; do not overload the archetype ID.
- Validate against movement post sizes and crystal/hand-stack clearance before showing green compatibility.

## Phase 3 — bezel families

Initial families: dive coin-edge, dive scalloped, pilot smooth, fluted dress, fixed tachymeter, GMT, and slide-rule.

- Separate bezel body and insert surface so insert artwork/material can change independently.
- Record case interface diameter, crystal clearance, insert OD/ID, insert profile, height, rotation capability, and click-system evidence.
- Clip live scale artwork to the physical insert annulus rather than a full-case square plane.

## Phase 4 — dial families

Initial families: sterile, diver, pilot A/B, field, dress sector, GMT, and chronograph.

- Separate substrate, applied indices, lume, printed artwork, date aperture, and feet/interface metadata.
- Prefer procedural indices/lettering for user overrides; authored dial GLBs must declare whether indices are baked in.
- Record diameter, thickness, centre hole, feet positions, date-window geometry, chapter-ring clearance, and movement compatibility.

## Phase 5 — configurator integration

- Add independent Hands, Bezel, Bezel Insert, and Dial selectors in Visual mode.
- Preview first; Apply only when compatibility is green or explicitly conditional. Red candidates remain preview-only and must explain the blocking interface.
- Show authored diameter beside every HD asset. If the case size changes away from that diameter, switch to the procedural representation and explain why.
- Persist component asset IDs in the project file and include them in render-package manifests.

## Acceptance gate per asset

An asset is registrable only when it passes: correct real-world bounds, correct anchor, no unexpected rotation/scale, named materials, clean normals, no duplicate geometry, render review, procedural fallback, compatibility metadata, and licence/source evidence.

## Recommended first delivery slice

1. Mercedes, baton, and dauphine hand sets.
2. Coin-edge dive and smooth fixed bezels, each with separate insert surface.
3. Sterile, diver, and dress-sector dials.
4. Independent selectors plus project persistence.
5. Nine-asset automated render/contact-sheet review and regression tests.
