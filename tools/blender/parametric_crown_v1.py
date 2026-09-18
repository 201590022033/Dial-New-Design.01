"""parametric-crown/v1: removable head, rear socket at origin, outward local +X.
1 numeric Blender unit = 1 mm. Case boss/tube never belong to this collection.
The blind socket is visual geometry; threads, seals and fit are not certified.
"""
import argparse
import json
import math
import os
import sys

SCHEMA = "parametric-crown/v1"
QUALITY = {"preview": 64, "normal": 128, "high": 192}
GEOMETRY_FIELDS = ("headDiameterMm", "headLengthMm", "socketDiameterMm", "socketDepthMm", "gripDepthMm")


def dimension(value, name, zero=False, allow_unknown=False):
    if isinstance(value, dict) and value.get("status") == "unknown":
        if allow_unknown:
            return None
        raise ValueError("unknown required dimension: " + name)
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError("missing/invalid dimension: " + name)
    if value < 0 or (not zero and value == 0):
        raise ValueError("out-of-range dimension: " + name)
    return value


def validate(p):
    if not isinstance(p, dict):
        raise ValueError("parameters must be a JSON object")
    if p.get("schema") != SCHEMA:
        raise ValueError("schema must be " + SCHEMA)
    provenance = p.get("provenance", {})
    if provenance.get("status") not in ("provisional", "specified") or not isinstance(provenance.get("source"), str) or not provenance["source"].strip():
        raise ValueError("provenance is required")
    for key in GEOMETRY_FIELDS:
        dimension(p.get(key), key, zero=key == "gripDepthMm")
    dimension(p.get("stemThreadPitchMm"), "stemThreadPitchMm", allow_unknown=True)
    attachment = p.get("attachment", {})
    if attachment.get("anchor") != "crown-interface":
        raise ValueError("attachment.anchor must be crown-interface")
    # Placement is assembly-owned and not baked into this local component asset.
    dimension(attachment.get("axialGapMm"), "attachment.axialGapMm", zero=True, allow_unknown=True)
    count = p.get("gripCount")
    if isinstance(count, bool) or not isinstance(count, int) or not 0 <= count <= 256:
        raise ValueError("gripCount must be an integer from 0 to 256")
    if p["socketDiameterMm"] >= p["headDiameterMm"]:
        raise ValueError("socketDiameterMm must be smaller than headDiameterMm")
    if p["socketDepthMm"] >= p["headLengthMm"]:
        raise ValueError("socketDepthMm must be smaller than headLengthMm")
    if p["gripDepthMm"] >= p["headDiameterMm"] / 4:
        raise ValueError("gripDepthMm must be smaller than headDiameterMm / 4")


def geometry(p, quality="normal"):
    """Closed head with a blind rear socket; no boolean or guessed bore dimensions."""
    validate(p)
    n = max(QUALITY[quality], p["gripCount"] * 4)
    vertices = []
    length, depth = p["headLengthMm"], p["socketDepthMm"]
    for x, radius, grip in ((0, p["headDiameterMm"] / 2, True),
                             (length, p["headDiameterMm"] / 2, True),
                             (0, p["socketDiameterMm"] / 2, False),
                             (depth, p["socketDiameterMm"] / 2, False)):
        for i in range(n):
            angle = math.tau * i / n
            r = radius + (p["gripDepthMm"] * (1 + math.cos(p["gripCount"] * angle)) / 2 if grip and p["gripCount"] else 0)
            vertices.append((x, r * math.cos(angle), r * math.sin(angle)))
    front, bottom = len(vertices), len(vertices) + 1
    vertices.extend(((length, 0, 0), (depth, 0, 0)))
    faces = []
    for i in range(n):
        j = (i + 1) % n
        faces.extend(((i, j, n+j, n+i), (i, 2*n+i, 2*n+j, j),
                      (n+i, n+j, front), (2*n+i, 3*n+i, 3*n+j, 2*n+j),
                      (3*n+j, 3*n+i, bottom)))
    return vertices, faces


def build(p, quality="normal"):
    import bpy
    vertices, faces = geometry(p, quality)
    old = bpy.data.collections.get("DD_PARAMETRIC_CROWN")
    if old:
        for obj in list(old.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.collections.remove(old)
    collection = bpy.data.collections.new("DD_PARAMETRIC_CROWN")
    bpy.context.scene.collection.children.link(collection)
    mesh = bpy.data.meshes.new("DD_CROWN_HEAD_MESH")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("DD_CROWN_HEAD", mesh)
    collection.objects.link(obj)
    material = bpy.data.materials.get("DD Crown Steel") or bpy.data.materials.new("DD Crown Steel")
    material.diffuse_color = (0.55, 0.59, 0.64, 1)
    material.metallic, material.roughness = 0.9, 0.24
    mesh.materials.append(material)
    obj["schema"] = SCHEMA
    obj["parameters"] = json.dumps(p, sort_keys=True)
    obj["attachment"] = "rear socket origin; +X outward; crown-interface + axialGapMm (assembly-owned)"
    return collection


def main():
    import bpy
    parser = argparse.ArgumentParser()
    parser.add_argument("--params", required=True)
    parser.add_argument("--output")
    parser.add_argument("--quality", choices=QUALITY, default="normal")
    args = parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    with open(args.params, encoding="utf-8") as source:
        parameters = json.load(source)
    collection = build(parameters, args.quality)
    if args.output:
        os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
        bpy.ops.object.select_all(action="DESELECT")
        for obj in collection.objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = collection.objects[0]
        bpy.ops.export_scene.gltf(filepath=os.path.abspath(args.output), export_format="GLB",
                                  use_selection=True, export_yup=True, export_extras=True)


if __name__ == "__main__":
    main()
