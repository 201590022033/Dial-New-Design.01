"""Dial Designer parametric-case/v1 reference generator.

Run with Blender: blender --background --python parametric_case_v1.py -- [options]
Blender units are millimetres (1 BU = 1 mm); this is deliberate for inspection.
"""
import argparse, json, math, os, sys
import bpy
from mathutils import Vector

SCHEMA = 'parametric-case/v1'
QUALITY = {'preview': 64, 'normal': 128, 'high': 192}
REFERENCE = {
    'schema': SCHEMA, 'caseDiameter': 40.0, 'midcaseHeight': 7.0, 'lugWidth': 20.0, 'lugToLug': 47.0,
    'dialOpening': 31.5, 'crystalSeatDiameter': 32.5, 'casebackOpening': 34.0,
    'upperCaseRadiusReduction': .45, 'lowerCaseRadiusReduction': .65, 'middleCaseBulge': .20,
    'bezelLipHeight': 1.10, 'casebackLipHeight': .80, 'lugRootWidth': 5.2, 'lugTipWidth': 4.0,
    'lugCaseOverlap': 2.2, 'lugTipDrop': 1.35, 'lugThickness': 4.5, 'lugTaperStrength': .80,
    'crownTubeRadius': 1.50, 'crownTubeLength': 2.30, 'crownBossRadius': 2.10,
    'crownBossLength': 1.50, 'crownBossEmbed': 2.20, 'crownTubeEmbed': 1.50,
}
def number(p, name):
    v = p.get(name)
    if isinstance(v, dict) and v.get('status') == 'unknown': raise ValueError("unknown required dimension: " + name)
    if not isinstance(v, (int, float)) or not math.isfinite(v): raise ValueError("missing/invalid dimension: " + name)
    if v < 0: raise ValueError("negative dimension: " + name)
    return float(v)
def validate(p):
    required = list(REFERENCE.keys())[1:]
    for k in required: number(p, k)
    if number(p, 'caseDiameter') <= 0: raise ValueError('caseDiameter must be greater than zero')
    if number(p, 'dialOpening') >= number(p, 'caseDiameter') or number(p, 'crystalSeatDiameter') >= number(p, 'caseDiameter'): raise ValueError('openings must be smaller than caseDiameter')
    if number(p, 'lugToLug') < number(p, 'caseDiameter'): raise ValueError('lugToLug must not be smaller than caseDiameter')
    if number(p, 'lugTipWidth') > number(p, 'lugWidth'): raise ValueError('lugTipWidth must not exceed lugWidth')
def mat(name, color, metallic=0.8, rough=.3):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name); m.diffuse_color = (*color, 1); m.metallic = metallic; m.roughness = rough; return m
def mesh(name, verts, faces, collection, material=None):
    me = bpy.data.meshes.new(name + '_MESH'); me.from_pydata(verts, [], faces); me.update(); ob = bpy.data.objects.new(name, me); collection.objects.link(ob)
    if material: ob.data.materials.append(material)
    for poly in me.polygons: poly.use_smooth = True
    return ob
def revolve(p, n, collection, material):
    r = number(p, 'caseDiameter') / 2; h = number(p, 'midcaseHeight'); inner = number(p, 'dialOpening') / 2
    # Dense, smooth cross-section: inner lower opening -> rounded lower shoulder -> belly -> upper shoulder -> inner seat.
    profile = [(inner, -h/2+.8), (r-.8, -h/2+.2), (r, -h*.25), (r+number(p,'middleCaseBulge'), 0), (r, h*.25), (r-.55, h/2-.35), (number(p,'crystalSeatDiameter')/2, h/2)]
    rings = [[(rad*math.cos(2*math.pi*i/n), rad*math.sin(2*math.pi*i/n), z) for i in range(n)] for rad,z in profile]
    verts = [v for ring in rings for v in ring]; faces=[]
    for j in range(len(rings)-1):
        for i in range(n): faces.append((j*n+i, j*n+(i+1)%n, (j+1)*n+(i+1)%n, (j+1)*n+i))
    return mesh('DD_CASE_MIDCASE', verts, faces, collection, material)
def cylinder(name, radius, depth, loc, collection, material):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=radius, depth=depth, location=loc, rotation=(0, math.pi/2, 0)); ob=bpy.context.object; ob.name=name; collection.objects.link(ob); [c.objects.unlink(ob) for c in list(ob.users_collection) if c != collection]; ob.data.materials.append(material); return ob
def build(p, quality='normal'):
    validate(p); old=bpy.data.collections.get('DD_PARAMETRIC_CASE')
    if old:
        for ob in list(old.objects): bpy.data.objects.remove(ob, do_unlink=True)
        bpy.data.collections.remove(old)
    col=bpy.data.collections.new('DD_PARAMETRIC_CASE'); bpy.context.scene.collection.children.link(col)
    steel=mat('DD Brushed Steel', (.32,.36,.4), .9, .28); polished=mat('DD Polished Steel', (.65,.68,.72), .95, .12)
    n=QUALITY[quality]; revolve(p,n,col,steel)
    r=number(p,'caseDiameter')/2; lug_w=number(p,'lugWidth'); tip=number(p,'lugTipWidth'); span=number(p,'lugToLug')/2
    # Four tapered prisms, with their root overlapping the case wall and a wrist-facing Z drop.
    for name, angle in [('12',0),('2',math.pi/2),('4',math.pi),('6',3*math.pi/2)]:
        ux,uy=math.cos(angle),math.sin(angle); vx,vy=-uy,ux; root=r-number(p,'lugCaseOverlap'); length=span-root
        z=-number(p,'lugTipDrop')/2 if name in ('12','6') else 0
        pts=[]
        for zz in (-number(p,'lugThickness')/2+z, number(p,'lugThickness')/2+z):
            pts += [(ux*root+vx*lug_w/2,uy*root+vy*lug_w/2,zz),(ux*span+vx*tip/2,uy*span+vy*tip/2,zz),(ux*span-vx*tip/2,uy*span-vy*tip/2,zz),(ux*root-vx*lug_w/2,uy*root-vy*lug_w/2,zz)]
        faces=[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]; ob=mesh('DD_CASE_LUG_'+name,pts,faces,col,steel)
        bevel=ob.modifiers.new('Conservative edge bevel','BEVEL'); bevel.width=.18; bevel.segments=2
    x=r-number(p,'crownBossEmbed')+number(p,'crownBossLength')/2; cylinder('DD_CASE_CROWN_BOSS',number(p,'crownBossRadius'),number(p,'crownBossLength'),(x,0,0),col,polished)
    x=r-number(p,'crownTubeEmbed')+number(p,'crownTubeLength')/2; cylinder('DD_CASE_CROWN_TUBE',number(p,'crownTubeRadius'),number(p,'crownTubeLength'),(x,0,0),col,polished)
    bpy.context.scene['DD_PARAMETRIC_SCHEMA']=SCHEMA; bpy.context.scene['DD_PARAMETRIC_QUALITY']=quality; return col
def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--params'); ap.add_argument('--output'); ap.add_argument('--quality',choices=QUALITY,default='normal'); args=ap.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    p=REFERENCE.copy()
    if args.params:
        with open(args.params, encoding='utf-8') as f: p=json.load(f)
    build(p,args.quality)
    if args.output:
        os.makedirs(os.path.dirname(os.path.abspath(args.output)),exist_ok=True); bpy.ops.object.select_all(action='DESELECT'); [o.select_set(True) for o in bpy.data.collections['DD_PARAMETRIC_CASE'].objects]; bpy.context.view_layer.objects.active=bpy.data.collections['DD_PARAMETRIC_CASE'].objects[0]; bpy.ops.export_scene.gltf(filepath=os.path.abspath(args.output),export_format='GLB',use_selection=True)
if __name__ == '__main__': main()
