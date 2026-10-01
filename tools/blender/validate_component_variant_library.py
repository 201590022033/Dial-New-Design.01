"""Batch-import and validate every generated component variant GLB."""
import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Vector


def script_args():
    return sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def world_bounds(meshes):
    points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    return tuple(max(point[axis] for point in points) - min(point[axis] for point in points) for axis in range(3))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", required=True)
    parsed = parser.parse_args(script_args())
    manifest_path = os.path.abspath(parsed.manifest)
    with open(manifest_path, encoding="utf-8") as handle:
        manifest = json.load(handle)
    if manifest.get("schema") != "dial-designer/component-variants/v1":
        raise ValueError("Unexpected component-variant manifest schema")
    reports = []
    for entry in manifest["assets"]:
        clear()
        source = os.path.abspath(entry["path"])
        if not os.path.isfile(source) or os.path.getsize(source) < 1000:
            raise ValueError(f"Missing or empty GLB: {source}")
        bpy.ops.import_scene.gltf(filepath=source)
        meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
        if not meshes:
            raise ValueError(f"No meshes: {entry['assetId']}")
        bounds = world_bounds(meshes)
        if not all(math.isfinite(value) and 0 < value < 80 for value in bounds):
            raise ValueError(f"Invalid bounds for {entry['assetId']}: {bounds}")
        if len(meshes) != entry["meshCount"]:
            raise ValueError(f"Mesh-count mismatch for {entry['assetId']}: {len(meshes)} != {entry['meshCount']}")
        missing = [obj.name for obj in meshes if not obj.data.materials]
        if missing:
            raise ValueError(f"Meshes without material for {entry['assetId']}: {missing}")
        reports.append({"assetId": entry["assetId"], "meshCount": len(meshes), "boundsMm": [round(value, 3) for value in bounds]})
    print("COMPONENT_VARIANT_VALIDATION=" + json.dumps({"validated": len(reports), "assets": reports}), flush=True)


if __name__ == "__main__":
    main()
