# Blender asset guide

Blender is also the canonical reference environment for future parameter-driven
case and hand generators. Scripts must derive meshes from versioned parameters,
keep units explicit, and emit validation metadata. A generated GLB is an output
artifact, not a replacement for the parameter set.

Browser visual assets are authored in Blender and exported as optimized `.glb` files. Blender is not a browser runtime dependency.

## Coordinate convention

- Use metric units with 1 Blender unit representing 1 millimetre at authoring scale.
- Centre the watch on the global Z axis; X/Y are the dial plane and positive Z points toward the crystal.
- Put the object origin on the watch radial centre and at its engineering seat height.
- Keep radial parts concentric with the watch axis and use the registry `anchor` to describe `watch-axis`, `dial-seat`, `hand-stack`, or `crown-interface` placement.
- The browser adapter owns any domain-millimetre to Three.js-unit conversion.

## Authoring and export

- Apply transforms, remove hidden geometry, recalculate outward normals, and triangulate only at export.
- Use stable names such as `case_round_40mm_v1`, `bezel_diver_40mm_v1`, and `hands_mercedes_v1`.
- Prefer bevels with 1–2 segments; avoid unapplied subdivision and dense booleans.
- Keep case assets below 50k triangles, bezels below 20k, crystals below 5k, and hand sets below 10k total.
- Use reusable materials where possible; do not bake every finish into a separate mesh.
- Keep textures at 1K by default and 2K only when visibly justified. Do not ship 4K/8K textures.
- Export GLB with selected objects, applied transforms, compressed geometry where available, and embedded or relative textures validated against the public asset path.

The visual registry is the integration point. A routine new part should add a catalogue reference, one registry descriptor, and one file under `public/assets/3d/` without a new React component.

P4 applies this path to case, dial, bezel, crystal, hands (one hand-set slot), and
crown. Descriptor `offset` is in engineering mm, `rotation` in XYZ radians and
`scale` is dimensionless. Defaults are numeric millimetre units and glTF Y-up;
`units: 'metres'` and `upAxis: 'Z'` are explicit alternatives. Blender's default
Y-up GLB export is rotated back by +pi/2 about X before assembly placement. The
scene converts mm to display units once; it does not resize authored GLBs when the
case diameter changes. Asset authors must use the matching anchor-local origin.
Procedural/loading/error fallbacks use the same assembly anchor and instance
transform but do not inherit GLB-specific offsets, rotation or scale.

### Parametric crown v1 and case-side interface

The existing case generator is unchanged: its boss and tube are mechanical
interface geometry and remain in `DD_PARAMETRIC_CASE`. They are **not** the
removable crown head. `parametric_crown_v1.py` consumes the canonical
`parametric-crown/v1` contract and creates only `DD_CROWN_HEAD` in
`DD_PARAMETRIC_CROWN`, with a rear blind socket and optional axial grip ribs.
`headDiameterMm` is the base diameter; the maximum grip diameter is
`headDiameterMm + 2 * gripDepthMm` when gripCount is nonzero.
Rebuilding the crown collection leaves the case untouched.

The crown's local rear face/socket entrance is X=0 and its head extends along +X.
Attach that origin to the `crown-interface` frame plus `attachment.axialGapMm`
along local +X. For the existing case generator the frame is at
`(caseDiameter / 2 - crownTubeEmbed + crownTubeLength, 0, 0)`; the 42 mm test case
therefore has X=21.8 mm. Explicit assembly frames support other positions/rotations.
The generator exports local geometry and never bakes this world placement into it.
The socket dimensions do not establish fit, stem compatibility, sealing or threads.

All values in `test_crown_v1.json` are an explicitly **provisional visual fixture**.
`stemThreadPitchMm` is unknown and deliberately unmodelled. Unknown geometry needed
to build the head/socket fails clearly; unknown attachment gaps can be stored but
must be resolved for engineering placement (the preview is marked provisional).
The TypeScript validator reports `valid`, `invalid` or `unknown` and retains paths
to unknown dimensions. None of these outcomes constitutes manufacturing approval.

```text
blender --background --factory-startup --python-exit-code 1 --python tools/blender/parametric_crown_v1.py -- --params tools/blender/test_crown_v1.json --quality normal --output .artifacts/blender-review/crown-v1/crown-v1.glb
```

After review, an intentionally published file can use the opt-in registry ID
`crown-reference-v1` at `/assets/3d/generated/crowns/crown-v1.glb`. This file is **not**
published automatically by the harness and is not selected by default. Bind the
crown instance with `visual: { category: 'crown', assetId: 'crown-reference-v1' }`
and retain its `parametricGeometry` and provenance. Missing assets render safely as
procedural previews. Legacy `customProperties.visualAssetId` remains supported.

## Parametric hand generator v1

[`tools/blender/parametric_hand_v1.py`](../tools/blender/parametric_hand_v1.py) consumes `parametric-hand/v1` or `parametric-hand-set/v1` JSON. It creates separate hub, body, tip, tail, and lume regions in `DD_PARAMETRIC_HANDS`, uses a real boolean pinion bore, and assigns reusable `HAND_METAL`/`HAND_LUME` materials. The demo fixture is `tools/blender/test_hand_set_v1.json`.

```text
blender --background --python tools/blender/parametric_hand_v1.py -- --params tools/blender/test_hand_set_v1.json --quality normal
blender --background --python tools/blender/parametric_hand_v1.py -- --params tools/blender/test_hand_set_v1.json --quality high --output public/assets/3d/generated/hands/hand-set.glb
```

Quality is a presentation setting (`preview`, `normal`, `high`), and Z positions in the hand-set demo are reference placement values rather than movement-specific stack dimensions. Unknown required dimensions fail clearly; no generic bore is substituted.

## Parametric case generator v1

The reference generator is [`tools/blender/parametric_case_v1.py`](../tools/blender/parametric_case_v1.py). It consumes the `parametric-case/v1` field names and treats Blender units as millimetres. The named reference values are embedded as an explicit demo preset; unknown required production values fail clearly rather than receiving defaults.

Run in Blender's Scripting workspace, or headlessly:

```text
blender --background --python tools/blender/parametric_case_v1.py -- --quality normal
blender --background --python tools/blender/parametric_case_v1.py -- --params case.json --quality high --output public/assets/3d/generated/cases/case.glb
```

Quality controls radial sampling (`preview`, `normal`, `high`) and is not part of the physical case schema. The generator creates/rebuilds only `DD_PARAMETRIC_CASE`, including a smooth revolved mid-case, four tapered lugs, and embedded crown boss/tube source objects. Re-running is idempotent. GLB export is optional and selection-scoped.

## Shared local component render-and-review harness

Prerequisites: Windows PowerShell 5.1 or later, a local Blender installation with
Eevee rendering support and its bundled glTF importer/exporter, and this repository.
No Python packages, Blender MCP, API keys, or network services are required.
Blender **5.2.1 LTS** was verified locally with `blender.exe --version`, followed by
the full background generation, reimport, and four-view render workflow.

Run this single command from any current directory (adjust the repository path if
your checkout is elsewhere):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Deon\Documents\GitHub\Dial-New-Design.01\tools\blender\review_case_42.ps1"
```

To supply another executable, append `-BlenderExe`:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Deon\Documents\GitHub\Dial-New-Design.01\tools\blender\review_case_42.ps1" -BlenderExe "D:\Apps\Blender\blender.exe"
```

The wrapper derives the checkout root from its own location. Without an override,
it checks `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`, then
`blender.exe` on PATH, then immediate Blender installation directories under
`Blender Foundation` in Program Files, Program Files (x86), and LocalAppData.
It does not modify the registry. Other Blender versions are not verified; the
renderer explicitly requires the installed `BLENDER_EEVEE` engine identifier.

Outputs are overwritten on each run in `.artifacts/blender-review/case-42/`:

| File | Purpose |
| --- | --- |
| `case-42.glb` | Temporary export of unchanged `test_case_42.json`, normal quality |
| `top.png` | View from +Z, dial plane visible |
| `front.png` | View from -Y, +Z up |
| `side.png` | View from +X, +Z up |
| `three-quarter.png` | View from +X/-Y/+Z |
| `manifest.json` | Blender version, source, label, mesh names/count, vertex count, bounds, engine, resolution, cameras and image paths/sizes |
| `review.log` | Complete Blender stdout/stderr, commands/arguments, exit codes and final artifact paths |

P4 moves orchestration into `review_component.ps1`; `review_case_42.ps1` remains a
compatible thin wrapper, and `review_crown.ps1` uses the same pipeline. Run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/blender/review_crown.ps1
```

Crown output goes to `.artifacts/blender-review/crown-v1/` with `crown-v1.glb` and
the same four views, manifest and log. Later generators can call the generic
wrapper with `-Generator`, `-ParamsFile`, `-AssetName` and `-AssetLabel` (absolute
input paths recommended). Asset names permit only lowercase letters, digits and
hyphens, keeping output cleanup inside the review directory. One log writer stays
open for each run to avoid Windows file-open races. Do not run concurrent reviews
with the same asset name. The validator, cameras, lights and renderer are shared;
no category-specific render pipeline was added.

Each stage runs in a fresh background Blender process with factory settings and
`--python-exit-code 1`. Generation uses the existing case generator without changing
its dimensions or algorithms. `validate_glb.py` rejects missing, blank, nonexistent,
empty, or unimportable GLBs and requires at least one mesh and a positive total
vertex count in the imported scene. Counts refer to imported mesh objects and their
vertices, including splits made by glTF export. This is a structural smoke check,
not a watertightness, normals, dimension-tolerance, or manufacturing certification.

`render_review.py` independently imports and validates the GLB, calculates combined
world-space bounds and translates scene roots to center the asset in memory. The
source GLB is never rewritten. Fixed area lights, neutral world, AgX color settings
and orthographic cameras produce 512 x 512 RGB PNGs. Each camera frames all bounding
box corners with a 15% margin and scale-relative clipping planes. Bounds are in
imported Blender units; for this fixture, one unit represents one millimetre.
Camera and lighting setup is repeatable; pixel-identical output across GPU drivers
or Blender versions is not guaranteed. A local repeat render produced identical
image data in all four views, but Blender embeds date/render-duration metadata in
PNGs, so whole-file hashes can differ even when pixels match.
The renderer uses Blender 5.2's default `World.node_tree` directly; it does not
assign the deprecated `World.use_nodes` property.

The wrapper stops on any failed subprocess and exits non-zero. It clears its known
previous outputs first; a success manifest is written only after all renders finish.
On failure, use `review.log` to identify the failing stage; partial images may remain.
Run only one instance per checkout at a time because the output directory is shared.
Inspect every view before accepting the asset: successful file generation alone does
not establish visual quality.

Generated review files are ignored only under `.artifacts/blender-review/` and must
not be treated as selected production assets. Production GLBs deliberately selected
for `public/assets/3d/` still require review and registry integration; this harness
does not create or register any production asset. GLB, PNG and Blender files elsewhere
remain eligible for version control.

### Troubleshooting and helper tests

- **Blender not found:** provide the full executable path with `-BlenderExe`.
- **Script policy prevents launch:** use the command above; its execution-policy
  override applies to that PowerShell process only.
- **Import or generation fails:** check the first failed stage in `review.log` and
  the versioned fixture. Do not replace missing dimensions with guessed values.
- **Eevee unavailable or GPU initialization fails:** verify Blender 5.2.1 and that
  Eevee works on the local graphics driver/session. Headless rendering still needs
  supported graphics hardware; the harness deliberately does not substitute Cycles.
- **Images look wrong:** inspect all four views for clipping, shading, overlaps and
  source geometry defects. Review scripts preserve the existing geometry/materials;
  fixing generator geometry is a separate task.

Pure framing/bounds tests use the Python standard library and do not import `bpy`:

```powershell
python -B -m unittest discover -s tools/blender -p test_review_helpers.py
python -B -m unittest discover -s tools/blender -p test_crown_helpers.py
blender --background --factory-startup --python-exit-code 1 --python tools/blender/test_component_assembly_blender.py
```

Run that test command from the repository root with a local Python 3 installation.
Ordinary `npm test` / Vitest runs do not launch or require Blender.

The Blender-only check verifies crown rebuild idempotence, retention of all seven
case objects, separate visibility and alignment against the actual tube bounds.
Pure crown helpers test contract failures, unknown dimensions, dimensions, socket
topology/orientation and local export coordinates. Review images check presentation;
the inherited case/lug model and the provisional crown still require engineering
fit and clearance review before production use.
