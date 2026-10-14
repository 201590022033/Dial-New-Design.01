"""Hardware migration safety and provenance tests; no Blender dependency."""
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parent))
import realism_migrate_hardware as subject

OLD = "d.use = d.type == 'CUDA'\np.add_argument('--device', choices=['AUTO', 'CPU', 'CUDA'], default='AUTO')\nquality = 256\n"
NEW = "d.use = d.type == 'CUDA' or (device == 'HYBRID' and d.type == 'CPU')\np.add_argument('--device', choices=['AUTO', 'CPU', 'CUDA', 'HYBRID'], default='AUTO')\nquality = 256\n"

class HardwareMigrationTests(unittest.TestCase):
    def test_exact_two_edits_preserve_previous_device_behavior(self):
        proof = subject.ast_proof(OLD, NEW)
        self.assertEqual(proof['permittedEditCount'], 2)
        self.assertEqual(proof['oldASTSha256'], proof['restoredNewASTSha256'])
        for row in proof['predicateTruthTable']:
            if row['requestedDevice'] != 'HYBRID':
                self.assertEqual(row['oldEnabledPredicate'], row['newEnabledPredicate'])
        self.assertTrue(next(row for row in proof['predicateTruthTable'] if row['requestedDevice'] == 'HYBRID' and row['deviceType'] == 'CPU')['newEnabledPredicate'])

    def test_unrelated_quality_default_or_predicate_edit_rejected(self):
        for bad in [NEW.replace('quality = 256', 'quality = 64'), NEW.replace("default='AUTO'", "default='HYBRID'"), NEW.replace("d.type == 'CPU'", "d.type != 'CUDA'")]:
            with self.subTest(source=bad), self.assertRaises(ValueError):
                subject.ast_proof(OLD, bad)

    def test_accumulates_idempotently_preserves_actual_origin_and_pixels(self):
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory)
            run = repo / 'run'
            (repo / 'tools/blender').mkdir(parents=True)
            (run / 'reports').mkdir(parents=True)
            (repo / 'tools/blender/realism_hero.py').write_bytes(NEW.encode())
            (run / 'reports/realism_hero-before-hybrid.py').write_bytes(OLD.encode())
            styles = [{'id': 'lady'}, {'id': 'field'}, {'id': 'hybrid'}]
            (run / 'assembly-manifest.json').write_text(json.dumps({'styles': styles}))
            image_hashes = {}
            for style in styles:
                identifier = style['id']
                (run / 'styles' / identifier).mkdir(parents=True)
                (run / 'renders' / identifier).mkdir(parents=True)
                pixels = ('untouched pixels ' + identifier).encode()
                image_hashes[identifier] = hashlib.sha256(pixels).hexdigest()
                (run / 'renders' / identifier / 'hero-quarter.png').write_bytes(pixels)
                metadata = {'engine': 'CYCLES', 'samples': 256, 'device': 'GPU', 'shots': {'hero-quarter': {'completed': True, 'imageSha256': image_hashes[identifier], 'resolution': [2400, 2400], 'renderFingerprint': 'new' if identifier == 'hybrid' else 'old'}}}
                (run / 'styles' / identifier / 'shots.json').write_text(json.dumps(metadata))
            (run / 'reports/render-fingerprint-migration.json').write_text(json.dumps({'oldProducerSha256': 'actual-before-camera-fix', 'migrations': [{'shot': 'hero-quarter', 'imageSha256': image_hashes['lady'], 'currentFingerprint': 'old'}]}))
            def base(repo, run, style, producer_bytes):
                return ('old' if producer_bytes.decode() == OLD else 'new'), {}
            def image_info(path):
                return {'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'resolution': [2400, 2400]}
            with patch.object(subject, 'fingerprint_base', side_effect=base), patch.object(subject, 'render_fingerprint', side_effect=lambda digest, *args: (digest, {})), patch.object(subject, 'png_info', side_effect=image_info):
                first = subject.migrate(repo, run, ['lady'])
                self.assertEqual(first['totalMigratedCount'], 1)
                self.assertEqual(first['migrations'][0]['actualProducerSHA'], 'actual-before-camera-fix')
                self.assertEqual(first['migrations'][0]['priorEquivalentProducerSha256'], subject.sha(OLD.encode()))
                second = subject.migrate(repo, run, ['field'])
                self.assertEqual(second['totalMigratedCount'], 2)
                before = (run / 'styles/hybrid/shots.json').read_bytes()
                third = subject.migrate(repo, run)
                self.assertEqual(third['newlyMigratedCount'], 0)
                self.assertEqual(third['totalMigratedCount'], 2)
                self.assertEqual((run / 'styles/hybrid/shots.json').read_bytes(), before)
                for style in styles:
                    identifier = style['id']
                    self.assertEqual(subject.sha((run / 'renders' / identifier / 'hero-quarter.png').read_bytes()), image_hashes[identifier])
                lady = json.loads((run / 'styles/lady/shots.json').read_text())
                self.assertEqual(lady['device'], 'GPU')
                self.assertEqual(lady['shots']['hero-quarter']['originalRequestedDevice'], 'CUDA')
                self.assertEqual(lady['shots']['hero-quarter']['actualProducerSHA'], 'actual-before-camera-fix')

if __name__ == '__main__':
    unittest.main()

