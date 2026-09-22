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
    'bezelLipHeight': 1.10, 'casebackLipHeight': .80, 'lugRootWidth': 5.2, 'lugTipWidth': 4.0, 'lugPairGap': 6.0,
    'lugCaseOverlap': 0.8, 'lugTipDrop': 1.35, 'lugThickness': 4.5, 'lugTaperStrength': .80,
    'lugStyle': 'straight', 'lugCurveStrength': .75, 'lugTwistDeg': 16.0, 'lugHoodLength': 2.4,
    'lugWireDiameter': 1.6, 'lugFacetDepth': .55, 'lugSkeletonCutoutRatio': .46,
    'crownTubeRadius': 1.50, 'crownTubeLength': 2.30, 'crownBossRadius': 2.10,
    'crownBossLength': 1.50, 'crownBossEmbed': 2.20, 'crownTubeEmbed': 1.50,
    'pusherCount': 0, 'pusherLayout': 'none', 'pusherAngularOffsetDeg': 0,
    'pusherTubeRadius': 0.90, 'pusherTubeLength': 1.80, 'pusherTubeEmbed': 1.20,
    'pusherBossRadius': 1.40, 'pusherBossLength': 1.00, 'pusherBossEmbed': 1.20,
    'springBarHoleDiameter': 2.00, 'springBarHoleFromLugTip': 2.80,
    'springBarHoleFromLowerLugEdge': 1.20, 'dialSeatDepth': 1.20,
    'chapterRingSeatDepth': 1.50, 'crownTubeThreadOuterDiameter': 3.50,
    'crownTubeThreadPitch': 0.35, 'crownTubeBoreDiameter': 2.10,
    'stemEngagementLength': 1.80, 'crystalAxialSeatDepth': 1.80,
    'handCrystalClearance': 0.65,
}
def number(p, name):
    v = p.get(name)
    if isinstance(v, dict) and v.get('status') == 'unknown': raise ValueError("unknown required dimension: " + name)
    if not isinstance(v, (int, float)) or not math.isfinite(v): raise ValueError("missing/invalid dimension: " + name)
    if v < 0: raise ValueError("negative dimension: " + name)
    return float(v)
def validate(p):
    numeric_required = [k for k in REFERENCE.keys() if k not in ('schema', 'pusherLayout', 'lugStyle')]
    for k in numeric_required: number(p, k)
    if number(p, 'caseDiameter') <= 0: raise ValueError('caseDiameter must be greater than zero')
    if number(p, 'dialOpening') >= number(p, 'caseDiameter') or number(p, 'crystalSeatDiameter') >= number(p, 'caseDiameter'): raise ValueError('openings must be smaller than caseDiameter')
    if number(p, 'lugToLug') < number(p, 'caseDiameter'): raise ValueError('lugToLug must not be smaller than caseDiameter')
    if number(p, 'lugTipWidth') > number(p, 'lugWidth'): raise ValueError('lugTipWidth must not exceed lugWidth')
    if number(p, 'lugPairGap') > number(p, 'lugWidth'):
        raise ValueError('lugPairGap must not exceed the nominal lugWidth/strap envelope')
    if number(p, 'crownTubeBoreDiameter') >= number(p, 'crownTubeThreadOuterDiameter'):
        raise ValueError('crownTubeBoreDiameter must be smaller than crownTubeThreadOuterDiameter')
    if number(p, 'springBarHoleFromLugTip') > number(p, 'lugToLug') / 2:
        raise ValueError('springBarHoleFromLugTip must remain inside the lug length')
    if p.get('lugStyle', 'straight') not in ('straight','curved','twisted','hooded','integrated','drilled','wire','teardrop','faceted','skeleton'):
        raise ValueError('unsupported lugStyle')
    if p.get('lugStyle') == 'skeleton' and not 0 < number(p, 'lugSkeletonCutoutRatio') < .8:
        raise ValueError('lugSkeletonCutoutRatio must be greater than 0 and less than 0.8')
    pc = int(number(p, 'pusherCount'))
    if pc not in (0, 1, 2): raise ValueError('pusherCount must be 0, 1, or 2')
    if pc > 0:
        layout = p.get('pusherLayout')
        if layout not in ('2h-4h', 'custom'): raise ValueError('pusherLayout must be 2h-4h or custom when pusherCount > 0')
        if number(p, 'pusherTubeRadius') > number(p, 'pusherBossRadius'):
            raise ValueError('pusherTubeRadius must not exceed pusherBossRadius')
def mat(name, color, metallic=0.8, rough=.3):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name); m.diffuse_color = (*color, 1); m.metallic = metallic; m.roughness = rough; return m
def mesh(name, verts, faces, collection, material=None):
    me = bpy.data.meshes.new(name + '_MESH'); me.from_pydata(verts, [], faces); me.update(); ob = bpy.data.objects.new(name, me); collection.objects.link(ob)
    if material: ob.data.materials.append(material)
    for poly in me.polygons: poly.use_smooth = True
    return ob
def torus(name, major_radius, minor_radius, z, collection, material, major_segments=192, minor_segments=12):
    bpy.ops.mesh.primitive_torus_add(major_segments=major_segments, minor_segments=minor_segments,
                                    location=(0, 0, z), major_radius=major_radius, minor_radius=minor_radius)
    ob=bpy.context.object; ob.name=name; collection.objects.link(ob)
    [c.objects.unlink(ob) for c in list(ob.users_collection) if c != collection]
    ob.data.materials.append(material)
    for poly in ob.data.polygons: poly.use_smooth=True
    return ob
def revolve(p, n, collection, material):
    r = number(p, 'caseDiameter') / 2; h = number(p, 'midcaseHeight'); inner = number(p, 'dialOpening') / 2
    upper = number(p, 'upperCaseRadiusReduction'); lower = number(p, 'lowerCaseRadiusReduction')
    bulge = number(p, 'middleCaseBulge')
    # Dense, smooth cross-section: lower opening -> caseback land -> lower chamfer ->
    # brushed belly -> upper chamfer -> crystal/chapter/dial seats. The shoulder
    # reduction parameters now control the silhouette instead of being metadata only.
    chapter_z = h / 2 - number(p, 'chapterRingSeatDepth')
    dial_z = h / 2 - number(p, 'dialSeatDepth')
    crystal_radius = number(p, 'crystalSeatDiameter') / 2
    profile = [
        (inner, -h/2+.8), (r-lower-.55, -h/2+.2),
        (r-lower*.55, -h/2+.34), (r-lower*.12, -h*.34),
        (r+bulge*.72, -h*.13), (r+bulge, 0), (r+bulge*.72, h*.13),
        (r-upper*.12, h*.34), (r-upper*.62, h/2-.34),
        (crystal_radius, h/2),
        (crystal_radius-.45, h/2), (crystal_radius-.45, chapter_z),
        (inner+.35, chapter_z), (inner+.35, dial_z), (inner, dial_z)
    ]
    rings = [[(rad*math.cos(2*math.pi*i/n), rad*math.sin(2*math.pi*i/n), z) for i in range(n)] for rad,z in profile]
    verts = [v for ring in rings for v in ring]; faces=[]
    for j in range(len(rings)-1):
        for i in range(n): faces.append((j*n+i, j*n+(i+1)%n, (j+1)*n+(i+1)%n, (j+1)*n+i))
    return mesh('DD_CASE_MIDCASE', verts, faces, collection, material)
def cylinder(name, radius, depth, loc, collection, material):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=radius, depth=depth, location=loc, rotation=(0, math.pi/2, 0)); ob=bpy.context.object; ob.name=name; collection.objects.link(ob); [c.objects.unlink(ob) for c in list(ob.users_collection) if c != collection]; ob.data.materials.append(material); return ob
def tube(name, outer_radius, inner_radius, depth, loc, collection, material):
    n = 64; x0 = loc[0] - depth / 2; x1 = loc[0] + depth / 2
    verts = []
    for x in (x0, x1):
        verts += [(x, outer_radius * math.cos(2*math.pi*i/n), outer_radius * math.sin(2*math.pi*i/n)) for i in range(n)]
        verts += [(x, inner_radius * math.cos(2*math.pi*i/n), inner_radius * math.sin(2*math.pi*i/n)) for i in range(n)]
    faces = []
    for i in range(n):
        j = (i + 1) % n
        faces += [(i, j, n+j, n+i), (2*n+i, 3*n+i, 3*n+j, 2*n+j)]
        faces += [(i, 2*n+i, 2*n+j, j), (n+i, n+j, 3*n+j, 3*n+i)]
    return mesh(name, verts, faces, collection, material)
def cut_spring_bar_hole(lug, p, center_x, center_y, center_z, width):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=number(p, 'springBarHoleDiameter') / 2, depth=width + 0.8, location=(center_x, center_y, center_z), rotation=(0, math.pi/2, 0))
    cutter = bpy.context.object
    try:
        modifier = lug.modifiers.new('Estimated nominal spring-bar hole', 'BOOLEAN')
        modifier.operation = 'DIFFERENCE'; modifier.solver = 'EXACT'; modifier.object = cutter
        bpy.context.view_layer.objects.active = lug
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    finally:
        bpy.data.objects.remove(cutter, do_unlink=True)
def lug_loft(name, p, end_sign, side_sign, root_y, span, collection, material, polished):
    style=p.get('lugStyle','straight'); root_w=number(p,'lugRootWidth'); tip_w=number(p,'lugTipWidth')
    thickness=number(p,'lugThickness'); drop=number(p,'lugTipDrop'); gap=number(p,'lugPairGap')
    root_x=side_sign*(gap/2+root_w/2); tip_x=side_sign*(gap/2+tip_w/2)
    verts=[]
    sections=(0.0,.18,.42,.68,.86,1.0)
    for t in sections:
        eased=t*t*(3-2*t)
        y=(1-t)*root_y+t*end_sign*span
        x=(1-eased)*root_x+eased*tip_x
        width=(1-eased)*root_w+eased*tip_w
        z=-drop*(.12+.38*eased)
        if style=='curved': z=-drop*(.08+.92*eased)*number(p,'lugCurveStrength')
        elif style=='teardrop': width*=1-.48*eased*eased; z-=drop*.22*eased
        elif style=='twisted': x+=side_sign*.55*math.sin(math.pi*eased)
        angle=math.radians(number(p,'lugTwistDeg')*eased) if style=='twisted' else 0
        for sx,sz in ((-1,-1),(1,-1),(1,1),(-1,1)):
            dx=sx*width/2; dz=sz*thickness/2
            rx=dx*math.cos(angle)-dz*math.sin(angle); rz=dx*math.sin(angle)+dz*math.cos(angle)
            if style=='faceted' and sz>0: rz+=number(p,'lugFacetDepth')*math.sin(math.pi*t)
            verts.append((x+rx,y,z+rz))
    last=(len(sections)-1)*4
    faces=[(0,1,2,3),(last,last+3,last+2,last+1)]
    for section in range(len(sections)-1):
        a=section*4; b=(section+1)*4
        for edge in range(4): faces.append((a+edge,a+(edge+1)%4,b+(edge+1)%4,b+edge))
    ob=mesh(name,verts,faces,collection,material); ob['DD_LUG_STYLE']=style; ob['DD_GEOMETRY_STATUS']='ESTIMATED_NOMINAL'
    ob.data.materials.append(polished)
    # Top planes become a controlled polished facet while flanks remain brushed.
    for poly in ob.data.polygons:
        if poly.normal.z > .48: poly.material_index=1
    ob['DD_SURFACE_TREATMENT']='brushed-flanks/polished-upper-facet'
    return ob, root_x
def fixed_wire_lug(name, p, end_sign, root_y, span, collection, material):
    gap=number(p,'lugPairGap'); wire=number(p,'lugWireDiameter'); x=gap/2+wire/2
    curve=bpy.data.curves.new(name+'_CURVE','CURVE'); curve.dimensions='3D'; curve.resolution_u=12
    curve.bevel_depth=wire/2; curve.bevel_resolution=4
    spline=curve.splines.new('BEZIER'); spline.bezier_points.add(3)
    coords=[(-x,root_y,0),(-x,end_sign*span,-number(p,'lugTipDrop')),(x,end_sign*span,-number(p,'lugTipDrop')),(x,root_y,0)]
    for point,coord in zip(spline.bezier_points,coords): point.co=coord; point.handle_left_type='AUTO'; point.handle_right_type='AUTO'
    ob=bpy.data.objects.new(name,curve); collection.objects.link(ob); ob.data.materials.append(material)
    ob['DD_LUG_STYLE']='wire'; ob['DD_STRAP_INTERFACE']='fixed-wire'; ob['DD_GEOMETRY_STATUS']='ESTIMATED_NOMINAL'; return ob
def integrated_lug(name, p, end_sign, root_y, span, collection, material):
    root_w=number(p,'lugPairGap')+2*number(p,'lugRootWidth'); tip_w=number(p,'lugPairGap')
    thickness=number(p,'lugThickness'); z=-number(p,'lugTipDrop')/2
    verts=[]
    for y,w in ((root_y,root_w),(end_sign*span,tip_w)):
        verts += [(-w/2,y,z-thickness/2),(w/2,y,z-thickness/2),(w/2,y,z+thickness/2),(-w/2,y,z+thickness/2)]
    faces=[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]
    ob=mesh(name,verts,faces,collection,material); ob['DD_LUG_STYLE']='integrated'; ob['DD_STRAP_INTERFACE']='integrated'; ob['DD_GEOMETRY_STATUS']='ESTIMATED_NOMINAL'
    bevel=ob.modifiers.new('Integrated shoulder bevel','BEVEL'); bevel.width=.35; bevel.segments=3; return ob
def build(p, quality='normal'):
    validate(p); old=bpy.data.collections.get('DD_PARAMETRIC_CASE')
    if old:
        for ob in list(old.objects): bpy.data.objects.remove(ob, do_unlink=True)
        bpy.data.collections.remove(old)
    col=bpy.data.collections.new('DD_PARAMETRIC_CASE'); bpy.context.scene.collection.children.link(col)
    steel=mat('DD Brushed Steel', (.38,.42,.47), .96, .3); polished=mat('DD Polished Steel', (.72,.76,.82), 1.0, .075)
    n=QUALITY[quality]; revolve(p,n,col,steel)
    r=number(p,'caseDiameter')/2; root_width=number(p,'lugRootWidth'); tip_width=number(p,'lugTipWidth'); pair_gap=number(p,'lugPairGap'); span=number(p,'lugToLug')/2
    # Separate polished shoulder bands create readable transitions under studio
    # lighting without changing the controlled case envelope.
    upper_radius=r-number(p,'upperCaseRadiusReduction')*.38
    lower_radius=r-number(p,'lowerCaseRadiusReduction')*.42
    upper_band=torus('DD_CASE_UPPER_CHAMFER',upper_radius,.13,number(p,'midcaseHeight')*.405,col,polished,n,10)
    lower_band=torus('DD_CASE_LOWER_CHAMFER',lower_radius,.11,-number(p,'midcaseHeight')*.405,col,polished,n,10)
    upper_band['DD_SURFACE_TREATMENT']='polished-upper-transition'; lower_band['DD_SURFACE_TREATMENT']='polished-lower-transition'
    # Two tapered prisms at each strap end. The crown axis (+X) stays clear;
    # the case retains only its boss and tube on that side.
    # Follow the circular case shoulder at each root corner, inset by
    # lugCaseOverlap. A single flat radial root plane floats when a wide paired
    # lug is moved outward to match a published inside-lug width.
    root_radius=r-number(p,'lugCaseOverlap')
    style=p.get('lugStyle','straight')
    for end_name, end_sign in [('12',1),('6',-1)]:
      root_y=end_sign*math.sqrt(max(0,root_radius*root_radius-(pair_gap/2+root_width/2)**2))
      if style=='wire':
        fixed_wire_lug('DD_CASE_LUG_'+end_name+'_WIRE',p,end_sign,root_y,span,col,polished)
        continue
      if style=='integrated':
        integrated_lug('DD_CASE_LUG_'+end_name+'_INTEGRATED',p,end_sign,root_y,span,col,steel)
        continue
      lug_objects=[]
      for side_name, side_sign in [('L',-1),('R',1)]:
        ob,root_center=lug_loft('DD_CASE_LUG_'+end_name+'_'+side_name,p,end_sign,side_sign,root_y,span,col,steel,polished)
        hole_y=end_sign*(span-number(p,'springBarHoleFromLugTip'))
        hole_z=-number(p,'lugTipDrop')/2-number(p,'lugThickness')/2+number(p,'springBarHoleFromLowerLugEdge')
        cut_spring_bar_hole(ob,p,root_center,hole_y,hole_z,root_width)
        ob['DD_SPRING_BAR_ACCESS']='through-drilled' if style=='drilled' else 'inside-lug'
        lug_objects.append(ob)
        if style=='skeleton':
            bpy.ops.mesh.primitive_cube_add(location=(root_center,(root_y+end_sign*span)/2,-number(p,'lugTipDrop')/2))
            cutter=bpy.context.object; cutter.scale=(root_width*number(p,'lugSkeletonCutoutRatio')/2,abs(end_sign*span-root_y)*.27,number(p,'lugThickness'))
            modifier=ob.modifiers.new('Skeleton lug cutout','BOOLEAN'); modifier.operation='DIFFERENCE'; modifier.solver='EXACT'; modifier.object=cutter
            bpy.context.view_layer.objects.active=ob; bpy.ops.object.modifier_apply(modifier=modifier.name); bpy.data.objects.remove(cutter,do_unlink=True)
        bevel=ob.modifiers.new('Lug family edge treatment','BEVEL'); bevel.width=.22 if style!='teardrop' else .34; bevel.segments=4
      if style=='hooded':
        hood_len=number(p,'lugHoodLength'); hood_y=root_y+end_sign*hood_len/2
        bpy.ops.mesh.primitive_cube_add(location=(0,hood_y,number(p,'lugThickness')*.18-number(p,'lugTipDrop')/2), scale=(pair_gap/2+root_width,hood_len/2,number(p,'lugThickness')*.16))
        hood=bpy.context.object; hood.name='DD_CASE_LUG_'+end_name+'_HOOD'; col.objects.link(hood); [c.objects.unlink(hood) for c in list(hood.users_collection) if c != col]; hood.data.materials.append(steel)
        hood['DD_LUG_STYLE']='hooded'; hood['DD_GEOMETRY_STATUS']='ESTIMATED_NOMINAL'
    x=r-number(p,'crownBossEmbed')+number(p,'crownBossLength')/2; cylinder('DD_CASE_CROWN_BOSS',number(p,'crownBossRadius'),number(p,'crownBossLength'),(x,0,0),col,polished)
    x=r-number(p,'crownTubeEmbed')+number(p,'crownTubeLength')/2
    tube('DD_CASE_CROWN_TUBE',number(p,'crownTubeThreadOuterDiameter')/2,number(p,'crownTubeBoreDiameter')/2,number(p,'crownTubeLength'),(x,0,0),col,polished)
    # Chronograph pushers at 2h (+60°) and 4h (-60°) around the +X crown axis.
    pc=int(number(p,'pusherCount'))
    if pc > 0 and p.get('pusherLayout') in ('2h-4h','custom'):
        offset=number(p,'pusherAngularOffsetDeg')*math.pi/180
        angles=[math.pi/3+offset, -math.pi/3+offset][:pc]
        for i, theta in enumerate(angles):
            name_suffix='2H' if i==0 else '4H'
            dx, dy = math.cos(theta), math.sin(theta)
            tube_embed=number(p,'pusherTubeEmbed'); tube_len=number(p,'pusherTubeLength')
            tube_r=number(p,'pusherTubeRadius')
            # Tube starts embedded in case and extends outward along the pusher axis.
            tube_start=r-tube_embed
            tx=(tube_start+tube_len/2)*dx; ty=(tube_start+tube_len/2)*dy
            bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=tube_r, depth=tube_len, location=(tx,ty,0), rotation=(0, math.pi/2, theta-math.pi/2))
            ob=bpy.context.object; ob.name=f'DD_CASE_PUSHER_TUBE_{name_suffix}'; col.objects.link(ob); [c.objects.unlink(ob) for c in list(ob.users_collection) if c != col]; ob.data.materials.append(polished)
            boss_embed=number(p,'pusherBossEmbed'); boss_len=number(p,'pusherBossLength')
            boss_r=number(p,'pusherBossRadius')
            boss_start=r-boss_embed
            bx=(boss_start+boss_len/2)*dx; by=(boss_start+boss_len/2)*dy
            bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=boss_r, depth=boss_len, location=(bx,by,0), rotation=(0, math.pi/2, theta-math.pi/2))
            ob=bpy.context.object; ob.name=f'DD_CASE_PUSHER_BOSS_{name_suffix}'; col.objects.link(ob); [c.objects.unlink(ob) for c in list(ob.users_collection) if c != col]; ob.data.materials.append(polished)
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
