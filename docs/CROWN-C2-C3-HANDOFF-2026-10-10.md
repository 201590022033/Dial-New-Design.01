# Crown C2 and C3 completion handoff

Completed 10 October 2026. The user authorized C2 followed by C3 and commit/push. C0 and C1 are included as required unpublished dependencies. C4, C5, C6 and C7 remain separate work; the existing scheduler stays paused.

## C2: choices, defaults and compatibility

Six draft, export-disabled concept crowns now appear in the catalogue: smooth, fine-fluted, coarse-fluted, cross-knurled, onion and compact dress. Search all remains restricted to crown candidates for the crown slot. UI, BOM and domain Apply reject wrong-slot candidates and respect locks. Apply reevaluates current state so an old crown preview cannot overwrite unrelated edits.

Default resolution preserves explicit and legacy saved choices first, then accepts an exact case-supplied crown supported by drawing/supplier evidence, then a supported platform recommendation, then provisional archetype styling. All ten profiles have deterministic styling: dive/GMT knurled; pilot onion; field coarse-fluted; formal/business/chrono fine-fluted; ladies compact; digital sport/casual smooth. Changing platform preserves authored choices and removes stale case-axis bindings.

No production case bundle has been newly certified or onboarded. Exact bundle and mating-interface evidence remains incomplete. Supplied-crown and recommendation precedence is covered with synthetic fixtures; these tests do not establish supplier facts.

Compatibility distinguishes appearance from physical interfaces. Known family, thread diameter/pitch, movement stem/reference/height, engagement, gasket, closure and cap-holder contradictions are red. Missing information stays unknown. Even nominal agreement requires tolerance and sealing validation. Shared NH35 names and seller Tap labels do not establish interchangeable case fit. A grip-only concept change preserves the previous physical contract and closure; a real replacement uses its own specification. Independent crown finish survives choices and case transitions.

## C3: geometry and ownership

`tools/blender/generate_crown_family.py` reproducibly creates six closed, neutral-steel head meshes, with matching shaped procedural fallback in `src/visual3d/crownGeometry.ts`. Dimensions below are presentation dimensions, not manufacturing specifications.

| Shape | Core OD mm | Maximum OD mm | Head length mm |
| --- | ---: | ---: | ---: |
| Smooth | 6.5 | 6.5 | 3.5 |
| Fine-fluted | 6.5 | 6.9 | 3.5 |
| Coarse-fluted | 6.5 | 7.1 | 3.5 |
| Cross-knurled | 6.5 | 6.9 | 3.5 |
| Onion | 6 | 7 | 4 |
| Compact dress | 5 | 5.2 | 2.5 |

The head datum is rear X=0, with +X outward in millimetres. No unmeasured physical socket is fabricated. All six GLBs and their generator hash are recorded in `docs/research/crown-c3-2026-10-10/asset-manifest.json`. Binary geometry bounds and procedural surface agreement are tested.

Only `DD_CASE_CROWN_PREVIEW` on the eight C0-reviewed case asset IDs is hidden on a runtime clone. Original case GLBs remain byte-identical to the C0 inventory. Tubes, bosses, guards and lugs remain intact. The compact ladies fixture now renders one operating head. The reference crown registry points to the existing reference GLB. Crown asset selection and fallback shape no longer depend on unrelated hand/dial/strap selection or case diameter. Custom dimensions use shaped fallback when a nominal GLB cannot represent them.

## Verification and evidence

- Full suite: 103 files / 884 tests passed, including 40 C2 and 18 C3 additions, plus the 40 C1 contract/integration tests.
- Lint and production build passed; the build includes TypeScript project checking. Existing dependency annotation, bundle-size and Three.js CommonJS warnings are non-fatal.
- Actual isolated browser acceptance at localhost:3018 verified all six front/side HD shapes, crown-only Search all, keyboard Apply, double-click Apply and fresh 34 mm ladies rendering. Browser error log was empty.
- Six pairs of HD screenshots, two Engineering front screenshots and ladies HD front/side screenshots are retained under `docs/research/crown-c3-2026-10-10/`. Engineering currently has no crown/side viewport: its screenshots establish the available front baseline only. Full C6 cross-profile acceptance is not claimed.

Physical fit, water resistance, custom/cap mechanisms, off-axis supplier integration and multi-axis rendering remain unresolved or later milestones. No source evidence gap was replaced with an invented value. Next implementation requires approval for the next milestone. Publication was explicitly authorized; verify live HEAD against origin/main before continuing from this checkpoint.
