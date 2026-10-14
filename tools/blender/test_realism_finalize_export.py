"""Pure-Python checks for standalone crystal extension completion."""
import copy
import json
import struct
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from realism_finalize_export import finalize_export_crystal, _chunks, SCHEMA

PROFILE = {'clearcoat': 1, 'clearcoatRoughness': .015, 'iridescence': .035, 'iridescenceIOR': 1.3, 'iridescenceThicknessRange': [220, 220]}
SOURCE = {'KHR_materials_iridescence': {'iridescenceFactor': .035, 'iridescenceIor': 1.3, 'iridescenceThicknessMinimum': 220, 'iridescenceThicknessMaximum': 220}}


def fixture(path, existing=None):
    material = {'name': 'crystal', 'extras': {'DD_REALISM_SCHEMA': SCHEMA, 'DD_REALISM_ROLE': 'crystal'},
                'pbrMetallicRoughness': {'baseColorFactor': [1, 1, 1, 1]}, 'extensions': existing or {'KHR_materials_ior': {'ior': 1.55}}}
    untouched = {'name': 'diamond', 'extras': {'DD_REALISM_SCHEMA': SCHEMA, 'DD_REALISM_ROLE': 'diamond'}}
    unknown = {'name': 'crystal-like', 'extras': {'DD_REALISM_SCHEMA': 'unknown', 'DD_REALISM_ROLE': 'crystal'}}
    document = {'asset': {'version': '2.0'}, 'materials': [material, untouched, unknown],
                'nodes': [{'name': 'protected', 'translation': [1, 2, 3]}],
                'buffers': [{'byteLength': 80}], 'accessors': [], 'bufferViews': [], 'extensionsUsed': list(material['extensions'])}
    encoded = json.dumps(document).encode()
    encoded += b' ' * ((-len(encoded)) % 4)
    binary = bytes(range(80))
    body = struct.pack('<II', len(encoded), 0x4E4F534A) + encoded + struct.pack('<II', len(binary), 0x004E4942) + binary
    path.write_bytes(struct.pack('<4sII', b'glTF', 2, 12 + len(body)) + body)
    return document, binary


class FinalizeExportTests(unittest.TestCase):
    def test_procedural_recipe_adds_missing_extensions_and_preserves_binary_and_other_materials(self):
        with tempfile.TemporaryDirectory() as folder:
            styles = Path(folder) / 'styles'
            styles.mkdir()
            path = styles / 'watch.glb'
            before, binary = fixture(path)
            report = finalize_export_crystal(path, PROFILE)
            after, chunks = _chunks(path.read_bytes())
            self.assertEqual(chunks[1][1], binary)
            self.assertEqual(after['nodes'], before['nodes'])
            self.assertEqual(after['materials'][1:], before['materials'][1:])
            self.assertEqual(after['materials'][0]['extensions']['KHR_materials_clearcoat'], {'clearcoatFactor': 1, 'clearcoatRoughnessFactor': .015})
            self.assertEqual(after['materials'][0]['extensions']['KHR_materials_iridescence'], SOURCE['KHR_materials_iridescence'])
            self.assertEqual(report['remainingInheritedProfileDifferences'], [])
            first = path.read_bytes()
            second = finalize_export_crystal(path, PROFILE)
            self.assertEqual(second['changes'], [])
            self.assertEqual(path.read_bytes(), first)

    def test_component_authority_completes_only_missing_ar_fields_without_adding_fallback_coat(self):
        with tempfile.TemporaryDirectory() as folder:
            styles = Path(folder) / 'styles'
            styles.mkdir()
            path = styles / 'watch.glb'
            factor = .03500000014901161
            fixture(path, {'KHR_materials_iridescence': {'iridescenceFactor': factor}})
            report = finalize_export_crystal(path, PROFILE, component_recipe=SOURCE, authority='component recipe')
            after, _ = _chunks(path.read_bytes())
            extensions = after['materials'][0]['extensions']
            self.assertNotIn('KHR_materials_clearcoat', extensions)
            self.assertEqual(extensions['KHR_materials_iridescence']['iridescenceFactor'], factor)
            self.assertEqual(extensions['KHR_materials_iridescence']['iridescenceThicknessMinimum'], 220)
            self.assertEqual(extensions['KHR_materials_iridescence']['iridescenceThicknessMaximum'], 220)
            self.assertEqual(report['authority'], 'component recipe')
            self.assertEqual(report['changes'][0]['addedExtensions'], [])
            self.assertEqual(len(report['changes'][0]['addedFields']['KHR_materials_iridescence']), 3)
            self.assertEqual(report['remainingInheritedProfileDifferences'], [])

    def test_existing_explicit_values_are_preserved_and_differences_reported(self):
        with tempfile.TemporaryDirectory() as folder:
            styles = Path(folder) / 'styles'
            styles.mkdir()
            path = styles / 'watch.glb'
            existing = copy.deepcopy(SOURCE)
            existing['KHR_materials_clearcoat'] = {'clearcoatFactor': .2, 'clearcoatRoughnessFactor': .13}
            fixture(path, existing)
            before = path.read_bytes()
            report = finalize_export_crystal(path, PROFILE)
            self.assertEqual(path.read_bytes(), before)
            self.assertEqual(len(report['remainingInheritedProfileDifferences']), 2)

    def test_public_components_are_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            with self.assertRaises(ValueError):
                finalize_export_crystal(root / 'public/assets/3d/crystal.glb', PROFILE, root)


if __name__ == '__main__':
    unittest.main()
