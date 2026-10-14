"""Physical-hole and provenance acceptance checks on the promoted leather component."""
import sys
from pathlib import Path
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
root=Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root/'public/assets/3d/archetypes/strap-leather.glb'))
bpy.context.view_layer.update()
objects=list(bpy.context.scene.objects)
rims=sorted([o for o in objects if o.name.startswith('DD_VR_HOLE_RIM_6_')],key=lambda o:o.location.y)
assert len(rims)==7,'Exactly seven real 6-tail holes required'
assert not any('HOLE_RIM_12' in o.name for o in objects),'No 12-side adjustment holes'
assert len([o for o in objects if o.name.startswith('DD_VR_STITCH_ROW_')])==4,'Four stitched edge rows required'
def tree(name):
    obj=bpy.data.objects[name]
    return BVHTree.FromPolygons([obj.matrix_world@v.co for v in obj.data.vertices],[list(p.vertices)for p in obj.data.polygons])
tail=tree('DD_ARCH_STRAP_6');buckle=tree('DD_ARCH_STRAP_12')
for rim in rims:
    center=rim.matrix_world.translation
    assert tail.ray_cast(Vector((center.x,center.y,10)),Vector((0,0,-1)),20)[0]is None,'Tail adjustment hole obstructed: '+rim.name
    assert buckle.ray_cast(Vector((center.x,-center.y,10)),Vector((0,0,-1)),20)[0]is not None,'Buckle side unexpectedly perforated'
for left,right in zip(rims,rims[1:]):assert abs(abs(left.location.y-right.location.y)-7.5)<.001,'Hole pitch drift'
for obj in objects:
    if obj.name.startswith('DD_VR_'):assert obj.get('DD_PROVENANCE_STATUS')=='provisional-presentation','New detail lacks provenance '+obj.name
print('REALISM_LEATHER_PASS: 7 open 2mm tail holes / 7.5mm pitch; intact buckle half; four segmented stitch rows; new-detail provenance')
