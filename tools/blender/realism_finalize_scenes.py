"""Leave editable source scenes with the default AR effect enabled after comparison."""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import bpy


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--run', type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
    results = []
    for path in sorted((args.run.resolve() / 'styles').glob('*/source.blend')):
        before = hashlib.sha256(path.read_bytes()).hexdigest()
        bpy.ops.wm.open_mainfile(filepath=str(path))
        restored = []
        for material in bpy.data.materials:
            if material.use_nodes:
                node = material.node_tree.nodes.get('DD_VR_SUBTLE_AR_BLEND')
                if node is not None:
                    node.inputs[0].default_value = .035
                    restored.append(material.name)
        bpy.ops.file.pack_all()
        bpy.ops.wm.save_as_mainfile(filepath=str(path))
        results.append({'style': path.parent.name, 'sourceSha256': before,
                        'finalSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                        'defaultArBlend': .035, 'materials': restored})
    (args.run / 'reports' / 'editable-scene-finalization.json').write_text(
        json.dumps({'scenes': results, 'rendersChanged': False}, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
