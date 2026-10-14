"""Verify the local realism delivery without Blender or third-party libraries.

Use --allow-incomplete while the serial render batch is running. Strict mode
requires all 20 final images and matching completed metadata/dependencies.
"""
from __future__ import annotations
import argparse
import base64
import csv
import hashlib
import json
import re
import struct
import zlib
from datetime import datetime, timezone
from pathlib import Path

STYLE_COUNT = 6
COMPONENT_COUNT = 101
SHOT_NAMES = ('hero-front', 'hero-three-quarter', 'hero-strap-macro')
DRESS_ID = 'archetype-dress-formal'
STYLE_IDS = {DRESS_ID, 'archetype-ladies-dress-nh05', 'archetype-field', 'archetype-dive', 'archetype-pilot', 'archetype-chronograph'}
CAMERA_KEYS = ('target', 'camera', 'lensMm', 'focusDistanceM', 'fStop')
LIMITS = {'trianglesTarget': 180000, 'trianglesReviewCeiling': 250000,
          'componentDownloadTargetBytes': 8 * 1024 * 1024,
          'componentDownloadReviewCeilingBytes': 12 * 1024 * 1024,
          'textureMaximumPx': 2048, 'renderMinimumWidthPx': 2400,
          'cyclesMinimumConfiguredMaximumSamples': 256}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def json_file(path):
    raw = Path(path).read_bytes()
    encoding = 'utf-16' if raw[:2] in (b'\xff\xfe', b'\xfe\xff') else 'utf-8-sig'
    return json.loads(raw.decode(encoding))


def image_dimensions(data):
    if data.startswith(b'\x89PNG\r\n\x1a\n') and len(data) >= 24:
        dimensions = list(struct.unpack_from('>II', data, 16))
        if data[12:16] != b'IHDR' or not all(dimensions):
            raise ValueError('Invalid PNG dimensions/header')
        return dimensions
    if data.startswith(b'\xff\xd8'):
        offset = 2
        while offset + 4 <= len(data):
            if data[offset] != 255:
                raise ValueError('Invalid JPEG marker')
            marker = data[offset + 1]
            offset += 2
            if marker in (0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
                continue
            length = struct.unpack_from('>H', data, offset)[0]
            if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                height, width = struct.unpack_from('>HH', data, offset + 3)
                return [width, height]
            if length < 2:
                raise ValueError('Invalid JPEG segment')
            offset += length
    raise ValueError('Unsupported/truncated image')


def png_info(path):
    data = Path(path).read_bytes()
    dimensions = image_dimensions(data)
    if not data.startswith(b'\x89PNG\r\n\x1a\n'):
        raise ValueError('Final render must be PNG')
    offset, saw_idat, saw_end = 8, False, False
    while offset + 12 <= len(data):
        length = struct.unpack_from('>I', data, offset)[0]
        kind = data[offset + 4:offset + 8]
        end = offset + 12 + length
        if end > len(data):
            raise ValueError('Truncated PNG chunk')
        expected = struct.unpack_from('>I', data, offset + 8 + length)[0]
        if zlib.crc32(data[offset + 4:offset + 8 + length]) & 0xFFFFFFFF != expected:
            raise ValueError('PNG CRC mismatch')
        saw_idat = saw_idat or kind == b'IDAT'
        if kind == b'IEND':
            saw_end = True
            if length or end != len(data):
                raise ValueError('Invalid PNG ending')
            break
        offset = end
    if not saw_idat or not saw_end:
        raise ValueError('PNG has no complete image stream')
    return {'sha256': sha(data), 'bytes': len(data), 'resolution': dimensions, 'pngChunksCompleteAndCRCValid': True}


def glb_info(path):
    path = Path(path)
    raw = path.read_bytes()
    if len(raw) < 20 or struct.unpack_from('<4sII', raw) != (b'glTF', 2, len(raw)):
        raise ValueError('Invalid GLB header')
    offset, document, binary = 12, None, None
    while offset < len(raw):
        length, kind = struct.unpack_from('<II', raw, offset)
        if offset + 8 + length > len(raw) or length % 4:
            raise ValueError('Invalid GLB chunk')
        payload = raw[offset + 8:offset + 8 + length]
        if kind == 0x4E4F534A:
            document = json.loads(payload)
        elif kind == 0x004E4942:
            binary = payload
        offset += 8 + length
    if document is None or binary is None:
        raise ValueError('GLB missing embedded JSON/BIN')
    mesh_triangles = []
    for mesh in document.get('meshes', []):
        count = 0
        for primitive in mesh['primitives']:
            accessor = document['accessors'][primitive['indices']] if 'indices' in primitive else document['accessors'][primitive['attributes']['POSITION']]
            mode = primitive.get('mode', 4)
            count += accessor['count'] // 3 if mode == 4 else max(0, accessor['count'] - 2) if mode in (5, 6) else 0
        mesh_triangles.append(count)
    nodes = document.get('nodes', [])
    roots = document.get('scenes', [{}])[document.get('scene', 0)].get('nodes')
    if roots is None:
        children = {child for node in nodes for child in node.get('children', [])}
        roots = [i for i in range(len(nodes)) if i not in children]
    def triangles(index, ancestry):
        if index in ancestry:
            raise ValueError('Cyclic GLB hierarchy')
        node = nodes[index]
        return (mesh_triangles[node['mesh']] if 'mesh' in node else 0) + sum(triangles(child, ancestry | {index}) for child in node.get('children', []))
    textures = []
    for image_index, image in enumerate(document.get('images', [])):
        if 'bufferView' in image:
            view = document['bufferViews'][image['bufferView']]
            start = view.get('byteOffset', 0)
            content = binary[start:start + view['byteLength']]
        elif image.get('uri', '').startswith('data:'):
            content = base64.b64decode(image['uri'].split(',', 1)[1])
        else:
            external = (path.parent / image['uri']).resolve()
            external.relative_to(path.parent.resolve())
            content = external.read_bytes()
        textures.append({'image': image_index, 'name': image.get('name'), 'bytes': len(content), 'dimensions': image_dimensions(content)})
    return {'sha256': sha(raw), 'bytes': len(raw), 'storedTriangles': sum(mesh_triangles),
            'instantiatedTriangles': sum(triangles(index, set()) for index in roots),
            'nodes': len(nodes), 'meshes': len(mesh_triangles), 'materials': len(document.get('materials', [])),
            'extensions': document.get('extensionsUsed', []), 'textures': textures,
            'textureMaximumPx': max([max(image['dimensions']) for image in textures] or [0])}


def fingerprint_base(repo, run, style, producer_bytes=None):
    digest = hashlib.sha256(((repo / 'tools/blender/realism_hero.py').read_bytes() if producer_bytes is None else producer_bytes) +
                            (repo / 'tools/blender/realism_normalize_export.py').read_bytes() +
                            (run / 'assembly-manifest.json').read_bytes())
    dependencies = []
    for component in style['components']:
        if component['visible'] and component['placement']['glb']:
            path = run / 'web' / ('public' + component['descriptor']['assetPath'])
            content = path.read_bytes()
            digest.update(content)
            dependencies.append({'path': str(path.relative_to(run)).replace('\\', '/'), 'sha256': sha(content)})
    for path in sorted((run / 'bakes/artwork' / style['id']).glob('*.png')):
        content = path.read_bytes()
        digest.update(content)
        dependencies.append({'path': str(path.relative_to(run)).replace('\\', '/'), 'sha256': sha(content)})
    return digest.digest(), dependencies


def render_fingerprint(source_digest, shot, description, samples, width):
    base_camera = {key: description[key] for key in CAMERA_KEYS}
    fingerprint_camera = dict(base_camera)
    if shot.startswith('crystal-ar-'):
        fingerprint_camera['arEnabled'] = description['arEnabled']
    expected = hashlib.sha256(source_digest + json.dumps({'shot': shot, 'camera': fingerprint_camera,
                                                         'samples': samples, 'width': width, 'draft': False}, sort_keys=True).encode()).hexdigest()
    return expected, base_camera


def readable_changes(run, changes, accounting):
    fields = ['path', 'status', 'sourceSha256', 'candidateSha256', 'bytesBefore', 'bytesAfter',
              'trianglesBefore', 'trianglesAfter', 'imagesBefore', 'imagesAfter', 'primitivesBefore', 'primitivesAfter',
              'roles', 'maps', 'extensions', 'addedObjects', 'newSurfaceUVObjects', 'anisotropyFrames', 'preservation', 'featureLosses']
    rows = []
    for item in changes['files']:
        before, after = item.get('before', {}), item.get('after', {})
        rows.append({'path': item['path'], 'status': item.get('status'), 'sourceSha256': item.get('source_sha256'),
                     'candidateSha256': item.get('candidate_sha256'), 'bytesBefore': item.get('source_bytes'),
                     'bytesAfter': item.get('candidate_bytes'), 'trianglesBefore': before.get('instantiated_triangles'),
                     'trianglesAfter': after.get('instantiated_triangles'),
                     'imagesBefore': before.get('images'), 'imagesAfter': after.get('images'),
                     'primitivesBefore': before.get('primitives'), 'primitivesAfter': after.get('primitives'),
                     'roles': '; '.join(sorted({change.get('role', 'unknown') for change in item.get('changes', [])})),
                     'maps': '; '.join(str(size[0]) + 'x' + str(size[1]) for size in item.get('new_map_dimensions', [])),
                     'extensions': '; '.join(item.get('extensions', [])),
                     'addedObjects': '; '.join(item.get('added_detail_objects', [])),
                     'newSurfaceUVObjects': '; '.join(item.get('added_surface_uv_objects', [])),
                     'anisotropyFrames': json.dumps(item.get('anisotropy', []), separators=(',', ':')),
                     'preservation': item.get('preservation', ''),
                     'featureLosses': '; '.join(item.get('feature_losses', []))})
    target = run / 'reports/per-file-changes.csv'
    with target.open('w', newline='', encoding='utf-8-sig') as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)
    lines = ['Per-file realism change log', '', 'All ' + str(len(rows)) + ' eligible component inputs are listed. Source/candidate SHA256 and full per-file omissions are in per-file-changes.csv.', '',
             '| Component | Status | Bytes before -> after | Triangles before -> after | New map sizes | Added detail objects |',
             '| --- | --- | ---: | ---: | --- | --- |']
    for row in rows:
        lines.append('| `' + row['path'] + '` | ' + str(row['status']) + ' | ' + str(row['bytesBefore']) + ' -> ' + str(row['bytesAfter']) +
                     ' | ' + str(row['trianglesBefore']) + ' -> ' + str(row['trianglesAfter']) + ' | ' + (row['maps'] or 'none') + ' | ' + (row['addedObjects'] or 'none') + ' |')
    lines += ['', 'Per-file surface roles, extensions and omissions', '']
    for row in rows:
        lines += ['- `' + row['path'] + '`: roles ' + (row['roles'] or 'authored preserved') + '; extensions ' + (row['extensions'] or 'none') + '. Added surface-map UVs: ' + (row['newSurfaceUVObjects'] or 'none') + '. Omissions: ' + (row['featureLosses'] or 'none recorded')]
    lines += ['', 'Excluded inputs (preserved)', ''] + ['- `' + item['path'] + '`: ' + item.get('reason', '') for item in accounting.get('excluded', [])]
    (run / 'reports/per-file-changes.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    return len(rows)


def runtime_budget_evidence(browser):
    observations = []
    def style_id(value):
        if not isinstance(value, str):
            return None
        text = value.lower()
        for token, identifier in [('chronograph', 'archetype-chronograph'), ('pilot', 'archetype-pilot'),
                                  ('ladies', 'archetype-ladies-dress-nh05'), ('dive', 'archetype-dive'),
                                  ('field', 'archetype-field'), ('dress', DRESS_ID)]:
            if token in text:
                return identifier
        return None
    def walk(value, location='$', inherited=None):
        if isinstance(value, str) and value.lstrip().startswith('{'):
            try:
                value = json.loads(value)
            except ValueError:
                return
        if isinstance(value, dict):
            identifier = next((style_id(value.get(key)) for key in ('styleId', 'style', 'name', 'label', 'archetypeId') if style_id(value.get(key))), inherited)
            if identifier and isinstance(value.get('triangles'), (int, float)) and isinstance(value.get('calls'), (int, float)):
                observations.append({'style': identifier, 'evidencePath': location, 'triangles': value['triangles'], 'calls': value['calls'],
                                     'frames': value.get('frames'), 'geometries': value.get('geometries'), 'textures': value.get('textures')})
            for key, child in value.items():
                walk(child, location + '.' + key, style_id(key) or identifier)
        elif isinstance(value, list):
            for index, child in enumerate(value):
                walk(child, location + '[' + str(index) + ']', inherited)
    walk(browser)
    exceptions = []
    for identifier in sorted({value['style'] for value in observations}):
        values = [value for value in observations if value['style'] == identifier]
        for metric, target, ceiling in [('triangles', LIMITS['trianglesTarget'], LIMITS['trianglesReviewCeiling']), ('calls', 400, None)]:
            peak = max(values, key=lambda value: value[metric])
            if peak[metric] > target:
                exceptions.append({'scope': 'runtime-renderer-diagnostic', 'style': identifier, 'metric': metric,
                                   'value': peak[metric], 'target': target, 'reviewCeiling': ceiling, 'requiresReview': True,
                                   'provisionalGate': metric == 'calls', 'source': 'reports/browser/acceptance.json' + peak['evidencePath'],
                                   'reason': 'Renderer.info counts rendered work including transmission/multiple passes, not standalone unique geometry. Protected live pilot scale geometry and chronograph details were retained; no geometry was decimated to hide these measured costs.',
                                   'qualificationLimit': 'Partial browser observations may include warmup/stale demand frames; complete 20-swap settled resource stability is not established.'})
    return observations, exceptions


def verify(repo, run):
    errors, pending, exceptions = [], [], []
    report = {'schema': 'dial-designer/realism-delivery/v1', 'generatedUtc': datetime.now(timezone.utc).isoformat(),
              'generator': {'path': 'tools/blender/realism_delivery_report.py', 'sha256': sha(Path(__file__).read_bytes())},
              'limits': LIMITS, 'errors': errors, 'pending': pending, 'budgetExceptions': exceptions,
              'committed': False, 'pushed': False, 'browserQualification': 'Partial recorded browser evidence only; full 20-swap stable-resource qualification is not established.',
              'renderSamplingNote': '256 is the configured maximum with adaptive sampling; this does not establish 256 samples at every pixel.'}
    promotion = json_file(run / 'reports/promotion-manifest.json')
    revision = re.search(r"WATCH_ASSET_REVISION = '([^']+)'", (repo / 'src/visual3d/glbLoadUrl.ts').read_text()).group(1)
    report['assetRevision'] = revision
    report['promotionRecordedAssetRevision'] = promotion.get('assetRevision')
    if promotion.get('assetRevision') != revision:
        pending.append('Promotion manifest cache revision differs from current application revision')
    changes = json_file(run / 'reports/asset-changes.json')
    accounting = json_file(run / 'reports/asset-accounting.json')
    manifest = json_file(repo / 'docs/realism/VR0-INPUT-MANIFEST.json')
    frozen_hash = sha((repo / 'docs/realism/VR0-INPUT-MANIFEST.json').read_bytes())
    eligible = {item['path']: item for item in manifest['files'] if item['eligible']}
    change_map = {item['path']: item for item in changes['files']}
    if len(eligible) != COMPONENT_COUNT or len(promotion['files']) != COMPONENT_COUNT or len(change_map) != COMPONENT_COUNT:
        errors.append('Expected exactly 101 eligible/promoted/change-log components')
    if accounting.get('processed_count') != COMPONENT_COUNT or accounting.get('pending'):
        errors.append('Input accounting is incomplete')
    if frozen_hash != promotion.get('inputManifestSha256') or frozen_hash != accounting.get('manifest_sha256'):
        errors.append('Frozen input manifest dependency hash mismatch')
    if {item['path'] for item in promotion['files']} != set(eligible) or set(change_map) != set(eligible):
        errors.append('Eligible, promoted and change-log component path sets differ')
    component_results = []
    for item in promotion['files']:
        name = item['path']
        current, staged = repo / name, run / 'web' / name
        record = {'path': name, 'expectedSha256': item['candidateSha256']}
        try:
            record.update(sha256=sha(current.read_bytes()), bytes=current.stat().st_size, stagedSha256=sha(staged.read_bytes()))
            if record['sha256'] != record['expectedSha256'] or record['stagedSha256'] != record['expectedSha256']:
                errors.append('Promoted/staged component hash mismatch: ' + name)
            original = eligible[name]
            if original['sha256'] != item['sourceSha256'] or change_map[name]['source_sha256'] != item['sourceSha256']:
                errors.append('Historical source hash mismatch: ' + name)
            if change_map[name]['candidate_sha256'] != item['candidateSha256']:
                errors.append('Per-file change-log candidate mismatch: ' + name)
            backup = Path(change_map[name]['source_read_path'])
            record['sourceBackupSha256'] = sha(backup.read_bytes())
            if record['sourceBackupSha256'] != item['sourceSha256']:
                errors.append('Immutable source backup mismatch: ' + name)
        except (OSError, KeyError, ValueError) as error:
            errors.append('Component dependency failure ' + name + ': ' + str(error))
        component_results.append(record)
    report['excludedInputs'] = []
    for original in manifest['files']:
        if original['eligible']:
            continue
        path = original['path']
        backup = repo / '.artifacts/blender-review/realism/vr0-2026-10-13/backup' / path
        try:
            record = {'path': path, 'historicalSha256': original['sha256'], 'currentSha256': sha((repo / path).read_bytes()), 'backupSha256': sha(backup.read_bytes()), 'reason': original.get('reason')}
            if record['historicalSha256'] != record['currentSha256'] or record['historicalSha256'] != record['backupSha256']:
                errors.append('Excluded review input changed or backup mismatch: ' + path)
            report['excludedInputs'].append(record)
        except OSError as error:
            errors.append('Excluded input/backup missing ' + path + ': ' + str(error))
    report['sourceBackupsVerified'] = len(component_results) + len(report['excludedInputs'])
    report['components'] = component_results
    report['inputAccounting'] = accounting
    report['frozenInputManifestSha256'] = frozen_hash
    report['changeLogRows'] = readable_changes(run, changes, accounting)
    contract = json_file(run / 'reports/asset-final-contract.json')
    if not contract.get('passed') or len(contract.get('files', [])) != COMPONENT_COUNT:
        errors.append('Preservation contract is not a 101-file pass')
    promoted = {item['path']: item for item in promotion['files']}
    for item in contract.get('files', []):
        name = item['candidate'].replace('\\', '/')
        name = name[name.index('public/assets/3d/'):]
        if name not in promoted or item['after']['sha256'] != promoted[name]['candidateSha256']:
            errors.append('Preservation contract candidate hash mismatch: ' + name)
        if any(max(image.get('dimensions', [0])) > LIMITS['textureMaximumPx'] for image in item['after'].get('images', [])):
            errors.append('Component texture exceeds 2048px: ' + name)
    recipe = json_file(run / 'reports/surface-recipes.json')
    if recipe.get('script_sha256') != sha((repo / 'tools/blender/realism_assets.py').read_bytes()):
        pending.append('Surface-recipe script hash differs from current dependency')
    construction = run / 'work/public/assets/3d/archetypes/strap-leather.blend'
    if construction.exists():
        report['leatherConstructionSource'] = {'path': str(construction.relative_to(run)).replace('\\', '/'),
                                               'sha256': sha(construction.read_bytes()), 'bytes': construction.stat().st_size}
    else:
        pending.append('Missing modifier-based leather construction source')
    assembly = json_file(run / 'assembly-manifest.json')
    if len(assembly['styles']) != STYLE_COUNT or {style['id'] for style in assembly['styles']} != STYLE_IDS:
        errors.append('Expected six frozen assembly styles')
    report['styles'] = []
    report['requiredFinalImages'] = 20
    completed = 0
    for style in assembly['styles']:
        identifier = style['id']
        result = {'id': identifier, 'label': style['label'], 'shots': []}
        report['styles'].append(result)
        directory = run / 'styles' / identifier
        glb = directory / 'watch.glb'
        try:
            result['standalone'] = glb_info(glb)
            if result['standalone']['textureMaximumPx'] > LIMITS['textureMaximumPx']:
                errors.append('Standalone texture exceeds 2048px: ' + identifier)
            triangles = result['standalone']['instantiatedTriangles']
            if triangles > LIMITS['trianglesTarget']:
                exceptions.append({'style': identifier, 'metric': 'standaloneInstantiatedTriangles', 'value': triangles,
                                   'target': LIMITS['trianglesTarget'], 'reviewCeiling': LIMITS['trianglesReviewCeiling'], 'requiresReview': True})
            if triangles > LIMITS['trianglesReviewCeiling']:
                errors.append('Standalone exceeds 250k triangle review ceiling: ' + identifier)
        except (OSError, ValueError, KeyError, struct.error) as error:
            pending.append('Standalone missing/incomplete ' + identifier + ': ' + str(error))
        paths = sorted({'public' + component['descriptor']['assetPath'] for component in style['components'] if component['visible'] and component['placement']['glb']})
        download = sum((repo / name).stat().st_size for name in paths)
        result['componentDownload'] = {'paths': paths, 'distinctBytes': download, 'target8MiB': download <= LIMITS['componentDownloadTargetBytes'],
                                       'within12MiBReviewCeiling': download <= LIMITS['componentDownloadReviewCeilingBytes']}
        if download > LIMITS['componentDownloadTargetBytes']:
            exceptions.append({'style': identifier, 'metric': 'distinctComponentDownloadBytes', 'value': download,
                               'target': LIMITS['componentDownloadTargetBytes'], 'reviewCeiling': LIMITS['componentDownloadReviewCeilingBytes'], 'requiresReview': True})
        if download > LIMITS['componentDownloadReviewCeilingBytes']:
            errors.append('Component download exceeds 12MiB review ceiling: ' + identifier)
        blend = directory / 'source.blend'
        if blend.exists() and blend.stat().st_size:
            result['sourceBlend'] = {'path': str(blend.relative_to(run)).replace('\\', '/'), 'bytes': blend.stat().st_size, 'sha256': sha(blend.read_bytes())}
        else:
            pending.append('Missing source.blend: ' + identifier)
        try:
            metadata = json_file(directory / 'shots.json')
        except (OSError, ValueError):
            metadata = {}
        result['renderMetadata'] = {key: metadata.get(key) for key in ('samples', 'adaptiveSampling', 'engine', 'denoiser', 'colourManagement', 'device')}
        source_digest, dependencies = fingerprint_base(repo, run, style)
        result['renderDependencies'] = dependencies
        names = list(SHOT_NAMES) + (['crystal-ar-on', 'crystal-ar-off'] if identifier == DRESS_ID else [])
        for shot in names:
            image = run / 'renders' / identifier / (shot + '.png')
            item = {'name': shot, 'path': str(image.relative_to(run)).replace('\\', '/'), 'verifiedComplete': False}
            result['shots'].append(item)
            issues = []
            description = metadata.get('shots', {}).get(shot, {})
            if metadata.get('style') != identifier or metadata.get('assemblyManifest') != 'assembly-manifest.json':
                issues.append('render metadata identifies a different assembly')
            try:
                item.update(png_info(image))
                if not description.get('completed'):
                    issues.append('metadata not completed')
                if item['sha256'] != description.get('imageSha256'):
                    issues.append('image SHA256 differs from completed metadata')
                if item['resolution'] != description.get('resolution') or item['resolution'][0] < LIMITS['renderMinimumWidthPx']:
                    issues.append('PNG/metadata resolution does not meet 2400px width')
                if metadata.get('engine') != 'CYCLES' or metadata.get('samples', 0) < LIMITS['cyclesMinimumConfiguredMaximumSamples']:
                    issues.append('Cycles/configured maximum sample target not met')
                expected, camera = render_fingerprint(source_digest, shot, description, metadata['samples'], item['resolution'][0])
                item['renderFingerprint'] = description.get('renderFingerprint')
                item['expectedRenderFingerprint'] = expected
                if expected != description.get('renderFingerprint'):
                    issues.append('render dependency fingerprint mismatch')
                item['camera'] = camera
                item['seconds'] = description.get('seconds')
                if description.get('reuseOfRenderedShot'):
                    reused = description['reuseOfRenderedShot']
                    source_description = metadata.get('shots', {}).get(reused, {})
                    source_path = run / 'renders' / identifier / (reused + '.png')
                    source_info = png_info(source_path)
                    source_camera = {key: source_description[key] for key in CAMERA_KEYS}
                    item['reuseOfRenderedShot'] = reused
                    item['reuseReason'] = description.get('reuseReason')
                    item['reusedSourceVerified'] = source_info['sha256'] == item['sha256'] == source_description.get('imageSha256') and source_camera == camera and source_description.get('completed', False)
                    if not item['reusedSourceVerified']:
                        issues.append('reused image source hash/camera/completed metadata mismatch')
            except (OSError, ValueError, KeyError, struct.error) as error:
                issues.append(str(error))
            item['verificationIssues'] = issues
            item['verifiedComplete'] = not issues
            if issues:
                pending.append(identifier + '/' + shot + ': ' + '; '.join(issues))
            else:
                completed += 1
        if identifier == DRESS_ID:
            pair = {item['name']: item for item in result['shots'] if item['name'].startswith('crystal-ar-')}
            result['arPairCameraMatches'] = pair['crystal-ar-on'].get('camera') == pair['crystal-ar-off'].get('camera') and bool(pair['crystal-ar-on'].get('camera'))
            if all(item['verifiedComplete'] for item in pair.values()) and not result['arPairCameraMatches']:
                errors.append('AR comparison camera metadata differs')
    finalization_path = run / 'reports/standalone-crystal-finalization.json'
    if finalization_path.exists():
        finalization = json_file(finalization_path)
        finalized = {item['style']: item for item in finalization.get('files', [])}
        if set(finalized) != STYLE_IDS or finalization.get('remainingInheritedProfileDifferenceCount') or finalization.get('componentAssetsModified'):
            pending.append('Standalone crystal authority finalization is incomplete or has unresolved differences')
        for style in report['styles']:
            item = finalized.get(style['id'])
            if not item:
                continue
            style['crystalMaterialAuthority'] = {'authority': item.get('authority'), 'recipe': item.get('authorityRecipe'),
                                                'sourceComponentRecipe': item.get('sourceComponentRecipe'),
                                                'matchedCrystals': item.get('matchedCrystals')}
            if style.get('standalone', {}).get('sha256') != item.get('outputSha256'):
                pending.append('Crystal finalization predates current standalone export: ' + style['id'])
    else:
        pending.append('Missing standalone crystal authority finalization')
    report['completedVerifiedImages'] = completed
    if completed != report['requiredFinalImages']:
        pending.append('Final image set incomplete: ' + str(completed) + '/20 verified')
    report['dependencies'] = []
    for name in ['assembly-manifest.json', 'registry-manifest.json', 'reports/asset-final-contract.json', 'reports/surface-recipes.json',
                 'reports/final-code-validation.json', 'reports/final-after-cache-revision.json', 'reports/browser/acceptance.json',
                 'reports/standalone-crystal-finalization.json']:
        path = run / name
        if path.exists():
            report['dependencies'].append({'path': name, 'sha256': sha(path.read_bytes()), 'bytes': path.stat().st_size})
        else:
            pending.append('Missing evidence dependency: ' + name)
    reuse_report = run / 'reports/ar-reference-reuse.json'
    if reuse_report.exists():
        report['arReferenceReuse'] = json_file(reuse_report)
        report['dependencies'].append({'path': 'reports/ar-reference-reuse.json', 'sha256': sha(reuse_report.read_bytes()), 'bytes': reuse_report.stat().st_size})
    for name in ['final-code-validation.json', 'final-after-cache-revision.json']:
        path = run / 'reports' / name
        if path.exists():
            evidence = json_file(path)
            if evidence.get('status') != 'passed':
                errors.append('Code validation report is not passed: ' + name)
            if name == 'final-after-cache-revision.json':
                if evidence.get('assetRevision') != revision or any(evidence.get('exitCodes', {}).values()):
                    errors.append('Final cache revision validation is stale or failed')
                for file, expected in evidence.get('files', {}).items():
                    if sha((repo / file).read_bytes()) != expected:
                        errors.append('Final cache revision source changed after validation: ' + file)
    for name in ['tools/blender/realism_hero.py', 'tools/blender/realism_normalize_export.py', 'tools/blender/realism_finalize_export.py', 'tools/blender/realism_assets.py', 'tools/blender/realism_artwork.mjs']:
        path = repo / name
        report['dependencies'].append({'path': name, 'sha256': sha(path.read_bytes()), 'bytes': path.stat().st_size})
    summaries = []
    for directory in (run / 'reports').glob('style-validator*'):
        path = directory / 'summary.json'
        if path.exists():
            summaries.append(path)
    if summaries:
        latest = max(summaries, key=lambda path: path.stat().st_mtime)
        validator = json_file(latest)
        report['standaloneValidator'] = {'path': str(latest.relative_to(run)).replace('\\', '/'), 'sha256': sha(latest.read_bytes()),
                                         'version': validator.get('validatorVersion'), 'files': len(validator.get('files', [])),
                                         'errors': validator.get('errors'), 'warnings': validator.get('warnings')}
        if validator.get('errors') or validator.get('warnings') or len(validator.get('files', [])) != STYLE_COUNT:
            pending.append('Standalone official validator is not a six-file zero-error/zero-warning report')
        elif any(path.stat().st_mtime > latest.stat().st_mtime for path in (run / 'styles').glob('*/watch.glb')):
            pending.append('Standalone official validator predates current exports; rerun after final batch')
    else:
        pending.append('Missing official standalone validator summary')
    report['standaloneBudgetStatus'] = 'within-targets' if not exceptions else 'exceptions-recorded'
    browser_path = run / 'reports/browser/acceptance.json'
    if browser_path.exists():
        try:
            observations, runtime_exceptions = runtime_budget_evidence(json_file(browser_path))
            report['runtimeRendererObservations'] = observations
            report['runtimeBudgetExceptions'] = runtime_exceptions
            exceptions.extend(runtime_exceptions)
        except ValueError:
            pending.append('Browser evidence JSON is being updated or invalid')
    report['runtimeQualificationStatus'] = 'partial; measured runtime budget exceptions and incomplete 20-swap resource qualification remain'
    followup_path = run / 'reports/browser/after-render-20-swaps.json'
    if followup_path.exists():
        followup = json_file(followup_path)
        report['browserFollowup'] = followup
        report['dependencies'].append({'path': 'reports/browser/after-render-20-swaps.json', 'sha256': sha(followup_path.read_bytes()), 'bytes': followup_path.stat().st_size})
        resources = followup.get('resourceCheck', {})
        stable = all(len(resources.get(key, [])) == 4 and len(set(resources[key])) == 1 for key in ('geometries', 'textures'))
        if followup.get('completedSwaps') == 20 and len(followup.get('swaps', [])) == 20 and all(item.get('axStateReturned') for item in followup['swaps']) and stable and not followup.get('consoleErrors'):
            report['browserQualification'] = 'Twenty HD style switches completed with no observed app console errors. The same Dress endpoint held {} geometries and {} textures after each of four cycles. This is bounded endpoint evidence, not per-intermediate-style, frame-time or long-session certification.'.format(resources['geometries'][0], resources['textures'][0])
            report['runtimeQualificationStatus'] = 'bounded 20-switch endpoint check passed; measured runtime budget exceptions and long-session/frame-time qualification remain'
            for exception in report.get('runtimeBudgetExceptions', []):
                exception['qualificationLimit'] = 'This peak comes from initial observations that may include loading/stale demand frames. The later 20-switch check establishes stable same-style cycle endpoints, not settled per-style peak costs or sustained frame rate.'
    report['runtimeProvisionalDrawCallGate'] = 400
    report['completeScope'] = 'File/metadata/binary delivery integrity; complete does not establish full browser qualification or absence of measured runtime budget exceptions.'
    report['status'] = 'failed' if errors else 'incomplete' if pending else 'complete'
    report['complete'] = not errors and not pending
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument('--run', type=Path, required=True)
    parser.add_argument('--allow-incomplete', action='store_true')
    args = parser.parse_args()
    repo, run = args.repo.resolve(), args.run.resolve()
    result = verify(repo, run)
    directory = run / 'reports'
    directory.mkdir(parents=True, exist_ok=True)
    (directory / 'delivery-manifest.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    (directory / 'delivery-report.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    lines = ['Realism delivery verification', '', 'Status: ' + result['status'] + '.', '',
             '- Promoted components checked: ' + str(len(result['components'])) + '.',
             '- Completed final images with matching metadata/dependencies: ' + str(result['completedVerifiedImages']) + '/20.',
             '- ' + result['browserQualification'], '- ' + result['renderSamplingNote'], '',
             '| Style | Standalone bytes | Instantiated triangles | Max texture px | Distinct component download bytes |',
             '| --- | ---: | ---: | ---: | ---: |']
    for style in result['styles']:
        glb = style.get('standalone', {})
        lines.append('| ' + style['label'] + ' | ' + str(glb.get('bytes', 'pending')) + ' | ' + str(glb.get('instantiatedTriangles', 'pending')) +
                     ' | ' + str(glb.get('textureMaximumPx', 'pending')) + ' | ' + str(style['componentDownload']['distinctBytes']) + ' |')
    for heading, key in [('Integrity errors', 'errors'), ('Pending evidence', 'pending'), ('Budget exceptions requiring review', 'budgetExceptions')]:
        lines += ['', heading, ''] + ['- ' + (value if isinstance(value, str) else json.dumps(value)) for value in result[key]]
        if not result[key]:
            lines.append('None.')
    lines += ['', 'This is file/metadata verification. It does not certify physical fit, image aesthetics, screen-reader qualification or complete browser resource stability.',
              'No commits or pushes are claimed. Per-file component changes and omissions are in per-file-changes.md and per-file-changes.csv.']
    (directory / 'delivery-report.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(json.dumps({'status': result['status'], 'components': len(result['components']), 'styles': len(result['styles']),
                      'verifiedFinalImages': result['completedVerifiedImages'], 'errors': len(result['errors']), 'pending': len(result['pending'])}))
    if result['errors'] or (result['pending'] and not args.allow_incomplete):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
