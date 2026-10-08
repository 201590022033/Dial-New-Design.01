# Navitimer selected-disc verification and M3A handoff

8 October 2026. The selected Navitimer graduation/reference inventory is complete for a **disclosed reconstruction**, not a factory-exact reproduction. Citizen's already verified inventory is unchanged. M3A Citizen implementation is next; this separate Navitimer packet is prepared for M3B after the shared M3A workflow. No runtime artwork, supplier data, dashboard state or GLB was changed in this research pass. Neither branded runtime acceptance gate is enabled.

## Same verification recipe, three focused tasks

- Outer-ring agent: independently inspect/count every rotating sector, numeral and stroke class; reconcile dense 50–60 stubs.
- Inner-ring agent: independently inspect/count every fixed sector and pointer/caption identity, including omitted labels and seconds 36.
- Source/measurement agent: inspect the exact booklet, attempt same-artwork source recovery, reproduce native pixel/geometry measurements and independently review the reconciled packet.
- Root: inspect native/full-page/branch PDF evidence, reconcile disagreements, preserve the source bytes, update both inventories/plan and add deterministic regression checks.

The computer-use skill supported online source inspection, and the PDF skill supported page-aware visual inspection and native image extraction. Live browser PDF display was blank; the already saved booklet was inspected and its fingerprint verified. No fresh retrieval or higher-resolution recovery is claimed. Enlargements isolate branches but add no native information.

## Exact source, without model mixing

Reference identity remains `navitimer-booklet-training-disc-2026-10-07`: the coloured training disc on viewer page 2 of the [user-selected Breitling booklet](https://www.breitlingsource.com/images/manuals/slide-rule.pdf). It is an identified illustrated layout, **not a named production watch**. The separate 1967 AOPA cover/time-row layout and modern B01/Automatic/Navitimer World artwork were not substituted or merged.

| Evidence | Fingerprint / scope |
| --- | --- |
| Selected booklet | 17 pages; SHA256 `3DCF8EFF7382092F4A2883B9844D73EA70B89C27949A2C6F0FDF584063A014B0` |
| Viewer page 2 native photograph | 600×525 pixels; original xref 4 DCTDecode JPEG stream, 53, 146 bytes |
| Preserved JPEG | SHA256 `46A429FC5F62BC2F69BB101FC55F4D8F524938E9D5BAFB3F80751AEF9B951E4F`; [unmodified source](research/slide-rules/evidence/navitimer-training-disc-native.jpg) |
| Same-booklet operation | Viewer 7–17 / printed 6–26; viewer 12 / printed 16 defines fixed seconds 36; viewer 16–17 / printed 24–26 confirms red KM just right of MPH |

No sharper copy of this same artwork was recovered. The collector archive has the same scan; a previously referenced third-party training-image asset now displays a copyright-warning replacement and was rejected without bypassing it. Direct official PDF retrieval failed. Different watch/manual diagrams may corroborate operation, not supply the chosen disc's colours, graduations or font.

## Verified graduation schedule

Each ring has **210 unique positions**: 420 total. Outer review has 30 sectors; inner review has 26. All 56 counts are reconciled. Shared 100 is existing 10, never a second tick or numeral.

| Range, lower-inclusive / upper-exclusive | Increment | Intervals per ring |
| --- | --- | ---: |
| 10–15 | 0.1 | 50 |
| 15–25 | 0.2 | 50 |
| 25–60 | 0.5 | 70 |
| 60–100 | 1 | 40 |

The initial provisional outer 200 count was rejected after isolating tiny half-unit stubs: 50–55 and 55–60 each have 9 interior strokes/10 intervals, then 60–65 has 4 interior strokes/5 intervals. The inner agent independently reported the same transitions. This differs from Citizen's 225-per-ring table, particularly 25–30; do not reuse its schedule.

Numerical geometry uses `360*log10(value/10)`. Visual counts establish the schedule first; mathematical consistency alone cannot prove a source transcription.

## Numerals, stroke hierarchy and anchor placement

- Outer 30 printed numerals: integers 10–25, then fives 30–95.
- Inner 25 printed numerals: integers 10–25, then 30/35/40/45/50/55 and literal 7/8/9 for 70/80/90. MPH replaces an ordinary 60 caption. No inner 65/75/85/95 numeral, but those four strokes remain broad major ticks.
- Ordinary outer strokes extend outward from the common divider; inner strokes extend inward. Numeral runs are tangent-following, centred on their own graduation lanes; bottom numerals remain inverted rather than being automatically made upright.
- Integers 10–25 and fives 30–95 are broad majors. Between 25 and 60, unlabelled whole integers are thin intermediates and half-units are minors. Other noninteger subdivisions and units 60–100 except fives are minors.
- No reliably separate 10.5–14.5 half-unit length tier is established at this resolution. Minor classification is a source-compatible reconstruction with aliasing uncertainty, not borrowed Citizen hierarchy.

Coarse profiles in native photographic pixels, not physical manufacturing sizes:

| Ring / profile | Length range | Width range |
| --- | --- | --- |
| Outer major | 6–13 px | 3–4.5 px |
| Outer intermediate | 8–12 px | 1.8–2.7 px |
| Outer minor | 3–8 px | 1–2.7 px |
| Inner major | 15–18 px | 2–4 px |
| Inner intermediate | 13–17 px | 1–2.5 px |
| Inner minor | 11–13 px | 1–2 px |

Allow approximately ±2 px length /±1 px width, perspective and threshold dependence. The actual major 11 black stroke is approximately 18×3 px; the earlier rough polar sample at adjacent 11.1 is not used as a major 11 measurement. Connected inner/outer marks crossing the divider must not become a single outer length. Font files, true cap heights/baseline gaps, physical ring dimensions and factory ink specifications remain `null`. Later implementation must measure actual substitute glyph bounds, tick gaps and physical target envelopes.

## Nine distinct references, not nine extra numerical ticks

| Role | Ownership | Source identity and colour |
| --- | --- | --- |
| Unit 10 | Fixed | Solid red outward triangle and red 10; no box; numeral caption is owned by existing inner 10 |
| Hour-rate 60 | Fixed | Solid black outward triangle, black MPH; no ordinary 60 caption or duplicated black 60 stroke |
| Seconds 36 | Fixed | Unlabelled solid red outward triangle; **no printed 36 caption** |
| KM | Fixed | Solid red outward triangle, black KM |
| NAUT. | Fixed | Solid red outward triangle, black NAUT. |
| STAT. | Fixed | Solid red outward triangle, black STAT. |
| Unit 10 | Rotating | Solid red inward triangle and existing red outer 10 numeral |
| Rate 60 | Rotating | Solid red inward triangle and existing red outer 60 numeral |
| Unlabelled reference near 36 | Rotating | Small red inward triangle; compatible with 36 in both fits; operational purpose unconfirmed |

The old inventory's fixed printed 36 was incorrect: adjacent black 35 belongs to the ordinary numeral row. Both ordinary 35 and 36 remain. The extra outer pointer is independent from fixed seconds 36 and has no invented caption. Outer 10/60 hidden black-stroke underlays remain ambiguous, so the packet preserves **composite source footprints and one numerical station** rather than asserting factory omissions or adding duplicate ticks.

## Colour and registration limits

Fourteen separately sampled pointer/caption/ink/substrate roles are preserved; they are raw RGB scan approximations, not factory hex codes. The source PDF uses a historical display ICC colour space; the preserved original JPEG has no embedded ICC. These samples must not be promoted to calibrated original ink. The thin blue-grey common divider cannot yield a reliable isolated sample; its exact hex stays `null`.

The two apparent boundary ellipses have different centres, so a single ellipse is not a reliable angular registration. A disclosed concentric-circle projective model gives median 0.319 px / P90 0.715 px residual. It is an assumption about the photographed plane, not a measured factory camera. All number angles remain logarithmic; the image is not used to invent mathematical values.

Registering fixed MPH 60 at the top gives unit origin 79.86555°. Photographed outer phase 330.94515° (≈−29.05°, uncertainty ±3°) is recorded for evidence comparison, **not silently applied as a runtime default/zero**.

Exact conversion ratios remain 1.852 km per nautical mile and 1.609344 km per statute mile. The constrained source fit yields KM 61.20536, NAUT 33.04825 and STAT 38.03125, with angular residuals approximately −1.017°/+0.502°/+0.515°.

An independent fit using nine reviewed fixed major strokes gives KM 60.81762, differing by 0.38773. Its fitted anchors stay within 0.482°, but the **withheld 11 validation fails at −2.3524°**. This failure is stored, not omitted. Absolute registration is therefore approximate: recommended nominal reconstruction KM ≈61±1, with all three conversion pointers derived as one exact-ratio group. Packet decimals preserve the source calculation; they are not manufacturer-specified anchor values or a claim of factory-exact geometry.

No HH:MM row or dedicated weight/volume/fuel-oil captions appear on this selected disc. The global excluded-annotation policy remains enforced; coincident ordinary numerical marks and gaps are retained. The distinct 1967 AOPA variant still has no accepted complete graduation table and remains separate.

## Durable handoff

- [Verification packet](research/slide-rules/navitimer-training-disc-verification.json): 420 numerical positions, 56 reviewed sectors, 55 numeral runs, 9 pointer identities and disclosed measurements/limitations.
- [Read-only measurement helper](research/slide-rules/measure-navitimer-source.py): reproduces pixel masks, fitted models, sample palette and sensitivity from native evidence; optional original-PDF provenance checking. It outputs JSON and does not edit the source.
- [Combined inventory](research/slide-rules/graduation-inventory.json): 126 mark records, including 106 numerical labels, 13 reference identities and 7 excluded-annotation identities; all 108 Citizen/Navitimer sectors counted. These mark records are not the full graduation count; per-reference packets are authoritative.
- [Validators](research/slide-rules/validate-inventory.mjs) and [Navitimer regression tests](../src/tests/navitimerReferenceInventory.test.ts): distinguish recorded source facts from runtime/factory acceptance and prevent schedule, caption, pointer-colour, provenance or model-mixing regressions.
- [Updated milestone plan](MILESTONE-PROMPTS-HYBRID-SLIDE-RULES-2026-10-07.md): M2 complete; Citizen M3A next; Navitimer M3B afterwards; GLBs remain behind the artwork/appearance dependencies.

## Verification and repository state

- Full suite: **537 tests across 73 files pass**, including 18 new Navitimer tests and 11 Citizen tests.
- Typecheck, lint and production build: pass.
- Combined/Citizen/Navitimer research validators: pass; 108 counted sectors, no uncounted sectors.
- Native measurement output reproduces the packet exactly; source JPEG hash matches.
- Citizen inventory/manifest subsets are unchanged; Citizen packet and separate 1967 plan remain byte-identical to HEAD.
- `git diff --check`: pass; new text files are also checked for trailing whitespace.
- Existing non-blocking warnings remain: Three CJS deprecation, Zod comment annotations and large build chunks. Git also reports normal LF-to-CRLF conversion warnings.

Changes are uncommitted. No commit, push or new milestone implementation is part of this verification request.
