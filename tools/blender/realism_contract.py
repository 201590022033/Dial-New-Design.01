"""Compare GLB node frames and protected geometry independently of Blender export ordering."""
import argparse, hashlib, json, math, struct
from pathlib import Path
KINDS={5120:('b',1),5121:('B',1),5122:('h',2),5123:('H',2),5125:('I',4),5126:('f',4)}
WIDTH={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def multiply(a,b):return [[sum(a[i][k]*b[k][j]for k in range(4))for j in range(4)]for i in range(4)]
def frame(node):
    if 'matrix'in node:return [[node['matrix'][j*4+i]for j in range(4)]for i in range(4)]
    x,y,z,w=node.get('rotation',[0,0,0,1]);length=math.sqrt(x*x+y*y+z*z+w*w);x,y,z,w=[v/length for v in(x,y,z,w)]
    r=[[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w),0],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w),0],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y),0],[0,0,0,1]]
    scale=node.get('scale',[1,1,1]);translation=node.get('translation',[0,0,0])
    for i in range(3):
        for j in range(3):r[i][j]*=scale[j]
        r[i][3]=translation[i]
    return r
def world_frames(doc):
    nodes=doc.get('nodes',[]);parents={i:p for p,n in enumerate(nodes)for i in n.get('children',[])};cache={}
    def get(i):
        if i not in cache:cache[i]=multiply(get(parents[i]),frame(nodes[i]))if i in parents else frame(nodes[i])
        return cache[i]
    return {n.get('name'):get(i)for i,n in enumerate(nodes)}
def world_bounds(rows,m):
    points=[[sum(m[i][k]*r[k]for k in range(3))+m[i][3]for i in range(3)]for r in rows]
    return [v for i in range(3)for v in(min(r[i]for r in points),max(r[i]for r in points))]
def read(path):
    raw=path.read_bytes(); size=struct.unpack_from('<I',raw,12)[0]
    doc=json.loads(raw[20:20+size]); offset=20+size
    binary=raw[offset+8:] if offset<len(raw) else b''
    return doc,binary
def accessor(doc,data,index):
    a=doc['accessors'][index]; v=doc['bufferViews'][a['bufferView']]; code,size=KINDS[a['componentType']]; n=WIDTH[a['type']]
    start=v.get('byteOffset',0)+a.get('byteOffset',0); stride=v.get('byteStride',n*size)
    return [struct.unpack_from('<'+code*n,data,start+i*stride) for i in range(a['count'])]
def geometry(doc,data,node):
    rows=[]
    if 'mesh' not in node:return rows
    for p in doc['meshes'][node['mesh']]['primitives']:
        attrs=p['attributes']; pos=accessor(doc,data,attrs['POSITION']); uv=accessor(doc,data,attrs['TEXCOORD_0']) if 'TEXCOORD_0'in attrs else [()] *len(pos)
        rows.extend(tuple(round(x,5) for x in (*v,*u)) for v,u in zip(pos,uv))
    return sorted(set(rows))
def stats(doc,path):
    triangles=0
    for node in doc.get('nodes',[]):
        if 'mesh'not in node:continue
        for p in doc['meshes'][node['mesh']]['primitives']:
            count=doc['accessors'][p.get('indices',p['attributes']['POSITION'])]['count'];mode=p.get('mode',4)
            triangles+=count//3 if mode==4 else max(0,count-2) if mode in(5,6)else 0
    images=[];_,binary=read(path)
    for image in doc.get('images',[]):
        view=doc['bufferViews'][image['bufferView']];raw=binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']];dimensions=None
        if raw[:8]==b'\x89PNG\r\n\x1a\n':dimensions=list(struct.unpack_from('>II',raw,16))
        elif raw[:2]==b'\xff\xd8':
            cursor=2
            while cursor+4<len(raw):
                if raw[cursor]!=255:cursor+=1;continue
                marker=raw[cursor+1];size=struct.unpack_from('>H',raw,cursor+2)[0]
                if marker in (192,193,194):h,w=struct.unpack_from('>HH',raw,cursor+5);dimensions=[w,h];break
                cursor+=size+2
        images.append({'name':image.get('name'),'bytes':len(raw),'dimensions':dimensions})
    return {'bytes':path.stat().st_size,'trianglesInstantiated':triangles,'nodes':len(doc.get('nodes',[])),'materials':len(doc.get('materials',[])),'images':images,'extensions':doc.get('extensionsUsed',[]),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
def compare(source,candidate):
    a,ab=read(source);b,bb=read(candidate);errors=[];notes=[]
    an={n['name']:n for n in a.get('nodes',[]) if 'name'in n};bn={n['name']:n for n in b.get('nodes',[]) if 'name'in n}
    def parents(d):return {d['nodes'][i].get('name'):n.get('name')for n in d.get('nodes',[])for i in n.get('children',[])}
    ap,bp=parents(a),parents(b)
    aw,bw=world_frames(a),world_frames(b)
    for name,n in an.items():
        if name not in bn:errors.append('missing node '+name);continue
        other=bn[name]
        if ap.get(name)!=bp.get(name):errors.append('parent changed '+name)
        left,right=frame(n),frame(other)
        if any(abs(left[i][j]-right[i][j])>(1e-3 if j==3 else 2e-7)for i in range(4)for j in range(4)):errors.append('local frame changed '+name)
        for key,value in n.get('extras',{}).items():
            if key.startswith('DD_') and other.get('extras',{}).get(key)!=value:errors.append(f'extra changed {name}/{key}')
        protected=any(t in name.upper()for t in ['DIAL','SCALE','NUMERAL','TEXT','INDEX','MARKER'])
        if protected and geometry(a,ab,n)!=geometry(b,bb,other):errors.append('protected position/UV correspondence changed '+name)
        ga,gb=geometry(a,ab,n),geometry(b,bb,other)
        if ga and gb:
            bounds=lambda rows:[v for i in range(3)for v in(min(r[i]for r in rows),max(r[i]for r in rows))]
            if max(abs(x-y)for x,y in zip(bounds(ga),bounds(gb)))>1e-3:errors.append('original object envelope changed '+name)
            if max(abs(x-y)for x,y in zip(world_bounds(ga,aw[name]),world_bounds(gb,bw[name])))>1e-3:errors.append('world envelope/datum changed '+name)
        if any(t in name.upper()for t in ('SPRING','BORE','ATTACH','TUBE','LUG','PIVOT')):
            # Adding a normal-map UV to an unwrapped-free metal lug changes no
            # attachment position. Existing UV ownership must still be exact.
            pa=sorted(set(r[:3]for r in ga));pb=sorted(set(r[:3]for r in gb))
            if pa!=pb or (ga and len(ga[0])>3 and ga!=gb):errors.append('protected attachment geometry changed '+name)
    additions=sorted(set(bn)-set(an))
    for name in additions:
        if not name.startswith('DD_VR_'):errors.append('unapproved new node '+name)
    before,after=stats(a,source),stats(b,candidate)
    for image in after['images']:
        if not image['dimensions'] or max(image['dimensions'])>2048:errors.append('image dimension unverified or over2048 '+str(image['name']))
    oldmaterials={m.get('name'):m for m in a.get('materials',[])}
    for m in b.get('materials',[]):
        old=oldmaterials.get(m.get('name'))
        if not old:continue
        role=m.get('extras',{}).get('DD_REALISM_ROLE')
        color=lambda v:v.get('pbrMetallicRoughness',{}).get('baseColorFactor',[1,1,1,1])
        derived=role in('strap-edge','strap-hole-rim')and m.get('extras',{}).get('DD_REALISM_BASE')=='strap'and m.get('extras',{}).get('DD_REALISM_SHADE')==.45
        if derived:notes.append('Approved derived strap edge/rim default uses 0.45 linear base; dashboard base remains authoritative: '+str(m.get('name')))
        if role!='crystal'and not derived and max(abs(x-y)for x,y in zip(color(old),color(m)))>1e-5:errors.append('source default color changed '+str(m.get('name')))
    losses=sorted(set(before['extensions'])-set(after['extensions']))
    notes.append('Geometry topology may change only for approved leather tail holes; protected artwork correspondence checked independently of vertex order.')
    return {'source':str(source),'candidate':str(candidate),'passed':not errors,'errors':errors,'notes':notes,'before':before,'after':after,'newObjects':additions,'featureLosses':losses,'budget':{'component2MiBTarget':after['bytes']<=2*1024**2,'component4MiBCeiling':after['bytes']<=4*1024**2,'webImages2048':all(i['dimensions']and max(i['dimensions'])<=2048 for i in after['images'])}}
def main():
    p=argparse.ArgumentParser();p.add_argument('--source-root',required=True);p.add_argument('--candidate-root',required=True);p.add_argument('--output',required=True);p.add_argument('--manifest');args=p.parse_args()
    root=Path(args.candidate_root); results=[]
    for path in sorted(root.rglob('*.glb')):
        relative=path.relative_to(root);source=Path(args.source_root)/relative
        if source.exists():results.append(compare(source,path))
    missing=[]
    if args.manifest:
        expected=[f['path']for f in json.loads(Path(args.manifest).read_text())['files']if f['eligible']]
        missing=[path for path in expected if not(root/path).exists()]
    report={'schema':'dial-designer/realism-contract/v1','passed':bool(results)and not missing and all(r['passed']for r in results),'missingWorkloadFiles':missing,'files':results}
    Path(args.output).parent.mkdir(parents=True,exist_ok=True);Path(args.output).write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'files':len(results),'passed':report['passed'],'errors':sum(len(r['errors'])for r in results)}))
    raise SystemExit(0 if report['passed']else 1)
if __name__=='__main__':main()
