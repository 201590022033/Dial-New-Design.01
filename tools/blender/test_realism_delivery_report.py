"""Pure file/parser/dependency tests for the delivery verifier."""
import hashlib
import json
import struct
import sys
import tempfile
import unittest
import zlib
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from realism_delivery_report import png_info, glb_info, fingerprint_base, runtime_budget_evidence, render_fingerprint


def chunk(kind, content):
    return struct.pack('>I', len(content)) + kind + content + struct.pack('>I', zlib.crc32(kind + content) & 0xFFFFFFFF)


class DeliveryReportTests(unittest.TestCase):
    def test_final_png_requires_complete_crc_valid_stream(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'final.png'
            data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', 2400, 1, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(b'\0' * 7201)) + chunk(b'IEND', b'')
            path.write_bytes(data)
            info = png_info(path)
            self.assertEqual(info['resolution'], [2400, 1])
            self.assertEqual(info['sha256'], hashlib.sha256(data).hexdigest())
            path.write_bytes(data[:-5])
            with self.assertRaises(ValueError):
                png_info(path)
            corrupted = bytearray(data)
            corrupted[20] ^= 1
            path.write_bytes(corrupted)
            with self.assertRaises(ValueError):
                png_info(path)

    def test_glb_counts_active_instances_separately_from_stored_geometry(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'watch.glb'
            document = {'asset': {'version': '2.0'}, 'buffers': [{'byteLength': 36}], 'bufferViews': [{'buffer': 0, 'byteLength': 36}],
                        'accessors': [{'bufferView': 0, 'type': 'VEC3', 'componentType': 5126, 'count': 3}],
                        'meshes': [{'primitives': [{'attributes': {'POSITION': 0}}]}],
                        'nodes': [{'mesh': 0}, {'mesh': 0}, {'mesh': 0}], 'scenes': [{'nodes': [0, 1]}], 'scene': 0}
            encoded = json.dumps(document).encode()
            encoded += b' ' * ((-len(encoded)) % 4)
            body = struct.pack('<II', len(encoded), 0x4E4F534A) + encoded + struct.pack('<II', 36, 0x004E4942) + b'\0' * 36
            path.write_bytes(struct.pack('<4sII', b'glTF', 2, len(body) + 12) + body)
            info = glb_info(path)
            self.assertEqual(info['storedTriangles'], 1)
            self.assertEqual(info['instantiatedTriangles'], 2)
            self.assertEqual(info['textureMaximumPx'], 0)

    def test_runtime_cost_exceptions_remain_separate_and_traceable(self):
        browser = {'galleryWarmup': [{'name': 'Pilot', 'stats': {'triangles': 74412, 'calls': 517}},
                                     {'name': 'Chronograph preview', 'stats': {'triangles': 207794, 'calls': 223}}]}
        observations, exceptions = runtime_budget_evidence(browser)
        self.assertEqual(len(observations), 2)
        self.assertEqual({(item['style'], item['metric']) for item in exceptions}, {('archetype-pilot', 'calls'), ('archetype-chronograph', 'triangles')})
        self.assertTrue(all(item['source'].startswith('reports/browser/acceptance.json') for item in exceptions))
        self.assertTrue(all('multiple passes' in item['reason'] for item in exceptions))

    def test_ar_fingerprints_include_enabled_flag_but_pair_camera_comparison_does_not(self):
        source = hashlib.sha256(b'frozen render dependencies').digest()
        camera = {'target': [0, 0, 0], 'camera': [0, -1, 1], 'lensMm': 100, 'focusDistanceM': 1.414, 'fStop': 11}
        cameras = []
        for shot, enabled in [('crystal-ar-on', True), ('crystal-ar-off', False)]:
            description = dict(camera, arEnabled=enabled)
            actual, base_camera = render_fingerprint(source, shot, description, 256, 2400)
            hero_expected = hashlib.sha256(source + json.dumps({'shot': shot, 'camera': description, 'samples': 256, 'width': 2400, 'draft': False}, sort_keys=True).encode()).hexdigest()
            self.assertEqual(actual, hero_expected)
            self.assertNotIn('arEnabled', base_camera)
            cameras.append(base_camera)
        self.assertEqual(cameras[0], cameras[1])
        with self.assertRaises(KeyError):
            render_fingerprint(source, 'crystal-ar-on', camera, 256, 2400)

    def test_render_fingerprint_changes_when_any_frozen_dependency_changes(self):
        with tempfile.TemporaryDirectory() as folder:
            repo = Path(folder)
            tools = repo / 'tools/blender'
            tools.mkdir(parents=True)
            (tools / 'realism_hero.py').write_text('hero')
            (tools / 'realism_normalize_export.py').write_text('helper')
            run = repo / 'run'
            (run / 'web/public/assets').mkdir(parents=True)
            (run / 'assembly-manifest.json').write_text('{}')
            asset = run / 'web/public/assets/component.glb'
            asset.write_bytes(b'original')
            style = {'id': 'test', 'components': [{'visible': True, 'placement': {'glb': True}, 'descriptor': {'assetPath': '/assets/component.glb'}}]}
            before, evidence = fingerprint_base(repo, run, style)
            asset.write_bytes(b'changed')
            after, _ = fingerprint_base(repo, run, style)
            self.assertNotEqual(before, after)
            self.assertEqual(len(evidence), 1)


if __name__ == '__main__':
    unittest.main()
