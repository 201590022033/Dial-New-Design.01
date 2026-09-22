"""Generate presentation-only 42 mm archetype component GLBs.

These meshes preserve the NMK901 envelope but do not claim machining fit.
Run with Blender: --background --factory-startup --python this_file -- --output DIR
"""
import argparse
import json
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import reference_42_supplemental as ref

STYLES = ("diver", "pilot", "field", "dress", "chronograph")
COLORS = {
    "diver": ((.008, .03, .07), (.68, .92, .62), (.01, .015, .022)),
    "pilot": ((.012, .014, .018), (.92, .78, .36), (.20, .09, .035)),
    "field": ((.035, .075, .045), (.76, .82, .62), (.16, .17, .08)),
    "dress": ((.76, .72, .62), (.20, .18, .15), (.16, .07, .035)),
    "chronograph": ((.78, .76, .69), (.72, .43, .08), (.035, .04, .05)),
}


def export(objects, path):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
        obj["DD_PROVENANCE_STATUS"] = "provisional-presentation"
        obj["DD_PROVENANCE_SOURCE"] = "Archetype visual library; NMK901 envelope; no fit claim"
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True,
                              export_yup=True, export_extras=True)


def dial(style):
    base, accent, dark = COLORS[style]
    face = ref.material("archetype dial surface", base, .12 if style != "dress" else .45, .3)
    ink = ref.material("archetype dial accent", accent, .15, .24)
    recess = ref.material("chronograph register", dark, .12, .34)
    steel = ref.material("applied polished marker", (.70, .75, .82), .92, .13)
    objects = [ref.cylinder("DD_ARCH_DIAL_FACE", 28.5, .4, face, 160, bevel=.07)]
    if style in ("pilot", "field"):
        count = 12
        for hour in range(1, count + 1):
            angle = hour * 30
            radius = 10.7 if style == "pilot" else 11.1
            a = math.radians(angle)
            objects.append(ref.text_mesh(f"DD_ARCH_NUMERAL_{hour:02d}", str(hour),
                          1.65 if style == "pilot" else 1.05,
                          (radius * math.sin(a), radius * math.cos(a), .28), ink, .018))
        objects.extend(ref.add_radial_markers("DD_ARCH_MINUTE", 60, 13.25, .08, .36, .07, .26, ink))
        objects.append(ref.triangle("DD_ARCH_ORIENTATION", 12.0, 1.5, 1.65, .12, .30, ink))
    elif style == "dress":
        objects.extend(ref.add_radial_markers("DD_ARCH_DRESS_INDEX", 12, 11.9, .18, 1.25, .11, .28, steel, 0))
        objects.append(ref.text_mesh("DD_ARCH_DRESS_SIGNATURE", "AUTOMATIC", .65, (0, -5.2, .27), ink, .012))
    elif style == "chronograph":
        objects.extend(ref.add_radial_markers("DD_ARCH_CHRONO_INDEX", 12, 12.1, .28, 1.15, .11, .28, steel, 3))
        # TMI VK63A dial drawing: all three register centres are 7.50 mm from centre.
        for index, (x, y) in enumerate(((-7.5, 0), (7.5, 0), (0, -7.5))):
            sub = ref.annulus(f"DD_ARCH_REGISTER_{index}", 6.2, .8, .12, recess, 96, .28)
            sub.location.x, sub.location.y = x, y
            objects.append(sub)
            for tick in range(12):
                a = math.radians(tick * 30)
                marker = ref.box(f"DD_ARCH_REGISTER_TICK_{index}_{tick}", (.08, .42, .06),
                                 (x + 2.25 * math.sin(a), y + 2.25 * math.cos(a), .38), ink)
                marker.rotation_euler.z = -a
                objects.append(marker)
        objects.append(ref.text_mesh("DD_ARCH_CHRONO_SIGNATURE", "CHRONOGRAPH", .58, (0, 5.0, .28), ink, .012))
    else:
        objects.extend(ref.add_radial_markers("DD_ARCH_DIVE_INDEX", 12, 11.6, .72, 1.55, .18, .30, ink, 3))
        objects.extend(ref.add_radial_markers("DD_ARCH_DIVE_MINUTE", 60, 13.3, .08, .35, .06, .27, ink))
        objects.append(ref.triangle("DD_ARCH_DIVE_ORIENTATION", 11.8, 1.8, 1.9, .16, .34, ink))
    return objects


def bezel(style):
    _, accent, dark = COLORS[style]
    steel = ref.material("archetype bezel steel", (.58, .64, .72), .94, .14)
    insert = ref.material("archetype bezel insert", dark, .25, .22)
    ink = ref.material("archetype bezel marking", accent, .08, .28)
    height = .62 if style in ("dress", "field") else 1.0
    inner_diameter = 32.0 if style in ("diver", "chronograph") else 37.8 if style == "pilot" else 38.2
    objects = [ref.annulus("DD_ARCH_BEZEL_CARRIER", 41, inner_diameter, height, steel, 160)]
    if style in ("diver", "chronograph"):
        objects.append(ref.annulus("DD_ARCH_BEZEL_INSERT", 39.2, 32.6, .28, insert, 160, height / 2 + .12))
        objects.extend(ref.add_radial_markers("DD_ARCH_BEZEL_SCALE", 60 if style == "diver" else 12,
                       17.8, .10, .75, .07, height / 2 + .31, ink, 5 if style == "diver" else 3))
        if style == "diver":
            objects.append(ref.triangle("DD_ARCH_BEZEL_ZERO", 17.7, 1.5, 1.7, .1, height / 2 + .34, ink))
        else:
            for text, angle in (("60", 0), ("120", 90), ("240", 180), ("400", 270)):
                a = math.radians(angle)
                objects.append(ref.text_mesh("DD_ARCH_TACHY_" + text, text, .55,
                               (17.0 * math.sin(a), 17.0 * math.cos(a), height / 2 + .35), ink, .01))
    elif style == "pilot":
        for index in range(72):
            a = math.radians(index * 5)
            flute = ref.box(f"DD_ARCH_COIN_EDGE_{index}", (.20, .58, .48),
                            (20.25 * math.sin(a), 20.25 * math.cos(a), .1), steel, .05)
            flute.rotation_euler.z = -a
            objects.append(flute)
    return objects


def hands(style, subdial_style="needle"):
    _, accent, _ = COLORS[style]
    metal = ref.material("archetype hand metal", (.68, .73, .80), .96, .1)
    lume = ref.material("archetype hand lume", accent, .04, .28)
    objects = []
    widths = {"diver": (1.55, 1.05), "pilot": (1.05, .72), "field": (.85, .58),
              "dress": (.48, .28), "chronograph": (.62, .34)}[style]
    for index, (length, width, angle) in enumerate(((8.6, widths[0], -35), (12.0, widths[1], 52), (13.0, .18, 138))):
        a = math.radians(angle)
        x, y = length * .42 * math.sin(a), length * .42 * math.cos(a)
        hand = ref.box(f"DD_ARCH_HAND_{index}", (width, length, .16), (x, y, .28 + index * .18), metal, .12)
        hand.rotation_euler.z = -a
        objects.append(hand)
        if index < 2 and style != "dress":
            inlay = ref.box(f"DD_ARCH_HAND_LUME_{index}", (width * .38, length * .66, .05),
                            (x, y, .39 + index * .18), lume, .05)
            inlay.rotation_euler.z = -a
            objects.append(inlay)
    objects.append(ref.cylinder("DD_ARCH_HAND_HUB", 1.45, .5, metal, 64, z=.55, bevel=.12))
    if style == "chronograph":
        # VK63 roles: 9h minute counter, 6h small seconds, 3h 24-hour.
        # Register centres and post bores are published by TMI; hand silhouettes remain presentation geometry.
        register_ink = ref.material("VK63 register hand", (.72, .12, .06), .72, .16)
        style_width = {"needle": .14, "baton": .30, "syringe": .22}[subdial_style]
        bores = (.37, .295, .32)
        for index, (x, y, angle) in enumerate(((-7.5, 0, 18), (0, -7.5, 128), (7.5, 0, -42))):
            length = 2.45
            a = math.radians(angle)
            hand = ref.box(f"DD_ARCH_VK63_{subdial_style.upper()}_{index}",
                           (style_width, length, .12),
                           (x + length * .42 * math.sin(a), y + length * .42 * math.cos(a), .82),
                           register_ink, .06)
            hand.rotation_euler.z = -a
            hand["DD_MOVEMENT"] = "VK63"
            hand["DD_REGISTER_HAND_STYLE"] = subdial_style
            hand["DD_REGISTER_CENTER_STATUS"] = "PUBLISHED"
            hand["DD_HAND_BORE_MM"] = bores[index]
            hand["DD_HAND_SHAPE_STATUS"] = "ESTIMATED_NOMINAL"
            objects.append(hand)
            hub = ref.cylinder(f"DD_ARCH_VK63_HUB_{index}", .28, .16, metal, 32, z=.84, bevel=.04)
            hub.location.x, hub.location.y = x, y
            objects.append(hub)
    return objects


def strap(style):
    colors = {"rubber": ((.01, .014, .02), .56), "leather": ((.19, .075, .03), .42),
              "canvas": ((.13, .15, .065), .68), "racing": ((.025, .03, .038), .46)}
    color, rough = colors[style]
    body = ref.material(style + " strap", color, 0, rough)
    detail = ref.material(style + " strap detail", tuple(min(1, c + .09) for c in color), 0, rough)
    objects = []
    for sign, label in ((1, "12"), (-1, "6")):
        objects.append(ref.tapered_strap(f"DD_ARCH_STRAP_{label}", 22, 18, 58, 3.0, sign, body))
        for side in (-1, 1):
            x = side * 8.4
            objects.append(ref.box(f"DD_ARCH_STRAP_EDGE_{label}_{side}", (.24, 52, .10),
                           (x, sign * 52, 1.56), detail, .08))
        if style == "racing":
            for row in range(5):
                y = sign * (31 + row * 8)
                for x in (-5.0, 0, 5.0):
                    objects.append(ref.cylinder(f"DD_ARCH_RACING_HOLE_{label}_{row}_{x}", 2.6, .12,
                                   detail, 48, z=1.6, bevel=.05))
                    objects[-1].location.x, objects[-1].location.y = x, y
    return objects


def pushers():
    steel = ref.material("chronograph pusher steel", (.7, .76, .84), .96, .1)
    objects = []
    for index, angle in enumerate((35, -35)):
        a = math.radians(angle)
        radius = 23.6
        bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=1.55, depth=3.8,
            location=(radius * math.cos(a), radius * math.sin(a), 0), rotation=(0, math.pi / 2, a))
        obj = bpy.context.object
        obj.name = f"DD_ARCH_CHRONO_PUSHER_{index}"
        ref.finish(obj, steel, .18)
        objects.append(obj)
    return objects


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    output = os.path.abspath(args.output)
    os.makedirs(output, exist_ok=True)
    assets = []
    for style in STYLES:
        for kind, builder in (("dial", dial), ("bezel", bezel), ("hands", hands)):
            ref.clear()
            name = f"{kind}-{style}.glb"
            export(builder(style), os.path.join(output, name))
            assets.append(name)
    for subdial_style in ("needle", "baton", "syringe"):
        ref.clear()
        name = f"hands-chronograph-{subdial_style}.glb"
        export(hands("chronograph", subdial_style), os.path.join(output, name))
        assets.append(name)
    for style in ("rubber", "leather", "canvas", "racing"):
        ref.clear()
        name = f"strap-{style}.glb"
        export(strap(style), os.path.join(output, name))
        assets.append(name)
    ref.clear()
    export(pushers(), os.path.join(output, "pushers-chronograph.glb"))
    assets.append("pushers-chronograph.glb")
    with open(os.path.join(output, "manifest.json"), "w", encoding="utf-8") as target:
        json.dump({"status": "provisional-presentation", "caseEnvelopeMm": 42, "assets": assets}, target, indent=2)
    print(f"Generated {len(assets)} archetype assets")


if __name__ == "__main__":
    main()
