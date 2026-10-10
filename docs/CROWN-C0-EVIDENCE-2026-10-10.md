# C0 evidence freeze and reproducible baselines

Reviewed 10 October 2026, Africa/Johannesburg. Production baseline: main `6931131420adb5606323f8c8db54dc4c76604f8d`, tracking origin/main. C0 and C1 are human-approved; C2 onward, publication and scheduler activation are not. Existing planning files remain untracked and preserved.

## Evidence records

The complete binary/node/hash inventory is in `CROWN-C0-ASSET-INVENTORY-2026-10-09.md`. Supplier records and additional movement evidence are in `CROWN-C0-SUPPLIER-EVIDENCE-2026-10-10.md`. Neither document certifies physical interchangeability.

### NH05B primary-source revision resolution

Downloaded the official [TMI NH05 specification pack](https://www.timemodule.com/upload/category/21/spec_sheet/NH05_SS.pdf) and [technical guide](https://www.timemodule.com/upload/category/21/technical_guide/NH05_TG.pdf) on 9 October 2026 at approximately 21:42-21:46 SAST, then inspected complete rendered pages. The PDF text is scanned; dimensions below were read visually. Original PDFs and selected page renders are retained in `docs/research/crown-c0-2026-10-10/`.

| Field | Evidence | Confidence / boundary |
| --- | --- | --- |
| Exact movement revision | Specification cover: NH05B, revised 27092024; TG cover NH05B/06B, 20122024 | Manufacturer drawing, revision-specific; does not resolve unspecified generic NH05 sellers |
| Stem reference | Spec PDF page 7, Hand Setting Stem v2: 0351 247; TG PDF page 7 / printed page 6, parts catalogue v2: 0351 247 | Confirmed in two primary-source pages |
| A | 571, units 1 = 1/100 mm; thus 5.71 mm | Drawing value, not final trimmed case length; drawing tolerance A +/-10 in source units |
| B | 1244.5, same units; thus 12.445 mm | Drawing reference extent, not final trimmed case length |
| Crown-side thread designation | Literal `S90P22.5` on stem drawing | Preserve literal designation and source units; no seller Tap-based equivalence or undocumented thread conversion |
| Other drawing features | 50 MAX; collar diameter 110 with +0/-0.6; neck diameter 58 with +0/-2; tip diameter 40 with +0/-1.2, in source units | Retain the complete page; these are distinct features, not a single universal socket diameter |
| Case tube, crown socket, gasket, final stem length | Unknown for aftermarket 34 mm case | Movement documentation cannot establish case-owned interfaces |

Spec PDF SHA256: `7ab2b1515745389682d09a9f9fbeccfc9f8a199b344e6231ec19f5ee7fea1716`.
TG PDF SHA256: `4abe35ec2bc40cf008793e16b0c40e09f0fda8a0682bff595a3e023e522482ab`.

The earlier generic supplier 351-420 claim is not adopted for NH05B. It remains an unresolved generic-NH05 seller/revision claim. No production movement or supplier record was changed.

## Baseline fixture procedure

Started a temporary Vite instance on `http://localhost:3017` from the actual repository. This unused origin showed zero checkpoints and disabled Undo before interaction. The pre-existing localhost:3000 and 127.0.0.1:3000 origins were observed only and were not edited. Main was the sole browser operator.

1. Load Diver starter through Build. Capture Engineering front.
2. Open Visual, expand controls, load 42 mm reference set, choose Face, collapse controls. Capture HD front.
3. Drag the watch by +300 horizontal pixels for the opposite side, then -600 for the operating-crown side. Capture both side views.
4. Switch to Engineering and capture the same 42 mm reference assembly.
5. Load Ladies Dress starter through Build (34 mm). In Visual choose Face and collapse controls, capture front. Drag -300 horizontal pixels, capture crown side. Switch to Engineering and capture front.

Screenshots are actual browser captures at 1280 x 720, retained under `docs/research/crown-c0-2026-10-10/`. They document existing behavior; no GLB regeneration or crown fix occurred in C0.

| File | SHA256 |
| --- | --- |
| diver-engineering-front.jpg | `f00ece44fbe4e868e0e6860f21ec4fa5c422d4530c11c6e9566167a2b96e07e5` |
| reference42-engineering-front.jpg | `9d0ecdff44819907298aab75a3055c578dcf444f0caf06c97ccab82bc5dd1eac` |
| reference42-hd-front.jpg | `4e28e87f81788b8ba8c59c24a0a222153860a06dbfe8343dddfa020c5306ba2f` |
| reference42-hd-side.jpg | `c23ab6499426aa0c7a76038d17f9b63e4d34ef8fffa39dfc4112d2e57fc1b1d4` |
| reference42-hd-crown-side.jpg | `61fa8e48790b32e048c08968f9d0e47e6331409e6b8d46cdfd16de74b22279a5` |
| ladies34-engineering-front.jpg | `1ab3dee75f4c4ca52190137da342aacf07954148c4d64fdb0cf25eecca3cb75e` |
| ladies34-hd-front.jpg | `0b11014dc7e69708d2ab32bf43c59de8745e0e141153d1f5030443dde1980bd5` |
| ladies34-hd-crown-side.jpg | `dbfd2c2890bfb5b4116ab1a07ce849ca933e64cdde303991c1db8887f6208fe5` |

Engineering currently displays a front dial/artwork canvas and does not expose a side/crown view. Therefore an Engineering side screenshot cannot be honestly captured at this baseline; HD side screenshots plus digital-mesh bounds cover that baseline observation. This is a named existing limitation, not a C0 implementation failure or new functionality claim. The full all-profile interaction/visual acceptance matrix remains C6 scope.

Reference HD front visibly shows the fluted head. Ladies HD shows compact crown presentation; screenshots alone cannot prove absence of overlapping duplicate geometry. The binary inventory establishes embedded ownership risk. Engineering and HD dial presentations are different existing adapters; C0 does not claim crown geometry agreement from the 2D canvas.

## Contract inputs and unresolved measurement gates

- Priority agreed: explicit saved choice, supplied case crown, evidence-backed platform recommendation, then provisional archetype styling. C1 represents choice/default separately; C2 implements resolution.
- Retain core OD separately from maximum grip envelope: reference 7 + 2 x 0.2 = 7.4 mm. Legacy geometry is preserved verbatim.
- Movement owns stem identity/revision; case owns tube/boss/guards; removable operating head has one owner per axis. Cap/holder requires explicit matched assembly ownership.
- Numeric clockwise angle from 3h must retain supplier wording and evidence independently. Supplier 3.8/4/4.1/4.2 are separate claims. Unknown exact NMK920 angle remains unknown.
- Unknown stem/socket/tube/closure/gasket/installation dimensions are legal contract states and never a fit pass. Case drawings limited to outer envelopes do not qualify hidden interfaces.
- Canonical axes must be explicitly authored and take precedence over competing legacy crown transforms. Documents without them retain their existing saved anchors and rendering behavior.

C0 automated baseline: `npm test -- src/tests/parametricContracts.test.ts src/tests/visualWatchAdapter.test.ts src/tests/watchAssemblyArchitecture.test.ts src/tests/visualAssetRegistry.test.ts` passed 4 files / 55 tests on 10 October 2026 at 01:32 SAST. These are pre-C1 checks of existing behavior, not verification of new implementation. `git diff --check` passed for tracked changes (new untracked documents require separate whitespace checks).

C0 gate COMPLETE on 10 October 2026 after reconciliation of the supplier lane, asset inventory, primary NH05B pages and actual isolated browser baselines. Proceed to approved C1 with explicit unknowns and the documented Engineering-view limitation; no procurement qualification depends on invented values. No C2/C3 work is authorized by this gate.
