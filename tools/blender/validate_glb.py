"""Import and validate a GLB in a fresh Blender scene (arguments follow --)."""
import argparse
import json
from pathlib import Path
import sys
import traceback


def script_args():
    return sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def import_glb(input_path):
    import bpy

    if not input_path or not input_path.strip():
        raise ValueError('GLB path must not be empty')
    source = Path(input_path).resolve()
    if not source.is_file() or source.stat().st_size == 0:
        raise ValueError(f'GLB must be an existing, non-empty file: {source}')
    if source.suffix.lower() != '.glb':
        raise ValueError(f'Expected a .glb file: {source}')
    bpy.ops.wm.read_factory_settings(use_empty=True)
    result = bpy.ops.import_scene.gltf(filepath=str(source))
    if result != {'FINISHED'}:
        raise RuntimeError(f'GLB import failed: {result}')
    meshes = sorted((obj for obj in bpy.context.scene.objects if obj.type == 'MESH'),
                    key=lambda obj: obj.name)
    vertex_count = sum(len(obj.data.vertices) for obj in meshes)
    if not meshes or vertex_count == 0:
        raise ValueError('Imported GLB must contain meshes and non-zero vertices')
    report = {'source_glb': str(source), 'mesh_names': [obj.name for obj in meshes],
              'mesh_count': len(meshes), 'vertex_count': vertex_count}
    print('GLB validation: ' + json.dumps(report), flush=True)
    return meshes, report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True, help='Non-empty GLB to import')
    args = parser.parse_args(script_args())
    import_glb(args.input)


if __name__ == '__main__':
    try:
        main()
    except Exception:
        traceback.print_exc()
        sys.exit(1)
