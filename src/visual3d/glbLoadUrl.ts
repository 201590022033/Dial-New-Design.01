import type { VisualAssetDescriptor } from './visualAssetRegistry';

export const glbLoadUrl = (descriptor: VisualAssetDescriptor, instanceId: number): string => {
  const attachmentAsset = descriptor.assetId.startsWith('lug-case-') ||
    descriptor.assetId.startsWith('archetype-strap-') || descriptor.assetId === 'archetype-pushers-chronograph' ||
    ['reference-42-case-preview', 'reference-42-strap-preview'].includes(descriptor.assetId);
  return descriptor.assetPath! + (descriptor.category === 'hands'
    ? `?selection=${instanceId}`
    : attachmentAsset ? '?v=attachment-seating-1' : '');
};
