// Rasterize the exact production-resolved scale SVG, with its existing fonts and clips.
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { resolve,join } from 'node:path';
import { createRequire } from 'node:module';
import { markerNumeralLayout } from '../../src/domain/generators/markerAppearance.ts';
const require=createRequire(resolve('tools/blender/realism-toolchain/package.json'));
const {Resvg}=require('@resvg/resvg-js');
const root=resolve(process.argv[2]??'.artifacts/blender-review/realism/vr-implementation-2026-10-14');
const manifest=JSON.parse(await readFile(join(root,'assembly-manifest.json'),'utf8'));
const xml=(value)=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function dialSvg(style){
  const model=style.model,d=model.dial,art=d.artwork,D=d.outerDiameterMm,C=D/2,a=model.archetypeAppearance;
  const parts=[];
  const text=(value,x,y,size,color,font,weight=600,angle=0,outline=false)=>parts.push(`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-family="${xml(font)}" font-size="${size}" font-weight="${weight}" fill="${outline?'none':xml(color)}"${outline?` stroke="${xml(color)}" stroke-width=".035"`:''}${angle?` transform="rotate(${angle} ${x} ${y})"`:''}>${xml(value)}</text>`);
  const appearance=a.regions?.markers;
  for(const marker of d.markers){
    if(!marker.text)continue;
    const glyph=markerNumeralLayout(marker,D/2);
    const color=appearance?(appearance.lumeMode==='off'?appearance.printColor:appearance.lumeColor):(a.markerColor??a.accentColor);
    text(marker.text,C+glyph.xMm,C+glyph.yMm,glyph.fontSizeMm,color,d.markerKind==='roman-numeral'?'Georgia, serif':art.fontFamily,700,0,appearance?.lumeMode==='outline');
  }
  if(model.assets.dial.assetType==='glb')for(const window of [...d.windows].sort((a,b)=>a.kind==='day'?-1:b.kind==='day'?1:0)){
    const angle=window.angleDeg*Math.PI/180,r=D/2*.74,x=C+Math.sin(angle)*r,y=C-Math.cos(angle)*r;
    parts.push(`<rect x="${x-window.widthMm/2}" y="${y-window.heightMm/2}" width="${window.widthMm}" height="${window.heightMm}" fill="#f8fafc" stroke="#26313d" stroke-width=".08"/>`);
    text(window.kind==='day'?'MON':'18',x,y,Math.min(1,window.heightMm*.7),'#26313d','Arial, sans-serif');
  }
  const size=Math.max(18*D/1024,art.fontSizeMm);
  if(art.content&&['arc','circular','inside-circle','outside-circle'].includes(art.layout)){
    const chars=[...art.content],step=chars.length>1?art.angleSpanDeg/(chars.length-1):0;
    chars.forEach((ch,i)=>{const deg=art.angleStartDeg+step*i,t=deg*Math.PI/180;text(ch,C+Math.sin(t)*art.radiusMm,C-Math.cos(t)*art.radiusMm,size,art.color,art.fontFamily,600,deg);});
  }else if(art.content)text(art.content,C,C-art.radiusMm*.45,size,art.color,art.fontFamily,600,art.layout==='vertical'?-90:0);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${D}mm" height="${D}mm" viewBox="0 0 ${D} ${D}">${parts.join('')}</svg>`;
}
for(const style of manifest.styles){
  const dir=join(root,'bakes','artwork',style.id);await mkdir(dir,{recursive:true});
  const dial=dialSvg(style);
  await writeFile(join(dir,'dial.svg'),dial);
  await writeFile(join(dir,'dial.png'),new Resvg(dial,{fitTo:{mode:'width',value:2048},font:{loadSystemFonts:true}}).render().asPng());
  for(const [index,entry]of style.scaleLayers.entries())for(const ring of entry.rings){
    const basename=`scale-${index}-${ring.ring}`;
    await writeFile(join(dir,basename+'.svg'),ring.svg);
    const image=new Resvg(ring.svg,{fitTo:{mode:'width',value:2048},font:{loadSystemFonts:true}}).render();
    await writeFile(join(dir,basename+'.png'),image.asPng());
  }
}
console.log('Production scale SVG and calibrated dial layout/2048px PNG artwork written for six gallery manifests.');
