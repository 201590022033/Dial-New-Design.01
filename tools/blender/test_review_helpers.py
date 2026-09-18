"""Pure helper tests: python -B -m unittest discover -s tools/blender -p test_review_helpers.py"""
import math
import unittest

from render_review import bounds, frame_scale


class ReviewHelpersTest(unittest.TestCase):
    def test_translated_asymmetric_bounds(self):
        center, dimensions = bounds([(2, -5, 10), (8, 3, 12), (4, 0, 11)])
        self.assertEqual(center, (5, -1, 11))
        self.assertEqual(dimensions, (6, 8, 2))

    def test_flat_mesh_has_valid_bounds(self):
        self.assertEqual(bounds([(-2, -2, 0), (2, 2, 0)])[1], (4, 4, 0))

    def test_invalid_bounds(self):
        for points in ([], [(0, 0, 0)], [(0, 0, math.nan)], [(0, 0, math.inf)]):
            with self.subTest(points=points), self.assertRaises(ValueError):
                bounds(points)

    def test_square_frame_encloses_every_projected_corner_with_margin(self):
        points = [(-12, 4, -100), (3, -8, -20), (6, 2, -40)]
        scale = frame_scale(points)
        self.assertAlmostEqual(scale, 27.6)
        for point in points:
            self.assertLess(abs(point[0]), scale / 2)
            self.assertLess(abs(point[1]), scale / 2)

    def test_depth_does_not_change_orthographic_scale(self):
        self.assertEqual(frame_scale([(2, 3, -10)]), frame_scale([(2, 3, -1000)]))

    def test_degenerate_view_and_invalid_margin_fail(self):
        with self.assertRaises(ValueError):
            frame_scale([(0, 0, -10)])
        for margin in (0, 1, math.inf, math.nan):
            with self.subTest(margin=margin), self.assertRaises(ValueError):
                frame_scale([(1, 2, 3)], margin)


if __name__ == '__main__':
    unittest.main()
