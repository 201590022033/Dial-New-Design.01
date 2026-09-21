"""Real mesh presentation fixtures, not manufacturing dimensions.

Blender --background --python this_file -- --output public/assets/3d/face-review
Optional --scale-json uses ticks/labels exported by the app's engineering engine.
All numeric coordinates are mm, Z-up, clock angles clockwise from twelve.
"""
import argparse
import json
import math
from pathlib import Path
import sys

import bpy
import numpy as np
from mathutils import Vector


def material(name, color, metal=0, rough=.35):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    return m


def texture(m, kind):
    # Explicit UV raster: survives glTF export, unlike an unbaked Noise node.
    size = 1024
    y, x = np.mgrid[-1:1:complex(size), -1:1:complex(size)]
    r, a = np.hypot(x, y), np.arctan2(y, x)
    if kind == 'sunburst':
        v = .55 + .18*np.sin(a*950) + .12*np.cos(a*3)
    elif kind == 'linen':
        v = .55 + .14*np.sin(x*500) + .14*np.sin(y*490)
    else:
        v = .55 + .2*np.sin(r*520 + 8*np.sin(a*12))
    pixels = np.ones((size, size, 4), dtype=np.float32)
    for i, c in enumerate((.10, .24, .37)):
        pixels[:, :, i] = c * v
    img = bpy.data.images.new('embedded-' + kind, size, size)
    img.pixels.foreach_set(pixels.ravel())
    img.pack()
    node = m.node_tree.nodes.new('ShaderNodeTexImage')
    node.image = img
    m.node_tree.links.new(node.outputs['Color'], m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])


def finish(obj, name, mat):
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def annulus(name, ri, ro, z, depth, mat, dome=0):
    # Closed annular solid; optional spherical-cap-like sag on both faces.
    n = 192
    radii = np.linspace(ri, ro, 25 if dome else 2)
    verts = []
    for height in (z-depth/2, z+depth/2):
        for r in radii:
            for i in range(n):
                a = i*2*math.pi/n
                verts.append((r*math.cos(a), r*math.sin(a), height+dome*(1-(r/ro)**2)))
    rows, faces = len(radii), []
    layer = rows*n
    for side in (0, 1):
        for row in range(rows-1):
            for i in range(n):
                q = [side*layer+row*n+i, side*layer+row*n+(i+1)%n,
                     side*layer+(row+1)*n+(i+1)%n, side*layer+(row+1)*n+i]
                faces.append(q if side else q[::-1])
    for row in (0, rows-1):
        for i in range(n):
            q = [row*n+i, row*n+(i+1)%n, layer+row*n+(i+1)%n, layer+row*n+i]
            faces.append(q if row == 0 else q[::-1])
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    uv = mesh.uv_layers.new()
    for poly in mesh.polygons:
        for li in poly.loop_indices:
            co = mesh.vertices[mesh.loops[li].vertex_index].co
            uv.data[li].uv = (.5+co.x/(2*ro), .5+co.y/(2*ro))
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj, name, mat)


def box(name, x, y, z, w, h, d, mat, angle=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    obj = bpy.context.object
    obj.dimensions = (w, h, d)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.rotation_euler.z = -math.radians(angle)
    return finish(obj, name, mat)


def tick(name, radius, angle, length, width, z, mat):
    a = math.radians(angle)
    return box(name, radius*math.sin(a), radius*math.cos(a), z, width, length, .035, mat, angle)


def label(text, radius, angle, z, mat, size=.65, rotation=None):
    a = math.radians(angle)
    bpy.ops.object.text_add(location=(radius*math.sin(a), radius*math.cos(a), z))
    obj = bpy.context.object
    obj.data.body = str(text)
    obj.data.align_x = 'CENTER'
    obj.data.align_y = 'CENTER'
    obj.data.size = size
    obj.data.extrude = .006
    obj.rotation_euler.z = -a if rotation is None else math.radians(rotation)
    obj.data.materials.append(mat)
    bpy.ops.object.convert(target='MESH')
    obj.name = 'label-' + str(text)
    return obj


def subtract(obj, cutter):
    bpy.context.view_layer.objects.active = obj
    mod = obj.modifiers.new('real aperture', 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.object = cutter
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


def dial(layout, finish_kind):
    paint = material('dial-' + finish_kind, (.08, .18, .3), .35)
    texture(paint, finish_kind)
    face = annulus('DIAL_WITH_CENTRE_BORE', .8, 14.25, 0, .4, paint)
    windows = {'date3': [(10.4, 0, 2.8, 1.9, '28')],
               'date6': [(0, -10.5, 2.8, 1.9, '28')],
               'daydate': [(9.6, 0, 5.4, 1.9, 'MON 28')]}.get(layout, [])
    subcentres = [(-7, 0), (7, 0), (0, -7)] if layout == 'chrono' else []
    for x, y, w, h, text in windows:
        subtract(face, box('window cutter', x, y, 0, w, h, 2, steel))
        box('calendar backing', x, y, -.28, w+.3, h+.3, .06, white)
        t = label(text, 0, 0, -.235, dark, .9, 0)
        t.location.x, t.location.y = x, y
    for j, (x, y) in enumerate(subcentres):
        bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=3.25, depth=.35, location=(x,y,.22))
        subtract(face, bpy.context.object)
        sub = annulus('recessed-register', .3, 3.22, .07, .04, dark)
        sub.location.x, sub.location.y = x, y
        for i in range(60):
            t = tick('register-tick', 2.85, i*6, .4 if i%5==0 else .18, .045, .11, white)
            t.location.x += x
            t.location.y += y
        for value, angle in [(0,0),(10,120),(20,240)]:
            t = label(value, 2.1, angle, .12, white, .65, 0)
            t.location.x += x
            t.location.y += y
        box('register-hand', x, y+1, .16, .1, 2, .04, white)
    for i in range(60):
        tick('minute-track', 13.65, i*6, .4 if i%5==0 else .2, .055, .23, white)
    for i in range(12):
        a = i*30
        x,y = 12.2*math.sin(math.radians(a)),12.2*math.cos(math.radians(a))
        if any(abs(x-wx)<ww/2+.5 and abs(y-wy)<wh/2+1 for wx,wy,ww,wh,_ in windows):
            continue
        tick('applied-baton', 12.2, a, 1.65, .58, .31, steel)
        tick('lume-inlay', 12.2, a, 1.3, .3, .34, lume)
    label('DIAL LAB', 4.8, 0, .24, white, 1, 0)


def scale(kind, inner=False):
    ri,ro,z = (14.4,16.8,.45) if inner else (17.0,20, .65)
    annulus('FIXED_CHAPTER' if inner else 'ROTATING_BEZEL', ri,ro,z,.45, dark)
    if not inner:
        annulus('bezel-metal-rim',19.7,20.1,z,.6,steel)
        for i in range(120):
            tick('grip-flute',20.03,i*3,.17,.16,z,steel)
    if kind == 'slide':
        vals = [1+i/50 for i in range(450)]
        ticks = [(v,360*math.log10(v)) for v in vals]
        labs = [(v,360*math.log10(v)) for v in [1,1.2,1.5,2,2.5,3,4,5,6,7,8,9]]
    elif kind == 'tachy':
        labs = [(v,21600/v) for v in [500,400,300,240,200,180,160,140,120,100,90,80,70,60]]
        ticks = labs
    else:
        ticks = [(i,i*6) for i in range(60)]
        labs = [(i,i*6) for i in range(0,60,5)]
    for i,(_,a) in enumerate(ticks):
        tick(kind+'-tick',ro-.35,a,.45 if i%5==0 else .25,.055,z+.25,white)
    for v,a in labs:
        label(v,ri+.9,a,z+.26,white,.64 if inner else .8)


def crystal(domed):
    glass = material('sapphire-transmission', (1,1,1), 0, .025)
    p = glass.node_tree.nodes.get('Principled BSDF')
    p.inputs['Transmission Weight'].default_value = 1
    p.inputs['IOR'].default_value = 1.76
    # tiny centre ring avoids degenerate duplicated centre vertices; cap the hole.
    annulus('CRYSTAL_DOMED' if domed else 'CRYSTAL_FLAT', .001, 16.9, 2, .55, glass, .9 if domed else 0)


def parent_rotation(objects, name, degrees=90):
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    for obj in objects:
        obj.parent = root
    for frame, angle in [(1,0),(61,degrees/2),(121,degrees)]:
        root.rotation_euler.z = -math.radians(angle)
        root.keyframe_insert(data_path='rotation_euler', frame=frame)
    bpy.context.scene.frame_set(1)
    return root


def export(path):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_selection=True,
                             export_animations=True, export_extras=True)


def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def engineering_scale(spec):
    if spec.get('schema') != 'dial-engineering-scale/v1':
        raise ValueError('Unsupported engineering scale schema')
    for ring in spec['rings']:
        before = set(bpy.context.scene.objects)
        annulus(ring['id'], ring['innerRadiusMm'],ring['outerRadiusMm'],.6,.4,dark)
        for t in ring['ticks']:
            radius = t['radiusMm']
            radius += t['lengthMm']/2 * (1 if t['direction']=='outside' else -1 if t['direction']=='inside' else 0)
            tick('engineering-tick',radius,t['angleDeg'],t['lengthMm'],t['widthMm'],.83,white)
        for l in ring['labels']:
            label(l['text'],l['radiusMm'],l['angleDeg'],.84,white,.65,l['rotationDeg'])
        parent_rotation(set(bpy.context.scene.objects)-before,ring['id']+'-pivot',ring['animationDeltaDeg'])


def main():
    global steel, white, dark, lume
    p = argparse.ArgumentParser()
    p.add_argument('--output', required=True)
    p.add_argument('--scale-json')
    p.add_argument('--render', action='store_true')
    args = p.parse_args(sys.argv[sys.argv.index('--')+1:])
    out = Path(args.output).resolve()
    out.mkdir(parents=True,exist_ok=True)
    clear()
    steel = material('steel',(.65,.7,.76),.92,.22)
    white = material('ivory printing',(.9,.91,.85))
    dark = material('charcoal ceramic',(.012,.018,.025),.15,.3)
    lume = material('lume visual swatch',(.65,.9,.73))
    scene = bpy.context.scene
    scene.frame_start,scene.frame_end,scene.render.fps = 1,121,30
    manifest = {'status':'provisional-presentation', 'units':'mm', 'assets':[]}
    jobs = [(f'dial-{layout}-{surface}',lambda l=layout,s=surface:dial(l,s))
            for layout,surface in [('date3','sunburst'),('date6','linen'),('daydate','sunburst'),('chrono','guilloche')]]
    jobs += [('crystal-'+name,lambda d=domed:crystal(d)) for name,domed in [('flat',False),('domed',True)]]
    jobs += [(f'{prefix}-{kind}',lambda k=kind,i=inner:scale(k,i))
             for prefix,inner,kinds in [('chapter',True,['minutes','tachy','slide']),('bezel',False,['minutes','tachy','slide'])] for kind in kinds]
    for name,build in jobs:
        clear()
        build()
        if name.startswith('bezel-') and name != 'bezel-tachy':
            parent_rotation(list(scene.objects),'BEZEL_PIVOT')
        export(out/(name+'.glb'))
        manifest['assets'].append(name+'.glb')
    clear()
    dial('chrono','guilloche')
    scale('slide',True)
    before = set(scene.objects)
    scale('slide',False)
    parent_rotation(set(scene.objects)-before,'BEZEL_PIVOT')
    if args.scale_json:
        clear()
        engineering_scale(json.loads(Path(args.scale_json).read_text(encoding='utf-8')))
    export(out/'assembly-animated.glb')
    manifest['assets'].append('assembly-animated.glb')
    # Studio saved with animation; glass separate for unobstructed geometry review.
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 24
    scene.render.resolution_x = scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.world.color = (.25,.25,.25)
    for location,power,size in [((0,0,50),35000,35),((-25,10,30),20000,20)]:
        bpy.ops.object.light_add(type='AREA', location=location)
        bpy.context.object.data.energy = power
        bpy.context.object.data.shape = 'DISK'
        bpy.context.object.data.size = size
        bpy.context.object.rotation_euler = (Vector((0,0,0))-bpy.context.object.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(0,-22,65))
    cam = bpy.context.object
    cam.rotation_euler = (-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.type,cam.data.ortho_scale = 'ORTHO',46
    scene.camera = cam
    bpy.ops.wm.save_as_mainfile(filepath=str(out/'assembly-animated.blend'))
    if args.render:
        for frame in (1,61,121):
            scene.frame_set(frame)
            scene.render.filepath = str(out/f'review-{frame:03d}.png')
            bpy.ops.render.render(write_still=True)
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')


if __name__ == '__main__':
    main()
