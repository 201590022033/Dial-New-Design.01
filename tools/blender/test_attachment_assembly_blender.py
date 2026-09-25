"""Inspect exported meshes, not only generator constants, for attachment regressions."""
import sys
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from attachment_preview import attachment, SPEC
from validate_glb import import_glb

ROOT = Path(__file__).resolve().parents[2] / 'public/assets/3d'
A = attachment()


def tree(obj):
    return BVHTree.FromPolygons([obj.matrix_world @ v.co for v in obj.data.vertices],
                               [list(p.vertices) for p in obj.data.polygons])


case_trees = []
for style in ('straight', 'curved', 'twisted', 'hooded', 'drilled', 'teardrop', 'faceted', 'skeleton', 'reference'):
    path = ROOT / ('reference-42/case.glb' if style == 'reference' else f'lug-cases/case-lugs-{style}.glb')
    meshes, _ = import_glb(str(path))
    assert not any('PUSHER' in obj.name for obj in meshes), f'Baked pusher leaked into {style}'
    midcase = next(obj for obj in meshes if obj.name == 'DD_CASE_MIDCASE')
    mid = tree(midcase)
    case_trees.append((style, [tree(obj) for obj in meshes]))
    for sign, label in ((1, '12'), (-1, '6')):
        # A straight bar must pass through empty space across the case, and its
        # tips must enter the unchanged bores instead of hitting the lug faces.
        origin = Vector((-A['gap']/2, sign*A['y'], A['z']))
        assert mid.ray_cast(origin, Vector((1, 0, 0)), A['gap'])[0] is None, f'{style}: case blocks spring bar'
        for side, suffix in ((-1, 'L'), (1, 'R')):
            lug = next(obj for obj in meshes if obj.name == f'DD_CASE_LUG_{label}_{suffix}')
            origin = Vector((side*(A['gap']/2-.1), sign*A['y'], A['z']))
            assert tree(lug).ray_cast(origin, Vector((side, 0, 0)), 1.0)[0] is None, f'{style}: tip blocked by lug'
    # Recess is local to the underside; the upper case still exists at 12 h.
    assert mid.ray_cast(Vector((0, 30, 2)), Vector((0, -1, 0)), 12)[0] is not None, f'{style}: upper case removed'

for filename in ('archetypes/strap-rubber.glb', 'archetypes/strap-leather.glb',
                 'archetypes/strap-canvas.glb', 'archetypes/strap-racing.glb', 'reference-42/strap.glb'):
    meshes, _ = import_glb(str(ROOT / filename))
    for sign, label in ((1, '12'), (-1, '6')):
        strap = next(obj for obj in meshes if obj.name in (f'DD_ARCH_STRAP_{label}', f'DD_REF42_STRAP_{label}'))
        assert abs(strap.get('DD_ATTACHMENT_AXIS_Y_MM', 0) - sign*A['y']) < .001
        assert abs(strap.get('DD_ATTACHMENT_AXIS_Z_MM', 0) - A['z']) < .001
        strap_tree = tree(strap)
        assert strap_tree.ray_cast(Vector((-15, sign*A['y'], A['z'])), Vector((1, 0, 0)), 30)[0] is None, 'Strap bore obstructed'
        for suffix in ('BODY', 'TIPS'):
            bar = next(obj for obj in meshes if obj.name == f'DD_SPRING_BAR_{label}_{suffix}')
            points = [bar.matrix_world @ v.co for v in bar.data.vertices]
            assert abs((min(v.y for v in points)+max(v.y for v in points))/2 - sign*A['y']) < .001
            assert abs((min(v.z for v in points)+max(v.z for v in points))/2 - A['z']) < .001
            if suffix == 'TIPS':
                assert abs(max(v.x for v in points) - (A['gap']/2+SPEC['springBarTipEngagementMm'])) < .01
        for style, trees in case_trees:
            assert all(not strap_tree.overlap(case) for case in trees), f'{filename}: strap intersects {style} case/lugs'

print('Attachment assembly PASS: 9 cases, 5 straps, unchanged lug bores, clear spring-bar axes and no strap/case intersections')
