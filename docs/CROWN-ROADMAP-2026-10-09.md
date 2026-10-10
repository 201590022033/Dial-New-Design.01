# Crown research and milestone roadmap

Planning-only checkpoint, 9 October 2026, Africa/Johannesburg. Baseline: `6931131420adb5606323f8c8db54dc4c76604f8d`.

Progress update, 10 October 2026: C0-C3 are complete. The user subsequently approved C2/C3 and commit/push. This roadmap retains the original research snapshot below. Current authority, verification and remaining gaps live in CROWN-RESUME-LEDGER-2026-10-09.md; interfaces live in CROWN-C1-CONTRACT-2026-10-10.md and current completion evidence in CROWN-C2-C3-HANDOFF-2026-10-10.md. C4-C7 remain unapproved.

## Authority and outcome

The user requested research, a detailed multi-agent plan and a continuation arrangement. This document does not authorize implementation, supplier onboarding, purchases, contacts, commits or pushes. Do not treat previous milestone publication approval as approval for new crown changes.

Goal after approval: credible case-supplied defaults for each archetype, independently customisable crown appearance and supported mechanisms, matching Engineering/HD/BOM behaviour, and explicit physical-fit uncertainty. Do not call a popular-looking design statistically the most common without market evidence.

## Research conclusions

1. A movement determines the movement-side winding/setting stem interface. It does not alone determine the final case crown, tube, gaskets, closure or pressure performance. Seller packages can include a stem or temporary operating crown; package contents must be recorded per SKU.
2. Default priority: explicit saved user choice, then the selected case/bundle's supplied crown, then an evidence-supported platform recommendation, then an archetype visual recommendation marked provisional. Fresh starter defaults must be deterministic, not dependent on an unrelated hand selection or stale previous platform.
3. Grip/profile, closure and protection are independent. Smooth, finely fluted, coin-edge, cross-knurled and onion describe shape/grip. Push-pull and screw-down describe closure. Protective cap, fixed guards and extraction lever are different features.
4. Changing grip must not silently change stem/thread dimensions. Changing closure may require a matched tube or different case. Unknown fit may be explored in explicit concept preview, but must not be presented as a confirmed procurement substitution.
5. The researched Tandorio ladies case specifies screw-in closure despite dress styling; its contents are variant-dependent. Never assign push-pull to every ladies/dress watch.
6. U-BOAT reference protection is a case-level mechanism. Its manual distinguishes outer cap A, operating crown C, extraction controls B/B1 and a separate bezel lock Q. Do not conflate bezel lock with crown closure or offer an ordinary tube a universal cap conversion.
7. Manufacturer documentation can establish stem references, but an NH05 revision conflict remains: generic supplier NH05 data and NH05B technical-guide data identify different stems. Exact revision and scanned drawing inspection remain C0 gates. Do not populate a universal NH05 stem from an ambiguous listing.

## Existing app movement mapping, not new fit certification

Source: `defaultBuilds.ts`, `archetypeProfiles.ts`, `watchPlatformLibrary.ts`, `movementLibrary.ts` at the baseline commit.

| Archetype | Current movement/platform | Crown default proposal when case contents are unknown |
| --- | --- | --- |
| Diver | NH35, NMK901-class reference; golden sample pending | Robust fluted/coin-edge or knurled; screw-down only with supported case/tube |
| Pilot, current slide-rule/tool style | NH35 shared platform | Easy-grip fluted/knurled; case decides closure. Onion remains a classic Flieger alternative |
| Field | NH35 shared platform | Medium coin-edge/fluted; preserve case-supplied closure |
| Dress | NH35 shared platform | Low-profile fine-fluted or smooth-sided; push-pull is a design fallback, not a universal fit claim |
| Ladies dress | NH05B research reference, 34 mm provisional aftermarket case | Compact fine-fluted/rounded. Researched Tandorio case has screw-in closure; confirm actual SKU |
| Chronograph | VK63 starter, presentation-only platform | Medium fine-fluted; matching supplied case crown; do not confuse with two pushers |
| Business / Casual | NH35 kit profiles | Fine-fluted / medium-grip respectively; selected case overrides styling |
| GMT travel | NH34 kit, presentation-only | Robust easy-grip crown; selected case and GMT stem/dial position decide fit |
| Digital sport | No qualified module mapped | No automatic mechanical crown assignment; leave unsupported unless module evidence exists |

NH36/38/39/70, Miyota 8215/9015, ETA 2824/2892 and Sellita SW200 library entries are not automatically qualified starter case/crown platforms. No new movement archetype is to be added merely to support a crown appearance.

## Source ledger

Research checked 9 October 2026. Preserve source URL, document revision, relevant page/section, retrieval timestamp and confidence for each future engineering field. Product URLs establish listed contents, not measured interchangeability. Listed prices/shipping were not qualified or onboarded in this pass.

| Source | Evidence usable in the plan | Limits / follow-up |
| --- | --- | --- |
| [TMI NH35 parts list](https://www.timemodule.com/upload/category/24/parts_list/NH35_PL.pdf), [NH34](https://www.timemodule.com/upload/category/23/parts_list/NH34_PL.pdf), [NH36](https://www.timemodule.com/upload/category/25/parts_list/NH36_PL.pdf) | Manufacturer stem reference 0351 200 reported in parts lists | Pin guide revision and stem-length option; shared reference is not a common final trimmed length or case crown |
| [TMI NH05 guide](https://www.timemodule.com/upload/category/21/technical_guide/NH05_TG.pdf) | Primary source for exact NH05 revision/interface | Scanned pages require inspection; agent found NH05B 0351247 in a manufacturer-authored mirror, conflicting with generic supplier 351-420. Pending primary drawing confirmation |
| [TMI VK63 parts](https://www.timemodule.com/upload/category/33/parts_list/VK63_PL.pdf) | VK63A stem reference 0351177 | Not the NH35 stem; exact crown-side diameter/pitch remains to be transcribed |
| [Miyota 8215 parts](https://miyotamovement.com/uploads/product/product_Xh9zETRpjKYPW4eakm.pdf), [9015 parts](https://miyotamovement.com/uploads/product/product_hLyE7QDRe38xg6nwCB.pdf) | Agent found 8215 065-212 / long option 065-A06, 9015 065-A05 | Extension research only; do not assume stems interchangeable from shared seller Tap labels |
| [ETA 2824-2 technical communication](https://shopb2b.eta.ch/en/technicaldocuments/index/pdf/id/1884/) | Manufacturer treats stem as variant-dependent | Exact delivered revision and interchangeability remain unconfirmed |
| [Sellita-authored SW200-1 mirror](https://mccawcompany.com/wp-content/uploads/2020/04/sellita_sw200-1.pdf) | Manufacturer-authored mirrored document, not direct manufacturer hosting | Preserve mirror provenance. A plastic work/transport crown is not the sealed wearable case crown |
| [Namoki NH35 movement package](https://www.namokimods.com/products/seiko-sii-nh35a-automatic-movement) | Seller says stem supplied | No final sealed crown inclusion established |
| [Namoki SKX knurled crown](https://www.namokimods.com/collections/all/products/skx-knurled-crown-sandblasted-finish) | Screw-down SKX crown, stem included; trimming required | Case-family context essential; supplier sealing claims are not custom-watch certification |
| [Namoki SRPE crown](https://www.namokimods.com/en-gb/collections/best-sellers/products/srpe-knurled-crown-polished-finish) | Alternative case-family crown with stem | Same broad movement compatibility does not establish SKX/SRPE tube interchangeability |
| [NMK932 field bundle](https://www.namokimods.com/products/nmk932-field-watch-case-bundle-steel-finish) | Included SKX013 coin-edge crown | Supplier contents take priority over generic field styling; do not infer closure from customer reviews |
| [NMK950 W10 pilot case](https://www.namokimods.com/en-au/products/nmk950-pilot-tonneau-case-steel-finish) | Matching sterile crown; several NH movements listed | Explicit crown closure not established in supplier technical text |
| [NMK955 VK chronograph case](https://www.namokimods.com/collections/yearend-mini-sale/products/nmk955-vk-chronograph-case-steel-finish) | Matching screw-down crown, distinct pushers and VK spacer supplied | Listed dial-size ranges conflict; supplier-compatible claim is not a complete dimensional qualification |
| [Tandorio 34 mm NH05 case](https://tandoriowatch.com/products/34mm-nh05-watch-case-bezel-insert-ring-sapphire-glass) | Explicit screw-in crown, NH05/NH06 naming | Contents described as optional; pin variant, dimensions and actual crown inclusion |
| [Laco Original Pilot](https://www.laco.de/en/watches/pilot-watch-original), [STOWA FAQ](https://www.stowa.de/faq) | Onion pilot styling and examples distinguishing diving/non-diving closure | Style references, not mod-component compatibility |
| [Hamilton X-Wind manual](https://www.hamiltonwatch.com/media/sgecom_watchmanuals/1005/1005_EN.pdf) | Pilot example with screw-down crown | Prevent universal pilot push-pull assumption |
| [U-BOAT instructions](https://www.uboatwatch.com/wp-content/uploads/2021/08/9016engOK.pdf) | Printed pages 5/7 distinguish cap, inner crown and optional extraction controls; page 5 separates bezel lock | Main agent rendered and visually inspected diagram page. Not a dimensioned manufacturing drawing |
| [U-BOAT CAPSULE](https://www.uboatwatch.com/product/capsule-45mm-pvd-bk-bl/) | Left-side protected crown assembly, Sellita SW200 basis | Reference for mechanism class, not a drop-in NH35 part or exact replica request |
| [Esslinger crown and tube sets](https://www.esslinger.com/threaded-screw-down-watch-crowns-complete-with-case-tubes/) | Replacement crown/tube families can be supplied together | Case machining and movement stem still need qualification |

## C0 - Evidence freeze and reproducible baseline

Status: planning research performed; implementation inventory and drawing gate not complete.

- Pin exact movements/revisions for supported platforms, especially NH05B. Inspect complete relevant manufacturer stem drawings, not OCR alone; retain unknown values if drawings cannot establish them.
- Record seller package contents separately: movement, usable stem, temporary crown, final crown, tube, gaskets, cap/holder, pushers. Use included / excluded / optional / unknown, not a boolean guessed from photographs.
- Inventory all eight embedded case-crown heads, exact reviewed node names, case IDs, source hashes and bounds. Distinguish head from legitimate tube/boss/guards. Confirm missing `crown-reference-v1` file and current reference crown envelope.
- Capture baseline front/side HD and Engineering screenshots without replacing user builds or pruning checkpoints. Use isolated fixtures where possible.
- Deliver field-level evidence ledger with unresolved issues. No live supplier additions yet.

Gate: no fabricated thread/pitch/stem data; inventory and selected-case default priority agreed. Evidence unavailable for one supplier does not block explicitly provisional styling of others.

## C1 - Canonical contract and legacy migration

- Add versioned crown specification with separate grip/profile, head core diameter, maximum grip envelope, axial length, closure, cap/protection, finish, position and physical interfaces.
- Separate movement-side stem identity/revision/thread from crown stem socket, case tube engagement and cap/holder interfaces. Preserve original supplier Tap labels and source units; ambiguous Tap alone cannot pass fit.
- Case owns tube, boss and fixed guards. Define explicit ownership for removable crown, cap and holder; a mechanism may require a matched multi-part assembly, not one mesh.
- Separate saved choice from recommended default. Loading old documents preserves IDs, anchors, procurement selections and appearance. Old undefined closure becomes unspecified, not automatically screw-down.
- Preserve parametric-crown/v1 meaning: 7 mm base plus 0.2 mm radial grip has 7.4 mm maximum OD. Never silently reinterpret old dimensions.

Files: `src/domain/geometry/parametric/crown.ts`, assembly types/serialization, catalogue types, visual model contract, versioned migration adapter.

Gate: validation rejects invalid dimensions/contradictory ownership, round trips preserve old/new projects, stem/case interfaces remain distinct. Shared contract frozen before parallel implementation.

## C2 - Crown catalogue, archetype defaults and compatibility

- Restrict Crown candidates to crown-compatible kinds; wrong-kind Apply must be rejected even through double-click, keyboard, BOM or stale preview. Broad external-category filtering is insufficient.
- Correct unsupported generic verified/sealing claims. Separate catalogue evidence, visual asset readiness and mechanical fit status.
- Use case-bundle crown first. Archetype defaults above are advisory only. Do not modify movement, source case or stem automatically when shape changes.
- Add dedicated checks for exact case/tube family, thread OD and pitch, socket/engagement, axis/stem height and travel, gasket envelope, guards/shoulder clearance and cap mechanism support. Classify absent data as unknown and contradictory known data as incompatible.
- Expose concept-only alternatives without enabling misleading orderability. Supported mechanical conversion must explicitly replace its required matched parts and re-evaluate the complete transition.

Files: catalogue registry, `OptionsTab.tsx`, compatibility engine and new crown-interface rule, default builds/profiles/platform mapping, configurator Apply guards.

Gate: negative tests for incompatible closure/tube/stem/case, unknown evidence, locked and wrong-kind writes; same movement with different case families never gets an automatic fit pass.

## C3 - Single crown ownership and compact HD library

Can run beside C2 only after C1 contract freeze.

- First decouple crown/reference-case eligibility from unrelated hand changes. Fix or explicitly retire the missing registry entry.
- Use an explicit reviewed asset ownership map: suppress only the embedded removable head when a separate replacement owns it; preserve tubes, bosses, guards, lugs and case material. Unknown assets must not get broad CROWN-name deletion.
- Generate a small reviewed geometry family: low-profile smooth-sided, fine-fluted/coin-edge, robust coarse-fluted, cross-knurled, classic onion and compact dress. Some can share one parameterised generator; asset count follows actual supported dimensions, not every colour combination.
- Finish is material, not duplicate GLBs. Geometry changes must alter silhouette/grip, not just a texture label. Separate precise supplier-derived models from provisional design approximations.
- Exactly one operating head per supported axis; multi-crown cases require explicit axis IDs and remain unsupported until complete interfaces exist.
- Procedural fallback must honestly preserve supported shape/envelope or disclose a simplified substitute; must not silently turn a fluted crown smooth after a hand change.

Files: Blender crown/variant generators; visual registry, `GlbAsset.tsx`, scene, adapter, component placement/anchors and asset contract tests.

Gate: real binary mesh/bounds tests; no duplicated heads; hide/show acts on one owner; replacement never hides structural case parts; hand/dial/archetype swaps do not unexpectedly switch crown.

## C4 - Connected controls, independent finish and BOM

Depends on C2 and C3.

- Right tray separates Shape, Closure/protection, Finish and Source/fit. Show supplied-with-case default and the reason an option requires another case/tube.
- Single click previews; explicit Apply, double-click and Enter use one validated transition. Locks, Undo/Redo, versions and import agree in Engineering and HD.
- Make crown finish independently selectable, initially inherit case; preserve inherit versus explicit override when case finish changes.
- Distinguish included crown/tube/stem from separately purchased replacements in BOM. Show included item without charging twice; replacement choice must not accidentally remove a case's bundle price.
- Future price snapshots record exact SKU/variant, source currency, ZAR conversion and FX timestamp, item price, South Africa shipping, tax assumptions and checked-at time. Unknown shipping is not zero. Research capture does not automatically certify fit or onboard a huge supplier catalogue.

Files: crown tray controls, assembly/UI stores, BOM calculator/sourcing, supplier capture schemas and existing price display helpers.

Gate: repeated preview/apply/back changes, included/separate/unknown cost cases, no duplicate BOM charge, source package contents survive save/load.

## C5 - Protected-cap/locking concept and matched platform gate

Depends on stable C1-C4. A separate optional milestone, not a prerequisite for ordinary crowns.

- Model a generic protective-cap/holder mechanism inspired by researched mechanism classes, not a branded copy. Include operating crown and clearance/placement of holder and optional extraction controls.
- Keep left-side relocation and mirrored dial/date behaviour out of ordinary crown Apply. A 9 o'clock assembly needs supported case, movement orientation, dial layout, hand stack and sourcing evidence.
- Initially provide an honestly labelled design concept if supplier-exact drawings are unavailable. Do not invent cap threads, holder hinge geometry or a waterproof rating.
- Do not call a fixed guard a lock; do not confuse the reference manual's bezel lock with crown protection.

Gate: concept appearance can pass separately from mechanical support. Physical Apply/orderability remains unavailable until matched hardware and evidence exist; this boundary does not block C6 acceptance of ordinary crowns.

## C6 - Full acceptance, evidence and publication checkpoint

- Unit/contract tests: schema/migration, wrong-kind refusals, current-case defaults, all grip and closure combinations, envelope and mating clearances, ownership, assets, materials, BOM package pricing and persistence.
- Automated matrix: all ten profile IDs and six starters; fresh and inherited reference assemblies; supported 34/38/42 mm fixtures plus 46 mm preview. Case changes must not silently stretch sourced crowns or stems.
- Computer-use acceptance: front/side views, all exposed shape/finish options, repeated swaps, included crown restoration, cap concept disclosure, locks, preview cancel, Undo/Redo, reload and import. Explicitly distinguish actual browser checks from deterministic model/mesh assertions.
- Test changing hands, dial, straps and bezel leaves selected crown unchanged. Hide/reveal crown must not leave an embedded duplicate behind.
- Run tests, typecheck, lint, production build and git diff checks. Keep existing slide-rule, lug, hand, scale, dial and BOM regressions passing.
- Record remaining supplier/pressure/measurement limitations in a final audit. Commit/push only if newly authorized for crown work; do not treat planning approval as publication approval.

Gate: all promised software functionality passes or is explicitly excluded from supported UI. Factory interchangeability and whole-watch pressure performance require external measurements/tests.

## C7 - Supplier-to-render off-axis Tuna case integration

Added at the user's request. This is a complete platform slice, not an appearance-only crown rotation. Numbering preserves the existing C0-C6 references; execute C7 before the final C6 release gate. C5 remains optional.

### Research checkpoint

Supplier observations checked 9 October 2026 at approximately 21:17 Africa/Johannesburg, not onboarding writes or delivered quotes:

| Exact candidate | Supplier-stated geometry / crown | Price observation and limits |
| --- | --- | --- |
| [Namoki NMK920 brushed](https://www.namokimods.com/products/nmk920-tuna-skx007-srpd-watch-case-brushed-finish) | 47 mm including shroud, 46.5 mm lug-to-lug, 11.3 mm excluding caseback, 22 mm lugs. Exact crown angle not numerically established | SGD 195, variant 40465538744495, live SKU NMK920-PL; unavailable. Existing repo SKU NMK920-BRUSHED needs reconciliation. SA shipping unknown |
| [Tandorio 46.5 Tuna](https://tandoriowatch.com/products/tuna-can-watch-case-46-5mm) | 46.5 x 15.4 mm, 22 mm lugs, 27-29 mm dial claim; explicit 4 o'clock screw-down supplier claim | USD 60.90, black variant 50602694836509, SKU 1005010072446013-black. API availability conflicts with page sold-out wording. SA shipping unverified, despite promotional free-shipping text |
| [KARAJAN 42 Tuna](https://diywatchmod.com/products/new-42mm-round-canned-watch-case) | 42 mm excluding crown, 47 mm including crown, 15 mm thick, 20 mm lugs, 28.5 mm dial, explicit 4.1 o'clock; top-loading/integrated caseback | USD 63, standard shipping advertised USD 5.99, not a verified SA quote. Separate assembly family, not a rear-loading substitute |

Other evidence counterexamples: [GESMART 47](https://gewatchparts.com/products/47mm-diver-watch-case-luminous-bezel-for-nh35-nh36-nh34-nh38-4r36-tuna-can-mod) states 3.8 o'clock; [Tandorio bronze 47](https://tandoriowatch.com/products/47mm-aluminum-bronze-tuna-can-watch-case) states 4.2 o'clock and 29 mm dial. Do not round these to a universal 4 o'clock platform. No genuine dimensioned case-interface drawing recovered for these new candidates in this research slice. Old NMK920 drawing provenance must be revalidated before claiming drawing-derived precision. No ZAR conversion was invented.

Repository findings: `generate_component_variant_library.py` places NMK920's embedded head at `(diameter/2 + 1.4, 0, 0)`, the generic 3 o'clock location. Current catalogue has no exact NMK920 crown angle. `movementLibrary.ts` uses coarse 3h/4h/9h labels; `assemblyAnchors.ts` angle override is subordinate to an existing parametric tube endpoint. C1 must resolve precedence and precision, not add a second competing transform.

### C7A - Evidence and exact variant qualification

- Reuse the existing NMK920 identity rather than duplicate the catalogue. Start with NMK920 plus one affordable supplier-stated 4 o'clock Tandorio variant. KARAJAN top-loading is a separate later candidate, not a hidden substitution.
- Capture exact SKU/variant, source URL, retrieval time, contents, stock contradictions, case/shroud/lug/crown dimensions, drawing provenance and field-level confidence. Revalidate old image URLs; photographs cannot establish hidden mating dimensions.
- Keep headline dimensions, supplier-stated compatibility, visual approximation and measured/drawing-qualified fit separate. Missing drawings do not justify invented stem height, tube thread, seat or dial-foot locations.
- Pricing must retain currency, checked-at, FX source/time when converted to ZAR, shipping-to-SA status and exclusions for taxes/import. Bundle contents must prevent charging included crowns/crystals/bezels twice.

### C7B - Mechanical platform and canonical axes

- Extend C1 with a documented coordinate convention. Prefer numeric angle and axis IDs over rounded clock labels; retain the original supplier wording and confidence. Test front-view clockwise angle from 3 o'clock, and explicitly map it to Blender/Three coordinates instead of assuming signs agree.
- One canonical axis drives tube, case opening, guards/shroud cutout, operating crown, stem and Engineering/HD placement. Resolve existing tube-end versus angle-override precedence.
- Store shroud OD, midcase OD, bezel/insert usable annulus, dial seat, crystal, caseback and lug width separately. A 47 mm shroud is not a 47 mm bezel marking envelope; a 46.5/47 mm sourced case must not be relabelled 46 mm.
- Model installation orientation, stem height, spacer, dial feet and calendar aperture/date-wheel orientation separately. Do not rotate the complete dial or movement merely to make the crown mesh look correct. Qualify NH35/NH36/NH34 variants individually where evidence differs.
- Top-loading versus rear-loading requires distinct service/assembly metadata. Water resistance remains a supplier claim, not software certification.

### C7C - Blender and actual GLBs

- Update the existing case generator or build a dedicated shrouded-case generator with evidence-based outer envelope, lugs, shroud cutout, tube/guards and crown axis. Keep removable-head ownership consistent with C3.
- Regenerate and inspect real GLB binaries. Record mesh names, axis datums, source hashes, bounds and material slots. No baked head at 3 o'clock plus separate head at 4 o'clock.
- Unknown interface geometry must be labelled presentation approximation, not manufacturing-ready. Do not create a new GLB per colour; use supported material overrides.
- An explicitly approximate crown axis can pass presentation/model-coherence assertions only. It cannot satisfy measured fit or become a verified angle. Leave unsupported qualification unknown when drawings/measurements are unavailable.

### C7D - Catalogue, supplier, dashboard and BOM wiring

- After implementation approval, onboard only qualified exact variants into the existing supplier framework. Supplier availability does not override fit uncertainty.
- Case selection must update right tray dimensions/options, platform movement/dial/crystal/caseback/strap compatibility, Engineering view, HD GLB and BOM through the shared validated Apply transition.
- Unsupported combinations stay unknown/incompatible with an explanation; do not auto-select unrelated movement or dial to hide a mismatch. Preserve explicit colour/hand choices where valid and invalidate stale anchors/sourcing where needed.
- Preview, Apply, double-click, Enter, locks, Undo/Redo, reload, version restore and import must converge on the same assembly. Included parts remain visible with transparent bundle pricing.

### C7E - End-to-end acceptance and handoff to C6

- Test 3h, supplier-stated 3.8h, 4h, 4.1h and 4.2h without silently coercing them. Missing exact angle remains unknown rather than a falsely verified numeric value.
- Check front/side views, exactly one crown, stem/tube collinearity, shroud clearance, correct dial/date orientation and no duplicate baked head. Verify 22 mm straps for the selected large cases.
- Verify scale ticks, labels and hit geometry use the actual selected bezel/dial/chapter annulus, not the case shroud. Retain the prior two-scale, sapphire-layer, lug, central-hand and dial/strap update regressions.
- Inspect actual browser flows under computer-use plus binary/geometry assertions. Final full test/typecheck/lint/build/diff gate is C6. Publication still requires separate approval.

## Delegation and usage-aware execution

- Research used two focused web agents plus one architecture-review agent; main agent consolidated evidence and inspected a rendered official mechanism diagram.
- Implementation after approval: main owns integration/ledger; Agent A canonical contract + fit; Agent B Blender/assets/render ownership; Agent C UI/BOM only after shared contracts stabilize. Never let several agents edit the same files concurrently; main assigns file ownership first.
- Browser acceptance has one operator at a time, or independently isolated fixture sessions. Visual and UI/BOM reviewers must not concurrently mutate the same browser or saved build; main coordinates handoff and restoration.
- Execute short bounded milestones, not five hours of continuous token use. Five hours is a retry cadence, not an estimate of how long coding should run. Focused tests per slice; full suite at integration checkpoint.
- Before ending any slice, record status, changed files, source hashes, verification commands/results, blockers and next safe action. Checkpoint to disk before expensive browser/asset passes.
- On reset resume only incomplete approved work; do not repeat completed research or launch duplicate agents. Re-check Git and latest user intent first; preserve unrelated local changes. Never imply enough budget is guaranteed for a milestone.
- Usage snapshot on 9 October: 67% five-hour allowance used, 57% weekly used, no purchased credits/reset credits reported. Five-hour reset reported at 10 October 2026 01:15:57 Africa/Johannesburg. These are a snapshot, not a reservation or promised execution time.
- Prepared heartbeat `resume-dial-designer-crown-roadmap`, five-hour cadence, PAUSED awaiting approval. It resumes only human-approved milestones. Activation and actual next-run time must be confirmed through the app; recurrence is not synchronised automatically to account resets. Keep computer on and desktop app running for local execution. No usage bypass or automatic credit purchase.
- OpenAI Docs was used to verify the local scheduling workflow: [scheduled tasks](https://learn.chatgpt.com/docs/automations?surface=app). PDF skill guided visual mechanism inspection. Computer-use skill is assigned to C0/C6 browser acceptance; this research slice did not mutate the app.

## Suggested bounded work batches after approval

1. C0 drawing/inventory completion + C1 contracts, then review before geometry work.
2. C2 and C3 independently, integrate before UI.
3. C4 for ordinary crowns, then C7 end-to-end off-axis supplier/case integration.
4. C6 final acceptance; publish only if authorized. Optional C5 protected-cap concept may follow, with targeted C6 re-run.

Next approval request: approve C0/C1 first, or explicitly authorize the wider C0-C4/C7/C6 roadmap. A smaller ordinary-crown C0-C4/C6 release is also possible if explicitly requested. Protected-cap work and publishing need their own clear scope. Do not start production code from this document alone.

Detailed execution prompts: `docs/PROJECT-CROWN-MILESTONE-PROMPTS.md`. Portable context cache: `docs/PROJECT-CROWN-CONTEXT.md`. The cache is a human-readable checkpoint, not a hidden model-memory or token-cache guarantee.
