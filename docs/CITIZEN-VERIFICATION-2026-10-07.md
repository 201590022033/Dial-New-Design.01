# Citizen JY8078-01L verification

7 October 2026. Reference research only, using the computer-use and PDF skills and three focused review agents. **Citizen's photographic reference is ready for Milestone 3A implementation with the disclosed approximations below.** This is not a completed Citizen renderer, a factory-exact reproduction certificate, or acceptance of the still-incomplete Navitimer reference.

## Evidence recovered

The selected model has not changed. The [official Canada product page](https://www.citizenwatch.com/ca/en/product/JY8078-01L.html) publishes a **1600x2000** `data-zoom-image`/`data-extra-large-screen-image`, not only its 500x625 display image. The [official Germany exact-model page](https://de.citizenwatch.eu/de/p/jy8078-01l/) publishes a **2000x2000** front image in its actual responsive `srcset`. Native dimensions and all four quadrants were inspected in the browser. No URL-resolution guessing or screenshot upscaling was used to manufacture detail.

The two images appear to be transforms of the same base photograph, not independently photographed specimens. The Canada image has the larger usable watch circle. Their unmodified bytes and fingerprints are retained under `research/slide-rules/evidence`; they are research evidence, not application textures or GLBs. Exact-model Spain/Thailand pages remain identity/layout corroboration.

The U680 manual's eleven calculator pages, viewer 82-92 / printed 81-91, were visually re-inspected using the existing rendered contact sheets. These establish operation only. Its generic Model 2 HH:MM row must not be imported into JY8078-01L artwork.

The Europe winter 2022/23 catalogue's large macro photograph depicts the rejected bracelet variant with a dark fixed strip/yellow distance pointers. Its small leather-model product picture does not supersede the recovered native front image. No mixing of those layouts is allowed.

## Complete circumference

Separate agents counted the outer and inner rings independently; root reviewed the native manufacturer imagery, reconciled the schedules and source exceptions, and checked the mathematical materialisation. A third reviewer corroborated pointers, palette, high-value sectors and the absolute conversion-group fit. These are separate reviews, not claims of independent photographic captures.

| Values, upper bound excluded | Increment | Intervals per ring |
| --- | --- | ---: |
| 10-15 | 0.1 | 50 |
| 15-30 | 0.2 | 75 |
| 30-60 | 0.5 | 60 |
| 60-100 | 1 | 40 |
| Total | One 100/10 seam | **225** |

All **52 Citizen review sectors** are now counted. The packet records **450 stable graduation identities**, underlying values, printed text or its absence, classes, measured profiles, colour roles, directions and sector/source provenance. Values are enumerated from the visually counted schedule; angles are then computed logarithmically, never interpolated at equal angular spacing. A graduation position is not necessarily an ordinary line: outer 60 is a solid triangular reference.

Outer printed numbers: 10-25 by ones, then 30,35,40,45,50,55,60,70,80,90. Inner numbers are the same except no ordinary printed 60: the hollow hour-rate reference occupies that identity. Long unlabelled marks must not acquire invented numerals.

**Length hierarchy also changes at 25**, although the numerical increment remains 0.2. The detailed profiles in the packet supersede early coarse estimates. In particular, outer 32.5 is short, not a long midpoint; 31-34 are intermediate. The 10-15 half-unit strokes and 65/75/85/95 are long without extra numeral labels. Do not use one globally uniform minor-length/class table.

## Corrected identities and typography

- Inner 10 is dark lettering in a yellow rectangular box, not yellow lettering. Outer 10 is dark lettering in a light box. Their ordinary graduation colours remain independent.
- Fixed 60 uses a **hollow light inward-pointing triangle**. The separate tiny **filled yellow outward-pointing triangle** immediately right is KM; KM lettering is light. Earlier low-resolution notes conflated these pointers and are superseded.
- STAT and NAUT use **red outward-pointing pointers**, with separate light captions.
- RX/NO and H/M/L are watch-function graphics, not calculator captions. Inner50/60 strokes are shortened square/rectangle shapes above NO/RX; neighbouring49,49.5,59,59.5,61 also shorten to approximately7px. All seven exceptions are recorded. Excluding radio text must not silently invent ordinary long replacement strokes.
- Both number rows follow tangents. Bottom numbers remain inverted, not automatically flipped upright. Numeral-run centres align with their own graduations; do not align their left edges or shift mathematical ticks for kerning.
- No HH:MM row or dedicated seconds-36 index occurs on this selected photograph. Ordinary graduation 36 remains. Do not expose either absent feature as Original artwork.

Representative source-pixel glyph bounds, measured cap heights, tick widths/lengths and gaps are recorded in the packet. Outer 55 and 20 have approximately 28px ink cap height and a 3px nearest visible ink-to-tick gap in the native Canada image. Fixed numeral samples have approximately 15-22px cap height, varying with perspective/rotation. Manual fixed-row bounds carry +/-5px uncertainty; pixel-component measurements carry approximately +/-2px. They are reconstruction targets, not manufacturer millimetres, font baselines or certified kerning metrics. The renderer must resolve actual substitute glyph bounds and verify the resulting gaps during M3A.

The connected inner-10 stroke has an observed clipped lower bound around 22px. Its recorded 29px upper extent is a reconstruction estimate informed by adjacent major strokes, not a directly recovered endpoint.

## Absolute distance placement

The pointer group was fitted to the **graduation plane**, not guessed from clock positions or the raised hand hub. A robust white-strip inner-edge fit used 306 accepted samples: centre approximately (752.959,994.709), ellipse semiaxes 451.133/448.527 source pixels; median residual 0.272px, 90th percentile 0.626px.

Using the hollow 60 index as the registration datum, the ratio-constrained source fit is:

- KM: **61.055605**, photographic fit, not factory specification.
- NAUT: KM / 1.852, approximately **32.967389**.
- STAT: KM / 1.609344, approximately **37.938194**.

Observed pointer residuals are approximately +0.0550,-0.0312,-0.0238 degrees, below 0.1 degree. Nominal KM is approximately 61.0 with a conservative +/-0.5-value photographic uncertainty. Retain the fitted anchor and exact ratios together; do not round each pointer separately or adopt the previously suggested unsupported 61.5. Register fixed 60 at the top and derive the shared unit origin as `360 - 360*log10(6)`; outer relative rotation is independent.

## Colours, exclusions and honest limitations

Each retained role has a separately recorded photographic median, source ROI, pixel-selection mask and sample count. These hex values are **reference-derived approximations**, not official ink or metal specifications; small yellow-pointer samples and illumination can differ from the larger yellow unit box. Do not replace them with the mock-up palette or one universal red/yellow accent. Pointers, text, tick ink, boxes and substrates remain separate roles.

Dedicated LBS/KG, gallon/litre, FUEL LBS and OIL LBS captions/pointers remain permanently excluded. Removing them must not remove co-located ordinary values or spread neighbouring marks into the gaps. Citizen/Blue Angels branding, hour markers, subdials and digital displays are outside the marking-system scope.

Exact font files, original ink specifications and engineering dimensions of the printable annuli were not recovered. Case diameter is approximately 45mm in Canada, 45.4mm in Europe/Thailand; neither proves the printed radii or physical tick lengths. No supplier fit or Blender accuracy is certified by this packet. Those unavailable specifications do not block a clearly disclosed photographic reconstruction; they do block a factory-exact claim.

## Handoff and verification

Authoritative new packet: [citizen-jy8078-verification.json](research/slide-rules/citizen-jy8078-verification.json). Existing manifest/inventory entries are reconciled with it. Reproduction checks, source-byte fingerprints and regression tests distinguish verified reference research from runtime acceptance.

Read-only measurement tools: `measure-citizen-photo.py` reproduces ellipse, palette and pointer fits using Pillow/NumPy; `measure-citizen-components.py` reports connected ink components and oriented glyph/tick metrics for selected source ROIs. Both print results only, without modifying photographs or application state.

**M3A is the next implementation step.** Citizen remains disabled in the application until its inventory is actually rendered, wired and compared with the source. Navitimer's 56 sectors remain uncounted; neither the combined M1 gate nor its runtime preset is enabled by Citizen's acceptance. The M2 software foundation remains complete. No application renderer, existing project, supplier record or GLB was changed in this verification.

### Final checks

- Three independent reviewer sign-offs passed; the inner-10 observed lower bound versus estimated upper extent is explicitly distinguished.
- Research validators passed: 450 Citizen graduation positions, 52 counted Citizen sectors, 56 still-uncounted Navitimer sectors; exact distance ratios and source-byte fingerprints agree.
- Full suite: **519 tests passed in 72 files**, including 11 new Citizen regression tests.
- Type checking, lint and production build passed. Build output retains dependency annotation/large-bundle warnings, and tests retain a Three.js CommonJS deprecation warning; none caused failures.
- `git diff --check` passed. Tracked and new research text files also passed a separate trailing-whitespace check.
- Navitimer mark/sector/source records were compared with the starting checkpoint and are unchanged. No application renderer, GLB or supplier data was edited.

### Git handoff

The two original source photographs were already tracked in `70b40c2` (`citizen`). At completion of the research, the new verification packet, measurement tools, validators, regression tests and documentation updates were uncommitted; no commit or push was performed during verification.

Commit-and-push follow-up: the user subsequently requested publishing this verification checkpoint. The agreed next-session order is Navitimer verification first, then Milestone 3A. Committing this research does not enable either original preset; the Citizen renderer gate remains disabled until M3A implementation and visual acceptance.
