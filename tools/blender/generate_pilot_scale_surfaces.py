"""Author physical pilot scale surfaces with watch-axis UVs (42 mm preview).

Live logarithmic artwork is printed into these lit GLB materials, rather than
placed on a transparent plane above the sapphire. Shapes remain provisional.
"""
import argparse
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import generate_archetype_library as archetype
import reference_42_supplemental as ref


def printing_surface(ring, outer, inner, z, material):
    count = 192
    vertices = [(radius * math.sin(2 * math.pi * i / count),
                 radius * math.cos(2 * math.pi * i / count), z)
                for radius in (outer, inner) for i in range(count)]
    faces = [(i, count + i, count + (i + 1) % count, (i + 1) % count)
             for i in range(count)]
    mesh = bpy.data.meshes.new("DD_SCALE_SURFACE_" + ring)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    uv = mesh.uv_layers.new(name="WatchAxisPrint")
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            position = mesh.vertices[mesh.loops[loop_index].vertex_index].co
            uv.data[loop_index].uv = (position.x / 42 + .5, position.y / 42 + .5)
    obj = bpy.data.objects.new("DD_SCALE_SURFACE_" + ring, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    obj["DD_SCALE_RING"] = ring.lower()
    obj["DD_SCALE_UV_DIAMETER_MM"] = 42
    obj["DD_SCALE_OUTER_RADIUS_MM"] = outer
    obj["DD_SCALE_INNER_RADIUS_MM"] = inner
    obj["DD_SCALE_SURFACE_Z_MM"] = z
    return obj


def logarithmic_marks(ring, radius, label_radius, z):
    """Default relief artwork also makes the standalone GLB reviewable."""
    ink = ref.material("Pilot ivory logarithmic marks", (.92, .90, .82), .04, .48)
    numbered = {10, 12, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90}
    objects = []
    for start, end, step in ((10, 20, .5), (20, 50, 1), (50, 100, 2)):
        for index in range(round((end - start) / step)):
            value = start + index * step
            angle = math.log10(value / 10) * 2 * math.pi
            major = value in numbered
            length = .45 if major else .25
            tick = ref.box(f"DD_PILOT_SCALE_{ring}_TICK_{value:g}",
                           (.12 if major else .08, length, .008),
                           ((radius - length / 2) * math.sin(angle),
                            (radius - length / 2) * math.cos(angle), z + .006), ink)
            tick.rotation_euler.z = -angle
            objects.append(tick)
            if major:
                objects.append(ref.text_mesh(f"DD_PILOT_SCALE_{ring}_LABEL_{value:g}",
                               f"{value:g}", .65,
                               (label_radius * math.sin(angle), label_radius * math.cos(angle), z + .01), ink, .002))
    return objects


def generate(output):
    os.makedirs(output, exist_ok=True)
    ref.clear()
    objects = archetype.bezel("pilot")
    ink = ref.material("Pilot logarithmic printing surface", (.012, .02, .032), .08, .48)
    objects.append(ref.annulus("DD_ARCH_BEZEL_INSERT", 39.2, 31.8, .28, ink, 192, 1.54))
    objects.append(printing_surface("OUTER", 19.6, 15.9, 1.688, ink))
    objects.extend(logarithmic_marks("OUTER", 18.4, 18.95, 1.688))
    archetype.export(objects, os.path.join(output, "bezel-pilot.glb"))
    ref.clear()
    ink = ref.material("Pilot fixed chapter scale surface", (.012, .02, .032), .08, .48)
    objects = [ref.annulus("DD_ARCH_CHAPTER_RING", 30.5, 26.9, 2.3, ink, 192)]
    objects.append(printing_surface("INNER", 15.25, 13.45, 1.158, ink))
    objects.extend(logarithmic_marks("INNER", 15, 14.25, 1.158))
    archetype.export(objects, os.path.join(output, "chapter-ring-pilot.glb"))
    print("Generated pilot rotating and fixed GLB printing surfaces")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    generate(args.output)


if __name__ == "__main__":
    main()
