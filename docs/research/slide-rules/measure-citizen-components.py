"""Read-only Citizen photograph connected-component measurements; no image edits."""
import sys
from collections import deque
from PIL import Image
import numpy as np

path = sys.argv[1]
x0,y0,w,h = map(int,sys.argv[2:6])
threshold = int(sys.argv[6]) if len(sys.argv)>6 else 200
arr = np.asarray(Image.open(path).convert('RGBA'))
crop = arr[y0:y0+h,x0:x0+w]
mask = ((crop[:,:,:3].min(axis=2)>=threshold) if threshold>=0 else (crop[:,:,:3].max(axis=2)<=-threshold)) & (crop[:,:,3]>100)
seen = np.zeros(mask.shape,dtype=bool)
rows=[]
components=[]
for y in range(mask.shape[0]):
    for x in range(mask.shape[1]):
        if seen[y,x] or not mask[y,x]:
            continue
        pts=[]
        q=deque([(x,y)])
        seen[y,x]=True
        while q:
            xx,yy=q.popleft(); pts.append((xx,yy))
            for dy in [-1,0,1]:
                for dx in [-1,0,1]:
                    nx,ny=xx+dx,yy+dy
                    if 0<=nx<w and 0<=ny<h and not seen[ny,nx] and mask[ny,nx]:
                        seen[ny,nx]=True; q.append((nx,ny))
        if len(pts)<6:
            continue
        p=np.asarray(pts,dtype=float)
        low=p.min(axis=0); high=p.max(axis=0)
        if max(high-low)>100:
            continue
        components.append(p+[x0,y0])
        cov=np.cov(p.T)
        eig,vec=np.linalg.eigh(cov)
        projection=(p-p.mean(axis=0))@vec
        lengths=projection.max(axis=0)-projection.min(axis=0)+1
        rows.append((len(pts), [int(low[0]+x0),int(low[1]+y0),int(high[0]-low[0]+1),int(high[1]-low[1]+1)],np.round(p.mean(axis=0)+[x0,y0],1).tolist(),np.round(sorted(lengths,reverse=True),1).tolist()))
print('source',path,'image size',arr.shape[1],arr.shape[0],'region',x0,y0,w,h,'RGB threshold',threshold)
for row in sorted(rows,key=lambda r:r[2][1]):
    print(row)
if len(sys.argv)>8:
    def ink_points(rect):
        xx,yy,ww,hh=map(int,rect.split(','))
        selected=[p for p in components if p[:,0].min()>=xx and p[:,1].min()>=yy and p[:,0].max()<xx+ww and p[:,1].max()<yy+hh]
        return np.concatenate(selected)
    tick=ink_points(sys.argv[7]); label=ink_points(sys.argv[8])
    eig,vec=np.linalg.eigh(np.cov(tick.T)); radial=vec[:,-1]
    if radial@(tick.mean(axis=0)-label.mean(axis=0))<0:
        radial=-radial
    tangent=np.array([-radial[1],radial[0]])
    tick_r=tick@radial; label_r=label@radial; label_t=label@tangent
    dists=np.linalg.norm(tick[:,None,:]-label[None,:,:],axis=2)
    ti,li=np.unravel_index(dists.argmin(),dists.shape)
    print('selected photographic sample',{'tickRect':sys.argv[7],'labelRect':sys.argv[8],'tickRadialLengthPx':round(np.ptp(tick_r)+1,2),'tickWidthPx':round(np.ptp(tick@tangent)+1,2),'labelInkRadialHeightPx':round(np.ptp(label_r)+1,2),'labelInkTangentialWidthPx':round(np.ptp(label_t)+1,2),'projectedRadialClearancePx':round(min(tick_r)-max(label_r)-1,2),'nearestInkGapPx':round(dists.min()-1,2),'nearestTickPixel':tick[ti].tolist(),'nearestLabelPixel':label[li].tolist(),'radialUnit':np.round(radial,4).tolist()})
