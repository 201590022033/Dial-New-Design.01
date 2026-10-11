# Crown C6 acceptance audit

Post-C7 checkpoint, 10 October: C7 was subsequently authorized and completed for provisional presentation. Fresh C6 regression rerun passed 106 files / 965 tests, lint/typecheck/build and diff checks. Actual two-case browser acceptance and all continuing hardware exclusions are in CROWN-C7-ACCEPTANCE-2026-10-10.md. The original audit below remains historical C0-C5 evidence; its source hashes are not a claim that later C7 code is unchanged.

10 October 2026, Africa/Johannesburg. User instruction: "go c6". **PASS for the approved C0-C5 ordinary-crown and protected-cap presentation scope.** C7 platform integration is excluded. This is software acceptance, not measured mechanical fit, factory interchangeability or water-resistance certification. C4-C6 remain local and uncommitted above published C0-C3 `b5c313bf95e1b47c68d8bee1412cac46cbd32122`; this instruction did not include publication.

## Final checks

| Check | Fresh C6 result |
| --- | --- |
| Full application tests | 105 files / 940 tests passed |
| Added C6 matrix | 29 tests passed |
| Type checking | `npm run typecheck` passed |
| Lint | `npm run lint` passed, zero warnings |
| Production build and project TypeScript build | `npm run build` passed |
| Diff/whitespace/conflict checks | Passed |
| Actual browser console errors | None |
| Existing C4/C5 production/test sources | All 30 hashes match their completion manifest |
| Original case and C3 crown GLBs | Unchanged; binary ownership, bounds and pinned hashes pass existing asset tests |

The build retains non-fatal dependency annotation and bundle-size notices; tests retain the existing Three.js CommonJS deprecation notice. No production-code repair was required during C6.

## Automated acceptance matrix

`src/tests/crownReleaseGate.test.ts` adds 18 starter/diameter cases, ten profile cases and one untouched-legacy case. It covers all six starters (diver, pilot, dress, ladies dress, field and chronograph) at custom preview diameters 34/38/42 mm. Each starter/diameter tests all six crown shapes, all three exposed concept closures and all five finish choices: **1,620 combinations**, each serialized and imported before checking ownership, appearance, placement, physical evidence and surrounding-part preservation. The same fixtures exercise **216 open/closed cap states** with actual mesh bounds, head-envelope clearance and exploded separation.

All ten profiles receive their default and then preserve an explicit imported smooth crown and rose finish through all ten profile transitions (100 inherited-profile transitions). Untouched legacy assemblies remain lossless and are not automatically opted into concepts. These are deterministic software checks; the custom diameter matrix does not qualify an exact supplier case at each diameter.

The fresh full-suite run also covers slide-rule persistence/calibration, two bezel scales, crystal/sapphire overlays, lug and case geometry, central/subdial hands, dial appearance, straps, physical compatibility, stale Preview/Apply, locks, Undo/Redo, project/version storage, bundle accounting, unknown shipping and snapshot FX. Existing C4 tests preserve exact selected commercial records and package contents across export/hydration/version restore and reject malformed snapshots before mutation. No new quote or supplier record was onboarded.

## Actual browser acceptance

An isolated `http://127.0.0.1:3020/` origin was used. All six starter Load actions were exercised; the expected knurled, onion, fine-fluted, compact and coarse-fluted defaults appeared. Each starter was inspected in Engineering and front/side HD. The six visible gallery profiles were checked through these starter loads; the remaining four profiles are covered by the automated ten-profile matrix, not claimed as manually photographed UI routes.

The main Engineering viewport still shows the dial rather than a complete watch-side crown view. The crown controls provide the shared-geometry front detail. Its displayed core/maximum diameter/length and finish were inspected beside the HD result. Full mechanical Engineering/HD placement acceptance is excluded until a case-side engineering view and measured interfaces exist.

Additional actions checked:

- Diver: screw-down concept, independent matte-black finish, transparent closed cap, front and end-on crown view. One operating crown remained distinct from the cap and holder.
- Reference 42 mm composition: smooth crown, rose finish, push-pull concept and exploded-open cap; the current chronograph visual profile was retained. Custom preview changed to 38 mm without changing crown dimensions or losing the concept labels.
- All five finish controls and all three closure choices were exercised across the fixtures. Every exposed crown shape was inspected; this is a representative visual matrix, not screenshots of all 1,620 automated combinations.
- The cap concept label remained visible in full-screen HD. Head, holder and exploded cap remained visibly distinct. Case/guard/holder attachment and hardware clearances remain unqualified.
- Saved version `C6 smooth rose open`; changed to no cap and brushed steel; restored the saved version; reloaded the project. Smooth crown, push-pull concept, rose finish, open cap and custom 38 mm preview survived.
- Onion Preview followed by Cancel retained the committed smooth crown. Locking the component disabled crown choices and finishes; unlocking restored editing.
- The researched NMK903 38 mm case allowed a provisional visual preview but incompatible Apply stayed disabled. The separate "research only; preview blocked" warning belongs to other explicitly research-only entries. A broad DOM observation initially conflated those cards; source inspection resolved this without a code change. The blocked-case screenshot documents the provisional visual, while the disabled Apply observation is recorded in the manifest.

Final browser error log was empty. The temporary tab and server were closed. No viewport override, supplier purchase, contact, scheduler or external publication action was performed.

## Support and exclusions

| Area | C6 disposition |
| --- | --- |
| Six concept head shapes and independent/inherited appearance | Software acceptance passed |
| Unspecified/push-pull/screw-down selections | Presentation choices; physical conversion remains unqualified |
| Open/closed protected cap | Presentation only, no orderable hardware, hinge/lever/lock/seal or pressure rating |
| Included case crown versus separately selected replacement | Software accounting passed using explicit evidence and synthetic accounting fixtures |
| 34 mm ladies starter and 42 mm reference composition | Browser acceptance passed within existing presentation/fit limits |
| Custom 34/38/42 mm previews | Automated matrix passed; custom 38 mm transition also checked in browser |
| Exact researched 38 mm case | Provisional preview inspected; incompatible Apply blocked, no fit approval |
| Exact 46.5/47 mm off-axis cases, 3.8/4/4.1/4.2h or left-side installation | C7 remains unimplemented and outside this gate |
| Multiple-axis rendering and full case-side Engineering view | Not supported by current renderer; no acceptance claim |

Build RED/UNKNOWN indicators remain visible where existing incomplete/incompatible parts require review. Passing C6 does not turn those assemblies into approved procurement builds. Historical catalogue/dial descriptions do not establish assembled-watch performance.

Evidence: `docs/research/crown-c6-2026-10-10/manifest.json` pins the screenshots and C6 source hash. C0-C5 source drawings, supplier gaps, binary manifests and earlier acceptance remain in their existing handoffs. Current remaining work is C7 or separately authorized publication; preserve this local checkpoint and keep scheduling paused.
