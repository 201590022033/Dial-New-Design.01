# Watch realism release — 14 October 2026

The live dashboard now uses the refined component models. This release preserves the existing designs and physical envelopes while improving leather, metal, ceramic, crystal and dial materials. Git publication was authorized on 14 October 2026. Repository source and refined runtime assets are tracked in Git; the large generated Blender/render archive remains local under the ignored `.artifacts/blender-review/` folder. That verified archive predates Git publication and retains its original validation-time publication fields.

VR0–VR5 delivery is complete: 101 refined component GLBs, six standalone watches with packed editable Blender scenes and 20 final 2400-pixel PNG files. All final photographs were visually inspected. Strict file/dependency verification, final Khronos validation and archive integrity passed. Open `delivery/gallery.html` in the implementation run to browse the collection; `delivery/watch-realism-2026-10-14.zip` is the complete archive and `delivery/package.json` records its size and SHA256.

## Deliverables

Implementation run: `.artifacts/blender-review/realism/vr-implementation-2026-10-14/`.

- `web/public/assets/3d/`: 101 refined registry/compatibility component GLBs, promoted to the corresponding application paths after validation.
- `styles/<style>/watch.glb`: six standalone assembled watches, standard metre units and +Y up. Component replacements retain the app's original numeric millimetres.
- `styles/<style>/source.blend`: packed, editable assembled scenes with the studio rig. `shots.json` records cameras, settings, completion and image hashes.
- `renders/<style>/`: final three-quarter, straight-on dial and strap-detail PNGs. Dress also supplies the same-camera AR off/on comparison. Draft/benchmark images are development evidence and are excluded from the delivery package.
- `work/public/assets/3d/archetypes/strap-leather.blend`: leather construction source, retaining Boolean hole modifiers and curve stitching.
- `reports/`: per-file changes, preserved-contract checks, validator results, app checks, browser evidence and final delivery manifest.
- `tools/blender/realism_*.py`, `.mjs`, `.mts`: reproducible build, assembly, artwork, verification and release tools. Tool-only dependencies are pinned separately in `tools/blender/realism-toolchain/`.

The six styles are Ladies Dress, Dress, Field, Diver, Pilot and Chronograph. Ladies uses the actual 34 mm starter and its 24.5 mm dial. Gallery appearance buttons preserve the selected physical parts; they do not silently resize a mismatched dial into a smaller case.

## What changed

The leather tail at 6 o'clock has seven real 2 mm holes at 7.5 mm spacing. Four separated stitch rows follow the original taper. Hole rims and edge paint derive from 45% of the current linear strap colour; thread remains cream. A neutral leather normal/roughness recipe allows dashboard recolouring without baking in a new colour variant.

Brushed metal uses directional anisotropy and restrained stochastic microdetail; polished areas retain their separate finish. Ceramic, rubber, canvas, dial and hand materials retain their roles. The application preserves imported physical materials and maps through appearance edits, including hand-region recolouring. Explicit crown finishes remain independent of the case until Inherit is selected.

Crystal has a neutral base, full alpha, transmission 1, IOR 1.55 and subtle iridescence. Cycles uses a restrained reflection blend rather than blue glass. Camera rays retain transmission/refraction; crystal shadow visibility follows the dashboard so the studio's disabled caustics do not blacken the date print. The AR pair changes only the reflection blend in the same view.

The AR-on reference reuses the verified three-quarter photograph, which already has the identical coating, camera, pose, lights, sample settings and seed. Its pixels are copied unchanged with explicit shared-render provenance; the AR-off photograph is rendered separately. The delivery contains 20 final PNG files, including this comparison pair.

Standalone export finalization restores coating fields omitted by Blender, using the imported component recipe for GLB-backed crystals and the frozen finish profile for the Ladies procedural fallback. It preserves existing factor precision and every binary geometry/UV byte. The five component crystals do not gain a new clearcoat; the Ladies fallback retains its existing dashboard clearcoat.

Live dial and scale artwork remains authoritative in the application. The standalone scenes rasterize the frozen production scale SVG and calibrated dial layout at 2048 px, keeping the current text, fonts, dimensions and ring positions. Hero duplicates pose the hands at 10:10:35 without changing saved application designs.

## Verification

- 114 source GLBs were inventoried, imported and backed up. 101 eligible files were processed; 13 unregistered animated/mixed-role `face-review/` fixtures remain untouched, with an explicit exclusion record.
- All 101 promoted component files pass the preservation contract and Khronos validation with zero errors and warnings. Original names, hierarchy, transforms, protected positions/UVs and attachment interfaces are checked against immutable originals.
- Full application checks passed: 147 test files, 1,315 tests, lint and production build. Existing production bundle-size/third-party annotation notices remain recorded.
- The standalone export repair changes only zero-length tangent XYZ vectors at singular strap UV vertices, deriving them from incident UV gradients and the existing normal. Positions, normals, UVs, indices, colours, material data, nodes and tangent handedness remain unchanged. No accepted nonzero tangent is altered; no arbitrary fallback was needed in the six verified assemblies.
- Browser evidence records all six gallery appearances, the actual Ladies starter, 34/38/40/42/46 mm preview changes, HD entry/exit and narrow framing, repeated rehaut hide/show, crystal visibility and explicit crown double-click preview, Apply and Undo. No application console errors were observed in the final session.
- After the render batch, 20 repeated HD switches completed in an isolated localhost project. The same Dress endpoint held 438 geometries and 55 textures after each of four cycles. `reports/browser/after-render-20-swaps.json` records the actions, counters and limits; automation durations are not FPS measurements.

The authoritative app results are `reports/final-tests.json` and `reports/final-code-validation.json`. Earlier failed/draft reports remain historical evidence and are not release results. Final render/package verification is recorded separately in the delivery manifest.

## Deliberate limits and remaining qualification

The approved dimension rule takes precedence over generic thickness/taper targets in the brief. The original 3 mm leather silhouette, crystal shape, hand thickness and supplier attachment geometry stay intact. No new permanent colour options, functional hardware claims or fit approvals are introduced.

The direct-patched component families retain their authored chamfers and crown knurling. A new all-family hard-edge bevel pass was not applied: preserving protected original geometry/UVs took precedence. This is a material and bounded-detail refinement, not a claim that every generic shape target in the original brief was imposed.

The bounded keeper top band is a presentation detail. A projecting functional keeper loop is omitted because it would exceed the original envelope. Racing straps retain their shallow decorative perforation cylinders; they are not represented as cut-through adjustment holes. Short procedural straps are not lengthened to force seven holes into insufficient space.

The Chronograph presentation retains the current three-o'clock date print overlapping its right subdial. The supplied dashboard artwork is preserved; resolving that layout is separate dial-design work.

Procedural material graphs become neutral web maps. Studio lights, depth of field, AgX and the Cycles reflection blend stay in the Blender scenes; the web uses supported glTF material extensions. Export maps are no larger than 2048 px. No external texture library or copyrighted product photography was required.

Pilot draw calls and Chronograph triangles exceed provisional optimisation targets because protected authored meshes and live scale/render passes are retained; the delivery report records the measured exceptions. Earlier mixed browser-control loops encountered command timeouts. A final sequence using fresh accessibility state completed 20 HD switches with stable same-style cycle endpoints and no observed app errors. Settled per-style peak costs and long-session frame-time comfort remain manual qualification, alongside the existing real screen-reader and physical-fit/supplier checks. None is implied by the material release.

## Rebuild and resume

Use Blender 5.2.1 LTS with `tools/blender/realism_assets.py` to rebuild candidates from the immutable source backup, never from promoted assets. Generate artwork with `node tools/blender/realism_artwork.mjs <run>`. Validate the candidates before using `realism_release.py --promote`.

Run `realism_hero.py` through Blender's background Python entry point with `--repo . --run <run> --style all --render --ar-comparison --device HYBRID --resume`. Final mode enforces at least 2400 px and 256 maximum samples. Adaptive sampling has a 64-sample minimum, 0.02 threshold and denoising. CPU fallback is supported. A completed image is skipped only when its fingerprint and SHA match; partial images cannot satisfy the delivery gate.

The same-scene local benchmark measured CUDA 26.61 s, CPU 15.20 s and combined CUDA+CPU 10.16 s at 600 px/64 samples. The combined backend therefore completes the remaining images without changing materials, cameras, sampling or pose. Accepted CUDA images retain their actual producer/backend provenance; a recorded AST check proves that adding the optional combined backend leaves the original CUDA request behaviour unchanged. `realism_complete.py` serializes remaining renders, provenance/finalization, validation and packaging in a durable local runner.

Immutable source backup: `.artifacts/blender-review/realism/vr0-2026-10-13/backup/`. Preserve that backup and the run's frozen manifests with the editable sources.
