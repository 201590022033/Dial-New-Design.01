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


def box(name, size, location, mat, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(location=location, scale=tuple(value / 2 for value in size))
    obj = bpy.context.object
    obj.name = name
    return finish(obj, mat, bevel)


def text_mesh(name, body, size, location, mat, extrude=0.025):
    """Create compact presentation typography and convert it for deterministic GLB export."""
    bpy.ops.object.text_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.body = body
    obj.data.align_x = "CENTER"
    obj.data.align_y = "CENTER"
    obj.data.size = size
    obj.data.extrude = extrude
    obj.data.bevel_depth = min(0.012, extrude / 3)
    obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    return obj


def triangle(name, radius, width, length, height, z, mat):
    vertices = [(-width / 2, radius - length / 2, z - height / 2),
                (width / 2, radius - length / 2, z - height / 2),
                (0, radius + length / 2, z - height / 2),
                (-width / 2, radius - length / 2, z + height / 2),
                (width / 2, radius - length / 2, z + height / 2),
                (0, radius + length / 2, z + height / 2)]
    faces = [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)]
    mesh = bpy.data.meshes.new(name + "_MESH")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj, mat, 0.04)


def rectangular_frame(name, outer_width, outer_height, depth, wall, location, plane, mat):
    """Create one watertight rectangular ring in XY or XZ for buckle/keeper hardware."""
    inner_width = outer_width - 2 * wall
    inner_height = outer_height - 2 * wall
    if inner_width <= 0 or inner_height <= 0:
        raise ValueError(f"Invalid rectangular frame dimensions for {name}")
    outer = [(-outer_width / 2, -outer_height / 2), (outer_width / 2, -outer_height / 2),
             (outer_width / 2, outer_height / 2), (-outer_width / 2, outer_height / 2)]
    inner = [(-inner_width / 2, -inner_height / 2), (inner_width / 2, -inner_height / 2),
             (inner_width / 2, inner_height / 2), (-inner_width / 2, inner_height / 2)]
    vertices = []
    for level in (-depth / 2, depth / 2):
        for a, b in outer + inner:
            vertices.append((a, b, level) if plane == "XY" else (a, level, b))
    faces = []
    for index in range(4):
        nxt = (index + 1) % 4
        faces.extend([(index, nxt, 8 + nxt, 8 + index),
                      (4 + nxt, 4 + index, 12 + index, 12 + nxt),
                      (index, 4 + index, 4 + nxt, nxt),
                      (8 + nxt, 12 + nxt, 12 + index, 8 + index)])
    mesh = bpy.data.meshes.new(name + "_MESH")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    return finish(obj, mat, min(0.18, wall * 0.28))


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
    dial_recess = material("date aperture recess", (0.003, 0.004, 0.006), 0.0, 0.48)
    dial_print = material("silver dial print", (0.72, 0.78, 0.83), 0.35, 0.24)
    date_card = material("warm white date card", (0.84, 0.82, 0.74), 0.0, 0.58)
    date_ink = material("date ink", (0.025, 0.03, 0.04), 0.0, 0.4)
    sapphire = material("sapphire", (0.58, 0.82, 1.0), 0.0, 0.06, 0.45, 0.16)
    rubber = material("black rubber strap", (0.012, 0.016, 0.021), 0.0, 0.54)
    rubber_detail = material("rubber strap relief", (0.028, 0.034, 0.043), 0.0, 0.46)
    built = []
    if asset == "dial":
        p = params["dial"]
        surface_z = p["thicknessMm"] / 2
        built.append(cylinder("DD_REF42_DIAL", p["outerDiameterMm"], p["thicknessMm"], dial_mat, segments, bevel=0.08))
        built.append(annulus("DD_REF42_DIAL_MINUTE_TRACK", p["outerDiameterMm"] - 0.8, p["outerDiameterMm"] - 1.15, 0.08, polished, segments, surface_z + 0.05))
        built.extend(add_radial_markers("DD_REF42_DIAL_MARKER", 12, 11.65, 0.62, 1.45, 0.18, surface_z + 0.12, lume, 3))
        # A restrained, generic dial signature keeps the preview brand-neutral.
        for index, width in enumerate((3.8, 2.8, 1.8)):
            built.append(box(f"DD_REF42_DIAL_LOGO_BAR_{index}", (width, 0.18, 0.08),
                             (0, 5.15 - index * 0.34, surface_z + 0.09), dial_print, 0.04))
        built.append(text_mesh("DD_REF42_DIAL_TEXT_AUTOMATIC", "AUTOMATIC", 0.82,
                               (0, -5.35, surface_z + 0.10), dial_print))
        built.append(text_mesh("DD_REF42_DIAL_TEXT_DEPTH", "200 m", 0.68,
                               (0, -6.35, surface_z + 0.10), lume))
        # NH35-style date presentation at three o'clock: frame, recess, card and numeral.
        date_x = 7.85
        built.append(box("DD_REF42_DATE_FRAME", (3.35, 2.65, 0.12),
                         (date_x, 0, surface_z + 0.08), polished, 0.12))
        built.append(box("DD_REF42_DATE_RECESS", (3.02, 2.32, 0.14),
                         (date_x, 0, surface_z + 0.15), dial_recess, 0.08))
        built.append(box("DD_REF42_DATE_CARD", (2.72, 2.02, 0.08),
                         (date_x, 0, surface_z + 0.23), date_card, 0.05))
        date_text = text_mesh("DD_REF42_DATE_NUMERAL", "21", 1.18,
                              (date_x, 0, surface_z + 0.30), date_ink, 0.018)
        built.append(date_text)
    elif asset == "chapter-ring":
        p = params["chapterRing"]
        built.append(annulus("DD_REF42_CHAPTER_RING", p["outerDiameterMm"], p["innerDiameterMm"], p["heightMm"], black, segments))
        built.extend(add_radial_markers("DD_REF42_CHAPTER_TICK", 60, (p["outerDiameterMm"] + p["innerDiameterMm"]) / 4, 0.10, 0.58, 0.08, p["heightMm"] / 2 + 0.04, lume))
    elif asset == "bezel":
        p = params["bezel"]
        built.append(annulus("DD_REF42_BEZEL_CARRIER", p["outerDiameterMm"], p["innerDiameterMm"], p["heightMm"], steel, segments))
        built.append(annulus("DD_REF42_BEZEL_INSERT", p["insertOuterDiameterMm"], p["insertInnerDiameterMm"], p["insertThicknessMm"], black, segments, p["heightMm"] / 2 + p["insertThicknessMm"] / 2))
        built.extend(add_radial_markers("DD_REF42_BEZEL_MARKER", 60, (p["insertOuterDiameterMm"] + p["insertInnerDiameterMm"]) / 4, 0.12, 1.25, 0.09, p["heightMm"] / 2 + p["insertThicknessMm"] + 0.05, lume))
        marker_z = p["heightMm"] / 2 + p["insertThicknessMm"] + 0.12
        pip_radius = (p["insertOuterDiameterMm"] + p["insertInnerDiameterMm"]) / 4
        built.append(triangle("DD_REF42_BEZEL_PIP_FRAME", pip_radius, 2.1, 2.35, 0.14, marker_z, polished))
        pip = cylinder("DD_REF42_BEZEL_PIP_LUME", 0.82, 0.16, lume, 48,
                       z=marker_z + 0.10, bevel=0.07)
        pip.location.y = pip_radius + 0.1
        built.append(pip)
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
        # Presentation hardware on the 12 o'clock tail: two rubber keepers and
        # a polished tang buckle. Dimensions are visual baselines, not fit data.
        strap_end_y = 23.0 + length
        for index, y in enumerate((strap_end_y - 5.4, strap_end_y - 2.9)):
            built.append(rectangular_frame(f"DD_REF42_STRAP_KEEPER_{index + 1}",
                                           p["taperEndWidthMm"] + 1.5, p["thicknessMm"] + 1.0,
                                           1.35, 0.42, (0, y, 0), "XZ", rubber_detail))
        buckle_y = strap_end_y + 5.0
        built.append(rectangular_frame("DD_REF42_BUCKLE_FRAME", p["taperEndWidthMm"] + 2.5,
                                       9.0, 2.2, 1.35, (0, buckle_y, 0.15), "XY", polished))
        bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.8, depth=p["taperEndWidthMm"] + 0.8,
                                            location=(0, strap_end_y + 0.9, 0.15), rotation=(0, math.pi / 2, 0))
        buckle_pin = bpy.context.object
        buckle_pin.name = "DD_REF42_BUCKLE_PIN"
        finish(buckle_pin, polished, 0.08)
        built.append(buckle_pin)
        tang = box("DD_REF42_BUCKLE_TANG", (1.1, 8.2, 0.55),
                   (0, buckle_y - 0.2, 1.1), polished, 0.16)
        tang.rotation_euler[2] = -0.035
        built.append(tang)
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
