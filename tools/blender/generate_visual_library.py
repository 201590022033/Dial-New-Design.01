"""Generate reviewed fallback GLBs for the non-reference visual library.

These are presentation assets, not dimensionally verified engineering parts.
They are intentionally generated from explicit nominal parameters so the browser
can exercise the GLB path while the evidence gate remains provisional.
"""
import argparse
import math
import os
import sys

import bpy


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for item in list(block):
            block.remove(item)


def material(name, color, metallic=0.8, roughness=0.25, transmission=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    if 'Transmission Weight' in bsdf.inputs:
        bsdf.inputs['Transmission Weight'].default_value = transmission
    return mat


def finish(obj, mat, bevel=0.0):
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new('presentation edge bevel', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
    return obj


def cylinder(name, radius, depth, location, mat, bevel=0.0, vertices=96):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    return finish(obj, mat, bevel)


def torus(name, major, minor, location, mat):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=128, minor_segments=24, location=location)
    obj = bpy.context.object
    obj.name = name
    return finish(obj, mat)


def annulus(name, outer_radius, inner_radius, depth, location, mat, segments=160):
    vertices = []
    faces = []
    half = depth / 2
    for z in (-half, half):
        for radius in (outer_radius, inner_radius):
            for index in range(segments):
                angle = 2 * math.pi * index / segments
                vertices.append((radius * math.cos(angle), radius * math.sin(angle), z + location[2]))
    outer_bottom, inner_bottom, outer_top, inner_top = 0, segments, segments * 2, segments * 3
    for index in range(segments):
        nxt = (index + 1) % segments
        faces.extend([
            (outer_bottom + index, outer_bottom + nxt, outer_top + nxt, outer_top + index),
            (inner_bottom + nxt, inner_bottom + index, inner_top + index, inner_top + nxt),
            (outer_top + index, outer_top + nxt, inner_top + nxt, inner_top + index),
            (outer_bottom + nxt, outer_bottom + index, inner_bottom + index, inner_bottom + nxt)
        ])
    mesh = bpy.data.meshes.new(name + '_MESH')
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj, mat, 0.05)


def export(output):
    os.makedirs(os.path.dirname(output), exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=output, export_format='GLB', use_selection=True)


def build_bezel():
    steel = material('polished steel', (0.62, 0.68, 0.76), 0.9, 0.14)
    black = material('bezel insert', (0.025, 0.04, 0.065), 0.12, 0.3)
    cylinder('DD_BEZEL_RING', 19.7, 1.2, (0, 0, 0), steel, 0.28)
    torus('DD_BEZEL_INSERT', 17.7, 1.0, (0, 0, 0.65), black)


def build_knurled_bezel():
    steel = material('knurled bezel steel', (0.62, 0.68, 0.76), 0.92, 0.2)
    black = material('black ceramic bezel insert', (0.025, 0.04, 0.065), 0.14, 0.22)
    annulus('DD_BEZEL_CARRIER_KNURLED', 20.5, 15.75, 2.8, (0, 0, 0), steel)
    annulus('DD_BEZEL_INSERT', 19.6, 16.3, 0.28, (0, 0, 1.54), black)
    for index in range(96):
        angle = 2 * math.pi * index / 96
        radius = 20.65
        bpy.ops.mesh.primitive_cube_add(location=(radius * math.cos(angle), radius * math.sin(angle), 0), scale=(0.18, 0.42, 1.1))
        tooth = bpy.context.object
        tooth.name = f'DD_BEZEL_KNURL_{index:03d}'
        tooth.rotation_euler[2] = angle
        finish(tooth, steel, 0.06)


def build_crystal():
    sapphire = material('sapphire', (0.5, 0.8, 1.0), 0.0, 0.08, 0.35)
    crystal = cylinder('DD_CRYSTAL_DOMED', 16.0, 0.65, (0, 0, 0), sapphire, 0.7)
    crystal.data.materials[0].surface_render_method = 'DITHERED'
    bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=32, location=(0, 0, 0.35), scale=(16.0, 16.0, 1.2))
    dome = bpy.context.object
    dome.name = 'DD_CRYSTAL_DOME'
    finish(dome, sapphire)


def hand(name, length, width, z, angle, mat):
    bpy.ops.mesh.primitive_cube_add(location=(0, 0, z), scale=(width / 2, length / 2, 0.075))
    obj = bpy.context.object
    obj.name = name
    # Keep the object origin at the movement post so rotation remains physical.
    for vertex in obj.data.vertices:
        vertex.co.y += length / 2
    obj.rotation_euler[2] = angle
    return finish(obj, mat, 0.08)


def build_hands():
    steel = material('hand steel', (0.8, 0.85, 0.92), 0.92, 0.12)
    lume = material('lume', (0.55, 1.0, 0.35), 0.05, 0.3)
    hour_angle = 0.2
    hand('DD_HAND_HOUR', 11.0, 1.15, 0.0, hour_angle, steel)
    hand('DD_HAND_MINUTE', 15.0, 0.82, 0.22, -0.9, steel)
    hand('DD_HAND_SECONDS', 16.5, 0.22, 0.44, 2.0, steel)
    marker_radius = 7.1
    torus('DD_HAND_HOUR_MARKER', 1.05, 0.22,
          (-marker_radius * math.sin(hour_angle), marker_radius * math.cos(hour_angle), 0.1), lume)
    cylinder('DD_HAND_HUB', 0.7, 0.5, (0, 0, 0.3), steel, 0.08)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--asset', choices=('bezel', 'bezel-knurled', 'crystal', 'hands', 'hands-mercedes-42'), required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    clear_scene()
    if args.asset == 'bezel':
        build_bezel()
    elif args.asset == 'bezel-knurled':
        build_knurled_bezel()
    elif args.asset == 'crystal':
        build_crystal()
    else:
        build_hands()
    export(args.output)


if __name__ == '__main__':
    main()
