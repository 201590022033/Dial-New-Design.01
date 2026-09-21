"""Generate separate visual GLBs for the NMK901 42 mm reference assembly."""
import argparse
import json
import math
import os
import sys

import bpy

QUALITY = {"preview": 64, "normal": 96, "high": 160}
ASSETS = ("dial", "chapter-ring", "bezel", "crystal", "caseback", "strap")


def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for blocks in (bpy.data.meshes, bpy.data.materials, bpy.data.curves):
        for block in list(blocks):
            blocks.remove(block)


def material(name, color, metallic=0.0, roughness=0.35, transmission=0.0, alpha=1.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, alpha)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, alpha)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Transmission Weight" in bsdf.inputs:
        bsdf.inputs["Transmission Weight"].default_value = transmission
    if "Alpha" in bsdf.inputs:
        bsdf.inputs["Alpha"].default_value = alpha
    return mat


def finish(obj, mat, bevel=0.0):
    obj.data.materials.append(mat)
    if bevel > 0:
        modifier = obj.modifiers.new("presentation edge bevel", "BEVEL")
        modifier.width = bevel
        modifier.segments = 4
    return obj


def cylinder(name, diameter, height, mat, segments, z=0.0, bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=segments, radius=diameter / 2, depth=height, location=(0, 0, z))
    obj = bpy.context.object
    obj.name = name
    return finish(obj, mat, bevel)


def annulus(name, outer_diameter, inner_diameter, height, mat, segments, z=0.0):
    outer = outer_diameter / 2
    inner = inner_diameter / 2
    if not 0 < inner < outer or height <= 0:
        raise ValueError(f"Invalid annulus dimensions for {name}")
    vertices = []
    faces = []
    for level in (-height / 2, height / 2):
        for radius in (outer, inner):
            vertices.extend((radius * math.cos(2 * math.pi * i / segments), radius * math.sin(2 * math.pi * i / segments), level + z) for i in range(segments))
    outer_bottom, inner_bottom, outer_top, inner_top = 0, segments, segments * 2, segments * 3
    for i in range(segments):
        nxt = (i + 1) % segments
        faces.extend([
            (outer_bottom + i, outer_bottom + nxt, outer_top + nxt, outer_top + i),
            (inner_bottom + nxt, inner_bottom + i, inner_top + i, inner_top + nxt),
            (outer_top + i, outer_top + nxt, inner_top + nxt, inner_top + i),
            (outer_bottom + nxt, outer_bottom + i, inner_bottom + i, inner_bottom + nxt)
        ])
    mesh = bpy.data.meshes.new(name + "_MESH")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj, mat, min(0.08, height / 8))


def add_radial_markers(prefix, count, radius, width, length, height, z, mat, major_every=5):
    markers = []
    for index in range(count):
        angle = 2 * math.pi * index / count
        major = major_every > 0 and index % major_every == 0
        marker_width = width * (1.75 if major else 1.0)
        marker_length = length * (1.35 if major else 1.0)
        marker_radius = radius - (marker_length - length) / 2
        bpy.ops.mesh.primitive_cube_add(location=(marker_radius * math.sin(angle), marker_radius * math.cos(angle), z),
                                        scale=(marker_width / 2, marker_length / 2, height / 2))
        marker = bpy.context.object
        marker.name = f"{prefix}_{index:02d}"
        marker.rotation_euler[2] = -angle
        finish(marker, mat, min(0.04, width / 4))
        markers.append(marker)
    return markers


def tapered_strap(name, near_width, far_width, length, height, sign, mat):
    near_y = sign * 23.0
    far_y = sign * (23.0 + length)
    z0, z1 = -height / 2, height / 2
    vertices = [
        (-near_width / 2, near_y, z0), (near_width / 2, near_y, z0),
        (-far_width / 2, far_y, z0), (far_width / 2, far_y, z0),
        (-near_width / 2, near_y, z1), (near_width / 2, near_y, z1),
        (-far_width / 2, far_y, z1), (far_width / 2, far_y, z1),
    ]
    faces = [(0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4),
             (2, 6, 7, 3), (0, 4, 6, 2), (1, 3, 7, 5)]
    mesh = bpy.data.meshes.new(name + "_MESH")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj, mat, min(1.15, height * 0.32))


def build(asset, params, quality):
    segments = QUALITY[quality]
    steel = material("316L brushed steel", (0.56, 0.62, 0.69), 0.9, 0.22)
    polished = material("316L polished steel", (0.72, 0.78, 0.86), 0.95, 0.11)
    black = material("black ceramic", (0.012, 0.018, 0.025), 0.18, 0.2)
    lume = material("reference lume", (0.68, 0.92, 0.62), 0.02, 0.32)
    dial_mat = material("navy dial", (0.012, 0.035, 0.075), 0.2, 0.3)
    sapphire = material("sapphire", (0.58, 0.82, 1.0), 0.0, 0.06, 0.45, 0.16)
    rubber = material("black rubber strap", (0.012, 0.016, 0.021), 0.0, 0.54)
    rubber_detail = material("rubber strap relief", (0.028, 0.034, 0.043), 0.0, 0.46)
    built = []
    if asset == "dial":
        p = params["dial"]
        built.append(cylinder("DD_REF42_DIAL", p["outerDiameterMm"], p["thicknessMm"], dial_mat, segments, bevel=0.08))
        built.append(annulus("DD_REF42_DIAL_MINUTE_TRACK", p["outerDiameterMm"] - 0.8, p["outerDiameterMm"] - 1.15, 0.08, polished, segments, p["thicknessMm"] / 2 + 0.05))
        built.extend(add_radial_markers("DD_REF42_DIAL_MARKER", 12, 11.65, 0.62, 1.45, 0.18, p["thicknessMm"] / 2 + 0.12, lume, 3))
    elif asset == "chapter-ring":
        p = params["chapterRing"]
        built.append(annulus("DD_REF42_CHAPTER_RING", p["outerDiameterMm"], p["innerDiameterMm"], p["heightMm"], black, segments))
        built.extend(add_radial_markers("DD_REF42_CHAPTER_TICK", 60, (p["outerDiameterMm"] + p["innerDiameterMm"]) / 4, 0.10, 0.58, 0.08, p["heightMm"] / 2 + 0.04, lume))
    elif asset == "bezel":
        p = params["bezel"]
        built.append(annulus("DD_REF42_BEZEL_CARRIER", p["outerDiameterMm"], p["innerDiameterMm"], p["heightMm"], steel, segments))
        built.append(annulus("DD_REF42_BEZEL_INSERT", p["insertOuterDiameterMm"], p["insertInnerDiameterMm"], p["insertThicknessMm"], black, segments, p["heightMm"] / 2 + p["insertThicknessMm"] / 2))
        built.extend(add_radial_markers("DD_REF42_BEZEL_MARKER", 60, (p["insertOuterDiameterMm"] + p["insertInnerDiameterMm"]) / 4, 0.12, 1.25, 0.09, p["heightMm"] / 2 + p["insertThicknessMm"] + 0.05, lume))
    elif asset == "crystal":
        p = params["crystal"]
        crystal = cylinder("DD_REF42_CRYSTAL", p["outerDiameterMm"], p["thicknessMm"], sapphire, segments, bevel=p["edgeBevelMm"])
        crystal.active_material.surface_render_method = "DITHERED"
        built.append(crystal)
    elif asset == "caseback":
        p = params["caseback"]
        built.append(cylinder("DD_REF42_CASEBACK", p["outerDiameterMm"], p["heightMm"], steel, segments, bevel=0.28))
        built.append(annulus("DD_REF42_CASEBACK_GRIP", p["outerDiameterMm"] - 0.8, p["outerDiameterMm"] - 2.0, 0.22, polished, segments, -p["heightMm"] / 2 - 0.08))
    elif asset == "strap":
        p = params["strap"]
        length = p["previewLengthPerSideMm"]
        for sign, label in ((1, "12"), (-1, "6")):
            strap = tapered_strap(f"DD_REF42_STRAP_{label}", p["lugWidthMm"], p["taperEndWidthMm"], length, p["thicknessMm"], sign, rubber)
            built.append(strap)
            for side in (-1, 1):
                y = sign * (23.0 + length / 2)
                bpy.ops.mesh.primitive_cube_add(location=(side * p["lugWidthMm"] * 0.28, y, p["thicknessMm"] / 2 + 0.10),
                                                scale=(0.32, length * 0.40, 0.10))
                rail = bpy.context.object
                rail.name = f"DD_REF42_STRAP_RAIL_{label}_{'L' if side < 0 else 'R'}"
                finish(rail, rubber_detail, 0.18)
                built.append(rail)
    for obj in built:
        obj["DD_PROVENANCE_STATUS"] = params["provenance"]["status"]
        obj["DD_PROVENANCE_SOURCE"] = params["provenance"]["source"]
    return built


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--params", required=True)
    parser.add_argument("--asset", choices=ASSETS, required=True)
    parser.add_argument("--quality", choices=tuple(QUALITY), default="normal")
    parser.add_argument("--output", required=True)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    with open(args.params, encoding="utf-8") as source:
        params = json.load(source)
    clear()
    objects = build(args.asset, params, args.quality)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    output = os.path.abspath(args.output)
    os.makedirs(os.path.dirname(output), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=output, export_format="GLB", use_selection=True, export_yup=True, export_extras=True)


if __name__ == "__main__":
    main()
