"""Blender integration check for the 42 mm lug-case option library."""
import json
from pathlib import Path
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from validate_glb import import_glb

root = Path(__file__).resolve().parents[2] / 'public' / 'assets' / '3d' / 'lug-cases'
manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
expected = {'straight','curved','twisted','hooded','integrated','drilled','wire','teardrop','faceted','skeleton'}
if manifest.get('status') != 'provisional-presentation' or set(manifest.get('styles', [])) != expected:
    raise AssertionError('Lug-case manifest is incomplete or has invalid provenance')
for style, filename in zip(manifest['styles'], manifest['assets']):
    meshes, report = import_glb(str(root / filename))
    if report['mesh_count'] < 4:
        raise AssertionError(f'{style} case has too few meshes')
    if not any(obj.get('DD_LUG_LIBRARY_STYLE') == style for obj in meshes):
        raise AssertionError(f'{style} provenance metadata missing')
print(f'Lug-case library PASS: {len(expected)} GLBs')
