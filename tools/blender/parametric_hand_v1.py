"""Dial Designer parametric-hand/v1 reference generator. 1 Blender unit = 1 mm.
Run: blender --background --python parametric_hand_v1.py -- --quality normal
"""
import argparse, json, math, os, sys
import bpy

SCHEMA='parametric-hand/v1'; SET_SCHEMA='parametric-hand-set/v1'; QUALITY={'preview':32,'normal':64,'high':96}
def d(v,n):
    if isinstance(v,dict) and v.get('status')=='unknown': raise ValueError('unknown required dimension: '+n)
    if not isinstance(v,(int,float)) or not math.isfinite(v) or v<0: raise ValueError('invalid dimension: '+n)
    return float(v)
def check(h):
    if h.get('schema')!=SCHEMA: raise ValueError('expected '+SCHEMA)
    d(h['hub']['diameter'],'hub.diameter'); d(h['hub']['thickness'],'hub.thickness'); hole=d(h['hub']['pinionHoleDiameter'],'hub.pinionHoleDiameter')
    if hole>=d(h['hub']['diameter'],'hub.diameter'): raise ValueError('pinionHoleDiameter must be smaller than hub diameter')
    body=d(h['body']['length'],'body.length'); tip=d(h['tip']['length'],'tip.length')
    if tip>body: raise ValueError('tip.length must not exceed body.length')
    for section in ('body','tip','tail'):
        for k,v in h[section].items():
            if isinstance(v,(int,float)) or isinstance(v,dict): d(v,section+'.'+k)
def material(name,color,rough):
    m=bpy.data.materials.get(name) or bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.metallic=.9; m.roughness=rough; return m
def link(name,mesh,col,mat):
    ob=bpy.data.objects.new(name,mesh); col.objects.link(ob); ob.data.materials.append(mat)
    for p in mesh.polygons: p.use_smooth=True
    return ob
def cyl(name,r,depth,z,col,mat,n):
    bpy.ops.mesh.primitive_cylinder_add(vertices=n,radius=r,depth=depth,location=(0,0,z)); ob=bpy.context.object; ob.name=name
    for c in list(ob.users_collection): c.objects.unlink(ob)
    col.objects.link(ob); ob.data.materials.append(mat); return ob
def prism(name,points,thick,z,col,mat):
    verts=[(x,y,z-thick/2) for x,y in points]+[(x,y,z+thick/2) for x,y in points]; q=len(points); faces=[tuple(range(q)),tuple(range(q,2*q))]
    for i in range(q): faces.append((i,(i+1)%q,(i+1)%q+q,i+q))
    ob=link(name,bpy.data.meshes.new(name+'_MESH'),col,mat); ob.data.from_pydata(verts,[],faces); ob.data.update();
    bevel=ob.modifiers.new('Conservative hand edge bevel','BEVEL'); bevel.width=min(.08,thick*.2); bevel.segments=2; return ob
def region(name,h,col,mat,lume,quality,z):
    b=h['body']; length=d(b['length'],'body.length'); root=d(b['rootWidth'],'body.rootWidth'); distal=d(b['distalWidth'],'body.distalWidth'); thick=d(b['thickness'],'body.thickness')
    body=prism(name+'_BODY',[(-root/2,0),(root/2,0),(distal/2,length),(-distal/2,length)],thick,z,col,mat)
    tip=h['tip']; style=tip['style']; tl=d(tip['length'],'tip.length'); tw=d(tip['width'],'tip.width')
    if style!='NONE':
        if style=='POINT': pts=[(-tw/2,length),(tw/2,length),(0,length+tl)]
        elif style=='TRIANGLE': pts=[(-tw/2,length),(tw/2,length),(tw/2,length+tl),(0,length+tl*1.15),(-tw/2,length+tl)]
        else: pts=[(-tw/2,length),(tw/2,length),(tw*.28,length+tl),(0,length+tl*1.2),(-tw*.28,length+tl)]
        prism(name+'_TIP',pts,thick,z,col,mat)
    tail=h['tail']; style=tail['style']; le=d(tail['length'],'tail.length'); w=d(tail['width'],'tail.width')
    if style!='NONE' and le>0: prism(name+'_TAIL',[(-w/2,0),(w/2,0),(w/3,-le),(-w/3,-le)],thick,z,col,mat)
    if style=='COUNTERWEIGHT' and tail.get('diskDiameter',0): cyl(name+'_TAIL_COUNTERWEIGHT',d(tail['diskDiameter'],'tail.diskDiameter')/2,thick,z-le,col,mat,QUALITY[quality])
    if style=='LOLLIPOP' and tail.get('diskDiameter',0): cyl(name+'_TAIL_LOLLIPOP',d(tail['diskDiameter'],'tail.diskDiameter')/2,thick,z-le,col,mat,QUALITY[quality])
    if h['lume'].get('body'): prism(name+'_LUME_BODY',[(-distal*.28,length*.08),(distal*.28,length*.08),(distal*.18,length*.86),(-distal*.18,length*.86)],thick*.35,z+thick*.52,col,lume)
    if tip.get('lume'): prism(name+'_LUME_TIP',[(-tw*.25,length+tl*.1),(tw*.25,length+tl*.1),(0,length+tl*.8)],thick*.35,z+thick*.52,col,lume)
    if tail.get('lume'): prism(name+'_LUME_TAIL',[(-w*.25,-le*.1),(w*.25,-le*.1),(0,-le*.8)],thick*.35,z+thick*.52,col,lume)
    return body
def hand(name,h,z,col,metal,lume,quality):
    check(h); n=QUALITY[quality]; hub=cyl(name+'_HUB',d(h['hub']['diameter'],'hub.diameter')/2,d(h['hub']['thickness'],'hub.thickness'),z,col,metal,n)
    hole=d(h['hub']['pinionHoleDiameter'],'hub.pinionHoleDiameter'); cutter=cyl(name+'_PINION_CUTTER',hole/2,d(h['hub']['thickness'],'hub.thickness')*3,z,col,metal,n); mod=hub.modifiers.new('REAL PINION BORE','BOOLEAN'); mod.operation='DIFFERENCE'; mod.object=cutter; bpy.context.view_layer.objects.active=hub; bpy.ops.object.modifier_apply(modifier=mod.name); bpy.data.objects.remove(cutter,do_unlink=True)
    return region(name,h,col,metal,lume,quality,z)
def build(data,quality='normal',output=None):
    if data.get('schema')==SCHEMA: hands={'HAND':data}
    elif data.get('schema')==SET_SCHEMA: hands={k.upper():v for k,v in data.items() if k in ('hour','minute','seconds') and v}
    else: raise ValueError('expected parametric-hand/v1 or parametric-hand-set/v1')
    old=bpy.data.collections.get('DD_PARAMETRIC_HANDS')
    if old:
        for o in list(old.objects): bpy.data.objects.remove(o,do_unlink=True)
        bpy.data.collections.remove(old)
    col=bpy.data.collections.new('DD_PARAMETRIC_HANDS'); bpy.context.scene.collection.children.link(col); metal=material('HAND_METAL',(.55,.58,.62),.18); lume=material('HAND_LUME',(.5,1,.35),.35)
    zmap={'HOUR':1.0,'MINUTE':1.45,'SECONDS':1.9}; made=[]
    for k,h in hands.items(): made.append(hand('DD_HAND_'+k,h,zmap.get(k,1.0),col,metal,lume,quality))
    if output:
        for o in bpy.context.selected_objects:o.select_set(False)
        for o in col.objects:o.select_set(True)
        bpy.context.view_layer.objects.active=made[0]; os.makedirs(os.path.dirname(os.path.abspath(output)),exist_ok=True); bpy.ops.export_scene.gltf(filepath=os.path.abspath(output),export_format='GLB',use_selection=True)
    return col
def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--params'); ap.add_argument('--output'); ap.add_argument('--quality',choices=QUALITY,default='normal'); a=ap.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    if not a.params: raise ValueError('--params is required; use a serialized parametric-hand/v1 or hand-set/v1 document')
    with open(a.params,encoding='utf-8') as f: data=json.load(f)
    build(data,a.quality,a.output)
if __name__=='__main__': main()
