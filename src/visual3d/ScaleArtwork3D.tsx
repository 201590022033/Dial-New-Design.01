import type { ScaleRunResult } from '@/services/scaleEngineService';
import type { VisualWatchModel } from './watchAssemblyToVisualModel';
import { scaleArtworkSurfaceZ, type ScaleArtworkRing } from './scaleArtworkEnvelope';
import { useScaleArtworkTexture } from './useScaleArtworkTexture';

type Ring = ScaleArtworkRing;

const RingArtwork = ({ preview, model, ring }: { preview: ScaleRunResult; model: VisualWatchModel; ring: Ring }) => {
  const texture = useScaleArtworkTexture(preview, model, ring);
  if (!texture) return null;
  // Runtime artwork follows the same physical scale radii as the engineering view.
  // It is a preview decal, not an engraved or dimensionally certified GLB surface.
  const z = scaleArtworkSurfaceZ(model, ring);
  return <mesh name={`scale-artwork-${ring}`} position={[0, 0, z]}>
    <planeGeometry args={[model.caseDiameterMm, model.caseDiameterMm]} />
    <meshStandardMaterial map={texture} transparent depthWrite={false} roughness={0.48} metalness={0.08} polygonOffset polygonOffsetFactor={-1} />
  </mesh>;
};

export const ScaleArtwork3D = ({ preview, model }: { preview: ScaleRunResult | null; model: VisualWatchModel }) => {
  if (!preview) return null;
  return <group name="live-scale-artwork">
    {model.assets.bezel.scaleArtworkSurface !== 'outer' && <RingArtwork preview={preview} model={model} ring="outer" />}
    {preview.kind === 'slide-rule' && model.assets['chapter-ring'].scaleArtworkSurface !== 'inner' && <RingArtwork preview={preview} model={model} ring="inner" />}
  </group>;
};
