"""Pure contract/geometry tests. No bpy required."""
import copy
import json
import math
from pathlib import Path
import unittest
from parametric_crown_v1 import geometry, validate


class CrownTests(unittest.TestCase):
    def setUp(self):
        self.p = json.loads(Path(__file__).with_name("test_crown_v1.json").read_text(encoding="utf-8"))

    def test_unknown_thread_is_preserved_and_not_modelled(self):
        before = copy.deepcopy(self.p)
        validate(self.p)
        vertices, faces = geometry(self.p)
        self.assertGreater(len(vertices), 0)
        self.assertGreater(len(faces), 0)
        self.assertEqual(before, self.p)

    def test_required_unknown_dimensions_fail(self):
        for key in ("headDiameterMm", "headLengthMm", "socketDiameterMm", "socketDepthMm", "gripDepthMm"):
            p = copy.deepcopy(self.p)
            p[key] = {"status": "unknown"}
            with self.subTest(key=key), self.assertRaisesRegex(ValueError, "unknown required"):
                geometry(p)

    def test_invalid_contracts_fail(self):
        for patch in ({"schema": "v2"}, {"headDiameterMm": True}, {"headLengthMm": 0},
                      {"socketDiameterMm": 9}, {"socketDepthMm": 5}, {"gripCount": 1.5},
                      {"gripCount": 257}, {"gripDepthMm": 3}, {"provenance": {}},
                      {"attachment": {"anchor": "watch-axis", "axialGapMm": 0}},
                      {"headDiameterMm": math.inf}):
            with self.subTest(patch=patch), self.assertRaises(ValueError):
                validate(dict(self.p, **patch))

    def test_local_origin_and_dimensions(self):
        vertices, _ = geometry(self.p)
        self.assertEqual(min(v[0] for v in vertices), 0)
        self.assertEqual(max(v[0] for v in vertices), self.p["headLengthMm"])
        self.assertAlmostEqual(max(v[1] for v in vertices), self.p["headDiameterMm"]/2 + self.p["gripDepthMm"])

    def test_closed_oriented_mesh_with_rear_socket(self):
        vertices, faces = geometry(self.p)
        edges = {}
        volume = 0
        for face in faces:
            for a, b in zip(face, face[1:] + face[:1]):
                key = tuple(sorted((a, b)))
                edges.setdefault(key, []).append((a, b))
            a = vertices[face[0]]
            for i in range(1, len(face)-1):
                b, c = vertices[face[i]], vertices[face[i+1]]
                cross = (b[1]*c[2]-b[2]*c[1], b[2]*c[0]-b[0]*c[2], b[0]*c[1]-b[1]*c[0])
                volume += sum(x*y for x, y in zip(a, cross))/6
        self.assertTrue(all(len(pair) == 2 and pair[0] == pair[1][::-1] for pair in edges.values()))
        expected = math.pi * ((self.p["headDiameterMm"]/2)**2 * self.p["headLengthMm"] - (self.p["socketDiameterMm"]/2)**2 * self.p["socketDepthMm"])
        self.assertGreater(volume, expected)
        self.assertLess(volume, expected * 1.3)

    def test_attachment_gap_does_not_bake_world_translation(self):
        expected = geometry(self.p)
        self.p["attachment"]["axialGapMm"] = 2
        self.assertEqual(geometry(self.p), expected)
        self.p["attachment"]["axialGapMm"] = {"status": "unknown"}
        self.assertEqual(geometry(self.p), expected)

    def test_all_quality_levels_and_plain_head(self):
        self.p["gripCount"] = 0
        self.p["gripDepthMm"] = 0
        sizes = [len(geometry(self.p, q)[0]) for q in ("preview", "normal", "high")]
        self.assertEqual(sizes, sorted(set(sizes)))


if __name__ == "__main__":
    unittest.main()
