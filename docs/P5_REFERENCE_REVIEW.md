# Archived P5: provisional 42 mm visual reference review

This document records the superseded pre-NMK901 fixture. The active controlled
reference is documented in [P7_NMK901_REFERENCE_REVIEW.md](P7_NMK901_REFERENCE_REVIEW.md)
and [CANONICAL_MEASUREMENT_EVIDENCE.md](CANONICAL_MEASUREMENT_EVIDENCE.md).

The opt-in `reference-42-preview/v1` configuration is a **visual review fixture**.
Its inputs are `tools/blender/test_case_42.json`, `test_crown_v1.json` and
`test_hand_set_v1.json`. The application stores those versioned parameter sets
on separate case, removable crown and hand-set assembly parts, plus explicit
`watch-axis`, `dial-seat`, `hand-stack`, `crown-interface`, `pusher-2h` and
`pusher-4h` frames. The case still owns the boss and tube. The crown head is
independent and replaceable. The fixture is not a certified watch design or a
production fit claim.

The fixture JSON now includes provisional chronograph pusher parameters
(`pusherCount: 2`, `pusherLayout: '2h-4h'`). The published reference GLBs listed
below have been regenerated with the updated lug-attachment math and pusher
geometry.

The three separately generated and reviewed GLBs are published under
`public/assets/3d/reference-42/` for a fixed 42 mm visual preview only:

| Asset | SHA-256 | Imported meshes / vertices |
| --- | --- | --- |
| `case.glb` | `82166E1EA7F96E812AD2F08AE9FAC8A2AF861923ACA60D1C0D0A2BB214BD6C63` | 11 / 3232 |
| `crown.glb` | `30AD6E178313C13AC88C94251806514297074EBB9A680334DE97641D44AD1716` | 1 / 1538 |
| `hands.glb` | `B16A2F7B3C58B820B36987FC09723FF5EAD28BA759B893D48044FB307A7E3952` | 15 / 2940 |

Blender 5.2.1 validated each GLB and rendered its top, front, side and
three-quarter views through the common `review_component.ps1` pipeline.
`review_reference_42.ps1` additionally assembled all three generators in
their stored frames, validated the 27-mesh / 7710-vertex combined review GLB
and rendered the same four views. The combined GLB is **review evidence only**;
the application loads three independent component assets. Logs, manifests and
PNG views are reproducible under `.artifacts/blender-review/` and are ignored
by Git. Use the wrappers in the [Blender asset guide](BLENDER_ASSET_GUIDE.md).

The first P5 review exposed a case-generator regression: four cardinal wedges
put one lug on the +X crown axis. That geometry has been corrected before this
milestone continues. The fixture now generates two tapered lugs at each 12/6
strap end, with an explicit 16 mm `lugPairGap` between each pair and no
crown-side strap lug. The existing case boss and tube remain correctly part of
the case; the removable crown remains separate. The pair gap is a provisional
visual strap envelope, not a selected strap or manufacturing measurement.
The lug roots overlap the case shoulder by `lugCaseOverlap` so the full tapered
root intersects the case surface; this prevents a floating-looking strap lug
when the provisional gap is widened.

The fixture hand bores (hour 0.5, minute 0.5, seconds 0.3 mm) differ from the
repository's NH35 movement template (1.5, 0.9, 0.2 mm). This is a reference
conflict, not a manufacturing tolerance judgment. The fixture also includes two
visual pusher interfaces while the retained NH35 template requires none; the
application reports that pusher-count conflict separately. The crown rear socket starts
at the tube end with no specified insertion/engagement; thread pitch remains
unknown. Dial seat, hand stack, crystal underside, sealing and stem retention
are unverified. The case has no complete dial/crystal geometry in this fixture.
The app reports the three known hand-bore conflicts and unresolved checks in the 3D
review panel. The 2D compatibility system remains separate. The 3D reference
view hides the schematic dial and crystal because their provisional placement
occludes the reviewed hands; no dial/crystal fit is implied. This visual-only
suppression does not change those assembly parts or 2D engineering output.

Select **Load 42 mm reference set** in the 3D panel to apply it to the active
assembly; it changes the case, crown and hand-set parameters and case diameter.
The selection and frames persist with assembly serialization. **Use procedural
preview** clears the three fixed asset bindings while retaining selected
parameters and frames. If the diameter or any fixture parameter changes, the
fixed GLBs are withheld and safe procedural visual fallbacks render instead.
The review set does not offer live Blender generation or a manufacturing-ready
parameter editor. Generate a new reviewed asset for changed parameters.

P6 records an explicit evidence gate for the strap interface, movement/hand
bores, crown engagement, dial seat, hand stack, crystal clearance, pusher
engagement and pusher clearance. All eight remain provisional or unknown in this
fixture. Next, source verified movement/hand bore and axial-stack evidence, and specify
measurable stem, socket, tube, pusher stem and pusher return-spring engagement
before fit or production approval. Continue with a small controlled set of
configurations only after those checks.
