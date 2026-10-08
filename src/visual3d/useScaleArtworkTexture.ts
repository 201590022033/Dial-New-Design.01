import { useEffect, useMemo } from 'react';
import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three';
import type { ScaleRunResult } from '@/services/scaleEngineService';
import type { ScaleTick, ScaleLabel } from '@/domain/scales/types';
import type { VisualWatchModel } from './watchAssemblyToVisualModel';
import { scaleArtworkClipEnvelope, scaleArtworkRadialShiftMm, type ScaleArtworkRing } from './scaleArtworkEnvelope';
import { scaleLabelRotation, scaleLabelBoxSize } from '@/domain/scales/resolvedScaleArtwork';
import { scalePointerRotation, scalePointerVertices } from '@/domain/scales/pointerGeometry';

type Ring = ScaleArtworkRing;

const polar = (radius: number, angle: number, pxPerMm: number, centre: number): [number, number] => {
  const radians = angle * Math.PI / 180;
  return [centre + Math.sin(radians) * radius * pxPerMm, centre - Math.cos(radians) * radius * pxPerMm];
};

const artworkForRing = (preview: ScaleRunResult, ring: Ring): { ticks: ScaleTick[]; labels: ScaleLabel[] } => ({
  ticks: preview.ticks.filter((tick) => (tick.ringId ?? 'outer') === ring),
  labels: preview.labels.filter((label) => (label.ringId ?? 'outer') === ring)
});

export const useScaleArtworkTexture = (preview: ScaleRunResult | null, model: VisualWatchModel, ring: Ring, background?: string, flipY = true) => {
  const texture = useMemo(() => {
    if (!preview || typeof document === 'undefined') return null;
    const marks = artworkForRing(preview, ring);
    const pointers = (preview.pointers ?? []).filter((pointer) => pointer.ringId === ring);
    const substrates = (preview.substrates ?? []).filter((substrate) => substrate.ringId === ring);
    if (!marks.ticks.length && !marks.labels.length && !pointers.length && !substrates.length) return null;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 2048;
    const context = canvas.getContext('2d');
    if (!context) return null;
    const pxPerMm = canvas.width / model.caseDiameterMm;
    const centre = canvas.width / 2;
    if (background) {
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    const clip = scaleArtworkClipEnvelope(preview, model, ring);
    const inwardShiftMm = scaleArtworkRadialShiftMm(preview, model, ring);
    const outerClipPx = Math.max(0, clip.outerRadiusMm * pxPerMm);
    const innerClipPx = Math.max(0, Math.min(clip.innerRadiusMm * pxPerMm, outerClipPx));
    context.beginPath();
    context.arc(centre, centre, outerClipPx, 0, Math.PI * 2);
    if (innerClipPx > 0) context.arc(centre, centre, innerClipPx, 0, Math.PI * 2, true);
    context.clip('evenodd');
    for (const substrate of substrates) {
      context.fillStyle = substrate.color;
      context.beginPath();
      context.arc(centre, centre, Math.max(0, substrate.outerRadiusMm - inwardShiftMm) * pxPerMm, 0, Math.PI * 2);
      if (substrate.innerRadiusMm > inwardShiftMm) context.arc(centre, centre, (substrate.innerRadiusMm - inwardShiftMm) * pxPerMm, 0, Math.PI * 2, true);
      context.fill('evenodd');
    }
    const color = preview.color || '#f8fafc';
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineCap = 'round';
    for (const tick of marks.ticks) {
      context.strokeStyle = tick.color ?? color;
      context.lineCap = tick.style === 'block' ? 'butt' : 'round';
      const length = tick.direction === 'bidirectional' ? tick.lengthMm / 2 : tick.lengthMm;
      const startRadius = tick.radiusMm - inwardShiftMm - (tick.direction === 'bidirectional' ? length : 0);
      const endRadius = tick.radiusMm - inwardShiftMm + (tick.direction === 'inside' ? -length : length);
      const start = polar(startRadius, tick.angleDeg, pxPerMm, centre);
      const end = polar(endRadius, tick.angleDeg, pxPerMm, centre);
      context.lineWidth = tick.widthMm * pxPerMm;
      context.beginPath();
      context.moveTo(...start);
      context.lineTo(...end);
      context.stroke();
    }
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = `600 ${preview.fontSizeMm * pxPerMm}px ${preview.fontFamily}`;
    for (const label of marks.labels) {
      const [x, y] = polar(label.radiusMm - inwardShiftMm, label.angleDeg, pxPerMm, centre);
      context.save();
      context.translate(x, y);
      context.rotate(scaleLabelRotation(label) * Math.PI / 180);
      context.font = `600 ${(label.fontSizeMm ?? preview.fontSizeMm) * pxPerMm}px ${preview.fontFamily}`;
      if (label.backgroundColour) {
        const box = scaleLabelBoxSize(label, preview.fontSizeMm);
        context.fillStyle = label.backgroundColour;
        context.fillRect(-box.width*pxPerMm/2, -box.height*pxPerMm/2, box.width*pxPerMm, box.height*pxPerMm);
      }
      context.fillStyle = label.color ?? color;
      context.fillText(label.text, 0, 0);
      context.restore();
    }
    for (const pointer of pointers) {
      const [x,y] = polar(pointer.radiusMm - inwardShiftMm, pointer.angleDeg, pxPerMm, centre);
      context.save();
      context.translate(x,y);
      context.rotate(scalePointerRotation(pointer) * Math.PI / 180);
      context.fillStyle = pointer.color;
      context.strokeStyle = pointer.strokeColor ?? pointer.color;
      context.lineWidth = pointer.strokeWidthMm * pxPerMm;
      context.lineJoin = 'round';
      context.beginPath();
      scalePointerVertices(pointer).forEach(([px,py], index) => index ? context.lineTo(px*pxPerMm, py*pxPerMm) : context.moveTo(px*pxPerMm, py*pxPerMm));
      context.closePath();
      if (pointer.color !== 'none') context.fill();
      if (pointer.strokeWidthMm > 0 && (pointer.strokeColor ?? pointer.color) !== 'none') context.stroke();
      context.restore();
    }
    const result = new CanvasTexture(canvas);
    // GLTF UVs have V flipped at export; planeGeometry uses conventional UVs.
    result.flipY = flipY;
    result.colorSpace = SRGBColorSpace;
    result.minFilter = LinearFilter;
    result.magFilter = LinearFilter;
    result.needsUpdate = true;
    return result;
  }, [background, flipY, model, preview, ring]);
  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
};
