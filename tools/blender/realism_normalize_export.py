"""Repair invalid standalone-export tangent XYZ only; preserve all other bytes.

Zero tangents are rebuilt from incident triangle position/UV gradients and
Gram-Schmidt projected against the same vertex normal. A deterministic normal-
orthogonal fallback is used only when no valid incident UV gradient exists.
Component public GLBs are never accepted. No Blender or third-party dependency.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import struct
from pathlib import Path


def _sha(data):
    return hashlib.sha256(data).hexdigest()


def _glb(raw):
    if len(raw) < 20 or struct.unpack_from('<4sII', raw) != (b'glTF', 2, len(raw)):
        raise ValueError('Expected complete glTF 2 GLB')
    offset = 12
    document = None
    binary_start = None
    while offset < len(raw):
        length, kind = struct.unpack_from('<II', raw, offset)
        if length % 4 or offset + 8 + length > len(raw):
            raise ValueError('Invalid chunk extent')
        if kind == 0x4E4F534A:
            document = json.loads(raw[offset + 8:offset + 8 + length])
        if kind == 0x004E4942:
            binary_start = offset + 8
        offset += 8 + length
    if document is None or binary_start is None:
        raise ValueError('Expected JSON and BIN chunks')
    return document, binary_start


def _accessor(document, raw, binary_start, index):
    accessor = document['accessors'][index]
    if 'sparse' in accessor or accessor.get('normalized', False):
        raise ValueError('Sparse/normalized vector storage requires explicit conversion')
    view = document['bufferViews'][accessor['bufferView']]
    if view.get('buffer', 0) != 0:
        raise ValueError('External buffer storage is unsupported')
    size = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[accessor['type']]
    component = {5121: 'B', 5123: 'H', 5125: 'I', 5126: 'f'}[accessor['componentType']]
    width = struct.calcsize(component)
    start = binary_start + view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
    stride = view.get('byteStride', width * size)
    if accessor['count'] and start + (accessor['count'] - 1) * stride + width * size > len(raw):
        raise ValueError('Accessor extends beyond GLB')
    values = [struct.unpack_from('<' + component * size, raw, start + i * stride) for i in range(accessor['count'])]
    return values, start, stride


def _unit(vector):
    length = math.sqrt(sum(value * value for value in vector))
    if not math.isfinite(length) or length < 1e-15:
        return None
    return tuple(value / length for value in vector)


def _project(vector, normal):
    dot = sum(vector[i] * normal[i] for i in range(3))
    return _unit(tuple(vector[i] - dot * normal[i] for i in range(3)))


def _derive(vertices, positions, normals, uvs, indices):
    gradients = {vertex: [] for vertex in vertices}
    if len(indices) % 3:
        raise ValueError('Expected triangle indices')
    for start in range(0, len(indices), 3):
        a, b, c = indices[start:start + 3]
        incident = set((a, b, c)).intersection(gradients)
        if not incident:
            continue
        du1, dv1 = uvs[b][0] - uvs[a][0], uvs[b][1] - uvs[a][1]
        du2, dv2 = uvs[c][0] - uvs[a][0], uvs[c][1] - uvs[a][1]
        determinant = du1 * dv2 - du2 * dv1
        if not math.isfinite(determinant) or abs(determinant) < 1e-15:
            continue
        tangent = tuple(((positions[b][k] - positions[a][k]) * dv2 - (positions[c][k] - positions[a][k]) * dv1) / determinant for k in range(3))
        if not all(math.isfinite(value) for value in tangent):
            continue
        for vertex in incident:
            gradients[vertex].append(tangent)
    output = {}
    for vertex in vertices:
        normal = _unit(normals[vertex])
        if normal is None:
            raise ValueError('Cannot derive a tangent from an invalid normal')
        candidates = gradients[vertex]
        direction = _project(tuple(sum(candidate[k] for candidate in candidates) for k in range(3)), normal)
        method = 'incident-UV-gradient'
        if direction is None:
            for candidate in candidates:
                direction = _project(candidate, normal)
                if direction is not None:
                    method = 'incident-UV-gradient-after-cancellation'
                    break
        if direction is None:
            axis = min(range(3), key=lambda k: abs(normal[k]))
            direction = _project(tuple(1.0 if k == axis else 0.0 for k in range(3)), normal)
            method = 'deterministic-normal-orthogonal-fallback'
        output[vertex] = (direction, method, len(candidates))
    return output


def repair_export_tangents(path, standalone_root=None, dry_run=False, normalize_nonzero=False):
    """Return an exact change report; patch only invalid tangent XYZ float bytes.

    A single-argument pipeline call requires a parent directory named styles.
    Callers may instead explicitly supply a standalone export root. Public 3D
    component paths and paths outside the declared root fail closed.
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
        raise ValueError('Export path is outside standalone_root')
    if '/public/assets/3d/' in path.as_posix().lower() or path.suffix.lower() != '.glb':
        raise ValueError('Public component assets/non-GLBs are excluded')
    raw = path.read_bytes()
    document, binary_start = _glb(raw)
    output = bytearray(raw)
    changes = []
    processed = set()
    for mesh_index, mesh in enumerate(document.get('meshes', [])):
        for primitive_index, primitive in enumerate(mesh['primitives']):
            attributes = primitive.get('attributes', {})
            tangent_index = attributes.get('TANGENT')
            if tangent_index is None or tangent_index in processed:
                continue
            processed.add(tangent_index)
            accessor = document['accessors'][tangent_index]
            if accessor['type'] != 'VEC4' or accessor['componentType'] != 5126:
                raise ValueError('Expected float32 VEC4 tangents')
            tangents, byte_start, stride = _accessor(document, raw, binary_start, tangent_index)
            invalid = []
            zeros = []
            for vertex, tangent in enumerate(tangents):
                if not all(math.isfinite(value) for value in tangent):
                    raise ValueError('Nonfinite tangent requires source investigation')
                if tangent[3] not in (-1.0, 1.0):
                    raise ValueError('Invalid tangent handedness requires source investigation')
                length = math.sqrt(sum(value * value for value in tangent[:3]))
                if length < 1e-15:
                    invalid.append(vertex)
                    zeros.append(vertex)
                elif normalize_nonzero and abs(length - 1.0) > 1e-4:
                    invalid.append(vertex)
            if not invalid:
                continue
            derived = {}
            if zeros:
                if primitive.get('mode', 4) != 4:
                    raise ValueError('Zero tangent repair requires triangle primitives')
                material = document.get('materials', [])[primitive['material']] if 'material' in primitive else {}
                normal_texture = material.get('normalTexture', {})
                texcoord = normal_texture.get('extensions', {}).get('KHR_texture_transform', {}).get('texCoord', normal_texture.get('texCoord', 0))
                positions = _accessor(document, raw, binary_start, attributes['POSITION'])[0]
                normals = _accessor(document, raw, binary_start, attributes['NORMAL'])[0]
                uvs = _accessor(document, raw, binary_start, attributes['TEXCOORD_' + str(texcoord)])[0]
                indices = [value[0] for value in _accessor(document, raw, binary_start, primitive['indices'])[0]] if 'indices' in primitive else list(range(len(positions)))
                derived = _derive(zeros, positions, normals, uvs, indices)
            for vertex in invalid:
                old = tangents[vertex]
                new, method, valid_gradients = derived[vertex] if vertex in derived else (_unit(old[:3]), 'normalize-nonzero-tangent', 0)
                offset = byte_start + vertex * stride
                struct.pack_into('<3f', output, offset, *new)
                changes.append({'mesh': mesh_index, 'meshName': mesh.get('name'), 'primitive': primitive_index,
                                'accessor': tangent_index, 'vertex': vertex, 'byteOffset': offset,
                                'before': list(old), 'after': list(struct.unpack_from('<4f', output, offset)),
                                'method': method, 'validIncidentGradients': valid_gradients})
    # Exact raw-byte proof: no change is allowed outside the recorded XYZ slots.
    restored = bytearray(output)
    for change in changes:
        offset = change['byteOffset']
        restored[offset:offset + 12] = raw[offset:offset + 12]
        assert output[offset + 12:offset + 16] == raw[offset + 12:offset + 16]
    assert restored == raw
    assert _glb(output)[0] == document
    if changes and not dry_run:
        temporary = path.with_name(path.name + '.tangent-repair-tmp')
        try:
            temporary.write_bytes(output)
            temporary.replace(path)
        finally:
            if temporary.exists():
                temporary.unlink()
    return {'path': relative.as_posix(), 'sourceSha256': _sha(raw), 'outputSha256': _sha(output),
            'bytesBefore': len(raw), 'bytesAfter': len(output), 'dryRun': dry_run, 'changes': changes,
            'reconstructedZeroTangents': sum(change['before'][:3] == [0.0, 0.0, 0.0] for change in changes),
            'normalizedNonzeroTangents': sum(change['method'] == 'normalize-nonzero-tangent' for change in changes),
            'fallbackTangents': sum(change['method'] == 'deterministic-normal-orthogonal-fallback' for change in changes),
            'preserved': {'allBytesOutsideChangedTangentXYZ': True, 'tangentHandednessW': True,
                          'positionsNormalsUVsColorsIndicesNodesMaterialsAndAccessors': True}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--styles-root', type=Path, required=True)
    parser.add_argument('--report', type=Path, required=True)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--normalize-nonzero', action='store_true', help='Explicitly normalize nonzero tangent vectors too; default repairs zero vectors only')
    args = parser.parse_args()
    files = sorted(args.styles_root.rglob('*.glb'))
    if not files:
        parser.error('No standalone GLBs found')
    results = [repair_export_tangents(path, args.styles_root, args.dry_run, args.normalize_nonzero) for path in files]
    report = {'schema': 'dial-designer/standalone-tangent-repair/v1', 'files': results, 'fileCount': len(results),
              'reconstructedZeroTangents': sum(result['reconstructedZeroTangents'] for result in results),
              'normalizedNonzeroTangents': sum(result['normalizedNonzeroTangents'] for result in results),
              'fallbackTangents': sum(result['fallbackTangents'] for result in results), 'componentAssetsModified': False}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: value for key, value in report.items() if key != 'files'}))


if __name__ == '__main__':
    main()
