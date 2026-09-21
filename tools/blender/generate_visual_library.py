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


def export(output):
    os.makedirs(os.path.dirname(output), exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=output, export_format='GLB', use_selection=True)


def build_bezel():
    steel = material('polished steel', (0.62, 0.68, 0.76), 0.9, 0.14)
    black = material('bezel insert', (0.025, 0.04, 0.065), 0.12, 0.3)
    cylinder('DD_BEZEL_RING', 19.7, 1.2, (0, 0, 0), steel, 0.28)
    torus('DD_BEZEL_INSERT', 17.7, 1.0, (0, 0, 0.65), black)


def build_crystal():
    sapphire = material('sapphire', (0.5, 0.8, 1.0), 0.0, 0.08, 0.35)
    crystal = cylinder('DD_CRYSTAL_DOMED', 16.0, 0.65, (0, 0, 0), sapphire, 0.7)
    crystal.data.materials[0].surface_render_method = 'DITHERED'
    bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=32, location=(0, 0, 0.35), scale=(16.0, 16.0, 1.2))
    dome = bpy.context.object
    dome.name = 'DD_CRYSTAL_DOME'
    finish(dome, sapphire)


def hand(name, length, width, z, angle, mat):
    bpy.ops.mesh.primitive_cube_add(location=(0, length / 2, z), scale=(width / 2, length / 2, 0.075))
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler[2] = angle
    return finish(obj, mat, 0.08)


def build_hands():
    steel = material('hand steel', (0.8, 0.85, 0.92), 0.92, 0.12)
    lume = material('lume', (0.55, 1.0, 0.35), 0.05, 0.3)
    hand('DD_HAND_HOUR', 11.0, 1.15, 0.0, 0.2, steel)
    hand('DD_HAND_MINUTE', 15.0, 0.82, 0.22, -0.9, steel)
    hand('DD_HAND_SECONDS', 16.5, 0.22, 0.44, 2.0, steel)
    torus('DD_HAND_HOUR_MARKER', 1.05, 0.22, (0, 7.1, 0.1), lume)
    cylinder('DD_HAND_HUB', 0.7, 0.5, (0, 0, 0.3), steel, 0.08)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--asset', choices=('bezel', 'crystal', 'hands'), required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    clear_scene()
    if args.asset == 'bezel':
        build_bezel()
    elif args.asset == 'crystal':
        build_crystal()
    else:
        build_hands()
    export(args.output)


if __name__ == '__main__':
    main()
