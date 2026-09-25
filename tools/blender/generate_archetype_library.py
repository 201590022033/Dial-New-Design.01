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


def prism_outline(name, points, height, z, material, bevel=.0):
    """Create a shallow, watertight hand or dial detail from a 2D outline."""
    count = len(points)
    vertices = [(x, y, z - height / 2) for x, y in points]
    vertices += [(x, y, z + height / 2) for x, y in points]
    faces = [tuple(range(count - 1, -1, -1)), tuple(range(count, count * 2))]
    for index in range(count):
        nxt = (index + 1) % count
        faces.append((index, nxt, count + nxt, count + index))
    mesh = bpy.data.meshes.new(name + "_MESH")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return ref.finish(obj, material, bevel)


def tapered_hand(name, length, root_width, shoulder_width, tip_width, tail_length,
                 height, z, angle, material):
    outline = [(-root_width / 2, -tail_length), (root_width / 2, -tail_length),
               (shoulder_width / 2, length * .18), (tip_width / 2, length),
               (-tip_width / 2, length), (-shoulder_width / 2, length * .18)]
    hand = prism_outline(name, outline, height, z, material, min(.06, root_width * .12))
    hand.rotation_euler.z = -math.radians(angle)
    return hand


def register_hand(name, style, length, z, angle, material):
    if style == "needle":
        outline = [(-.09, -.42), (.09, -.42), (.07, length * .82),
                   (.0, length), (-.07, length * .82)]
    elif style == "baton":
        outline = [(-.17, -.38), (.17, -.38), (.15, length * .88),
                   (.08, length), (-.08, length), (-.15, length * .88)]
    else:
        outline = [(-.10, -.40), (.10, -.40), (.09, length * .60),
                   (.24, length * .78), (.0, length), (-.24, length * .78),
                   (-.09, length * .60)]
    hand = prism_outline(name, outline, .12, z, material, .025)
    hand.rotation_euler.z = -math.radians(angle)
    return hand


def join_objects(name, objects):
    """Consolidate presentation details while preserving material slots."""
    if not objects:
        raise ValueError(f"Cannot join empty object group: {name}")
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    joined = bpy.context.object
    joined.name = name
    return joined


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
    elif style == "chronograph":
        minute_details = ref.add_radial_markers("DD_ARCH_CHRONO_MINUTE", 60, 13.25, .08, .38, .06, .25, ink, 5)
        hour_details = ref.add_radial_markers("DD_ARCH_CHRONO_INDEX", 12, 11.85, .25, 1.12, .12, .31, steel, 3)
        objects.extend(minute_details)
        objects.extend(hour_details)
        register_details = [[], [], []]
        # TMI VK63A dial drawing: all three register centres are 7.50 mm from centre.
        for index, (x, y) in enumerate(((-7.5, 0), (7.5, 0), (0, -7.5))):
            recessed_surface = ref.cylinder(f"DD_ARCH_REGISTER_RECESS_{index}", 6.25, .06, recess, 96, z=.215, bevel=.06)
            recessed_surface.location.x, recessed_surface.location.y = x, y
            objects.append(recessed_surface)
            register_details[index].append(recessed_surface)
            polished_ring = ref.annulus(f"DD_ARCH_REGISTER_RING_{index}", 6.55, 6.15, .10, steel, 96, .27)
            polished_ring.location.x, polished_ring.location.y = x, y
            objects.append(polished_ring)
            register_details[index].append(polished_ring)
            track_ring = ref.annulus(f"DD_ARCH_REGISTER_TRACK_{index}", 5.35, 5.15, .05, ink, 96, .285)
            track_ring.location.x, track_ring.location.y = x, y
            objects.append(track_ring)
            register_details[index].append(track_ring)
            for tick in range(30):
                a = math.radians(tick * 12)
                major = tick % 5 == 0
                marker = ref.box(f"DD_ARCH_REGISTER_TICK_{index}_{tick:02d}",
                                 ((.11 if major else .055), (.48 if major else .26), .055),
                                 (x + 2.32 * math.sin(a), y + 2.32 * math.cos(a), .325), ink)
                marker.rotation_euler.z = -a
                objects.append(marker)
                register_details[index].append(marker)
            for label_index, label in enumerate(("30", "10", "20")):
                a = math.radians(label_index * 120)
                label_mesh = ref.text_mesh(f"DD_ARCH_REGISTER_LABEL_{index}_{label}", label, .43,
                                           (x + 1.55 * math.sin(a), y + 1.55 * math.cos(a), .335), ink, .008)
                objects.append(label_mesh)
                register_details[index].append(label_mesh)
        face = objects[0]
        objects = [
            face,
            join_objects("DD_ARCH_CHRONO_MINUTE_TRACK", minute_details),
            join_objects("DD_ARCH_CHRONO_HOUR_MARKERS", hour_details),
            *[join_objects(f"DD_ARCH_REGISTER_ASSEMBLY_{index}", details)
              for index, details in enumerate(register_details)]
        ]
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
    # All these assets share the same 31.5 mm crystal at Z=6.25, thickness 1.5.
    # The old .62/1.0 mm carrier left its top below the crystal and the larger
    # dress/pilot apertures left an unsupported gap around the glass.
    # Nominal presentation seat: top 5.65 + 2.8/2 = 7.05, crystal top = 7.0.
    height = 2.8
    inner_diameter = 31.5
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
    register_ink = ref.material("VK63 register hand", (.72, .12, .06), .72, .16) if style == "chronograph" else metal
    objects = []
    widths = {"diver": (1.55, 1.05), "pilot": (1.05, .72), "field": (.85, .58),
              "dress": (.48, .28), "chronograph": (.62, .34)}[style]
    for index, (length, width, angle) in enumerate(((8.6, widths[0], -35), (12.0, widths[1], 52), (13.0, .18, 138))):
        if style == "chronograph":
            hand_name = "DD_ARCH_CHRONO_SECONDS" if index == 2 else f"DD_ARCH_HAND_{index}"
            hand = tapered_hand(hand_name, length,
                                width if index < 2 else .28,
                                width * .78 if index < 2 else .16,
                                .18 if index < 2 else .055,
                                1.05 if index < 2 else 2.25,
                                .16 if index < 2 else .10, .30 + index * .18,
                                angle, metal if index < 2 else register_ink)
            objects.append(hand)
            if index < 2:
                inlay_length = length * .58
                a = math.radians(angle)
                inlay = ref.box(f"DD_ARCH_HAND_LUME_{index}", (width * .28, inlay_length, .045),
                                (inlay_length * .58 * math.sin(a), inlay_length * .58 * math.cos(a), .405 + index * .18), lume, .035)
                inlay.rotation_euler.z = -a
                objects.append(inlay)
        else:
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
        bores = (.37, .295, .32)
        for index, (x, y, angle) in enumerate(((-7.5, 0, 18), (0, -7.5, 128), (7.5, 0, -42))):
            length = 2.45
            hand = register_hand(f"DD_ARCH_VK63_{subdial_style.upper()}_{index}",
                                 subdial_style, length, .82, angle, register_ink)
            hand.location.x, hand.location.y = x, y
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
    a = ref.attachment()
    for sign, label in ((1, "12"), (-1, "6")):
        objects.append(ref.tapered_strap(f"DD_ARCH_STRAP_{label}", 22, 18, 58, 3.0, sign, body))
        for side in (-1, 1):
            x = side * 8.4
            objects.append(ref.box(f"DD_ARCH_STRAP_EDGE_{label}_{side}", (.24, 52, .10),
                           (x, sign * (a['y'] + 29), a['z'] + 1.56), detail, .08))
        if style == "racing":
            for row in range(5):
                y = sign * (a['y'] + 8 + row * 8)
                for x in (-5.0, 0, 5.0):
                    objects.append(ref.cylinder(f"DD_ARCH_RACING_HOLE_{label}_{row}_{x}", 2.6, .12,
                                   detail, 48, z=a['z'] + 1.6, bevel=.05))
                    objects[-1].location.x, objects[-1].location.y = x, y
    steel = ref.material('spring bar steel', (.7, .76, .84), .96, .16)
    objects.extend(ref.spring_bars(steel))
    return objects


def pushers():
    steel = ref.material("chronograph pusher steel", (.7, .76, .84), .96, .1)
    objects = []
    for index, angle in enumerate((35, -35)):
        a = math.radians(angle)
        # The original button starts at radial 21.7 mm, outside the 21.2 mm
        # case belly. Give it an embedded stem and an overlapping collar.
        # ALL three pieces stay in this separately gated chronograph asset:
        # never bake pusher hardware into the shared case/lug library.
        for suffix, radial_start, radial_end, radius, bevel in (
            ("_STEM", 19.8, 22.4, .90, .06),
            ("_COLLAR", 20.4, 22.05, 1.20, .10),
            ("", 21.7, 25.5, 1.55, .18),
        ):
            center = (radial_start + radial_end) / 2
            bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=radius,
                depth=radial_end - radial_start,
                location=(center * math.cos(a), center * math.sin(a), 0),
                rotation=(0, math.pi / 2, a))
            obj = bpy.context.object
            obj.name = f"DD_ARCH_CHRONO_PUSHER_{index}{suffix}"
            ref.finish(obj, steel, bevel)
            objects.append(obj)
    return objects


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--bezel-only", action="store_true", help="Regenerate only bezel assets; preserve the remaining library and manifest")
    parser.add_argument("--pushers-only", action="store_true", help="Regenerate only the separately gated chronograph pusher asset")
    parser.add_argument("--straps-only", action="store_true", help="Regenerate only the four strap attachment assets")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
    output = os.path.abspath(args.output)
    os.makedirs(output, exist_ok=True)
    if args.straps_only:
        for style in ('rubber', 'leather', 'canvas', 'racing'):
            ref.clear()
            export(strap(style), os.path.join(output, f'strap-{style}.glb'))
        print('Generated four aligned strap assets with spring bars')
        return
    if args.pushers_only:
        ref.clear()
        export(pushers(), os.path.join(output, "pushers-chronograph.glb"))
        print("Generated connected chronograph pushers (shared case assets unchanged)")
        return
    if args.bezel_only:
        for style in STYLES:
            ref.clear()
            export(bezel(style), os.path.join(output, f"bezel-{style}.glb"))
        print(f"Generated {len(STYLES)} seated bezel assets")
        return
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
