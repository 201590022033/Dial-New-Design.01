"""Reproducible six-gallery assembly/export and serialized Cycles product photography.

Production components retain numeric-mm coordinates. Standalone scene converts once
through a labelled 0.001 root. Every camera/light is excluded from style export.
"""
import argparse, hashlib, json, math, sys, time
from pathlib import Path
import bpy
from mathutils import Matrix, Vector, Euler
sys.path.insert(0,str(Path(__file__).resolve().parent))
from realism_normalize_export import repair_export_tangents
SCHEMA='dial-designer/realism-material/v1'
def linear(hex):
    rgb=[int(hex.lstrip('#')[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in rgb)+(1,)
def material(name,color,metal=0,rough=.5,role=None):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=linear(color);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    if role:m['DD_REALISM_SCHEMA']=SCHEMA;m['DD_REALISM_ROLE']=role
    return m
def mesh(name,g,mat):
    p=g['positions'];v=[p[i:i+3]for i in range(0,len(p),3)];idx=g['indices']or list(range(len(v)))
    data=bpy.data.meshes.new(name);data.from_pydata(v,[],[idx[i:i+3]for i in range(0,len(idx),3)]);data.update()
    if g.get('uv'):
        uv=data.uv_layers.new(name='UVMap')
        for loop in data.loops:uv.data[loop.index].uv=g['uv'][loop.vertex_index*2:loop.vertex_index*2+2]
    o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.data.materials.append(mat);return o
def cylinder(name,radius,depth,z,mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=128,radius=radius,depth=depth,location=(0,0,z));o=bpy.context.object;o.name=name;o.data.materials.append(mat)
    bevel=o.modifiers.new('DD_VR_preserved_envelope_bevel','BEVEL');bevel.width=min(.04,depth/8);bevel.segments=2
    return o
def transform(p):
    def frame(t,r,s=(1,1,1)):return Matrix.Translation(Vector(t))@Euler(r,'XYZ').to_matrix().to_4x4()@Matrix.Diagonal((*s,1))
    return frame(p['anchor']['positionMm'],p['anchor']['rotationRad'])@frame(p['offset'],p['rotation'])@frame(p['descriptorOffset'],p['descriptorRotation'],p['descriptorScale'])
def recolor(objects,category,model):
    a=model['archetypeAppearance']
    for o in objects:
        if o.type!='MESH':continue
        if category=='dial' and any(t in o.name.upper() for t in ['HOUR_MARKER','HOUR_INDEX','ROMAN','NUMERAL']):o.hide_render=True
        for slot in o.material_slots:
            if not slot.material:continue
            m=slot.material.copy();slot.material=m;p=m.node_tree.nodes.get('Principled BSDF')if m.use_nodes else None
            if not p:continue
            role=m.get('DD_REALISM_ROLE','');color=None
            if role.startswith('strap-') and role not in ('strap-stitch','strap-hardware'):color=a['strapColor']
            elif role=='dial-face':color=model['dialColor']
            elif role in ('hand-metal','hand-tip'):
                region=a.get('regions',{}).get('mainHands',{})
                color=region.get('tipColor')if role=='hand-tip'else region.get('metalColor')
                if not color:
                    face=linear(model['dialColor']);luminance=face[0]*.2126+face[1]*.7152+face[2]*.0722
                    color=a.get('handsColor')or('#26313d'if luminance>.55 else'#d7dde3')
            if color:
                c=linear(color);shade=float(m.get('DD_REALISM_SHADE',1));p.inputs['Base Color'].default_value=tuple(x*shade for x in c[:3])+(1,)
def live_artwork(style,run):
    model=style['model'];d=model['dial'];comp=next(c for c in style['components']if c['category']=='dial');p=comp['placement']
    z=p['anchor']['positionMm'][2]+p['offset'][2]+(p['descriptorOffset'][2]if p['glb']else model['previewEnvelope']['dialZ']-p['anchor']['positionMm'][2])+d['thicknessMm']/2+.34
    a=model['archetypeAppearance'];mat=material('DD_VR_live_marker',a.get('markerColor')or a['accentColor'],.12,.48,'ink')
    def text(name,value,x,y,size,angle=0):
        curve=bpy.data.curves.new(name,'FONT');curve.body=value;curve.size=size;curve.align_x='CENTER';curve.align_y='CENTER';curve.extrude=.002
        font=Path('C:/Windows/Fonts/arialbd.ttf')
        if font.exists():curve.font=bpy.data.fonts.load(str(font),check_existing=True)
        o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o);o.location=(x,y,z+.015);o.rotation_euler.z=angle;o.data.materials.append(mat)
    for i,m in enumerate(d['markers']):
        theta=math.radians(m['angleDeg']);r=(m['innerRadiusMm']+m['outerRadiusMm'])/2;x,y=r*math.sin(theta),r*math.cos(theta)
        if m.get('text'):continue
        if d['markerKind']=='round':
            bpy.ops.mesh.primitive_uv_sphere_add(segments=18,ring_count=12,radius=max(.36,m['widthMm']),location=(x,y,z-.06))
        else:
            bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,z));bpy.context.object.scale=(m['widthMm'],max(.35,m['outerRadiusMm']-m['innerRadiusMm']),.14)
        o=bpy.context.object;o.name='DD_VR_live_marker_'+str(i);o.rotation_euler.z=-theta;o.data.materials.append(mat)
    # Same calibrated numeral/typography/date layout and font families as the app;
    # never substitute Blender's built-in font or manually reposition its glyphs.
    image_path=run/'bakes'/'artwork'/style['id']/'dial.png'
    if not image_path.exists():raise RuntimeError('Missing calibrated dial artwork '+str(image_path))
    ink=material('DD_VR_calibrated_dial_print','#ffffff',0,.72,'ink')
    shader=ink.node_tree.nodes.get('Principled BSDF');tex=ink.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(image_path));tex.image.pack()
    ink.node_tree.links.new(tex.outputs['Color'],shader.inputs['Base Color']);ink.node_tree.links.new(tex.outputs['Alpha'],shader.inputs['Alpha']);ink.surface_render_method='DITHERED'
    radius=d['outerDiameterMm']/2-.7;verts=[(0,0,z+.015)]+[(radius*math.cos(i*math.tau/128),radius*math.sin(i*math.tau/128),z+.015)for i in range(128)]
    data=bpy.data.meshes.new('DD_VR_calibrated_dial_print');data.from_pydata(verts,[],[(0,i+1,(i+1)%128+1)for i in range(128)]);data.update();uv=data.uv_layers.new(name='UVMap')
    for loop in data.loops:
        v=data.vertices[loop.vertex_index].co;uv.data[loop.index].uv=(.5+v.x/(2*radius),.5+v.y/(2*radius))
    o=bpy.data.objects.new(data.name,data);bpy.context.collection.objects.link(o);o.data.materials.append(ink)
def scale_artwork(style,run):
    for index,entry in enumerate(style.get('scaleLayers',[])):
        for ring in entry['rings']:
            marks=[m for m in entry['layer']['ticks']+entry['layer']['labels']if m.get('ringId','outer')==ring['ring']]
            if not marks:continue
            path=run/'bakes'/'artwork'/style['id']/f"scale-{index}-{ring['ring']}.png"
            if not path.exists():raise RuntimeError('Missing actual production scale artwork '+str(path))
            m=material('DD_VR_live_scale_'+ring['ring'],'#ffffff',0,.72,'ink');nodes=m.node_tree.nodes;p=nodes.get('Principled BSDF');image=nodes.new('ShaderNodeTexImage');image.image=bpy.data.images.load(str(path));image.image.pack();m.node_tree.links.new(image.outputs['Color'],p.inputs['Base Color']);m.node_tree.links.new(image.outputs['Alpha'],p.inputs['Alpha']);m.surface_render_method='DITHERED'
            size=style['model']['caseDiameterMm'];bpy.ops.mesh.primitive_plane_add(size=size,location=(0,0,ring['z']+.003));o=bpy.context.object;o.name=f"DD_VR_live_scale_{index}_{ring['ring']}";o.data.materials.append(m)
def procedural(style,c,run):
    model=style['model'];e=model['previewEnvelope'];a=model['archetypeAppearance'];category=c['category'];g=style['proceduralGeometry'];out=[]
    mat=material('DD_VR_'+category,a['strapColor']if category=='strap'else model['finishes'][category]['color'],1 if category not in('strap','crystal')else 0,model['finishes'][category]['roughness'],'strap-face'if category=='strap'else 'steel-brushed')
    if category=='strap':
        nodes=mat.node_tree.nodes;links=mat.node_tree.links;p=nodes.get('Principled BSDF');uv=nodes.new('ShaderNodeTexCoord');mapping=nodes.new('ShaderNodeVectorMath');mapping.operation='SCALE';mapping.inputs[3].default_value=.125;links.new(uv.outputs['UV'],mapping.inputs[0])
        for name in('normal','roughness'):
            tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(run/'bakes'/'leather'/(name+'.png')),check_existing=True);tex.image.colorspace_settings.name='Non-Color';tex.image.pack();links.new(mapping.outputs['Vector'],tex.inputs['Vector'])
            if name=='normal':normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.45;links.new(tex.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],p.inputs['Normal'])
            else:channel=nodes.new('ShaderNodeSeparateColor');links.new(tex.outputs['Color'],channel.inputs[0]);links.new(channel.outputs['Green'],p.inputs['Roughness'])
        out=[mesh('DD_VR_procedural_STRAP_'+label,x,mat)for label,x in zip(('6','12'),g['strap'])]
        attachment=e['attachment'];surface=attachment['barZ']+attachment['strapThickness']/2+.04;thread=material('DD_VR_procedural_cream_thread','#e7dcc8',0,.9,'strap-stitch')
        for sign in(-1,1):
            for side in(-1,1):
                for i in range(18):
                    bpy.ops.mesh.primitive_cube_add(size=1,location=(side*attachment['strapWidth']*(.43-i*.0035),sign*(attachment['barY']+5+i*attachment['strapLength']/22),surface));o=bpy.context.object;o.name=f'DD_VR_procedural_STITCH_{sign}_{side}_{i}';o.scale=(.18,.75,.10);o.data.materials.append(thread);out.append(o)
            hardware=material('DD_VR_procedural_springbar','#b9c3cd',1,.3,'strap-hardware')
            for suffix,radius,length in(('BODY',attachment['bodyRadius'],attachment['gap']-.2),('TIPS',attachment['tipRadius'],attachment['gap']+2*attachment['tipEngagement'])):
                o=cylinder('DD_VR_procedural_BAR_'+suffix+str(sign),radius,length,0,hardware);o.location=(0,sign*attachment['barY'],attachment['barZ']);o.rotation_euler.y=math.pi/2;out.append(o)
    elif category=='case':out=[mesh('DD_VR_procedural_case',g['case'],mat)]+[mesh('DD_VR_procedural_lug_'+str(i),x,mat)for i,x in enumerate(g['lugs'])]
    elif category=='chapter-ring':out=[mesh('DD_VR_procedural_chapter',g['chapter'],mat)];out[0].location.z=e['chapterZ']
    elif category=='caseback':out=[cylinder('DD_VR_procedural_caseback',model['caseDiameterMm']/2-.4,1.5,-model['caseThicknessMm']/2,mat)]
    elif category=='crystal':
        p=mat.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(1,1,1,1);p.inputs['Transmission Weight'].default_value=1;p.inputs['IOR'].default_value=1.55;p.inputs['Roughness'].default_value=.015;mat['DD_REALISM_ROLE']='crystal'
        out=[cylinder('DD_VR_procedural_crystal',e['crystalRadius'],e['crystalThickness'],e['crystalZ'],mat)]
    elif category=='bezel':
        # Same seven-point lathe envelope as production fallback.
        ri,ro,h=e['bezelInnerRadius'],e['bezelOuterRadius'],e['bezelHeight'];points=[(ri,-h/2),(ro-.3,-h/2),(ro,-h/2+.3),(ro,h/2-.3),(ro-.3,h/2),(ri,h/2),(ri,-h/2)]
        verts=[(r*math.cos(i*2*math.pi/128),r*math.sin(i*2*math.pi/128),z+e['bezelZ'])for i in range(128)for r,z in points];faces=[]
        for i in range(128):
            for j in range(len(points)-1):q=i*len(points)+j;n=((i+1)%128)*len(points)+j;faces.append((q,n,n+1,q+1))
        data=bpy.data.meshes.new('DD_VR_procedural_bezel');data.from_pydata(verts,[],faces);o=bpy.data.objects.new(data.name,data);bpy.context.collection.objects.link(o);o.data.materials.append(mat);out=[o]
    return out
def pose(objects):
    angles={'HOUR':305.2916667,'MINUTE':63.5,'SECONDS':210}
    groups={k:[]for k in angles}
    for o in objects:
        name=o.name.upper()
        if o.type!='MESH' or 'HAND'not in name or 'SUBDIAL'in name:continue
        key=next((k for k in angles if k in name),None)
        if 'ARCH_HAND' in name:
            if name.endswith('_0'):key='HOUR'
            elif name.endswith('_1'):key='MINUTE'
            elif name.endswith('_2'):key='SECONDS'
        if not key:continue
        groups[key].append(o)
    chrono=next((o for o in objects if o.name=='DD_ARCH_CHRONO_SECONDS'),None)
    if chrono:groups['SECONDS'].append(chrono)
    for key,group in groups.items():
        blades=[o for o in group if not any(t in o.name.upper()for t in('LUME','TAIL','HUB','TIP'))]
        if not blades:continue
        blade=max(blades,key=lambda o:len(o.data.vertices));coords=[blade.matrix_world@v.co for v in blade.data.vertices]
        # Use the symmetric blade axis, not one off-centre tip corner.
        import numpy as np
        xy=np.asarray([(v.x,v.y)for v in coords]);_,axes=np.linalg.eigh(np.cov(xy.T));axis=axes[:,-1]
        projections=xy@axis
        if abs(projections.min())>abs(projections.max()):axis=-axis
        delta=math.pi/2-math.radians(angles[key])-math.atan2(axis[1],axis[0]);rotation=Matrix.Rotation(delta,4,'Z')
        # A single watch-axis rotation keeps blade, tail, lume and hub together.
        for o in group:o.matrix_world=rotation@o.matrix_world
def assembly(style,run,repo):
    bpy.ops.wm.read_factory_settings(use_empty=True);allobjects=[]
    for c in style['components']:
        if not c['visible']:continue
        if c['placement']['glb']:
            rel='public/'+c['descriptor']['assetPath'].lstrip('/');path=run/'web'/rel
            if not path.exists():path=repo/rel
            before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=str(path));objects=list(set(bpy.context.scene.objects)-before)
            roots=[o for o in objects if o.parent not in objects];matrix=transform(c['placement'])
            for o in roots:o.matrix_world=matrix@o.matrix_world
            recolor(objects,c['category'],style['model']);allobjects+=objects
            for o in objects:
                if o.name in style.get('suppressedNodes',{}).get(c['category'],[]):o.hide_render=True;o.hide_set(True)
        else:
            created=procedural(style,c,run)
            if not created:raise RuntimeError('Visible fallback category missing implementation: '+c['category'])
            allobjects+=created
    pose(allobjects);live_artwork(style,run);scale_artwork(style,run)
    for o in list(bpy.context.scene.objects):
        if o.type=='FONT':
            bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
    allobjects=list(bpy.context.scene.objects);root=bpy.data.objects.new('DD_VR_METRIC_EXPORT_ROOT',None);bpy.context.collection.objects.link(root);root['DD_VR_UNITS']='metres; numeric millimetres converted once by 0.001 root'
    for o in allobjects:
        if not o.parent:o.parent=root
    root.scale=(.001,)*3;bpy.context.view_layer.update();return allobjects,root
def light(name,loc,power,size,target,color=(1,1,1),size_y=None):
    data=bpy.data.lights.new(name,'AREA');data.energy=power*.02;data.color=color;data.shape='RECTANGLE';data.size=size;data.size_y=size_y or size
    o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
def cycles_ar(objects,enabled=True):
    """Cycles reflection-only blend: GLB export retains its supported .035 extension."""
    for o in objects:
        if o.type!='MESH':continue
        for slot in o.material_slots:
            mat=slot.material
            if not mat or mat.get('DD_REALISM_ROLE')!='crystal' or not mat.use_nodes:continue
            nodes=mat.node_tree.nodes;links=mat.node_tree.links;mix=nodes.get('DD_VR_SUBTLE_AR_BLEND')
            if mix is None:
                p=nodes.get('Principled BSDF');film=nodes.new('ShaderNodeBsdfPrincipled');film.name='DD_VR_THIN_FILM_REFLECTION'
                for socket in p.inputs:
                    if socket.name not in film.inputs:continue
                    try:film.inputs[socket.name].default_value=socket.default_value
                    except (AttributeError,TypeError):pass
                    if socket.is_linked:links.new(socket.links[0].from_socket,film.inputs[socket.name])
                for target,thickness in((p,0),(film,220)):
                    if 'Thin Film Thickness'in target.inputs:
                        for link in list(target.inputs['Thin Film Thickness'].links):links.remove(link)
                        target.inputs['Thin Film Thickness'].default_value=thickness
                    if 'Thin Film IOR'in target.inputs:target.inputs['Thin Film IOR'].default_value=1.3
                mix=nodes.new('ShaderNodeMixShader');mix.name='DD_VR_SUBTLE_AR_BLEND';links.new(p.outputs['BSDF'],mix.inputs[1]);links.new(film.outputs['BSDF'],mix.inputs[2]);output=next(n for n in nodes if n.type=='OUTPUT_MATERIAL');links.new(mix.outputs[0],output.inputs['Surface'])
            mix.inputs[0].default_value=.035 if enabled else 0
def studio(objects,device='AUTO'):
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=256;scene.cycles.use_denoising=True;scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.02;scene.cycles.adaptive_min_samples=64;scene.cycles.max_bounces=8;scene.cycles.transmission_bounces=6;scene.cycles.transparent_max_bounces=8;scene.cycles.seed=141026;scene.view_settings.view_transform='AgX';scene.world=bpy.data.worlds.new('DD_VR_neutral_studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.12,.12,.12,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.35
    scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False;scene.render.resolution_percentage=100
    cycles_ar(objects)
    # The dashboard crystal does not cast a shadow. Match that studio policy:
    # otherwise disabling expensive caustics turns opaque date ink black below
    # the sapphire, despite retaining full camera-ray transmission/refraction.
    for o in objects:
        if o.type=='MESH' and any(slot.material and slot.material.get('DD_REALISM_ROLE')=='crystal' for slot in o.material_slots):o.visible_shadow=False
    prefs=bpy.context.preferences.addons['cycles'].preferences
    try:
        if device=='CPU':raise ValueError('CPU selected for this run')
        prefs.compute_device_type='CUDA';prefs.get_devices()
        for d in prefs.devices:d.use=d.type=='CUDA' or(device=='HYBRID' and d.type=='CPU')
        scene.cycles.device='GPU'if any(d.type=='CUDA'for d in prefs.devices)else'CPU'
    except Exception:scene.cycles.device='CPU'
    scene.cycles.caustics_reflective=False;scene.cycles.caustics_refractive=False
    light('DD_VR_top_softbox',(.01,.09,.14),16,.08,(0,0,0),size_y=.06)
    light('DD_VR_left_strip',(-.09,-.02,.09),8,.018,(0,0,0),size_y=.18)
    light('DD_VR_right_strip',(.095,.02,.08),10,.012,(0,0,0),size_y=.15)
    light('DD_VR_warm_kicker',(.03,.12,.035),3,.05,(0,0,0),(1,.86,.72))
    bottom=min((o.matrix_world@Vector(v)).z for o in objects if o.type=='MESH'for v in o.bound_box)
    bpy.ops.mesh.primitive_plane_add(size=2,location=(0,0,bottom-.0005));plane=bpy.context.object;plane.name='DD_VR_STUDIO_FLOOR';plane.data.materials.append(material('DD_VR_background','#07090d',0,.64))
    data=bpy.data.cameras.new('DD_VR_camera');cam=bpy.data.objects.new(data.name,data);bpy.context.collection.objects.link(cam);scene.camera=cam;data.lens=85;data.clip_start=.001;data.clip_end=10
    return cam
def camera(cam,objects,shot):
    coords=[o.matrix_world@Vector(v)for o in objects if o.type=='MESH'and not o.hide_render for v in o.bound_box]
    low=Vector(tuple(min(v[i]for v in coords)for i in range(3)));high=Vector(tuple(max(v[i]for v in coords)for i in range(3)));target=(low+high)/2
    scene=bpy.context.scene;scene.render.resolution_x=2400;scene.render.resolution_y=2400 if shot=='hero-front'else 1800
    if shot=='hero-strap-macro':
        holes=[o for o in objects if 'HOLE_RIM'in o.name.upper()];tail=[o for o in objects if 'STRAP_6'in o.name.upper()]
        focus=holes or tail
        if holes:target=sum((o.matrix_world@Vector((0,0,0))for o in holes),Vector())/len(holes)
        elif tail:
            # Strap mesh pivots intentionally remain at the watch origin.
            # Frame its real surface bounds instead of mistaking that pivot for
            # the tail centre (also applies to the preserved procedural strap).
            points=[o.matrix_world@Vector(v) for o in tail for v in o.bound_box]
            target=Vector(tuple((min(v[i]for v in points)+max(v[i]for v in points))/2 for i in range(3)))
        else:target=Vector((0,low.y*.7,high.z*.5))
        direction=Vector((.22,-.42,1)).normalized();span=.038;cam.data.lens=110
    else:
        direction=Vector((0,0,1))if shot=='hero-front'else Vector((.75,-1.15,2.4)).normalized();span=max(high.x-low.x,high.y-low.y);cam.data.lens=100 if shot=='hero-front'else 85
        if shot in('hero-front','hero-three-quarter'):
            target=Vector((.001,0,.004));span=.052 if shot=='hero-front'else .066
    rotation=Euler((0,0,0)).to_quaternion()if shot=='hero-front'else(-direction).to_track_quat('-Z','Y');inv=rotation.inverted();projected=[inv@(v-target)for v in coords];aspect=scene.render.resolution_x/scene.render.resolution_y
    if shot=='whole-watch':span=max(max(v.x for v in projected)-min(v.x for v in projected),(max(v.y for v in projected)-min(v.y for v in projected))*aspect)
    distance=span*cam.data.lens/36*1.18;cam.location=target+direction*distance;cam.rotation_euler=rotation.to_euler();cam.data.dof.use_dof=shot not in('hero-front','hero-strap-macro');cam.data.dof.focus_distance=distance;cam.data.dof.aperture_fstop=11
    return {'target':list(target),'camera':list(cam.location),'lensMm':cam.data.lens,'focusDistanceM':distance,'fStop':11}
def main():
    p=argparse.ArgumentParser();p.add_argument('--run',required=True);p.add_argument('--repo',required=True);p.add_argument('--style',default='all');p.add_argument('--render',action='store_true');p.add_argument('--ar-comparison',action='store_true');p.add_argument('--draft',action='store_true');p.add_argument('--benchmark',action='store_true');p.add_argument('--device',choices=['AUTO','CPU','CUDA','HYBRID'],default='AUTO');p.add_argument('--samples',type=int,default=256);p.add_argument('--width',type=int,default=2400);p.add_argument('--resume',action='store_true');p.add_argument('--shots',default='hero-three-quarter,hero-front,hero-strap-macro');args=p.parse_args(sys.argv[sys.argv.index('--')+1:]);run=Path(args.run).resolve();repo=Path(args.repo).resolve();manifest=json.loads((run/'assembly-manifest.json').read_text())
    if not(args.draft or args.benchmark)and(args.width<2400 or args.samples<256):raise ValueError('Final delivery requires at least 2400 px and 256 maximum samples')
    for style in manifest['styles']:
        if args.style not in('all',style['id']):continue
        objects,root=assembly(style,run,repo);dest=run/'styles'/style['id'];dest.mkdir(parents=True,exist_ok=True)
        bpy.ops.object.select_all(action='DESELECT')
        for o in [root,*objects]:
            if not o.hide_render:o.select_set(True)
        bpy.ops.export_scene.gltf(filepath=str(dest/'watch.glb'),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_tangents=True,export_apply=True)
        repair=repair_export_tangents(dest/'watch.glb',run/'styles')
        (dest/'tangent-repair.json').write_text(json.dumps(repair,indent=2)+'\n')
        cam=studio(objects,args.device);shots=args.shots.split(',')
        if args.ar_comparison and style['id']=='archetype-dress-formal':shots+=['crystal-ar-on','crystal-ar-off']
        suffix='-draft'if args.draft else('-benchmark-'+args.device.lower()if args.benchmark else'')
        metadata_path=dest/('shots'+suffix+'.json')
        previous=json.loads(metadata_path.read_text())if metadata_path.exists()else{}
        samples=32 if args.draft else args.samples
        metadata={'style':style['id'],'assemblyManifest':'assembly-manifest.json','samples':samples,'adaptiveSampling':{'enabled':True,'threshold':.02,'minSamples':min(64,samples)},'bounces':{'maximum':8,'transmission':6,'transparent':8},'denoiser':'OpenImageDenoise','colourManagement':'AgX','engine':'CYCLES','shots':previous.get('shots',{})}
        source_hash=hashlib.sha256(Path(__file__).read_bytes()+Path(__file__).with_name('realism_normalize_export.py').read_bytes()+(run/'assembly-manifest.json').read_bytes())
        for c in style['components']:
            if c['visible']and c['placement']['glb']:source_hash.update((run/'web'/('public'+c['descriptor']['assetPath'])).read_bytes())
        for path in sorted((run/'bakes'/'artwork'/style['id']).glob('*.png')):source_hash.update(path.read_bytes())
        for shot in shots:
            framing='hero-three-quarter'if shot.startswith('crystal-ar-')else shot
            description=camera(cam,objects,framing);scene=bpy.context.scene;scene.cycles.samples=samples;scene.cycles.adaptive_min_samples=min(64,samples)
            ratio=scene.render.resolution_y/scene.render.resolution_x;scene.render.resolution_x=args.width;scene.render.resolution_y=round(args.width*ratio)
            if shot.startswith('crystal-ar-'):
                enabled=shot.endswith('-on')
                cycles_ar(objects,enabled)
                description['arEnabled']=enabled
            else:cycles_ar(objects,True)
            if args.draft:scene.render.resolution_percentage=25
            target=run/'renders'/style['id']/(shot+suffix+'.png');target.parent.mkdir(parents=True,exist_ok=True)
            fingerprint=hashlib.sha256(source_hash.digest()+json.dumps({'shot':shot,'camera':description,'samples':samples,'width':args.width,'draft':args.draft},sort_keys=True).encode()).hexdigest()
            existing=metadata['shots'].get(shot,{})
            if args.resume and target.exists()and existing.get('renderFingerprint')==fingerprint and existing.get('completed')and hashlib.sha256(target.read_bytes()).hexdigest()==existing.get('imageSha256'):
                print('DD_VR_RESUME '+str(target),flush=True);continue
            scene.render.filepath=str(target.with_name(target.stem+'.part.png'))
            bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(dest/'source.blend'))
            if args.render:
                start=time.time()
                try:result=bpy.ops.render.render(write_still=True)
                except RuntimeError:scene.cycles.device='CPU';result=bpy.ops.render.render(write_still=True)
                partial=Path(scene.render.filepath)
                if result!={'FINISHED'}or not partial.exists():raise RuntimeError('Render did not finish: '+str(target))
                partial.replace(target);description.update(seconds=time.time()-start,completed=True,imageSha256=hashlib.sha256(target.read_bytes()).hexdigest())
                print('DD_VR_RENDERED '+json.dumps({'path':str(target),'seconds':description['seconds'],'device':scene.cycles.device}),flush=True)
                metadata['device']=scene.cycles.device
            description.update(renderFingerprint=fingerprint,resolution=[round(scene.render.resolution_x*scene.render.resolution_percentage/100),round(scene.render.resolution_y*scene.render.resolution_percentage/100)])
            metadata['shots'][shot]=description;metadata_path.write_text(json.dumps(metadata,indent=2)+'\n')
if __name__=='__main__':main()


