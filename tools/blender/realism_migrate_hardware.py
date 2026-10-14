"""Migrate verified completed render fingerprints after a proven hardware-only edit.

Only selected, quiescent styles may be modified. The original CUDA/GPU capture
and image bytes remain authoritative; new HYBRID-produced fingerprints are
skipped. The migration ledger accumulates entries across repeated invocations.
"""
from __future__ import annotations
import argparse
import ast
import copy
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from realism_delivery_report import fingerprint_base, render_fingerprint, png_info


def sha(data):
    return hashlib.sha256(data).hexdigest()


def ast_proof(old_source, new_source):
    old_tree = ast.parse(old_source)
    current = ast.parse(new_source)
    old_assignment = ast.parse("d.use = d.type == 'CUDA'").body[0]
    new_assignment = ast.parse("d.use = d.type == 'CUDA' or (device == 'HYBRID' and d.type == 'CPU')").body[0]
    old_choices = ast.parse("['AUTO', 'CPU', 'CUDA']", mode='eval').body
    new_choices = ast.parse("['AUTO', 'CPU', 'CUDA', 'HYBRID']", mode='eval').body
    edits = []
    def dump(node):
        return ast.dump(node, include_attributes=False)
    class RestoreAllowedChanges(ast.NodeTransformer):
        def visit_Assign(self, node):
            if dump(node) == dump(new_assignment):
                edits.append({'line': node.lineno, 'kind': 'CUDA device predicate extended only when requested device is HYBRID',
                              'beforeAST': dump(old_assignment), 'afterAST': dump(node)})
                return copy.deepcopy(old_assignment)
            return self.generic_visit(node)
        def visit_Call(self, node):
            if isinstance(node.func, ast.Attribute) and node.func.attr == 'add_argument' and node.args and isinstance(node.args[0], ast.Constant) and node.args[0].value == '--device':
                for keyword in node.keywords:
                    if keyword.arg == 'choices' and dump(keyword.value) == dump(new_choices):
                        edits.append({'line': node.lineno, 'kind': 'HYBRID appended to device argparse choices',
                                      'beforeAST': dump(old_choices), 'afterAST': dump(keyword.value)})
                        keyword.value = copy.deepcopy(old_choices)
            return self.generic_visit(node)
    restored = RestoreAllowedChanges().visit(copy.deepcopy(current))
    if len(edits) != 2 or dump(restored) != dump(old_tree):
        raise ValueError('Producer changes exceed the two permitted hardware-only AST edits')
    if sum(dump(node) == dump(old_assignment) for node in ast.walk(old_tree)) != 1:
        raise ValueError('Expected exactly one original CUDA device assignment')
    table = []
    for requested in ['AUTO', 'CPU', 'CUDA', 'HYBRID']:
        for dtype in ['CUDA', 'CPU', 'OPTIX', 'OTHER']:
            old = dtype == 'CUDA'
            new = dtype == 'CUDA' or (requested == 'HYBRID' and dtype == 'CPU')
            table.append({'requestedDevice': requested, 'deviceType': dtype, 'oldEnabledPredicate': old, 'newEnabledPredicate': new})
    assert all(row['oldEnabledPredicate'] == row['newEnabledPredicate'] for row in table if row['requestedDevice'] != 'HYBRID')
    return {'permittedEditCount': 2, 'edits': edits, 'astIdenticalAfterReversingOnlyPermittedEdits': True,
            'oldASTSha256': sha(dump(old_tree).encode()), 'restoredNewASTSha256': sha(dump(restored).encode()),
            'cudaRequestBehaviorUnchanged': True, 'originalArgparseChoicesAndDefaultUnchanged': True,
            'cameraMaterialLightingPoseAndQualitySettingsASTUnchanged': True, 'predicateTruthTable': table}


def migrate(repo, run, selectors=None):
    old_path = run / 'reports/realism_hero-before-hybrid.py'
    new_path = repo / 'tools/blender/realism_hero.py'
    old_bytes, new_bytes = old_path.read_bytes(), new_path.read_bytes()
    proof = ast_proof(old_bytes.decode('utf-8'), new_bytes.decode('utf-8'))
    old_sha, new_sha = sha(old_bytes), sha(new_bytes)
    ledger_path = run / 'reports/hardware-fingerprint-migration.json'
    previous = json.loads(ledger_path.read_text()) if ledger_path.exists() else {}
    if previous and (previous.get('oldProducerSHA') != old_sha or previous.get('currentProducerSHA') != new_sha):
        raise ValueError('Existing migration ledger belongs to different producer sources')
    accumulated = {(item['style'], item['shot'], item['imageSha256']): item for item in previous.get('migrations', [])}
    camera_provenance_path = run / 'reports/render-fingerprint-migration.json'
    prior = json.loads(camera_provenance_path.read_text()) if camera_provenance_path.exists() else {}
    assembly = json.loads((run / 'assembly-manifest.json').read_text())
    selected = [style for style in assembly['styles'] if not selectors or 'all' in selectors or style['id'] in selectors]
    if not selected:
        raise ValueError('No selected frozen styles')
    for item in accumulated.values():
        item.setdefault('actualProducerSHA', item['originalProducerSHA'])
        item.setdefault('priorEquivalentProducerSha256', old_sha)
    current_images, skipped, metadata_changes = [], [], []
    newly_migrated = 0
    for style in selected:
        identifier = style['id']
        metadata_path = run / 'styles' / identifier / 'shots.json'
        if not metadata_path.exists():
            skipped.append({'style': identifier, 'reason': 'No final shots metadata'})
            continue
        metadata_bytes = metadata_path.read_bytes()
        metadata = json.loads(metadata_bytes)
        original_metadata = copy.deepcopy(metadata)
        old_digest, _ = fingerprint_base(repo, run, style, old_bytes)
        new_digest, _ = fingerprint_base(repo, run, style, new_bytes)
        for shot, description in metadata.get('shots', {}).items():
            if not description.get('completed'):
                skipped.append({'style': identifier, 'shot': shot, 'reason': 'Not completed'})
                continue
            image = run / 'renders' / identifier / (shot + '.png')
            image_info = png_info(image)
            if image_info['sha256'] != description.get('imageSha256') or image_info['resolution'] != description.get('resolution'):
                raise ValueError('Completed image hash/resolution mismatch: ' + identifier + '/' + shot)
            if metadata.get('engine') != 'CYCLES' or metadata.get('samples', 0) < 256 or image_info['resolution'][0] < 2400:
                skipped.append({'style': identifier, 'shot': shot, 'reason': 'Not final2400/256 Cycles quality'})
                continue
            expected_old, _ = render_fingerprint(old_digest, shot, description, metadata['samples'], image_info['resolution'][0])
            expected_new, _ = render_fingerprint(new_digest, shot, description, metadata['samples'], image_info['resolution'][0])
            stored = description.get('renderFingerprint')
            if stored == expected_new:
                if description.get('hardwareOnlyFingerprintMigration'):
                    description.setdefault('actualProducerSHA', description['originalProducerSHA'])
                    description.setdefault('priorEquivalentProducerSha256', old_sha)
                    description['hardwareOnlyFingerprintMigration'].setdefault('actualProducerSHA', description['originalProducerSHA'])
                    description['hardwareOnlyFingerprintMigration'].setdefault('priorEquivalentProducerSha256', old_sha)
                current_images.append({'style': identifier, 'shot': shot, 'imageSha256': image_info['sha256'],
                                       'originalProducerSHA': description.get('originalProducerSHA', new_sha),
                                       'reason': 'Already current producer fingerprint; metadata unchanged'})
                continue
            if stored != expected_old:
                raise ValueError('Completed shot fingerprint matches neither verified producer: ' + identifier + '/' + shot)
            original_producer = description.get('originalProducerSHA', old_sha)
            prior_matches = [record for record in prior.get('migrations', []) if record.get('shot') == shot and record.get('imageSha256') == image_info['sha256'] and record.get('currentFingerprint') == stored]
            if prior_matches and not description.get('originalProducerSHA'):
                original_producer = prior.get('oldProducerSha256', old_sha)
            reason = 'Hardware-only compatible producer change: HYBRID extends device selection; original CUDA/GPU image pixels and camera/material/lighting/pose/quality recipe are unchanged.'
            migration = {'style': identifier, 'shot': shot, 'imageSha256': image_info['sha256'],
                         'originalProducerSHA': original_producer, 'actualProducerSHA': original_producer,
                         'priorEquivalentProducerSha256': old_sha, 'previousFingerprintProducerSHA': old_sha,
                         'currentFingerprintProducerSHA': new_sha, 'previousFingerprint': stored,
                         'currentFingerprint': expected_new, 'originalRequestedDevice': 'CUDA',
                         'originalSceneDevice': metadata.get('device'), 'reason': reason,
                         'priorCameraMigrationReport': 'reports/render-fingerprint-migration.json' if prior_matches else None,
                         'pixelFilesModified': False}
            accumulated[(identifier, shot, image_info['sha256'])] = migration
            description['originalProducerSHA'] = original_producer
            description['actualProducerSHA'] = original_producer
            description['priorEquivalentProducerSha256'] = old_sha
            description['originalRequestedDevice'] = 'CUDA'
            description['originalSceneDevice'] = metadata.get('device')
            description['hardwareOnlyFingerprintMigration'] = copy.deepcopy(migration)
            description['renderFingerprint'] = expected_new
            newly_migrated += 1
            assert sha(image.read_bytes()) == image_info['sha256']
        if metadata != original_metadata:
            if metadata_path.read_bytes() != metadata_bytes:
                raise ValueError('Metadata changed concurrently; retry only after selected style writer finishes')
            encoded = (json.dumps(metadata, indent=2) + '\n').encode('utf-8')
            temporary = metadata_path.with_name(metadata_path.name + '.hardware-migration-tmp')
            try:
                temporary.write_bytes(encoded)
                temporary.replace(metadata_path)
            finally:
                if temporary.exists():
                    temporary.unlink()
            metadata_changes.append({'style': identifier, 'beforeSha256': sha(metadata_bytes), 'afterSha256': sha(encoded),
                                     'deviceBefore': original_metadata.get('device'), 'deviceAfter': metadata.get('device')})
    report = {'schema': 'dial-designer/hardware-only-fingerprint-migration/v1', 'updatedUtc': datetime.now(timezone.utc).isoformat(),
              'oldProducerPath': str(old_path.relative_to(run)).replace('\\', '/'), 'oldProducerSHA': old_sha,
              'currentProducerPath': 'tools/blender/realism_hero.py', 'currentProducerSHA': new_sha,
              'proof': proof, 'newlyMigratedCount': newly_migrated, 'totalMigratedCount': len(accumulated),
              'migrations': list(accumulated.values()), 'alreadyCurrent': current_images, 'skipped': skipped,
              'metadataChangesThisRun': metadata_changes, 'pixelFilesModified': False,
              'provenanceNote': 'Original producer SHA and CUDA/GPU capture retained; current fingerprints do not claim that accepted images were rendered again or used HYBRID.'}
    ledger_path.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--run', type=Path, required=True)
    parser.add_argument('--style', action='append', help='Repeat exact frozen style IDs; default/all processes completed shots in all quiescent styles')
    args = parser.parse_args()
    report = migrate(args.repo.resolve(), args.run.resolve(), args.style)
    print(json.dumps({'newlyMigrated': report['newlyMigratedCount'], 'totalMigrated': report['totalMigratedCount'],
                      'alreadyCurrent': len(report['alreadyCurrent']), 'permittedASTEdits': report['proof']['permittedEditCount'], 'pixelFilesModified': False}))


if __name__ == '__main__':
    main()
