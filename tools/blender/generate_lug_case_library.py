"""Generate provisional 42 mm case GLBs for every lug geometry family."""
import argparse
import json
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import parametric_case_v1 as casegen

STYLES = ('straight','curved','twisted','hooded','integrated','drilled','wire','teardrop','faceted','skeleton')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--params', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    with open(args.params, encoding='utf-8') as source:
        base = json.load(source)
    output = os.path.abspath(args.output)
    os.makedirs(output, exist_ok=True)
    assets = []
    for style in STYLES:
        params = dict(base)
        params['lugStyle'] = style
        casegen.build(params, 'high')
        for obj in bpy.data.collections['DD_PARAMETRIC_CASE'].objects:
            obj['DD_LUG_LIBRARY_STYLE'] = style
            obj['DD_PROVENANCE_STATUS'] = 'provisional-presentation'
            obj['DD_PROVENANCE_SOURCE'] = '2026-09-22 lug reference taxonomy; NMK901 envelope; no fit claim'
            obj.select_set(True)
        bpy.context.view_layer.objects.active = bpy.data.collections['DD_PARAMETRIC_CASE'].objects[0]
        filename = f'case-lugs-{style}.glb'
        bpy.ops.export_scene.gltf(filepath=os.path.join(output, filename), export_format='GLB', use_selection=True, export_yup=True, export_extras=True)
        assets.append(filename)
        bpy.ops.object.select_all(action='DESELECT')
    with open(os.path.join(output, 'manifest.json'), 'w', encoding='utf-8') as target:
        json.dump({'status': 'provisional-presentation', 'caseEnvelopeMm': 42, 'styles': list(STYLES), 'assets': assets}, target, indent=2)
    print(f'Generated {len(assets)} lug-case assets')


if __name__ == '__main__':
    main()
