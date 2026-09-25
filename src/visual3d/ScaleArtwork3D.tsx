import { useEffect, useMemo } from 'react';
import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three';
import type { ScaleRunResult } from '@/services/scaleEngineService';
import type { ScaleTick, ScaleLabel } from '@/domain/scales/types';
import type { VisualWatchModel } from './watchAssemblyToVisualModel';

type Ring = 'outer' | 'inner';

const polar = (radius: number, angle: number, pxPerMm: number, centre: number): [number, number] => {
  const radians = angle * Math.PI / 180;
  return [centre + Math.sin(radians) * radius * pxPerMm, centre - Math.cos(radians) * radius * pxPerMm];
};

const artworkForRing = (preview: ScaleRunResult, ring: Ring): { ticks: ScaleTick[]; labels: ScaleLabel[] } => ({
  ticks: preview.ticks.filter((tick) => (tick.ringId ?? 'outer') === ring),
  labels: preview.labels.filter((label) => (label.ringId ?? 'outer') === ring)
});

const RingArtwork = ({ preview, model, ring }: { preview: ScaleRunResult; model: VisualWatchModel; ring: Ring }) => {
  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const marks = artworkForRing(preview, ring);
    if (!marks.ticks.length && !marks.labels.length) return null;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 2048;
    const context = canvas.getContext('2d');
    if (!context) return null;
    const pxPerMm = canvas.width / model.caseDiameterMm;
    const centre = canvas.width / 2;
    const color = preview.color || '#f8fafc';
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineCap = 'round';
    for (const tick of marks.ticks) {
      const length = tick.direction === 'bidirectional' ? tick.lengthMm / 2 : tick.lengthMm;
      const startRadius = tick.radiusMm - (tick.direction === 'bidirectional' ? length : 0);
      const endRadius = tick.radiusMm + (tick.direction === 'inside' ? -length : length);
      const start = polar(startRadius, tick.angleDeg, pxPerMm, centre);
      const end = polar(endRadius, tick.angleDeg, pxPerMm, centre);
      context.lineWidth = Math.max(1.4, tick.widthMm * pxPerMm);
      context.beginPath();
      context.moveTo(...start);
      context.lineTo(...end);
      context.stroke();
    }
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = `600 ${preview.fontSizeMm * pxPerMm}px ${preview.fontFamily}`;
    for (const label of marks.labels) {
      const [x, y] = polar(label.radiusMm, label.angleDeg, pxPerMm, centre);
      context.save();
      context.translate(x, y);
      if (label.orientation !== 'horizontal') context.rotate((label.angleDeg + label.rotationDeg) * Math.PI / 180);
      context.fillText(label.text, 0, 0);
      context.restore();
    }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    result.minFilter = LinearFilter;
    result.magFilter = LinearFilter;
    result.needsUpdate = true;
    return result;
  }, [model.caseDiameterMm, preview, ring]);
  useEffect(() => () => texture?.dispose(), [texture]);
  if (!texture) return null;
  const envelope = model.previewEnvelope;
  // Runtime artwork follows the same physical scale radii as the engineering view.
  // It is a preview decal, not an engraved or dimensionally certified GLB surface.
  const z = ring === 'outer'
    ? envelope.bezelZ + envelope.bezelHeight / 2 + 0.09
    : envelope.crystalZ + envelope.crystalThickness / 2 + 0.025;
  return <mesh name={`scale-artwork-${ring}`} position={[0, 0, z]}>
    <planeGeometry args={[model.caseDiameterMm, model.caseDiameterMm]} />
    <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
  </mesh>;
};

export const ScaleArtwork3D = ({ preview, model }: { preview: ScaleRunResult | null; model: VisualWatchModel }) => {
  if (!preview) return null;
  return <group name="live-scale-artwork">
    <RingArtwork preview={preview} model={model} ring="outer" />
    {preview.kind === 'slide-rule' && <RingArtwork preview={preview} model={model} ring="inner" />}
  </group>;
};
