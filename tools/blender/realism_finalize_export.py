"""Complete missing standalone crystal extensions from the frozen app profile.

Only versioned DD_REALISM_ROLE=crystal materials are eligible. Existing
values remain authored; only missing scalar extensions/fields are completed. All BIN chunks/accessors/geometry stay identical.
"""
from __future__ import annotations
import argparse
import copy
import hashlib
import json
import math
import struct
from pathlib import Path

SCHEMA = 'dial-designer/realism-material/v1'
SUPPORTED = ('KHR_materials_clearcoat', 'KHR_materials_iridescence')
SCALAR_FIELDS = {'KHR_materials_clearcoat': ('clearcoatFactor', 'clearcoatRoughnessFactor'),
                 'KHR_materials_iridescence': ('iridescenceFactor', 'iridescenceIor', 'iridescenceThicknessMinimum', 'iridescenceThicknessMaximum')}


def _sha(data):
    return hashlib.sha256(data).hexdigest()


def _chunks(raw):
    if len(raw) < 20 or struct.unpack_from('<4sII', raw) != (b'glTF', 2, len(raw)):
        raise ValueError('Expected complete glTF2 GLB')
    chunks, offset = [], 12
    while offset < len(raw):
        length, kind = struct.unpack_from('<II', raw, offset)
        if length % 4 or offset + 8 + length > len(raw):
            raise ValueError('Invalid GLB chunk')
        chunks.append((kind, raw[offset + 8:offset + 8 + length]))
        offset += 8 + length
    if not chunks or chunks[0][0] != 0x4E4F534A:
        raise ValueError('GLB must start with JSON')
    return json.loads(chunks[0][1]), chunks


def _extension_recipes(profile):
    def number(key, fallback, low, high=None):
        value = profile.get(key, fallback)
        if not isinstance(value, (int, float)) or not math.isfinite(value) or value < low or (high is not None and value > high):
            raise ValueError('Invalid frozen crystal profile field: ' + key)
        return value
    recipes = {}
    if profile.get('clearcoat', 0) > 0:
        recipes['KHR_materials_clearcoat'] = {'clearcoatFactor': number('clearcoat', 0, 0, 1),
                                             'clearcoatRoughnessFactor': number('clearcoatRoughness', 0, 0, 1)}
    if profile.get('iridescence', 0) > 0:
        thickness = profile.get('iridescenceThicknessRange', [100, 400])
        if len(thickness) != 2 or not all(isinstance(value, (int, float)) and math.isfinite(value) and value >= 0 for value in thickness) or thickness[0] > thickness[1]:
            raise ValueError('Invalid frozen iridescence thickness range')
        recipes['KHR_materials_iridescence'] = {'iridescenceFactor': number('iridescence', 0, 0, 1),
                                               'iridescenceIor': number('iridescenceIOR', 1.3, 1),
                                               'iridescenceThicknessMinimum': thickness[0],
                                               'iridescenceThicknessMaximum': thickness[1]}
    return recipes


def finalize_export_crystal(path, crystal_profile, standalone_root=None, component_recipe=None, authority='procedural fallback finish'):
    """Add only missing supported scalar extensions/fields; return a JSON change report.

    Single-argument path scope is styles/. An explicit standalone_root is also
    accepted. Public component GLBs fail closed. Inherited values are never
    overwritten, including existing fields that differ from the frozen profile.
    """
    path = Path(path).resolve()
    if standalone_root is None:
        standalone_root = next((parent for parent in path.parents if parent.name == 'styles'), None)
        if standalone_root is None:
            raise ValueError('Provide standalone_root or export beneath styles/')
    standalone_root = Path(standalone_root).resolve()
    try:
        relative = path.relative_to(standalone_root)
    except ValueError:
        raise ValueError('Standalone export is outside declared root')
    if '/public/assets/3d/' in path.as_posix().lower() or path.suffix.lower() != '.glb':
        raise ValueError('Public component assets/non-GLBs are excluded')
    raw = path.read_bytes()
    document, chunks = _chunks(raw)
    updated = copy.deepcopy(document)
    recipes = _extension_recipes(crystal_profile) if component_recipe is None else {name: {key: value for key, value in fields.items() if key in SCALAR_FIELDS[name]} for name, fields in component_recipe.items() if name in SUPPORTED}
    changes, matches, differences = [], [], []
    used = list(updated.get('extensionsUsed', []))
    for index, material in enumerate(updated.get('materials', [])):
        extras = material.get('extras', {})
        if extras.get('DD_REALISM_SCHEMA') != SCHEMA or extras.get('DD_REALISM_ROLE') != 'crystal':
            continue
        before = copy.deepcopy(material)
        added = []
        added_fields = {}
        extensions = material.get('extensions', {})
        for name, recipe in recipes.items():
            if name not in extensions:
                extensions[name] = copy.deepcopy(recipe)
                added.append(name)
                if name not in used:
                    used.append(name)
            else:
                for field, value in recipe.items():
                    if field not in extensions[name]:
                        extensions[name][field] = copy.deepcopy(value)
                        added_fields.setdefault(name, []).append(field)
        if added or added_fields:
            material['extensions'] = extensions
            changes.append({'material': index, 'name': material.get('name'), 'addedExtensions': added, 'addedFields': added_fields,
                            'beforeJson': before, 'afterJson': copy.deepcopy(material)})
        matches.append({'material': index, 'name': material.get('name'), 'extensions': copy.deepcopy(extensions)})
        defaults = {'clearcoatFactor': 0, 'clearcoatRoughnessFactor': 0, 'iridescenceFactor': 0,
                    'iridescenceIor': 1.3, 'iridescenceThicknessMinimum': 100, 'iridescenceThicknessMaximum': 400}
        for name, recipe in recipes.items():
            for field, expected in recipe.items():
                actual = extensions.get(name, {}).get(field, defaults[field])
                if abs(actual - expected) > 1e-6:
                    differences.append({'material': index, 'name': material.get('name'), 'extension': name, 'field': field,
                                        'expectedAuthorityValue': expected, 'effectiveExported': actual,
                                        'reason': 'Existing explicit exported value preserved; differs from authority recipe.'})
        if component_recipe is not None:
            for name, field in [('KHR_materials_clearcoat', 'clearcoatFactor'), ('KHR_materials_iridescence', 'iridescenceFactor')]:
                if name not in recipes and extensions.get(name, {}).get(field, 0) > 1e-6:
                    differences.append({'material': index, 'name': material.get('name'), 'extension': name, 'field': field,
                                        'expectedAuthorityValue': 0, 'effectiveExported': extensions[name][field],
                                        'reason': 'Existing explicit extension retained although source component recipe omits it.'})
    if changes:
        updated['extensionsUsed'] = used
    restored = copy.deepcopy(updated)
    for change in changes:
        restored['materials'][change['material']] = change['beforeJson']
    if 'extensionsUsed' in document:
        restored['extensionsUsed'] = document['extensionsUsed']
    else:
        restored.pop('extensionsUsed', None)
    assert restored == document
    output = raw
    if changes:
        encoded = json.dumps(updated, ensure_ascii=True, separators=(',', ':')).encode('utf-8')
        encoded += b' ' * ((-len(encoded)) % 4)
        output_chunks = [(chunks[0][0], encoded)] + chunks[1:]
        body = b''.join(struct.pack('<II', len(data), kind) + data for kind, data in output_chunks)
        output = struct.pack('<4sII', b'glTF', 2, 12 + len(body)) + body
        final, final_chunks = _chunks(output)
        assert final == updated and final_chunks[1:] == chunks[1:]
        temporary = path.with_name(path.name + '.crystal-finalize-tmp')
        try:
            temporary.write_bytes(output)
            temporary.replace(path)
        finally:
            if temporary.exists():
                temporary.unlink()
    return {'path': relative.as_posix(), 'sourceSha256': _sha(raw), 'outputSha256': _sha(output),
            'sourceJsonSha256': _sha(chunks[0][1]), 'outputJsonSha256': _sha(_chunks(output)[1][0][1]),
            'authority': authority, 'authorityRecipe': recipes,
            'frozenCrystalProfile': crystal_profile, 'frozenProfileSha256': _sha(json.dumps(crystal_profile, sort_keys=True).encode()),
            'matchedCrystals': matches, 'changes': changes, 'remainingInheritedProfileDifferences': differences,
            'preserved': {'allNonJsonChunksByteIdentical': True, 'geometryNormalsUVColorsNodesAccessorsAndOtherMaterials': True,
                          'existingExplicitCrystalValuesUnchanged': True}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run', type=Path, required=True)
    parser.add_argument('--style', default='all')
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    run = args.run.resolve()
    assembly = json.loads((run / 'assembly-manifest.json').read_text())
    results = []
    for style in assembly['styles']:
        if args.style not in ('all', style['id']):
            continue
        backed = next((component for component in style['components'] if component['category'] == 'crystal' and component['placement']['glb']), None)
        recipe, source = None, None
        authority = 'procedural fallback finish'
        if backed:
            source_path = run / 'web' / ('public' + backed['descriptor']['assetPath'])
            content = source_path.read_bytes()
            source_doc, _ = _chunks(content)
            matches = [material for material in source_doc.get('materials', []) if material.get('extras', {}).get('DD_REALISM_SCHEMA') == SCHEMA and material.get('extras', {}).get('DD_REALISM_ROLE') == 'crystal']
            if len(matches) != 1:
                raise ValueError('Expected one exact-role source component crystal: ' + str(source_path))
            recipe = matches[0].get('extensions', {})
            source = {'path': str(source_path.relative_to(run)).replace('\\', '/'), 'sha256': _sha(content), 'material': matches[0].get('name'), 'extensions': recipe}
            authority = 'component recipe'
        result = finalize_export_crystal(run / 'styles' / style['id'] / 'watch.glb', style['model']['finishes']['crystal'], run / 'styles', recipe, authority)
        result['sourceComponentRecipe'] = source
        result['style'] = style['id']
        results.append(result)
    if not results:
        parser.error('No matching frozen styles')
    report = {'schema': 'dial-designer/standalone-crystal-finalization/v1', 'files': results,
              'frozenProfilesIdentical': len({item['frozenProfileSha256'] for item in results}) == 1,
              'changedMaterials': sum(len(item['changes']) for item in results),
              'remainingInheritedProfileDifferenceCount': sum(len(item['remainingInheritedProfileDifferences']) for item in results),
              'componentAssetsModified': False}
    destination = args.report or run / 'reports/standalone-crystal-finalization.json'
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: value for key, value in report.items() if key != 'files'}))


if __name__ == '__main__':
    main()
