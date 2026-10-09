# Bezel artwork ownership audit — 9 October 2026

## Why the first fix was incomplete

The standard diver uses `DD_ARCH_BEZEL_SCALE_*` and `DD_ARCH_BEZEL_ZERO`; component variants use `DD_BEZEL_SCALE_*`. Generic slide-rule bezels add `DD_BEZEL_INNER_SCALE_*`; the reference kit uses `DD_REF42_BEZEL_MARKER_*` and pip meshes. The renderer's earlier global name rule only recognised the archetype family. All these GLBs can receive the same independently generated runtime scale, so the missing families displayed both authored relief and live artwork. This was an asset/rendering ownership contract gap, not duplicate scale generation, a reason to move graduations, or a need for new GLBs.

## Repair and future asset contract

`src/visual3d/authoredBezelMarkings.ts` now declares reviewed print regions for all 18 registered bezel options, including explicitly unmarked and procedural options. `GlbAsset.tsx` consults the selected asset's declaration only when live artwork owns its bezel band (or a replacement surface texture exists). Removing the replacement restores authored defaults via the existing isolated GLTF clone. Physical carriers, inserts, grip teeth, knurling, prongs, gems and surface meshes are not print regions. Both generic slide-rule tracks belong to the same physical bezel and are replaced together; this does not hide a separately selected chapter ring. Pilot authored print now also remains visible when no replacement surface texture exists, instead of being unconditionally hidden.

When adding a bezel: inspect its real GLB mesh names; declare print regions or explicitly none; review the total mesh count and authored-print count; run the whole registered-library contract test and inspect live/default transitions. A newly registered bezel without a declaration fails tests. Added meshes and changed print-region counts also require review. These guards are not a geometric or supplier-fit certification.

| Asset family | Authored print meshes replaced |
| --- | ---: |
| Standard diver | 61 |
| Coin-edge diver | 60 |
| Scalloped diver | 60 |
| Chronograph archetype | 16 |
| Fixed tachymeter variant | 12 |
| GMT variant | 24 |
| Generic slide-rule variant, both tracks | 120 |
| Reference 42mm bezel, ticks and pip | 62 |
| Pilot outer surface | 87 |
| Unmarked dress/field/smooth/fluted/knurled/legacy/diamond/procedural options | 0 |

## Computer-use evidence and limitations

After the requested 14:00 Johannesburg time had passed, the audit loaded a Diver test configuration using the app's automatic pre-load backup. Selected Rotating Bezel and clicked the actual right-side options for coin-edge, scalloped, GMT, generic slide-rule, fixed tachymeter and knurled bezels; inspected each in HD Visual. Screenshot evidence is under `docs/research/slide-rules/acceptance/diver-*-single-scale-2026-10-09.png`. Coin-edge/scalloped print is now replaced by one live scale, and physical grips remain. No catalogue selection was applied: an existing 14mm hand versus 13.4mm usable dial radius conflict disables Apply across these candidates. The audit did not bypass that safety check or alter hand dimensions. Thus these are preview visual checks, not successful Apply/fit tests.

Cancelled the temporary component preview, used Undo once to restore the original pilot/Navitimer project and returned to Engineering view. The automatically created pre-load backup remains available. Saved designs and supplier data were not overwritten. Tests cover repeated print/default switching, empty/dial-only targets, asset-specific matching and physical-mesh preservation across every registered bezel. Small live labels close to the crystal remain a legibility/layout limitation for the later acceptance audit; no radial geometry was altered in this repair.

No Blender binaries regenerated, no appearance-work milestone completed, no Milestone 7 started, and no schedule created because the requested start time had already passed. This repair is uncommitted until separately requested.

Final verification: 716 tests across 92 files passed, including 11 focused artwork-ownership tests. Typecheck, lint, production build and diff whitespace checks passed. Existing Zod annotation and large-bundle warnings remain non-blocking. Files changed: the artwork contract, its GLB renderer integration and regression tests; this audit and six preview screenshots are new evidence files.
