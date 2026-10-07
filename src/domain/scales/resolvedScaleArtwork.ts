import type { ScaleRunResult } from '@/services/scaleEngineService';
import type { ScaleLabel, ScaleTick } from './types';
import { scalePointerVertices, scalePointerRotation } from './pointerGeometry';

export const scaleArtworkLayers = (preview: ScaleRunResult): ScaleRunResult[] => preview.layers ?? [preview];

export const escapeScaleXml = (text: string): string => text.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!);
export const scaleLabelRotation = (label: ScaleLabel): number => label.orientation === 'horizontal' ? label.rotationDeg : label.angleDeg + label.rotationDeg;
export const scaleTickRadii = (tick: ScaleTick): [number, number] => [
  tick.radiusMm - (tick.direction === 'bidirectional' ? tick.lengthMm / 2 : 0),
  tick.radiusMm + (tick.direction === 'inside' ? -tick.lengthMm : tick.direction === 'bidirectional' ? tick.lengthMm / 2 : tick.lengthMm)
];

/** Same resolved positions, per-mark colours and text transforms in live SVG and vector export. */
export const scaleArtworkSvgContent = (preview: ScaleRunResult, units = 1, cx = 0, cy = 0, onlyRing?: 'outer' | 'inner', onlyTarget?: string, includeHitGeometry = true): string => {
  if (preview.layers) return preview.layers.map((layer) => scaleArtworkSvgContent(layer, units, cx, cy, onlyRing, onlyTarget, includeHitGeometry)).join('');
  const polar = (radius: number, angle: number): [number, number] => [cx + units * radius * Math.sin(angle * Math.PI / 180), cy - units * radius * Math.cos(angle * Math.PI / 180)];
  return (['outer', 'inner'] as const).filter((ring) => !onlyRing || ring === onlyRing).map((ring) => {
    const envelope = ring === 'inner' ? preview.fixedPlacementEnvelope ?? preview.placementEnvelope : preview.placementEnvelope;
    const target = ring === 'inner' ? preview.fixedPlacementTargetBandId ?? 'band-chapter-ring' : preview.placementTargetBandId ?? 'band-outer-bezel';
    if (onlyTarget && target !== onlyTarget) return '';
    const id = `scale-${target.replace(/[^a-zA-Z0-9_-]/g, '-')}-${ring}-clip`;
    const inner = envelope.innerRadiusMm * units, outer = envelope.outerRadiusMm * units;
    const path = `M ${cx-outer},${cy} a ${outer},${outer} 0 1,0 ${outer*2},0 a ${outer},${outer} 0 1,0 ${-outer*2},0` + (inner > 0 ? ` M ${cx-inner},${cy} a ${inner},${inner} 0 1,0 ${inner*2},0 a ${inner},${inner} 0 1,0 ${-inner*2},0` : '');
    const ticks = preview.ticks.filter((t) => (t.ringId ?? 'outer') === ring).map((tick, index) => {
      const [start, end] = scaleTickRadii(tick);
      const [x1,y1] = polar(start,tick.angleDeg), [x2,y2] = polar(end,tick.angleDeg);
      const hit = includeHitGeometry && (tick.hoverPaddingMm ?? 0) > 0 ? `<line data-scale-hit-id="${escapeScaleXml(tick.id ?? '')}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="transparent" stroke-width="${(tick.widthMm+2*(tick.hoverPaddingMm ?? 0))*units}" stroke-linecap="round" pointer-events="stroke"/>` : '';
      return `<line data-scale-tick-index="${index}" data-mark-id="${escapeScaleXml(tick.id ?? '')}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${escapeScaleXml(tick.color ?? preview.color)}" stroke-width="${tick.widthMm*units}" stroke-linecap="round"/>${hit}`;
    }).join('');
    const labels = preview.labels.filter((l) => (l.ringId ?? 'outer') === ring).map((label,index) => {
      const [x,y] = polar(label.radiusMm,label.angleDeg);
      return `<text data-scale-label-index="${index}" data-mark-id="${escapeScaleXml(label.id ?? '')}" x="${x}" y="${y}" transform="rotate(${scaleLabelRotation(label)} ${x} ${y})" text-anchor="middle" dominant-baseline="central" font-weight="600" font-family="${escapeScaleXml(preview.fontFamily)}" font-size="${preview.fontSizeMm*units}" fill="${escapeScaleXml(label.color ?? preview.color)}">${escapeScaleXml(label.text)}</text>`;
    }).join('');
    const pointers = (preview.pointers ?? []).filter((pointer) => pointer.ringId === ring).map((pointer) => {
      const [x,y] = polar(pointer.radiusMm, pointer.angleDeg);
      const points = scalePointerVertices(pointer).map(([px,py]) => `${px*units},${py*units}`).join(' ');
      const transform = `translate(${x} ${y}) rotate(${scalePointerRotation(pointer)})`;
      const hit = includeHitGeometry && (pointer.hoverPaddingMm ?? 0) > 0 ? `<polygon data-scale-hit-id="${escapeScaleXml(pointer.id)}" points="${points}" transform="${transform}" fill="transparent" stroke="transparent" stroke-width="${(pointer.strokeWidthMm+2*(pointer.hoverPaddingMm ?? 0))*units}" stroke-linejoin="round" pointer-events="all"/>` : '';
      return `<polygon data-mark-id="${escapeScaleXml(pointer.id)}" points="${points}" transform="${transform}" fill="${escapeScaleXml(pointer.color)}" stroke="${escapeScaleXml(pointer.strokeColor ?? pointer.color)}" stroke-width="${pointer.strokeWidthMm*units}" stroke-linejoin="round"/>${hit}`;
    }).join('');
    // Hit geometry stays inside the same clip. Padding has already participated
    // in fit; it never displaces an actual mathematical graduation.
    const hover = (includeHitGeometry ? preview.labels : []).filter((label) => (label.ringId ?? 'outer') === ring && (label.hoverPaddingMm ?? 0) > 0).map((label) => {
      const [x,y] = polar(label.radiusMm,label.angleDeg), pad = label.hoverPaddingMm ?? 0;
      const width = (label.boundsMm?.width ?? preview.fontSizeMm*label.text.length*0.58)+2*pad;
      const height = (label.boundsMm?.height ?? preview.fontSizeMm)+2*pad;
      return `<rect data-scale-hit-id="${escapeScaleXml(label.id ?? '')}" x="${x-width*units/2}" y="${y-height*units/2}" width="${width*units}" height="${height*units}" transform="rotate(${scaleLabelRotation(label)} ${x} ${y})" fill="transparent" pointer-events="all"/>`;
    }).join('');
    return `<defs><clipPath id="${id}"><path d="${path}" clip-rule="evenodd" fill-rule="evenodd"/></clipPath></defs><g data-band-id="${escapeScaleXml(target)}" data-ring-id="${ring}" clip-path="url(#${id})">${ticks}${labels}${pointers}${hover}</g>`;
  }).join('');
};

export const resolvedScaleSvg = (preview: ScaleRunResult, diameterMm: number, ring?: 'outer' | 'inner'): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${diameterMm}mm" height="${diameterMm}mm" viewBox="${-diameterMm/2} ${-diameterMm/2} ${diameterMm} ${diameterMm}" data-ring="${ring ?? 'both'}" data-units="mm"><title>Resolved scale marking artwork</title>${scaleArtworkSvgContent(preview,1,0,0,ring,undefined,false)}</svg>`;
