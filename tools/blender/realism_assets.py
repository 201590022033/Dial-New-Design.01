"""Deterministic, staging-only realism component builder (Blender Python).

blender -b --python tools/blender/realism_assets.py -- --repo ROOT --output-dir RUN
Use --asset-path public/assets/3d/archetypes/strap-leather.glb for the canary.
Original GLB chunks are retained for material-only assets: protected geometry,
UVs, hierarchy, animation, names, frames and authored colours are not re-exported.
Generated maps are analytical, neutral surface-channel bakes, never baked light.
"""
import argparse
import copy
import hashlib
import json
import math
from pathlib import Path
import struct
import sys
import zlib

SCHEMA = 'dial-designer/realism-material/v1'


def read_glb(path):
    data = path.read_bytes()
    size = struct.unpack_from('<I', data, 12)[0]
    doc = json.loads(data[20:20+size])
    start = 20+size
    binary = bytearray(data[start+8:]) if start < len(data) else bytearray()
    return doc, binary


def write_glb(path, doc, binary):
    doc['buffers'] = [{'byteLength': len(binary)}]
    encoded = json.dumps(doc, separators=(',', ':')).encode()
    encoded += b' ' * (-len(encoded) % 4)
    binary += b'\0' * (-len(binary) % 4)
    data = struct.pack('<III', 0x46546c67, 2, 28+len(encoded)+len(binary))
    data += struct.pack('<II', len(encoded), 0x4e4f534a)+encoded
    data += struct.pack('<II', len(binary), 0x004e4942)+binary
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def document_counts(doc):
    def triangles(mesh):
        return sum(doc['accessors'][p.get('indices',p['attributes']['POSITION'])]['count']//3 for p in mesh['primitives'] if p.get('mode',4)==4)
    return {'stored_triangles':sum(triangles(m) for m in doc.get('meshes',[])), 'instantiated_triangles':sum(triangles(doc['meshes'][n['mesh']]) for n in doc.get('nodes',[]) if 'mesh' in n), 'nodes':len(doc.get('nodes',[])), 'materials':len(doc.get('materials',[])), 'images':len(doc.get('images',[])), 'primitives':sum(len(m['primitives']) for m in doc.get('meshes',[]))}


def append_view(doc, binary, data, **kwargs):
    binary += b'\0' * (-len(binary) % 4)
    index = len(doc.setdefault('bufferViews', []))
    doc['bufferViews'].append(dict(buffer=0, byteOffset=len(binary), byteLength=len(data), **kwargs))
    binary += data
    return index


def png(path, pixels):
    import numpy as np
    pixels = np.asarray(np.clip(pixels, 0, 1)*255+.5, dtype=np.uint8)
    height, width, channels = pixels.shape
    raw = b''.join(b'\0'+row.tobytes() for row in pixels)
    def chunk(kind, data):
        return struct.pack('>I', len(data))+kind+data+struct.pack('>I', zlib.crc32(kind+data)&0xffffffff)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR', struct.pack('>IIBBBBB', width,height,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b''))


def generate_maps(root):
    import numpy as np
    rng = np.random.default_rng(420614)
    maps = {}
    for recipe in ('leather','rubber','canvas','brushed','matte'):
        n=1024 if recipe=='leather' else 512
        y,x = np.mgrid[0:n,0:n]/n
        noise = rng.random((n,n))-.5
        if recipe == 'leather':
            # 192 jittered cells over64mm gives0.33mm irregular pore spacing.
            cells=192; seeds=rng.random((cells,cells,2))*.8+.1
            gx=x*cells+.14*np.sin(y*2*math.pi*13)
            gy=y*cells+.14*np.sin(x*2*math.pi*11)
            ix=np.floor(gx).astype(int); iy=np.floor(gy).astype(int)
            distance=np.full_like(x,10)
            for ox in (-1,0,1):
                for oy in (-1,0,1):
                    sx=ix+ox; sy=iy+oy; seed=seeds[sy%cells,sx%cells]
                    squared=(gx-sx-seed[...,0])**2+(gy-sy-seed[...,1])**2
                    distance=np.minimum(distance,squared)
            pores=np.exp(-distance/.06)
            height = -.022*pores+noise*.002
            rough = .52 + pores*.025 + noise*.025 + .015*np.sin(x*2*math.pi*7)*np.sin(y*2*math.pi*9)
        elif recipe == 'canvas':
            height = .018*(np.sin(x*2*math.pi*142)+np.sin(y*2*math.pi*142))*(.8+.2*np.sin((x+y)*2*math.pi*71))
            rough = .86 + noise*.04
        elif recipe == 'rubber':
            height = noise*.003
            rough = .63 + noise*.035
        elif recipe == 'brushed':
            # Stochastic fine strands avoid a coherent near-Nyquist sine tile,
            # whose mip levels read as broad/wavy bands at dashboard zoom.
            strands=(np.roll(noise[:,0],-1)+2*noise[:,0]+np.roll(noise[:,0],1))/4
            height = .00015*(strands[:,None]*.7+noise*.3)
            rough = .3+strands[:,None]*.0015+noise*.001
        else:
            height = noise*.001
            rough = .60+noise*.025
        dy,dx = np.gradient(height, 64/n)
        normal = np.stack((-dx,-dy,np.ones_like(dx)),axis=-1)
        normal /= np.linalg.norm(normal,axis=-1)[...,None]
        normal = normal*.5+.5
        # Packed G = normalized roughness variation; B remains metalness-neutral.
        reference = {'leather':.52,'rubber':.63,'canvas':.86,'brushed':.30,'matte':.60}[recipe]
        packed = np.stack((np.ones_like(x),np.clip(rough/reference,0,1),np.ones_like(x)),axis=-1)
        normal_path = root/recipe/'normal.png'; rough_path=root/recipe/'roughness.png'
        png(normal_path,normal); png(rough_path,packed)
        maps[recipe] = (normal_path,rough_path)
    return maps


def role_for(material, path):
    name = material.get('name','').lower()
    pbr = material.get('pbrMetallicRoughness',{})
    if 'diamond' in name: return 'diamond',None
    if 'sapphire' in name or 'crystal' in name: return 'crystal',None
    if 'strap' in name:
        kind = next((k for k in ('leather','racing','canvas','rubber') if k in path or k in name),'rubber')
        return ('strap-edge' if kind in ('leather','racing') and ('detail' in name or 'relief' in name) else 'strap-face'), ('leather' if kind=='racing' else kind)
    if 'lume' in name or 'luminous' in name: return 'hand-lume' if 'hand' in name else 'lume',None
    if 'hand' in name: return 'hand-metal' if pbr.get('metallicFactor',0)>.3 else 'hand-tip',None
    if ('marker' in name or 'marking metal' in name) and pbr.get('metallicFactor',0)>.5: return 'steel-polished',None
    if any(k in name for k in ('ink','marking','print','accent','numeral','logarithmic','date card')): return 'ink',None
    if 'dial' in name or 'register' in name: return 'dial-face','matte'
    if 'ceramic' in name or 'bezel insert' in name or 'bezel_insert' in name: return 'bezel-ceramic',None
    if any(k in name for k in ('steel','case_body','case_cavity','gold','pvd','metal')):
        if 'sandblast' in path or 'pvd_matte' in name: return 'steel-brushed','matte'
        return ('steel-polished' if 'polish' in name or 'gold' in name else 'steel-brushed'),('brushed' if 'polish' not in name else None)
    return None,None


def add_extension(doc, material, name, value):
    material.setdefault('extensions',{})[name] = value
    if name not in doc.setdefault('extensionsUsed',[]): doc['extensionsUsed'].append(name)


def texture(doc,binary,path):
    image = len(doc.setdefault('images',[]))
    doc['images'].append({'name':'DD_VR_'+path.parent.name+'_'+path.stem,'mimeType':'image/png','bufferView':append_view(doc,binary,path.read_bytes())})
    index = len(doc.setdefault('textures',[]))
    doc['textures'].append({'source':image})
    return index


def prepare_surface_uvs(doc,binary,path):
    """Add surface UV only where no authored UV exists; never touch artwork."""
    import numpy as np
    added=[]
    for node in doc.get('nodes',[]):
        if 'mesh' not in node: continue
        for primitive in doc['meshes'][node['mesh']]['primitives']:
            if 'material' not in primitive and 'strap-' in path and node.get('name','').startswith('DD_ARCH_STRAP_') and 'EDGE' not in node['name']:
                kind=next(k for k in ('leather','racing','canvas','rubber') if k in path)
                primitive['material']=len(doc.setdefault('materials',[]))
                doc['materials'].append({'name':kind+' strap','pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'metallicFactor':0,'roughnessFactor':.6}})
            material=doc.get('materials',[])[primitive['material']] if 'material' in primitive else {}
            role,recipe=role_for(material,path)
            attributes=primitive['attributes']
            if not recipe or role=='dial-face' or 'TEXCOORD_0' in attributes: continue
            accessor=doc['accessors'][attributes['POSITION']]
            view=doc['bufferViews'][accessor['bufferView']]
            if accessor['componentType']!=5126: continue
            start=view.get('byteOffset',0)+accessor.get('byteOffset',0)
            positions=np.ndarray((accessor['count'],3),dtype='<f4',buffer=binary,offset=start,strides=(view.get('byteStride',12),4)).copy()
            axes=np.argsort(np.ptp(positions,axis=0))[-2:]
            uv=positions[:,axes]/64
            new_view=append_view(doc,binary,np.asarray(uv,dtype='<f4').tobytes(),target=34962)
            attributes['TEXCOORD_0']=len(doc['accessors'])
            doc['accessors'].append({'bufferView':new_view,'componentType':5126,'count':len(positions),'type':'VEC2'})
            added.append(node.get('name'))
    return added


def add_surface_tangents(doc,binary):
    """Store explicit tangent frames for newly mapped surfaces, no normal edits."""
    import numpy as np
    def values(index, count):
        a=doc['accessors'][index]; v=doc['bufferViews'][a['bufferView']]
        dtype={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']]
        item=np.dtype(dtype).itemsize
        return np.ndarray((a['count'],count),dtype=dtype,buffer=binary,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',item*count),item)).copy()
    for mesh in doc.get('meshes',[]):
        for p in mesh['primitives']:
            mat=doc.get('materials',[])[p['material']] if 'material' in p else {}
            a=p['attributes']
            if 'normalTexture' not in mat or 'TANGENT' in a or not all(k in a for k in ('POSITION','NORMAL','TEXCOORD_0')) or p.get('mode',4)!=4: continue
            pos=values(a['POSITION'],3); normal=values(a['NORMAL'],3); uv=values(a['TEXCOORD_0'],2)
            indices=values(p['indices'],1).ravel() if 'indices' in p else np.arange(len(pos))
            tri=indices.reshape(-1,3)
            e1=pos[tri[:,1]]-pos[tri[:,0]]; e2=pos[tri[:,2]]-pos[tri[:,0]]
            d1=uv[tri[:,1]]-uv[tri[:,0]]; d2=uv[tri[:,2]]-uv[tri[:,0]]
            determinant=d1[:,0]*d2[:,1]-d1[:,1]*d2[:,0]
            inv=np.zeros_like(determinant); mask=np.abs(determinant)>1e-12; inv[mask]=1/determinant[mask]
            t=(e1*d2[:,1,None]-e2*d1[:,1,None])*inv[:,None]
            b=(e2*d1[:,0,None]-e1*d2[:,0,None])*inv[:,None]
            tangent=np.zeros_like(pos); bitangent=np.zeros_like(pos)
            for i in range(3): np.add.at(tangent,tri[:,i],t); np.add.at(bitangent,tri[:,i],b)
            tangent-=normal*np.sum(normal*tangent,axis=1)[:,None]
            length=np.linalg.norm(tangent,axis=1); bad=length<1e-8
            helper=np.zeros_like(normal); helper[:,2]=1; helper[np.abs(normal[:,2])>.9]=[0,1,0]
            tangent[bad]=np.cross(helper[bad],normal[bad]); length=np.linalg.norm(tangent,axis=1)
            tangent/=np.maximum(length[:,None],1e-10)
            w=np.where(np.sum(np.cross(normal,tangent)*bitangent,axis=1)<0,-1,1)
            result=np.column_stack((tangent,w)).astype('<f4')
            view=append_view(doc,binary,result.tobytes(),target=34962)
            a['TANGENT']=len(doc['accessors']); doc['accessors'].append({'bufferView':view,'componentType':5126,'count':len(pos),'type':'VEC4'})


def directional_anisotropy(doc,binary,path):
    """Explicit brush frames: circumferential case/crown; longitudinal lugs.

    New brush normal channels use this intentionally authored tangent frame.
    Existing artwork UV and geometric normals remain byte-for-byte unchanged.
    """
    import numpy as np
    records=[]
    def values(index):
        a=doc['accessors'][index]; v=doc['bufferViews'][a['bufferView']]
        return np.ndarray((a['count'],3),dtype='<f4',buffer=binary,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',12),4)).copy()
    for node in doc.get('nodes',[]):
        if 'mesh' not in node: continue
        for primitive in doc['meshes'][node['mesh']]['primitives']:
            if 'material' not in primitive: continue
            mat=doc['materials'][primitive['material']]
            if mat.get('extras',{}).get('DD_REALISM_ROLE')!='steel-brushed': continue
            name=node.get('name',''); attrs=primitive['attributes']
            if 'sandblast' in path or 'pvd_matte' in mat.get('name','').lower():
                records.append({'node':name,'status':'isotropic','reason':'Existing blasted/matte finish remains isotropic.'}); continue
            if 'TANGENT' in attrs or not all(k in attrs for k in ('POSITION','NORMAL','TEXCOORD_0')):
                records.append({'node':name,'status':'fallback','reason':'Existing authored tangent or incomplete surface frame preserved.'}); continue
            pos=values(attrs['POSITION']); normal=values(attrs['NORMAL'])
            if 'LUG' in name.upper() or 'SPRING' in name.upper() or 'PUSHER' in name.upper():
                extent=np.ptp(pos,axis=0); axis=0 if extent[0]>extent[2] else 2
                desired=np.zeros_like(pos); desired[:,axis]=1
                direction='longitudinal local '+('X' if axis==0 else 'Z')
            else:
                # Crown provenance specifies axial +X; watch components inherit +Y up.
                axis=0 if 'CROWN' in name.upper() else 1
                center=(np.min(pos,axis=0)+np.max(pos,axis=0))/2
                radial=pos-center; axial=np.zeros_like(pos); axial[:,axis]=1
                desired=np.cross(axial,radial)
                direction='circumferential local '+('X' if axis==0 else 'Y')
            tangent=desired-normal*np.sum(normal*desired,axis=1)[:,None]
            length=np.linalg.norm(tangent,axis=1); bad=length<1e-8
            helper=np.zeros_like(normal); helper[:,2]=1; helper[np.abs(normal[:,2])>.9]=[0,1,0]
            tangent[bad]=np.cross(helper[bad],normal[bad]); length=np.linalg.norm(tangent,axis=1)
            tangent/=np.maximum(length[:,None],1e-10)
            result=np.column_stack((tangent,np.ones(len(tangent)))).astype('<f4')
            view=append_view(doc,binary,result.tobytes(),target=34962)
            attrs['TANGENT']=len(doc['accessors']); doc['accessors'].append({'bufferView':view,'componentType':5126,'count':len(pos),'type':'VEC4'})
            add_extension(doc,mat,'KHR_materials_anisotropy',{'anisotropyStrength':.5,'anisotropyRotation':0})
            records.append({'node':name,'status':'anisotropic','strength':.5,'direction':direction,'frame':'authored geometric brush tangent; original positions/normals/UV preserved'})
    return records


def material_patch(doc,binary,path,maps):
    changes=[]; cached={}
    for index,material in enumerate(doc.get('materials',[])):
        role,recipe=role_for(material,path)
        if not role: changes.append({'material':material.get('name'),'status':'no-op','reason':'Unresolved material role; preserve authored material.'}); continue
        extras=material.setdefault('extras',{})
        extras.update(DD_REALISM_SCHEMA=SCHEMA,DD_REALISM_ROLE=role)
        pbr=material.setdefault('pbrMetallicRoughness',{})
        if role.startswith('strap'):
            shade=.45 if role=='strap-edge' and recipe=='leather' else 1
            extras.update(DD_REALISM_BASE='strap',DD_REALISM_SHADE=shade)
            if shade!=1:
                # Derived material uses the face's original fresh linear colour.
                face=next((m for m in doc['materials'] if role_for(m,path)[0]=='strap-face'),material)
                color=list(face.get('pbrMetallicRoughness',{}).get('baseColorFactor',[1,1,1,1]))
                pbr['baseColorFactor']=[c*shade for c in color[:3]]+[color[3]]
            pbr['roughnessFactor']=(.34 if shade!=1 else {'leather':.55,'canvas':.89,'rubber':.66}[recipe])
            add_extension(doc,material,'KHR_materials_sheen',{'sheenColorFactor':[.32,.29,.25] if recipe=='leather' else [.12,.12,.12],'sheenRoughnessFactor':.7})
        elif role=='crystal':
            pbr.update(baseColorFactor=[1,1,1,1],metallicFactor=0,roughnessFactor=0)
            material['alphaMode']='OPAQUE'
            add_extension(doc,material,'KHR_materials_transmission',{'transmissionFactor':1})
            add_extension(doc,material,'KHR_materials_ior',{'ior':1.55})
            add_extension(doc,material,'KHR_materials_iridescence',{'iridescenceFactor':.035,'iridescenceIor':1.3,'iridescenceThicknessMinimum':220,'iridescenceThicknessMaximum':220})
        elif role=='diamond':
            add_extension(doc,material,'KHR_materials_ior',{'ior':2.42})
            pbr['roughnessFactor']=.025
        elif role=='bezel-ceramic':
            pbr.update(metallicFactor=0,roughnessFactor=.16)
            add_extension(doc,material,'KHR_materials_clearcoat',{'clearcoatFactor':1,'clearcoatRoughnessFactor':.08})
        elif role in ('steel-brushed','steel-polished','hand-metal'):
            pbr.update(metallicFactor=1,roughnessFactor=.48 if recipe=='matte' else .3 if role=='steel-brushed' else .10)
        elif role=='dial-face': pbr['roughnessFactor']=.62
        elif role=='ink': pbr.update(metallicFactor=0,roughnessFactor=.60)
        elif role in ('lume','hand-lume'): pbr.update(metallicFactor=0,roughnessFactor=.70)
        has_uv=any('TEXCOORD_0' in p.get('attributes',{}) for mesh in doc.get('meshes',[]) for p in mesh['primitives'] if p.get('material')==index)
        # Do not replace an authored finish map or dial UV/artwork channel.
        if recipe and has_uv:
            if recipe not in cached: cached[recipe]=tuple(texture(doc,binary,p) for p in maps[recipe])
            normal,rough=cached[recipe]
            material.setdefault('normalTexture',{'index':normal,'scale':.65 if recipe=='leather' else .10 if recipe=='brushed' else .45})
            pbr.setdefault('metallicRoughnessTexture',{'index':rough})
        changes.append({'material':material.get('name'),'role':role,'recipe':recipe,'mapped':bool(recipe and has_uv)})
    return changes


def leather_detail(source, target, blend_path):
    import bpy
    from mathutils import Vector
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(source))
    body=bpy.data.objects.get('DD_ARCH_STRAP_6')
    if body is None: raise ValueError('Leather canary tail identity missing')
    bounds=[body.matrix_world@Vector(c) for c in body.bound_box]
    ymin,ymax=min(v.y for v in bounds),max(v.y for v in bounds)
    zmin,zmax=min(v.z for v in bounds),max(v.z for v in bounds)
    holes=[ymin+6+i*7.5 for i in range(7)]
    if holes[-1]+4>ymax-4: raise ValueError('Seven holes cannot fit preserved leather envelope')
    if not body.data.materials:
        base=bpy.data.materials.new('leather strap'); base.use_nodes=True
        base.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(1,1,1,1)
        base.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.52
        for label in ('12','6'): bpy.data.objects['DD_ARCH_STRAP_'+label].data.materials.append(base)
    else: base=body.data.materials[0]
    edge=base.copy(); edge.name='DD_VR_leather derived hole rim'
    thread=base.copy(); thread.name='DD_VR_cream waxed cotton stitch'
    bsdf=thread.node_tree.nodes.get('Principled BSDF'); bsdf.inputs['Base Color'].default_value=(.79,.72,.56,1); bsdf.inputs['Roughness'].default_value=.7
    thread['DD_REALISM_SCHEMA']=SCHEMA; thread['DD_REALISM_ROLE']='strap-stitch'
    face=base.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value[:]
    edge.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=tuple(c*.45 for c in face[:3])+(face[3],)
    edge.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.34
    edge['DD_REALISM_SCHEMA']=SCHEMA; edge['DD_REALISM_ROLE']='strap-hole-rim'; edge['DD_REALISM_BASE']='strap'; edge['DD_REALISM_SHADE']=.45
    for label in ('12','6'):
        strap=bpy.data.objects['DD_ARCH_STRAP_'+label]
        strap.data.materials.append(edge)
        for polygon in strap.data.polygons:
            center=strap.matrix_world@polygon.center
            normal=strap.matrix_world.to_3x3()@polygon.normal
            if abs(center.y)>25 and abs(normal.z)<.5: polygon.material_index=len(strap.data.materials)-1
    for i,y in enumerate(holes):
        bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=1,depth=zmax-zmin+2,location=(0,y,(zmax+zmin)/2))
        cutter=bpy.context.object; cutter.name=f'DD_VR_HOLE_CUTTER_6_{i+1}'; cutter.hide_render=True
        modifier=body.modifiers.new(f'DD_VR_adjustment_hole_6_{i+1}','BOOLEAN'); modifier.operation='DIFFERENCE'; modifier.solver='EXACT'; modifier.object=cutter
        cutter.hide_set(True)
        # Restrained rim inside existing thickness/width envelope, intersects face.
        bpy.ops.mesh.primitive_torus_add(major_segments=32,minor_segments=6,location=(0,y,zmax-.045),major_radius=1.05,minor_radius=.07)
        rim=bpy.context.object; rim.name=f'DD_VR_HOLE_RIM_6_{i+1}'; rim.data.materials.append(edge)
    for label in ('12','6'):
        strap=bpy.data.objects['DD_ARCH_STRAP_'+label]
        corners=[strap.matrix_world@Vector(c) for c in strap.bound_box]
        low,high=min(v.y for v in corners),max(v.y for v in corners)
        top=max(v.z for v in corners)
        vertices=[strap.matrix_world@v.co for v in strap.data.vertices]
        near=min(abs(v.y) for v in vertices); far=max(abs(v.y) for v in vertices)
        near_half=max(abs(v.x) for v in vertices if abs(v.y)<near+.3)
        far_half=max(abs(v.x) for v in vertices if abs(v.y)>far-.3)
        # Follow the actual taper2mm inside its edge, independent of source rails.
        for side in (-1,1):
            for i in range(16):
                y=low+6+i*3
                if y+1.7>high-4: continue
                fraction=max(0,min(1,(abs(y)-near)/(far-near)))
                row_x=side*(near_half+(far_half-near_half)*fraction-2)
                curve=bpy.data.curves.new(f'DD_VR_THREAD_{label}_{side}_{i}','CURVE'); curve.dimensions='3D'; curve.bevel_depth=.105; curve.bevel_resolution=1; curve.resolution_u=2
                spline=curve.splines.new('POLY'); spline.points.add(3)
                for point,dy,z in zip(spline.points,(-.85,-.55,.55,.85),(top-.09,top-.005,top-.005,top-.09)): point.co=(row_x,y+dy,z,1)
                obj=bpy.data.objects.new(curve.name,curve); bpy.context.collection.objects.link(obj); obj.data.materials.append(thread)
    # Missing 12-side keeper/tang hardware: bounded within source strap envelope.
    steel=bpy.data.objects.get('DD_SPRING_BAR_12_BODY').data.materials[0]
    for x in (-8.1,8.1):
        bpy.ops.mesh.primitive_cube_add(size=1,location=(x,71.5,(zmax+zmin)/2)); obj=bpy.context.object; obj.name='DD_VR_BUCKLE_12_SIDE_'+str(x); obj.dimensions=(.55,5.5,2.6); obj.data.materials.append(steel)
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0,74,zmax+.015)); obj=bpy.context.object; obj.name='DD_VR_BUCKLE_12_BRIDGE'; obj.dimensions=(16.5,.55,.12); obj.data.materials.append(steel)
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0,72,zmax+.015)); obj=bpy.context.object; obj.name='DD_VR_BUCKLE_12_TONGUE'; obj.dimensions=(.45,4,.12); obj.data.materials.append(steel)
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0,66,zmax+.015)); obj=bpy.context.object; obj.name='DD_VR_KEEPER_12'; obj.dimensions=(16.5,1.3,.12); obj.data.materials.append(edge)
    # Only newly generated map UVs on the two strap bodies; originals UV0 retained.
    for label in ('12','6'):
        obj=bpy.data.objects['DD_ARCH_STRAP_'+label]
        if not obj.data.uv_layers:
            uv=obj.data.uv_layers.new(name='DD_VR_SurfaceUV')
            for loop in obj.data.loops:
                v=obj.matrix_world@obj.data.vertices[loop.vertex_index].co
                uv.data[loop.index].uv=(v.x/64,v.y/64)
    for obj in bpy.context.scene.objects:
        if obj.name.startswith('DD_VR_'):
            obj['DD_PROVENANCE_STATUS']='provisional-presentation'
            obj['DD_PROVENANCE_SOURCE']='Watch realism2026-10-14; bounded leather construction detail derived from immutable VR0 source; presentation only, no physical-fit claim'
    blend_path.parent.mkdir(parents=True,exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    # Convert new thread curves only; original names/pivots/frames untouched.
    for obj in list(bpy.context.scene.objects):
        if obj.type=='CURVE':
            bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True)
            bpy.context.view_layer.objects.active=obj; bpy.ops.object.convert(target='MESH')
    for label in ('12','6'):
        for side in (-1,1):
            rows=[o for o in bpy.context.scene.objects if o.name.startswith(f'DD_VR_THREAD_{label}_{side}_')]
            if rows:
                bpy.ops.object.select_all(action='DESELECT')
                for row in rows: row.select_set(True)
                bpy.context.view_layer.objects.active=rows[0]; bpy.ops.object.join()
                rows[0].name=f'DD_VR_STITCH_ROW_{label}_{side}'
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.context.scene.objects:
        if 'CUTTER' not in obj.name:
            obj.hide_set(False); obj.select_set(True)
    target.parent.mkdir(parents=True,exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',use_selection=True,export_extras=True,export_apply=True,export_yup=True)
    return {'holes':7,'hole_side':'6','hole_diameter_mm':2,'hole_pitch_mm':7.5,'thread':'cream','hardware_side':'12','source_blend':str(blend_path)}


def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--repo',required=True); parser.add_argument('--output-dir',required=True); parser.add_argument('--asset-path',action='append'); parser.add_argument('--manifest'); parser.add_argument('--asset-id'); parser.add_argument('--stage',default='build')
    args=parser.parse_args(sys.argv[sys.argv.index('--')+1:])
    repo=Path(args.repo).resolve(); output=Path(args.output_dir).resolve()
    manifest=Path(args.manifest) if args.manifest else repo/'docs/realism/VR0-INPUT-MANIFEST.json'
    baseline=json.loads(manifest.read_text())
    manifest_hash=hashlib.sha256(manifest.read_bytes()).hexdigest()
    maps=generate_maps(output/'bakes')
    recipe_report=output/'reports'/'surface-recipes.json'; recipe_report.parent.mkdir(parents=True,exist_ok=True)
    recipe_report.write_text(json.dumps({'seed':420614,'map_size':{'leather':[1024,1024],'other':[512,512]},'map_period_mm':64,'external_sources':[],'provenance':'Original analytical procedural fields in tools/blender/realism_assets.py; neutral tangent normal and packed linear roughness; no lighting or base-colour pixels.','normal_relief_mm':{'leather':.022,'canvas':.018,'rubber':.003,'brushed':.00015,'matte':.001},'script_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},indent=2)+'\n')
    records=[]
    for item in baseline['files']:
        relative=item['path']
        if not item.get('eligible',True): continue
        if '/face-review/' in relative: continue
        if args.asset_path and relative not in args.asset_path: continue
        if args.asset_id and args.asset_id not in (item.get('assetId'),Path(relative).stem): continue
        # Always use the verified immutable original, including after promotion.
        # Public paths may already contain a candidate and are never build inputs.
        source=repo/'.artifacts/blender-review/realism/vr0-2026-10-13/backup'/relative
        target=output/'web'/relative
        sha=hashlib.sha256(source.read_bytes()).hexdigest()
        if sha!=item['sha256']: raise ValueError('Immutable original hash changed: '+relative)
        original_doc,_=read_glb(source)
        detail=None
        if relative.endswith('/archetypes/strap-leather.glb'):
            detail=leather_detail(source,target,output/'work'/Path(relative).with_suffix('.blend'))
            doc,binary=read_glb(target)
        else: doc,binary=read_glb(source)
        added_uvs=prepare_surface_uvs(doc,binary,relative)
        changes=material_patch(doc,binary,relative,maps)
        anisotropy=directional_anisotropy(doc,binary,relative)
        add_surface_tangents(doc,binary)
        # Preserve explicitly authored generated-region extras instead of name guessing.
        for mat in doc.get('materials',[]):
            if 'DD_VR_cream' in mat.get('name',''): mat['extras'].update(DD_REALISM_SCHEMA=SCHEMA,DD_REALISM_ROLE='strap-stitch'); mat['pbrMetallicRoughness']['roughnessFactor']=.7
            if 'derived hole rim' in mat.get('name',''): mat['extras'].update(DD_REALISM_SCHEMA=SCHEMA,DD_REALISM_ROLE='strap-hole-rim',DD_REALISM_BASE='strap',DD_REALISM_SHADE=.45)
        write_glb(target,doc,binary)
        record={'path':relative,'status':'processed','source_sha256':sha,'candidate_sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'source_bytes':source.stat().st_size,'candidate_bytes':target.stat().st_size,'changes':changes,'detail':detail,'extensions':doc.get('extensionsUsed',[]),'feature_losses':['Procedural surface channels sampled to deterministic 512 px neutral normal/roughness maps.','Circumferential anisotropy omitted: preserve isotropic roughness/normal fallback.','Cycles lighting, DOF and colour management are render-only.'],'preservation':'Original GLB geometry/UV/hierarchy chunks retained exactly.' if not detail else 'Original object names/transforms retained; approved 6-tail Boolean holes and bounded new detail geometry.'}
        record['added_surface_uv_objects']=added_uvs
        record['source_read_path']=str(source)
        record['input_manifest_sha256']=manifest_hash
        record['anisotropy']=anisotropy
        record['feature_losses'][1]='Directional anisotropy .5 carried by authored brush frames; any preserved authored-frame fallback is listed per primitive.'
        record['before']=document_counts(original_doc)
        record['after']=document_counts(doc)
        record['added_detail_objects']=[n.get('name') for n in doc.get('nodes',[]) if n.get('name','').startswith('DD_VR_')]
        record['new_map_dimensions']=sorted({(1024,1024) if c.get('recipe')=='leather' else (512,512) for c in changes if c.get('mapped')})
        record['feature_losses'][0]='Procedural surface channels sampled to deterministic neutral normal/roughness maps (leather1024px, other512px).'
        if detail:
            record['feature_losses'].extend(['Existing3mm leather thickness and straight source profile retained instead of requested3.5–4mm pillow silhouette.','Buckle bridge/tongue and keeper top band are bounded presentation details; a projecting functional keeper loop would exceed the approved source envelope and is omitted.'])
        if '/strap-racing.glb' in relative:
            record['feature_losses'].append('Original shallow filled racing-perforation cylinders retained on both halves; these are decorative rather than cut-through holes. Seven new centerline adjustment holes omitted where they would overlap the existing decorative centerline pattern; no pattern or envelope redesign.')
        records.append(record); print('DD_REALISM_PROCESSED '+relative,flush=True)
        destination=output/'reports'/'asset-changes.json'; destination.parent.mkdir(parents=True,exist_ok=True)
        existing=json.loads(destination.read_text()) if destination.exists() else {'schema':'dial-designer/realism-assets/v1','files':[]}
        existing['files']=[f for f in existing['files'] if f['path']!=relative]+[record]
        existing['files'].sort(key=lambda f:f['path']); destination.write_text(json.dumps(existing,indent=2)+'\n')
    expected=[f['path'] for f in baseline['files'] if f.get('eligible',True) and '/face-review/' not in f['path']]
    report=output/'reports'/'asset-changes.json'
    done=json.loads(report.read_text())['files'] if report.exists() else []
    accounted={f['path'] for f in done}
    accounting={'schema':'dial-designer/realism-input-accounting/v1','manifest_sha256':manifest_hash,'expected_count':len(expected),'processed_count':len(accounted),'pending':[p for p in expected if p not in accounted],'excluded':[{'path':f['path'],'reason':f.get('reason','Unregistered review fixture')} for f in baseline['files'] if not f.get('eligible',True)]}
    (output/'reports'/'asset-accounting.json').write_text(json.dumps(accounting,indent=2)+'\n')
    print('DD_REALISM_COMPLETE '+str(len(records)),flush=True)


if __name__=='__main__': main()
