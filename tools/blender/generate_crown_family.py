"""C3 presentation heads in millimetres, rear x=0 and local +X outward.

Surface formula matches src/visual3d/crownGeometry.ts. Closed heads deliberately
omit unmeasured physical sockets, seals and threads. No case structure included.
"""
import bpy
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FAMILY = [
    ("smooth", "cylindrical", "smooth", 6.5, 6.5, 3.5),
    ("fine-fluted", "cylindrical", "fine-fluted", 6.5, 6.9, 3.5),
    ("coarse-fluted", "cylindrical", "coarse-fluted", 6.5, 7.1, 3.5),
    ("knurled", "cylindrical", "cross-knurled", 6.5, 6.9, 3.5),
    ("onion", "onion", "fine-fluted", 6, 7, 4),
    ("compact-dress", "compact-dress", "fine-fluted", 5, 5.2, 2.5),
]


def geometry(shape, grip, core, maximum, length):
    vertices, faces = [], []
    segments, rings = 128, 24
    teeth = 16 if grip == "coarse-fluted" else 0 if grip == "smooth" else 32
    for j in range(rings + 1):
        t = j / rings
        profile = .62 + .38 * math.sin(math.pi * t) if shape == "onion" else .94 + .06 * min(1, t * 12, (1 - t) * 12)
        for i in range(segments):
            a = i / segments * math.tau
            relief = 0 if not teeth else (2 + math.cos(teeth*a + t*math.pi*4) + math.cos(teeth*a - t*math.pi*4))/4 if grip == "cross-knurled" else (1 + math.cos(teeth*a))/2
            radius = profile * (core/2 + (maximum-core)/2 * relief)
            vertices.append((t*length, radius*math.cos(a), radius*math.sin(a)))
            if j < rings:
                k, n = j*segments+i, j*segments+(i+1) % segments
                faces.extend(((k, n, k+segments), (n, n+segments, k+segments)))
    rear = len(vertices)
    vertices.extend(((0, 0, 0), (length, 0, 0)))
    for i in range(segments):
        n = (i+1) % segments
        faces.extend(((rear, n, i), (rear+1, rings*segments+i, rings*segments+n)))
    return vertices, faces


def main():
    output = ROOT / "public/assets/3d/crowns"
    output.mkdir(parents=True, exist_ok=True)
    manifest = []
    for name, shape, grip, core, maximum, length in FAMILY:
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.object.delete(use_global=False)
        mesh = bpy.data.meshes.new("DD_CROWN_HEAD_MESH")
        vertices, faces = geometry(shape, grip, core, maximum, length)
        mesh.from_pydata(vertices, [], faces)
        mesh.update()
        obj = bpy.data.objects.new("DD_CROWN_HEAD", mesh)
        bpy.context.collection.objects.link(obj)
        material = bpy.data.materials.new("DD Crown neutral steel")
        material.diffuse_color = (.55, .59, .64, 1)
        material.metallic, material.roughness = .9, .24
        mesh.materials.append(material)
        for polygon in mesh.polygons:
            polygon.use_smooth = True
        obj["provenance"] = "C3 visual approximation; physical interfaces unknown"
        obj["shape"], obj["grip"] = shape, grip
        obj["coreDiameterMm"], obj["maximumOuterDiameterMm"], obj["headLengthMm"] = core, maximum, length
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        path = output / f"crown-{name}.glb"
        bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", use_selection=True, export_yup=True, export_extras=True)
        manifest.append({"asset": path.relative_to(ROOT).as_posix(), "sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "shape": shape, "grip": grip, "coreDiameterMm": core, "maximumOuterDiameterMm": maximum, "headLengthMm": length})
    target = ROOT / "docs/research/crown-c3-2026-10-10"
    target.mkdir(parents=True, exist_ok=True)
    (target / "asset-manifest.json").write_text(json.dumps({"generator": "tools/blender/generate_crown_family.py", "generatorSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), "assets": manifest}, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
