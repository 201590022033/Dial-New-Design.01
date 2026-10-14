"""Pure-Python checks for the standalone tangent repair byte contract."""
import json
import struct
import tempfile
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from realism_normalize_export import repair_export_tangents


def fixture(path, degenerate_uv=False):
    arrays = [
        ([0, 0, 0, 1, 0, 0, 0, 1, 0], 'VEC3'),
        ([0, 0, 1] * 3, 'VEC3'),
        ([0, 0, 0, 0, 0, 0] if degenerate_uv else [0, 0, 1, 0, 0, 1], 'VEC2'),
        ([0, 0, 0, -1, .999975, 0, 0, 1, 1, 0, 0, -1], 'VEC4'),
    ]
    binary = bytearray()
    accessors, views = [], []
    for values, kind in arrays:
        data = struct.pack('<' + 'f' * len(values), *values)
        views.append({'buffer': 0, 'byteOffset': len(binary), 'byteLength': len(data)})
        accessors.append({'bufferView': len(views) - 1, 'componentType': 5126, 'count': 3, 'type': kind})
        binary.extend(data)
    document = {'asset': {'version': '2.0'}, 'buffers': [{'byteLength': len(binary)}],
                'bufferViews': views, 'accessors': accessors,
                'nodes': [{'name': 'protected', 'mesh': 0, 'translation': [1, 2, 3]}],
                'meshes': [{'name': 'strap', 'primitives': [{'attributes': {'POSITION': 0, 'NORMAL': 1, 'TEXCOORD_0': 2, 'TANGENT': 3}}]}]}
    encoded = json.dumps(document).encode()
    encoded += b' ' * ((-len(encoded)) % 4)
    body = struct.pack('<II', len(encoded), 0x4E4F534A) + encoded + struct.pack('<II', len(binary), 0x004E4942) + binary
    raw = struct.pack('<4sII', b'glTF', 2, 12 + len(body)) + body
    path.write_bytes(raw)
    return raw


class StandaloneTangentRepairTests(unittest.TestCase):
    def test_gradient_repair_preserves_every_other_byte_and_is_idempotent(self):
        with tempfile.TemporaryDirectory() as folder:
            styles = Path(folder) / 'styles'
            styles.mkdir()
            path = styles / 'watch.glb'
            before = fixture(path)
            report = repair_export_tangents(path)
            self.assertEqual(report['reconstructedZeroTangents'], 1)
            self.assertEqual(report['normalizedNonzeroTangents'], 0)
            self.assertEqual(report['fallbackTangents'], 0)
            change = report['changes'][0]
            self.assertEqual(change['after'], [1, 0, 0, -1])
            self.assertEqual(change['method'], 'incident-UV-gradient')
            after = path.read_bytes()
            offset = change['byteOffset']
            self.assertEqual(before[:offset], after[:offset])
            self.assertEqual(before[offset + 12:], after[offset + 12:])
            again = repair_export_tangents(path)
            self.assertEqual(again['changes'], [])
            self.assertEqual(path.read_bytes(), after)

    def test_degenerate_uv_uses_and_counts_deterministic_orthogonal_fallback(self):
        with tempfile.TemporaryDirectory() as folder:
            styles = Path(folder) / 'styles'
            styles.mkdir()
            path = styles / 'watch.glb'
            fixture(path, degenerate_uv=True)
            report = repair_export_tangents(path)
            self.assertEqual(report['fallbackTangents'], 1)
            self.assertEqual(report['changes'][0]['after'], [1, 0, 0, -1])

    def test_rejects_public_components_and_paths_outside_declared_root(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            with self.assertRaises(ValueError):
                repair_export_tangents(root / 'public/assets/3d/component.glb', root)
            with self.assertRaises(ValueError):
                repair_export_tangents(root / 'other.glb', root / 'styles')


if __name__ == '__main__':
    unittest.main()
