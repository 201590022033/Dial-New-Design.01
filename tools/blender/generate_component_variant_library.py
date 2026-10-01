"""Generate the independent Dial Designer component-variant GLB library.

The output is deterministic presentation geometry in millimetres.  Supplier case
assets honour recorded headline/drawing envelopes but remain provisional until
their full interface drawings have been transcribed and independently checked.

Run with Blender:
  blender --background --factory-startup --python tools/blender/generate_component_variant_library.py -- --output public/assets/3d/variants
"""
import argparse
import json
import math
import os
import sys

import bpy


HAND_STYLES = ("baton", "mercedes", "sword", "dauphine", "syringe", "cathedral", "pencil", "broad-arrow", "skeleton")
BEZEL_STYLES = ("dive-coin-edge", "dive-scalloped", "pilot-smooth", "dress-fluted", "tachymeter-fixed", "gmt", "slide-rule")
DIAL_STYLES = ("sterile", "diver", "pilot-a", "pilot-b", "field", "dress-sector", "gmt", "chronograph")
CASE_SPECS = {
    "nh05-ladies-dress-34": dict(diameter=34.0, thickness=10.5, lug_width=16.0, lug_to_lug=40.0, shape="dress"),
    "tandorio-pilot-40": dict(diameter=40.2, thickness=12.3, lug_width=20.0, lug_to_lug=48.0, shape="pilot"),
    "namoki-nmk920-tuna-47": dict(diameter=47.0, thickness=11.3, lug_width=22.0, lug_to_lug=46.5, shape="tuna"),
    "feiyashi-samurai-438": dict(diameter=43.8, thickness=13.65, lug_width=22.0, lug_to_lug=49.0, shape="samurai"),
    "tandorio-bronze-diver-44": dict(diameter=44.0, thickness=14.0, lug_width=22.0, lug_to_lug=50.0, shape="turtle"),
    "wr-skx-sandblasted-42": dict(diameter=42.0, thickness=11.0, lug_width=22.0, lug_to_lug=46.0, shape="skx"),
    "tandorio-willard-41": dict(diameter=41.0, thickness=12.7, lug_width=19.0, lug_to_lug=48.0, shape="willard"),
}


def args_after_dash():
    return sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for blocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
        for block in list(blocks):
            blocks.remove(block)


def material(name, color, metallic=0.0, roughness=0.35):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    return mat


def finish(obj, mat, bevel=0.0):
    obj.data.materials.append(mat)
    if bevel:
        modifier = obj.modifiers.new("presentation edge bevel", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
    return obj


def cylinder(name, diameter, height, z, mat, vertices=96, bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=diameter / 2, depth=height, location=(0, 0, z))
    obj = bpy.context.object
    obj.name = name
    return finish(obj, mat, bevel)


def box(name, dimensions, location, mat, bevel=0.0, rotation=0.0):
    bpy.ops.mesh.primitive_cube_add(location=location, scale=tuple(value / 2 for value in dimensions))
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler.z = rotation
    return finish(obj, mat, bevel)


def annulus(name, outer_diameter, inner_diameter, height, z, mat, segments=128):
    outer, inner = outer_diameter / 2, inner_diameter / 2
    vertices, faces = [], []
    for level in (z - height / 2, z + height / 2):
        for radius in (outer, inner):
            vertices.extend((radius * math.cos(2 * math.pi * i / segments), radius * math.sin(2 * math.pi * i / segments), level) for i in range(segments))
    ob, ib, ot, it = 0, segments, segments * 2, segments * 3
    for index in range(segments):
        nxt = (index + 1) % segments
        faces.extend(((ob + index, ob + nxt, ot + nxt, ot + index), (ib + nxt, ib + index, it + index, it + nxt),
                      (ot + index, ot + nxt, it + nxt, it + index), (ob + nxt, ob + index, ib + index, ib + nxt)))
    mesh = bpy.data.meshes.new(name + "_MESH")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj, mat, min(0.06, height / 8))


def prism(name, points, height, z, mat, bevel=0.0):
    count = len(points)
    vertices = [(x, y, z - height / 2) for x, y in points] + [(x, y, z + height / 2) for x, y in points]
    faces = [tuple(range(count - 1, -1, -1)), tuple(range(count, count * 2))]
    for index in range(count):
        nxt = (index + 1) % count
        faces.append((index, nxt, count + nxt, count + index))
    mesh = bpy.data.meshes.new(name + "_MESH")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj, mat, bevel)


def radial_markers(prefix, count, radius, width, length, z, mat, major_every=0):
    objects = []
    for index in range(count):
        angle = 2 * math.pi * index / count
        major = major_every and index % major_every == 0
        marker_length = length * (1.45 if major else 1.0)
        marker_width = width * (1.5 if major else 1.0)
        obj = box(f"{prefix}_{index:02d}", (marker_width, marker_length, .10),
                  (radius * math.sin(angle), radius * math.cos(angle), z), mat, .025, -angle)
        objects.append(obj)
    return objects


def hand_outline(style, length, width):
    tail = length * .13
    if style == "pencil":
        return [(-width * .32, -tail), (width * .32, -tail), (width * .28, length * .9), (0, length), (-width * .28, length * .9)]
    if style == "sword":
        return [(-width * .25, -tail), (width * .25, -tail), (width * .48, length * .55), (0, length), (-width * .48, length * .55)]
    if style == "dauphine":
        return [(0, -tail), (width * .55, length * .32), (0, length), (-width * .55, length * .32)]
    if style == "syringe":
        return [(-width * .45, -tail), (width * .45, -tail), (width * .38, length * .62), (width * .10, length * .62), (0, length), (-width * .10, length * .62), (-width * .38, length * .62)]
    if style == "cathedral":
        return [(-width * .40, -tail), (width * .40, -tail), (width * .52, length * .28), (width * .28, length * .68), (0, length), (-width * .28, length * .68), (-width * .52, length * .28)]
    if style == "broad-arrow":
        return [(-width * .25, -tail), (width * .25, -tail), (width * .24, length * .52), (width * .72, length * .52), (0, length), (-width * .72, length * .52), (-width * .24, length * .52)]
    if style == "mercedes":
        return [(-width * .30, -tail), (width * .30, -tail), (width * .32, length * .42), (width * .65, length * .58), (width * .38, length * .76), (0, length), (-width * .38, length * .76), (-width * .65, length * .58), (-width * .32, length * .42)]
    return [(-width / 2, -tail), (width / 2, -tail), (width * .42, length * .9), (0, length), (-width * .42, length * .9)]


def build_hands(style, compact=False):
    steel = material("DD_HAND_STEEL", (.74, .79, .86), .92, .13)
    lume = material("DD_HAND_LUME", (.66, .95, .67), .04, .28)
    scale = .72 if compact else 1.0
    for index, (role, length, width, angle) in enumerate((("HOUR", 9.0, 1.35, -32), ("MINUTE", 12.7, .88, 48), ("SECONDS", 13.8, .20, 137))):
        width *= scale
        obj = prism(f"DD_HAND_{role}", hand_outline(style, length * scale, width), .15 if index < 2 else .10, index * .20, steel, .035)
        obj.rotation_euler.z = math.radians(angle)
        obj["DD_HAND_STYLE"] = style
        obj["DD_ROLE"] = role.lower()
        if index < 2 and style not in ("dauphine", "skeleton"):
            hand_angle = math.radians(angle)
            inlay_radius = length * scale * .46
            inlay = box(f"DD_HAND_{role}_LUME", (width * .28, length * scale * .48, .045),
                        (-inlay_radius * math.sin(hand_angle), inlay_radius * math.cos(hand_angle), index * .20 + .10),
                        lume, .02, hand_angle)
    cylinder("DD_HAND_HUB", 1.35 * scale, .52, .35, steel, 64, .08)


def add_edge_teeth(style, outer_diameter, height, steel):
    if style == "pilot-smooth":
        return
    count = 48 if style == "dive-scalloped" else 72 if style in ("dive-coin-edge", "dress-fluted") else 96
    for index in range(count):
        angle = 2 * math.pi * index / count
        radius = outer_diameter / 2 + (.05 if style == "dive-scalloped" else .10)
        tangential = .34 if style == "dive-scalloped" else .18
        radial = .72 if style == "dive-scalloped" else .42
        box(f"DD_BEZEL_EDGE_{index:03d}", (tangential, radial, height * .72),
            (radius * math.sin(angle), radius * math.cos(angle), 0), steel, .035, -angle)


def build_bezel(style):
    steel = material("DD_BEZEL_STEEL", (.60, .66, .74), .94, .16)
    dark = material("DD_BEZEL_INSERT", (.012, .025, .045), .16, .24)
    accent = material("DD_BEZEL_MARKINGS", (.83, .88, .86), .08, .30)
    outer = 41.0
    annulus("DD_BEZEL_CARRIER", outer, 31.5, 2.8, 0, steel)
    add_edge_teeth(style, outer, 2.8, steel)
    if style != "dress-fluted" and style != "pilot-smooth":
        annulus("DD_BEZEL_INSERT", 39.2, 32.5, .28, 1.54, dark)
    if style in ("dive-coin-edge", "dive-scalloped", "gmt", "tachymeter-fixed", "slide-rule"):
        count = 24 if style == "gmt" else 12 if style == "tachymeter-fixed" else 60
        radial_markers("DD_BEZEL_SCALE", count, 17.8, .10, .64, 1.74, accent, 5 if count == 60 else 3)
    if style == "slide-rule":
        radial_markers("DD_BEZEL_INNER_SCALE", 60, 16.2, .055, .32, 1.76, accent, 5)


def dial_palette(style):
    if style in ("diver", "gmt"): return ((.012, .035, .075), (.68, .95, .72))
    if style.startswith("pilot"): return ((.01, .012, .016), (.95, .88, .63))
    if style == "field": return ((.035, .075, .045), (.82, .86, .69))
    if style == "dress-sector": return ((.76, .71, .60), (.16, .14, .12))
    if style == "chronograph": return ((.75, .74, .69), (.10, .11, .13))
    return ((.10, .16, .28), (.82, .86, .91))


def build_dial(style, diameter=28.5):
    face_color, ink_color = dial_palette(style)
    face = material("DD_DIAL_FACE", face_color, .25 if style in ("sterile", "dress-sector") else .10, .31)
    ink = material("DD_DIAL_MARKINGS", ink_color, .18, .25)
    recess = material("DD_DIAL_RECESS", tuple(v * .45 for v in face_color), .08, .42)
    cylinder("DD_DIAL_SUBSTRATE", diameter, .42, 0, face, 160, .06)
    radius = diameter / 2
    if style == "sterile":
        return
    if style == "chronograph":
        radial_markers("DD_DIAL_MINUTE", 60, radius - .65, .06, .34, .27, ink, 5)
        for index, (x, y) in enumerate(((-diameter * .26, 0), (diameter * .26, 0), (0, -diameter * .26))):
            register = cylinder(f"DD_DIAL_REGISTER_{index}", diameter * .25, .06, .24, recess, 64, .03)
            register.location.x, register.location.y = x, y
        return
    count = 12
    marker_radius = radius - (1.6 if style == "diver" else 1.2)
    width = .72 if style == "diver" else .25
    length = 1.28 if style in ("diver", "dress-sector") else .72
    radial_markers("DD_DIAL_INDEX", count, marker_radius, width, length, .28, ink)
    radial_markers("DD_DIAL_MINUTE", 60, radius - .42, .055, .26, .27, ink, 5)
    if style in ("pilot-a", "pilot-b"):
        cylinder("DD_DIAL_PILOT_ORIENTATION", 1.15, .11, .31, ink, 3)
        bpy.context.object.location.y = radius - 2.0
    if style == "gmt":
        radial_markers("DD_DIAL_GMT_TRACK", 24, radius - 2.6, .10, .58, .29, ink, 3)
    if style == "dress-sector":
        annulus("DD_DIAL_SECTOR_RING", diameter - 4.2, diameter - 4.55, .07, .28, ink)


def lug_pair(lug_width, lug_to_lug, body_diameter, height, steel, style):
    gap = lug_width
    lug_each = max(2.2, (body_diameter - gap) / 5.2)
    # Seat each lug just inside the midcase and terminate exactly at the
    # recorded lug-to-lug envelope.  This prevents a visual-only lug block
    # from silently making a supplier case longer than its source drawing.
    inner_y = body_diameter / 2 - 1.4
    outer_y = lug_to_lug / 2
    length = max(1.0, outer_y - inner_y)
    y = (inner_y + outer_y) / 2
    flare = 1.25 if style in ("samurai", "willard") else 1.0
    for end in (-1, 1):
        for side in (-1, 1):
            x = side * (gap / 2 + lug_each / 2)
            box(f"DD_CASE_LUG_{end}_{side}", (lug_each * flare, length, height * .58), (x, end * y, -.15), steel, .45)


def build_case(case_id, spec):
    bronze = spec["shape"] == "turtle"
    steel = material("DD_CASE_BODY", (.42, .19, .055) if bronze else (.60, .66, .73), .92, .22 if spec["shape"] == "skx" else .14)
    dark = material("DD_CASE_CAVITY", (.012, .016, .022), .10, .45)
    diameter, thickness = spec["diameter"], spec["thickness"]
    inner = min(diameter - 6.0, 34.5 if diameter > 40 else diameter - 7.0)
    annulus("DD_CASE_MIDCASE", diameter, inner, thickness * .62, 0, steel, 160)
    cylinder("DD_CASE_FLOOR", inner + 1.4, thickness * .12, -thickness * .29, dark, 128, .18)
    lug_pair(spec["lug_width"], spec["lug_to_lug"], diameter, thickness, steel, spec["shape"])
    if spec["shape"] == "tuna":
        annulus("DD_CASE_TUNA_SHROUD", diameter, diameter - 4.2, thickness * .48, -.15, steel, 12)
    elif spec["shape"] == "turtle":
        annulus("DD_CASE_TURTLE_SHOULDER", diameter, diameter - 3.0, thickness * .28, -.2, steel, 96)
    elif spec["shape"] in ("samurai", "willard"):
        annulus("DD_CASE_FACETED_SHOULDER", diameter, diameter - 2.6, thickness * .24, .1, steel, 12 if spec["shape"] == "samurai" else 64)
    crown_x = diameter / 2 + 1.4
    crown = cylinder("DD_CASE_CROWN_PREVIEW", 5.8 if diameter > 36 else 4.2, 3.2, crown_x, steel, 48, .12)
    crown.rotation_euler.y = math.pi / 2
    crown.location = (crown_x, 0, 0)
    for key, value in spec.items():
        if isinstance(value, (int, float, str)):
            crown[f"DD_{key.upper()}"] = value
    crown["DD_SOURCE_STATUS"] = "provisional-from-recorded-dimensions"


def export_asset(output_path, asset_id, category):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    objects = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    for obj in objects:
        obj["DD_ASSET_ID"] = asset_id
        obj["DD_CATEGORY"] = category
        obj["DD_UNITS"] = "millimetres"
        obj["DD_PROVENANCE_STATUS"] = "provisional-presentation"
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=output_path, export_format="GLB", use_selection=True, export_yup=True, export_extras=True)
    relative_path = os.path.relpath(output_path, os.getcwd()).replace("\\", "/")
    return {"assetId": asset_id, "category": category, "path": relative_path, "meshCount": len(objects)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True)
    parsed = parser.parse_args(args_after_dash())
    root = os.path.abspath(parsed.output)
    manifest = []
    for style in HAND_STYLES:
        clear_scene(); build_hands(style)
        manifest.append(export_asset(os.path.join(root, "hands", f"hands-{style}-42.glb"), f"hands-{style}-42", "hands"))
    clear_scene(); build_hands("baton", compact=True)
    manifest.append(export_asset(os.path.join(root, "hands", "hands-baton-nh05-34.glb"), "hands-baton-nh05-34", "hands"))
    for style in BEZEL_STYLES:
        clear_scene(); build_bezel(style)
        manifest.append(export_asset(os.path.join(root, "bezels", f"bezel-{style}-42.glb"), f"bezel-{style}-42", "bezel"))
    for style in DIAL_STYLES:
        clear_scene(); build_dial(style)
        manifest.append(export_asset(os.path.join(root, "dials", f"dial-{style}-285.glb"), f"dial-{style}-285", "dial"))
    for style in ("mother-of-pearl", "champagne-sunburst", "silver-roman", "black-sunburst"):
        clear_scene(); build_dial("dress-sector" if style == "silver-roman" else "sterile", 24.5)
        manifest.append(export_asset(os.path.join(root, "dials", f"dial-nh05-{style}-245.glb"), f"dial-nh05-{style}-245", "dial"))
    for case_id, spec in CASE_SPECS.items():
        clear_scene(); build_case(case_id, spec)
        manifest.append(export_asset(os.path.join(root, "cases", f"case-{case_id}.glb"), f"case-{case_id}", "case"))
    os.makedirs(root, exist_ok=True)
    with open(os.path.join(root, "manifest.json"), "w", encoding="utf-8") as handle:
        json.dump({"schema": "dial-designer/component-variants/v1", "assets": manifest}, handle, indent=2)
    print(json.dumps({"generated": len(manifest), "output": root}))


if __name__ == "__main__":
    main()
