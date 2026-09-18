import type { VisualWatchModel } from './watchAssemblyToVisualModel';
import { categoryAnchor, isUsableVisualAsset, type VisualCategory } from './visualAssetRegistry';
import { finiteVector } from './assemblyAnchors';
import type { Vector3Tuple } from '@/domain/geometry/parametric';

/** Nested composition: anchor * part transform * descriptor transform * axis/units.
 * No implicit global scaling by case diameter: authored component sizes remain intact.
 */
export const componentPlacement = (model: VisualWatchModel, category: VisualCategory) => {
  const descriptor = model.assets[category];
  const glb = isUsableVisualAsset(descriptor, category) && descriptor.assetType === 'glb';
  const anchorId = descriptor.anchor && descriptor.anchor in model.anchors ? descriptor.anchor : categoryAnchor[category];
  const transform = model.transforms[category];
  const offset: Vector3Tuple = finiteVector(transform?.offsetMm) ? [...transform.offsetMm] : [0, 0, 0];
  const gap = category === 'crown' ? model.crown.parameters?.attachment.axialGapMm : undefined;
  if (typeof gap === 'number' && Number.isFinite(gap) && gap >= 0) offset[0] += gap;
  return {
    glb, anchor: model.anchors[anchorId], offset,
    rotation: finiteVector(transform?.rotationRad) ? transform.rotationRad : [0, 0, 0] as Vector3Tuple,
    descriptorOffset: glb ? descriptor.offset ?? [0, 0, 0] as Vector3Tuple : [0, 0, 0] as Vector3Tuple,
    descriptorRotation: glb ? descriptor.rotation ?? [0, 0, 0] as Vector3Tuple : [0, 0, 0] as Vector3Tuple,
    descriptorScale: glb ? descriptor.scale ?? [1, 1, 1] as Vector3Tuple : [1, 1, 1] as Vector3Tuple
  };
};
