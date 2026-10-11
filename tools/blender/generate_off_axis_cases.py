"""C7 provisional case envelopes; shared JSON is the sole presentation axis source.

No embedded operating head. Hidden interfaces, cutout, tube and body are explicitly
approximate; source GLBs from C0/C3 are retained for legacy documents.
"""
import argparse
import json
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(__file__))
from generate_component_variant_library import annulus, cylinder, material, lug_pair, export_asset


def shroud_with_cutout(layout, steel):
    outer = layout["shroudMm"] / 2
    inner = outer - 1.8
    theta = -math.radians(layout["clockwiseDeg"])
    half = math.radians(layout["cutoutHalfAngleDeg"])
    height = layout["heightMm"]
    vertices, faces = [], []
    count = 192
    for step in range(count + 1):
        angle = theta + half + (math.tau - 2 * half) * step / count
        for radius, z in ((inner, -height / 2), (outer, -height / 2), (outer, height / 2), (inner, height / 2)):
            vertices.append((radius * math.cos(angle), radius * math.sin(angle), z))
    faces.extend(((0, 3, 2, 1), (count * 4, count * 4 + 1, count * 4 + 2, count * 4 + 3)))
    for step in range(count):
        for edge in range(4):
            a, b = step * 4 + edge, step * 4 + (edge + 1) % 4
            faces.append((a, b, b + 4, a + 4))
    mesh = bpy.data.meshes.new("DD_CASE_SHROUD_MESH")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("DD_CASE_TUNA_SHROUD_WITH_CROWN_CUTOUT", mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(steel)
    return obj


def build(layout, output):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    steel = material("DD_CASE_BODY", (.60, .66, .73), .9, .3)
    dark = material("DD_CASE_CAVITY", (.012, .016, .022), .1, .45)
    theta = -math.radians(layout["clockwiseDeg"])
    radius = layout["interfaceRadiusMm"]
    body_radius = layout["bodyMm"] / 2
    height = layout["heightMm"]
    body = annulus("DD_CASE_MIDCASE", layout["bodyMm"], layout["openingMm"], height * .8, 0, steel, 192)
    # Radial bore is visual geometry, not an inferred physical tube thread.
    bore = cylinder("PRESENTATION_BORE_CUTTER", 2.2, radius + 2, 0, dark, 64)
    bore.rotation_euler = (0, math.pi / 2, theta)
    bore.location = ((radius / 2) * math.cos(theta), (radius / 2) * math.sin(theta), 0)
    modifier = body.modifiers.new("Provisional axis opening", "BOOLEAN")
    modifier.operation, modifier.object = "DIFFERENCE", bore
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.data.objects.remove(bore, do_unlink=True)
    shroud_with_cutout(layout, steel)
    cylinder("DD_CASE_FLOOR", layout["openingMm"], height * .08, -height * .35, dark, 128)
    lug_pair(layout["lugWidthMm"], layout["renderLugToLugMm"], layout["bodyMm"], height, steel, "tuna")
    tube_length = radius - (body_radius - .8)
    tube = cylinder("DD_CASE_CROWN_TUBE_PRESENTATION", 1.8, tube_length, 0, steel, 64)
    tube.rotation_euler = (0, math.pi / 2, theta)
    tube_radius = radius - tube_length / 2
    tube.location = (tube_radius * math.cos(theta), tube_radius * math.sin(theta), 0)
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            obj["DD_CANONICAL_AXIS_ID"] = "crown-main"
            obj["DD_CLOCKWISE_FROM_3H_DEG"] = layout["clockwiseDeg"]
            obj["DD_INTERFACE_RADIUS_MM"] = radius
            obj["DD_STEM_HEIGHT_MM"] = 0
            obj["DD_PHYSICAL_FIT"] = "unqualified"
            obj["DD_PRESENTATION_ASSUMPTIONS"] = layout["notes"]
    return export_asset(os.path.join(output, layout["assetId"] + ".glb"), layout["assetId"], "case")


def main():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="public/assets/3d/variants/cases")
    opts = parser.parse_args(args)
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    with open(os.path.join(root, "src/domain/crown/offAxisLayouts.json"), encoding="utf-8") as file:
        layouts = json.load(file)
    print(json.dumps([build(layout, opts.output) for layout in layouts], indent=2))


if __name__ == "__main__":
    main()
