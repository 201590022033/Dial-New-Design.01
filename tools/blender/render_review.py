"""Render four deterministic orthographic review views; run with Blender."""
import argparse
import json
import math
from pathlib import Path
import sys
import traceback

# Blender does not consistently put the script's directory on sys.path.
sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from validate_glb import import_glb, script_args


def bounds(points):
    """Return finite, non-degenerate world-space bounds (also usable without bpy)."""
    points = list(points)
    if not points or any(not math.isfinite(v) for point in points for v in point):
        raise ValueError('Bounds require finite points')
    low = tuple(min(point[i] for point in points) for i in range(3))
    high = tuple(max(point[i] for point in points) for i in range(3))
    dimensions = tuple(high[i] - low[i] for i in range(3))
    if max(dimensions) <= 0:
        raise ValueError('Asset has zero spatial extent')
    return tuple((low[i] + high[i]) / 2 for i in range(3)), dimensions


def frame_scale(camera_points, margin=1.15):
    """Square orthographic scale enclosing all projected corners about the origin."""
    if margin <= 1 or not math.isfinite(margin):
        raise ValueError('Framing margin must be finite and greater than one')
    extent = max(abs(point[i]) for point in camera_points for i in (0, 1))
    if not math.isfinite(extent) or extent <= 0:
        raise ValueError('View has no finite projected extent')
    return 2 * extent * margin


def main():
    import bpy
    from mathutils import Vector

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True)
    parser.add_argument('--output-dir', required=True)
    parser.add_argument('--asset-label', required=True)
    args = parser.parse_args(script_args())
    if not args.output_dir.strip() or not args.asset_label.strip():
        raise ValueError('Output directory and asset label must not be empty')
    output = Path(args.output_dir).resolve()
    output.mkdir(parents=True, exist_ok=True)
    manifest_path = output / 'manifest.json'
    # A failed re-render must never retain a previous success manifest.
    manifest_path.unlink(missing_ok=True)
    meshes, report = import_glb(args.input)
    scene = bpy.context.scene
    bpy.context.view_layer.update()
    corners = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    center, dimensions = bounds(corners)
    center = Vector(center)
    # Translate only hierarchy roots: children inherit exactly one translation.
    for obj in list(scene.objects):
        if obj.parent is None:
            matrix = obj.matrix_world.copy()
            matrix.translation -= center
            obj.matrix_world = matrix
    bpy.context.view_layer.update()
    corners = [corner - center for corner in corners]
    radius = max(corner.length for corner in corners)

    # Inspect the installed API rather than assuming an older Eevee identifier.
    engines = {item.identifier for item in scene.render.bl_rna.properties['engine'].enum_items}
    if 'BLENDER_EEVEE' not in engines:
        raise RuntimeError(f'Blender 5.2 Eevee (BLENDER_EEVEE) unavailable: {sorted(engines)}')
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = scene.render.resolution_y = 512
    scene.render.resolution_percentage = 100
    scene.render.pixel_aspect_x = scene.render.pixel_aspect_y = 1
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGB'
    scene.render.image_settings.color_depth = '8'
    scene.render.film_transparent = False
    scene.render.use_file_extension = True
    scene.render.dither_intensity = 0
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    scene.world = bpy.data.worlds.new('Review neutral world')
    # Blender 5.2 creates a usable World.node_tree with Background and Output
    # nodes by default. Assigning use_nodes is deprecated in that API.
    background = scene.world.node_tree.nodes.get('Background')
    background.inputs['Color'].default_value = (0.18, 0.18, 0.18, 1)
    background.inputs['Strength'].default_value = 0.8

    # Imported lights/cameras must not affect the fixed review environment.
    for obj in list(scene.objects):
        if obj.type in {'LIGHT', 'CAMERA'}:
            bpy.data.objects.remove(obj, do_unlink=True)
    for name, position, power, size in [
        ('Key', (1.5, -2, 3), 60, 2.5),
        ('Fill', (-2, -1, 1), 40, 3),
        ('Rim', (1, 2, 2), 80, 2),
    ]:
        data = bpy.data.lights.new('Review ' + name, 'AREA')
        data.energy = power * radius ** 2
        data.shape = 'DISK'
        data.size = size * radius
        light = bpy.data.objects.new(data.name, data)
        scene.collection.objects.link(light)
        light.location = Vector(position) * radius
        light.rotation_euler = (-light.location).to_track_quat('-Z', 'Y').to_euler()

    views = []
    for name, direction in [('top', (0, 0, 1)), ('front', (0, -1, 0)),
                            ('side', (1, 0, 0)), ('three-quarter', (1, -1, 1))]:
        data = bpy.data.cameras.new('Review ' + name)
        camera = bpy.data.objects.new(data.name, data)
        scene.collection.objects.link(camera)
        camera.location = Vector(direction).normalized() * radius * 4
        camera.rotation_euler = (-camera.location).to_track_quat('-Z', 'Y').to_euler()
        data.type = 'ORTHO'
        bpy.context.view_layer.update()
        inverse = camera.matrix_world.inverted()
        data.ortho_scale = frame_scale([inverse @ corner for corner in corners])
        data.clip_start = radius * 0.01
        data.clip_end = radius * 10
        scene.camera = camera
        path = output / (name + '.png')
        scene.render.filepath = str(path)
        path.unlink(missing_ok=True)
        result = bpy.ops.render.render(write_still=True)
        if result != {'FINISHED'} or not path.is_file() or path.stat().st_size == 0:
            raise RuntimeError(f'Render failed: {path}')
        views.append({'name': name, 'camera': camera.name, 'output_path': str(path),
                      'size_bytes': path.stat().st_size, 'orthographic_scale': data.ortho_scale,
                      'camera_location': list(camera.location)})

    manifest = {**report, 'blender_version': bpy.app.version_string,
                'asset_label': args.asset_label, 'render_engine': scene.render.engine,
                'resolution': [512, 512], 'bounding_box_dimensions': list(dimensions),
                'bounding_box_units': 'Blender units (case fixture: 1 unit = 1 mm)',
                'source_center': list(center), 'views': views}
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(f'Review manifest: {manifest_path}', flush=True)


if __name__ == '__main__':
    try:
        main()
    except Exception:
        traceback.print_exc()
        sys.exit(1)
