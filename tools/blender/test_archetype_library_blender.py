"""Blender integration check for the generated archetype component library."""
import json
from pathlib import Path
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from validate_glb import import_glb


root = Path(__file__).resolve().parents[2] / "public" / "assets" / "3d" / "archetypes"
manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
expected = 23
if manifest.get("status") != "provisional-presentation" or len(manifest.get("assets", [])) != expected:
    raise AssertionError("Archetype manifest is incomplete or has invalid provenance")

total_meshes = 0
mesh_names_by_asset = {}
for filename in manifest["assets"]:
    meshes, report = import_glb(str(root / filename))
    total_meshes += report["mesh_count"]
    mesh_names_by_asset[filename] = set(report["mesh_names"])
    if not all(obj.get("DD_PROVENANCE_STATUS") == "provisional-presentation" for obj in meshes):
        raise AssertionError(f"Missing presentation provenance in {filename}")

chrono_dial = mesh_names_by_asset["dial-chronograph.glb"]
for required in ("DD_ARCH_CHRONO_MINUTE_TRACK", "DD_ARCH_CHRONO_HOUR_MARKERS",
                 "DD_ARCH_REGISTER_ASSEMBLY_0", "DD_ARCH_REGISTER_ASSEMBLY_1",
                 "DD_ARCH_REGISTER_ASSEMBLY_2"):
    if required not in chrono_dial:
        raise AssertionError(f"High-detail VK63 dial mesh missing: {required}")
if "DD_ARCH_CHRONO_SIGNATURE" in chrono_dial:
    raise AssertionError("Chronograph GLB must not duplicate the live typography layer")
for style in ("needle", "baton", "syringe"):
    names = mesh_names_by_asset[f"hands-chronograph-{style}.glb"]
    if f"DD_ARCH_VK63_{style.upper()}_0" not in names:
        raise AssertionError(f"High-detail VK63 {style} hand mesh missing")

print(f"P10 archetype library PASS: {expected} GLBs, {total_meshes} meshes")
