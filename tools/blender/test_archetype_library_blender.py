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
for filename in manifest["assets"]:
    meshes, report = import_glb(str(root / filename))
    total_meshes += report["mesh_count"]
    if not all(obj.get("DD_PROVENANCE_STATUS") == "provisional-presentation" for obj in meshes):
        raise AssertionError(f"Missing presentation provenance in {filename}")

print(f"P10 archetype library PASS: {expected} GLBs, {total_meshes} meshes")
