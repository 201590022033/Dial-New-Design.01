import type { VisualAssetDescriptor } from './visualAssetRegistry';

/** One release revision for promoted component assets; stable across Suspense retries. */
export const WATCH_ASSET_REVISION = 'watch-realism-v2';

export const glbLoadUrl = (descriptor: VisualAssetDescriptor): string =>
  `${descriptor.assetPath!}?v=${WATCH_ASSET_REVISION}`;
