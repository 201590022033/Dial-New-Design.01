# C1 crown contract and migration handoff

Completed 10 October 2026 after the C0 evidence gate. This freezes additive contracts for subsequent C2/C3 work; it does not implement crown controls, defaults, procurement qualification or replacement GLBs.

## Public contract

The public entry point is `src/domain/crown/index.ts`. `types.ts` declares `crown-spec/v1`, `crown-axis/v1` and `crown-choice/v1`; `validation.ts`, `axis.ts` and `legacy.ts` provide assertions, conversions and explicit reversible migration.

- `CrownSpecificationV1` separates shape and grip, core diameter and maximum grip envelope, axial length, closure, protection and finish. Finish explicitly inherits the case or overrides material/color/texture.
- Physical interfaces are independent: movement stem identity/revision/thread, crown socket, case-tube engagement/gaskets and matched cap/holder mechanism. Installation retains movement rotation/stem height/spacer, dial feet/rotation, calendar aperture/date-wheel orientation and front/rear loading.
- Each evidential field is either unknown with a reason or known with a source and evidence kind. Supplier wording is preserved independently from measured numeric values. Schema validity is never a mechanical-fit or sealing certificate.
- The operating head belongs to the crown; tube, boss and fixed guards belong to the case. Caps, holders and extraction levers have explicit ownership and require matched assembly identity where applicable.
- `CrownChoiceV1` keeps selected instance/source separate from a catalogue recommendation. C1 never applies a recommendation automatically.

Optional metadata lives on assembly parts (`crownAxes`, `crownSpecification`), catalogue entries and `designConfig.crownChoice`. A visual binding can reference `crownAxisId`. No existing catalogue entry is silently upgraded.

## Placement source and coordinates

The case part owns the numeric axis. `axisId` references are unique across an assembly; every operating head on an authored axis is counted, including hidden and legacy heads. Serialization rejects duplicate owners, missing references and contradictory case/crown visual categories. Known catalogue kinds take priority over visual labels when validating ownership.

Clockwise angle is measured from front-view 3h, in degrees `[0,360)`. In the runtime Engineering/Blender frame, the face is XY, +Z points toward the crystal and +X is 3h. For angle theta, interface radius r and stem height h:

`position = [r*cos(theta), -r*sin(theta), h]`, `rotation = [0, 0, -theta]`.

`crownAxisToExportedAssetFrame` is explicitly for exported Y-up assets: position `[x,z,-y]`, rotation `[0,-theta,0]`. It is not a second runtime conversion; the existing GLB loader restores the Engineering frame.

An explicitly declared modern axis overrides saved legacy anchors, visual angles and tube endpoints. Legacy visual transforms remain in storage but are inactive for canonical placement. Unknown modern coordinates omit the operating crown instead of inventing placement. Without modern metadata, the original saved-anchor > tube endpoint > visual-angle precedence is unchanged.

The document can preserve multiple case axes and heads. The existing visual model has one crown slot, so multiple declared axes intentionally omit that slot until later renderer work supports them. C1 does not claim multiple-crown rendering or an Engineering side viewport.

## Migration matrix

| Input | C1 behavior | Preserved or unknown |
| --- | --- | --- |
| Old assembly or `.dial` document without crown contracts | Load/save remains opt-out; no automatic migration | IDs, explicit choices, supplier/source metadata, anchors, transforms and geometry retained |
| Explicit `migrateLegacyCrown` call | Returns new specification plus a deep original snapshot | `restoreLegacyCrown` restores the complete snapshot; no in-place mutation |
| Legacy parametric 7 mm core and 0.2 mm radial grip | Core 7 mm, maximum envelope 7.4 mm | Original dimensions remain verbatim |
| Legacy nominal dimensions without grip geometry | Nominal core/head length retained as presentation evidence | Maximum envelope unknown |
| Missing legacy closure | Known `unspecified`, with legacy provenance | No push-pull or screw-down inference |
| Legacy visual socket/thread fields | Original snapshot retained | Physical stem/socket/tube/thread and gasket fit remain unknown |
| Legacy appearance | Explicit material/color/texture override | Appearance retained; inheritance available for new authored data |
| Unknown physical evidence | Legal persisted contract state | Validation reports unknown, never fit verified |
| Invalid dimensions/IDs, conflicting ownership or references | Reject at assembly and embedded `.dial` boundaries | Runtime hydration rejects before store mutation |

## Verification and scope

Current full-suite result: 101 files / 826 tests passed, including 26 crown contract tests and 14 assembly integration tests. Coverage includes clockwise fixtures, exported coordinates, invalid dimensions, padded identity rejection, reversible migration, unknown evidence, ownership, modern precedence, legacy preservation, hidden duplicate heads, multiple-axis persistence and invalid hydration refusal.

Production build includes `tsc -b`; final lint/build/whitespace results are recorded in the live ledger. Existing Three.js CommonJS deprecation warnings are unrelated to this slice.

C0 sources and limitations remain in `CROWN-C0-EVIDENCE-2026-10-10.md`, the asset inventory, supplier evidence ledger and `docs/research/crown-c0-2026-10-10/`. Unknown exact case angles and mating interfaces remain unknown. No source GLB was rewritten. The missing reference asset path, embedded head suppression, appearance meshes, Apply/default rules, BOM and off-axis platform implementation remain subsequent milestones.

Next implementation gate: separately authorize C2 and/or C3 against these frozen contracts. Changes remain uncommitted; the continuation scheduler stays paused.
