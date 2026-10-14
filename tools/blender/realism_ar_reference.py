"""Reuse the verified AR-on three-quarter photograph as the comparison reference.

The hero and AR-on camera/settings are identical in realism_hero.py. This copies
pixels without editing them and records the shared render rather than computing
the same view twice. Run between Blender jobs, never during a metadata write.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import shutil
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from realism_delivery_report import fingerprint_base


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--run', type=Path, required=True)
    args = parser.parse_args()
    repo, run = args.repo.resolve(), args.run.resolve()
    identifier = 'archetype-dress-formal'
    style = next(s for s in json.loads((run / 'assembly-manifest.json').read_text())['styles'] if s['id'] == identifier)
    path = run / 'styles' / identifier / 'shots.json'
    metadata = json.loads(path.read_text())
    source = metadata['shots']['hero-three-quarter']
    image = run / 'renders' / identifier / 'hero-three-quarter.png'
    source_digest, _ = fingerprint_base(repo, run, style)
    camera = {key: source[key] for key in ('target', 'camera', 'lensMm', 'focusDistanceM', 'fStop')}
    def fingerprint(shot, description):
        return hashlib.sha256(source_digest + json.dumps({'shot': shot, 'camera': description,
            'samples': metadata['samples'], 'width': source['resolution'][0], 'draft': False}, sort_keys=True).encode()).hexdigest()
    assert source['completed'] and metadata['samples'] >= 256 and source['resolution'][0] >= 2400
    assert source['renderFingerprint'] == fingerprint('hero-three-quarter', camera)
    assert hashlib.sha256(image.read_bytes()).hexdigest() == source['imageSha256']
    comparison = copy.deepcopy(source)
    camera['arEnabled'] = True
    comparison['arEnabled'] = True
    comparison['renderFingerprint'] = fingerprint('crystal-ar-on', camera)
    comparison['reuseOfRenderedShot'] = 'hero-three-quarter'
    comparison['reuseReason'] = 'Identical 0.035 AR blend, camera, pose, lights, sample settings and fixed seed. Pixel data copied unchanged; render seconds refer to the shared original render.'
    destination = image.with_name('crystal-ar-on.png')
    shutil.copyfile(str(image), str(destination))
    metadata['shots']['crystal-ar-on'] = comparison
    path.write_text(json.dumps(metadata, indent=2) + '\n')
    report = {'source': str(image), 'comparison': str(destination), 'sha256': source['imageSha256'],
              'pixelFilesIdentical': image.read_bytes() == destination.read_bytes(),
              'sharedRenderSeconds': source['seconds'], 'arBlend': .035, 'reason': comparison['reuseReason']}
    (run / 'reports' / 'ar-reference-reuse.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
