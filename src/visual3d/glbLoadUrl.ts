import type { VisualAssetDescriptor } from './visualAssetRegistry';

export const glbLoadUrl = (descriptor: VisualAssetDescriptor): string => {
  const attachmentAsset = descriptor.assetId.startsWith('lug-case-') ||
    descriptor.assetId.startsWith('archetype-strap-') || descriptor.assetId === 'archetype-pushers-chronograph' ||
    ['reference-42-case-preview', 'reference-42-strap-preview'].includes(descriptor.assetId);
  return descriptor.assetPath! + (descriptor.category === 'hands'
    ? '?v=main-hand-library-3'
    : descriptor.scaleArtworkSurface ? '?v=pilot-scale-surfaces-1'
    : attachmentAsset ? '?v=attachment-seating-1' : '');
};
