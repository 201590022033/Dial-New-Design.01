"""Presentation dial generator with texture-ready surfaces and marking geometry."""
import argparse
import math
import os
import sys

import bpy


def number(params, key, default=None):
    value = params.get(key, default)
    if value is None or isinstance(value, dict):
        raise ValueError('unknown required dial dimension: ' + key)
    if not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
        raise ValueError('invalid dial dimension: ' + key)
    return float(value)


def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.curves):
        for item in list(block):
            block.remove(item)


def textured_material(name, color, secondary, intensity, contrast, metallic=0.05, roughness=0.38):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get('Principled BSDF')
    noise = nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 7.0 + intensity * 30.0
    noise.inputs['Detail'].default_value = 5.0
    noise.inputs['Roughness'].default_value = 0.7
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (*color, 1.0)
    ramp.color_ramp.elements[1].color = (*secondary, 1.0)
    ramp.color_ramp.elements[0].position = max(0.0, 0.5 - contrast * 0.35)
    ramp.color_ramp.elements[1].position = min(1.0, 0.5 + contrast * 0.35)
    links.new(noise.outputs['Fac'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    return mat


def simple_material(name, color, metallic=0.6, roughness=0.22):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.metallic = metallic
    mat.roughness = roughness
    return mat


def finish(obj, material, bevel=0.0):
    obj.data.materials.append(material)
    if bevel:
        modifier = obj.modifiers.new('dial edge bevel', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 3
    return obj


def disk(name, radius, depth, material):
    bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=radius, depth=depth, location=(0, 0, 0))
    obj = bpy.context.object
    obj.name = name
    return finish(obj, material, min(0.12, depth / 3))


def marker(name, radius, width, length, angle, material):
    theta = math.radians(angle)
    x = radius * math.sin(theta)
    y = radius * math.cos(theta)
    bpy.ops.mesh.primitive_cube_add(location=(x, y, 0.28), scale=(width / 2, length / 2, 0.07))
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler[2] = -theta
    return finish(obj, material, 0.05)


def ring(name, x, y, radius, material):
    bpy.ops.mesh.primitive_torus_add(major_radius=radius * 0.82, minor_radius=0.12, major_segments=64, minor_segments=12, location=(x, y, 0.3))
    obj = bpy.context.object
    obj.name = name
    return finish(obj, material)


def build(params):
    outer = number(params, 'outerDiameterMm') / 2
    depth = number(params, 'thicknessMm')
    marker_cfg = params['markerLayout']
    surface = params['surface']
    dial_color = tuple(surface.get('colorRgb', [0.04, 0.07, 0.12]))
    secondary = tuple(surface.get('secondaryColorRgb', [0.01, 0.02, 0.04]))
    dial = textured_material('dial textured surface', dial_color, secondary, float(surface.get('textureIntensity', 0.35)), float(surface.get('textureContrast', 0.65)))
    steel = simple_material('applied marking metal', (0.78, 0.84, 0.92), 0.86, 0.16)
    lume = simple_material('luminous marking', (0.45, 1.0, 0.3), 0.05, 0.3)
    aperture = simple_material('aperture interior', (0.01, 0.015, 0.02), 0.0, 0.48)
    disk('DD_DIAL_FACE', outer, depth, dial)
    count = int(marker_cfg.get('count', 12))
    start = float(marker_cfg.get('startAngleDeg', -90))
    inner = float(marker_cfg.get('radiusInnerMm', outer * 0.72))
    outer_radius = float(marker_cfg.get('radiusOuterMm', outer * 0.86))
    width = float(marker_cfg.get('widthMm', 0.5))
    for index in range(max(1, count)):
        angle = start + 360.0 * index / max(1, count)
        marker(f'DD_DIAL_MARKER_{index:02d}', (inner + outer_radius) / 2, width if index % 3 else width * 1.8, outer_radius - inner, angle, lume if marker_cfg.get('lumed', False) else steel)
    for index, subdial in enumerate(params.get('subdials', [])):
        theta = math.radians(float(subdial['angleDeg']))
        x = outer * 0.52 * math.sin(theta)
        y = outer * 0.52 * math.cos(theta)
        bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=float(subdial['radiusMm']), depth=0.08, location=(x, y, 0.32))
        sub = bpy.context.object
        sub.name = f"DD_DIAL_SUBDIAL_{index:02d}_{subdial.get('role', 'CUSTOM').upper()}"
        finish(sub, aperture, 0.08)
        ring(f'DD_DIAL_SUBDIAL_RING_{index:02d}', x, y, float(subdial['radiusMm']), steel)
    for index, window in enumerate(params.get('windows', [])):
        theta = math.radians(float(window['angleDeg']))
        radius = outer * 0.74
        x = radius * math.sin(theta)
        y = radius * math.cos(theta)
        bpy.ops.mesh.primitive_cube_add(location=(x, y, 0.36), scale=(float(window['widthMm']) / 2, float(window['heightMm']) / 2, 0.08))
        aperture_obj = bpy.context.object
        aperture_obj.name = f"DD_DIAL_WINDOW_{index:02d}_{window.get('kind', 'DATE').upper()}"
        aperture_obj.rotation_euler[2] = -theta
        finish(aperture_obj, aperture, 0.12)
    bpy.context.scene['DD_PARAMETRIC_SCHEMA'] = 'parametric-dial/v1'
    bpy.context.scene['DD_TEXTURE_READY'] = True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--params', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    import json
    with open(args.params, 'r', encoding='utf-8') as handle:
        params = json.load(handle)
    clear()
    build(params)
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=args.output, export_format='GLB', use_selection=True)


if __name__ == '__main__':
    main()
