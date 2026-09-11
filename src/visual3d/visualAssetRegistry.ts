export type VisualCategory = 'case' | 'dial' | 'bezel' | 'crystal' | 'hands' | 'crown';

export type VisualAssetDescriptor = {
  assetId: string;
  category: VisualCategory;
  assetType: 'procedural' | 'glb';
  assetPath?: string;
  materialProfile?: string;
  handStyle?: 'baton' | 'mercedes' | 'needle';
  scale?: [number, number, number];
  rotation?: [number, number, number];
  offset?: [number, number, number];
  anchor?: 'watch-axis' | 'dial-seat' | 'hand-stack';
};

export const visualAssetRegistry: Record<string, VisualAssetDescriptor> = {
  'visual-case-default': { assetId: 'visual-case-default', category: 'case', assetType: 'procedural', materialProfile: 'brushed-steel' },
  'visual-dial-default': { assetId: 'visual-dial-default', category: 'dial', assetType: 'procedural', materialProfile: 'dial' },
  'visual-bezel-default': { assetId: 'visual-bezel-default', category: 'bezel', assetType: 'procedural', materialProfile: 'polished-steel' },
  'visual-crystal-default': { assetId: 'visual-crystal-default', category: 'crystal', assetType: 'procedural', materialProfile: 'sapphire' },
  'visual-hands-baton': { assetId: 'visual-hands-baton', category: 'hands', assetType: 'procedural', handStyle: 'baton', materialProfile: 'polished-steel' },
  'visual-hands-mercedes': { assetId: 'visual-hands-mercedes', category: 'hands', assetType: 'procedural', handStyle: 'mercedes', materialProfile: 'polished-steel' }
  , 'case-round-40mm-v1': { assetId: 'case-round-40mm-v1', category: 'case', assetType: 'glb', assetPath: '/assets/3d/cases/case_round_40mm_v1.glb', materialProfile: 'brushed-steel', anchor: 'watch-axis' }
  , 'bezel-diver-40mm-v1': { assetId: 'bezel-diver-40mm-v1', category: 'bezel', assetType: 'glb', assetPath: '/assets/3d/bezels/bezel_diver_40mm_v1.glb', materialProfile: 'polished-steel', anchor: 'watch-axis' }
  , 'crystal-domed-32mm-v1': { assetId: 'crystal-domed-32mm-v1', category: 'crystal', assetType: 'glb', assetPath: '/assets/3d/crystals/crystal_domed_32mm_v1.glb', materialProfile: 'sapphire', anchor: 'dial-seat' }
  , 'hands-mercedes-v1': { assetId: 'hands-mercedes-v1', category: 'hands', assetType: 'glb', assetPath: '/assets/3d/hands/hands_mercedes_v1.glb', handStyle: 'mercedes', materialProfile: 'polished-steel', anchor: 'hand-stack' }
};

export const resolveVisualAsset = (assetId: string | undefined, fallback: VisualAssetDescriptor): VisualAssetDescriptor =>
  (assetId && visualAssetRegistry[assetId]) || fallback;

export const resolveVisualAssetByCategory = (assetId: string | undefined, category: VisualCategory, fallback: VisualAssetDescriptor) => {
  const resolved = assetId ? visualAssetRegistry[assetId] : undefined;
  return resolved?.category === category ? resolved : fallback;
};
