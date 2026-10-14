"""Produce a compact review/implementation manifest from a read-only VR0 inventory."""
import argparse
from collections import Counter
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inventory", required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()
    source = Path(args.inventory).resolve()
    report = json.loads(source.read_text(encoding="utf-8"))
    output = Path(args.output_dir).resolve()
    output.mkdir(parents=True, exist_ok=True)
    files = []
    for file in report["files"]:
        excluded = "/face-review/" in file["path"]
        files.append({"path": file["path"], "sha256": file["sha256"],
                      "bytes": file["bytes"], "triangles": file["triangles"],
                      "objects": len(file["objects"]),
                      "eligible": not excluded,
                      "reason": "Unregistered animated/mixed-role demonstration fixture" if excluded
                                else "Registered runtime or compatibility component",
                      "baseline": str(source),
                      "materials": [m.get("name") for m in file["gltf_materials"]],
                      "role_candidates": file["role_counts"]})
    manifest = {"schema": "watch-realism-input/v1",
                "source_commit": "c1cead147bf88c2b4e6ae8272984e75d096e49b1",
                "scope": "101 registered/compatibility components; 13 review fixtures excluded from promotion",
                "role_policy": "Names/source builders establish semantics; inventory candidates alone never authorize a geometry edit",
                "approved_strap_sides": {"6": "adjustment-hole tail", "12": "buckle side"},
                "geometry_policy": "Preserve dimensions, names, pivots, dial/scale UV and attachment interfaces",
                "files": files}
    (output / "VR0-INPUT-MANIFEST.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    lines = ["# VR0 asset inspection — 14 October 2026", "",
             "All 114 originals imported successfully and have verified SHA-256 backup copies. No source GLB was changed by inspection.", "",
             f"Total: {report['total_bytes']:,} bytes; {report['total_triangles']:,} triangulated imported faces; "
             f"{sum(len(f['objects']) for f in report['files']):,} imported objects.", "",
             "The full local `inventory.json` records every object/mesh/material name, parent, local/world matrix, scale, dimensions, bounds, UV layer/hash, geometry hashes, raw glTF node/mesh/accessor/material data and animation declarations. "
             "It is under `.artifacts/blender-review/realism/vr0-2026-10-13/`, next to immutable `backup/` and `backup-manifest.json`. "
             "The compact [input manifest](VR0-INPUT-MANIFEST.json) records exact source hashes and eligibility.", "",
             "## Component identities and deviations", "",
             "- `DD_CASE_MIDCASE` is the case; `DD_CASE_LUG_*` are lugs. Crown boss/tube objects belong to the case interface, not the separately selected crown head. Preserve those interfaces.",
             "- `DD_HAND_HOUR_*`, `DD_HAND_MINUTE_*`, `DD_HAND_SECONDS_*` directly identify main hand parts; shared hubs are not independently posed blades. Archetype builder order resolves `DD_ARCH_HAND_0/1/2` to hour/minute/seconds. Its chronograph central seconds has its own `DD_ARCH_CHRONO_SECONDS` name; VK63 objects are register hands/hubs.",
             "- `DD_ARCH_STRAP_6/12` are equal-length leather/rubber/canvas/racing previews. The user approved treating 6 as the adjustment tail and 12 as the buckle side without changing dimensions. Reference rubber already has buckle/tang/keepers on side 12; do not duplicate them.",
             "- Archetype straps are nominal 22→18 mm, 58 mm per side, 3 mm thick; imported width is 20.8 mm at the attachment after clearance. Reference rubber previews are only ~19 mm per side and 3.2 mm thick. Do not impose generic brief measurements or seven leather holes on these short rubber previews.",
             "- Source `DD_ARCH_TACHY_*`, coin-edge, orientation, hour-marker and register-assembly names denote scale/edge/marker/register detail as established by the existing builder. Preserve their role and artwork. These were conservative `unidentified` candidates in the automated name scan; they are not unidentified whole-watch parts.",
             "- `face-review/` has 13 unregistered demonstration assets, including three animation-bearing files and generic labels/flutes/applied markers. They stay backed up and outside production promotion. Most input files are separate components, not complete watches.",
             "- Numeric coordinates are authored millimetres and exported Y-up under the existing app registry contract. Blender fresh-import scenes report unit system NONE and scale 1; this is not permission to reinterpret the component as metres or apply a conversion. No nonuniform/negative imported object scales were found.",
             "- Some metal/hand detail meshes have no UVs. Preserve existing dial/scale UV0; use added secondary UVs only on non-artwork surfaces if needed. Do not pretend every mesh already has bake-ready UVs.",
             "- Existing texture images occur in the Namoki silver dial and five face-review assets. Preserve those images/UV relationships; generate neutral new material maps rather than baking a fixed strap hue.",
             "- The two pilot rings already total 103,272 triangles. Microdetail should be baked and draw-call/texture costs measured before increasing this workload.", "",
             "## Per-file inventory", "",
             "The detailed object and mesh names are available in the linked local full inventory. Here bytes, triangles and material names make per-file differences reviewable.", "",
             "| GLB path under public/assets/3d | Objects | Triangles | Bytes | Materials | Workload |", "|---|---:|---:|---:|---|---|"]
    for file in files:
        materials = "; ".join(str(m) for m in file["materials"]).replace("|", "\\|")
        lines.append(f"| `{file['path'][len('public/assets/3d/'):]}` | {file['objects']} | "
                     f"{file['triangles']:,} | {file['bytes']:,} | {materials} | "
                     f"{'Refine / explicit no-op record' if file['eligible'] else 'Review only'} |")
    (output / "VR0-ASSET-INVENTORY.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps({"files": len(files), "eligible": sum(f["eligible"] for f in files), "output": str(output)}))


if __name__ == "__main__":
    main()
