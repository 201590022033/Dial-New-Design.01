import type { AnchorId, ComponentCategory } from '@/domain/geometry/parametric';
export type VisualCategory = ComponentCategory;
export const visualCategories: VisualCategory[] = ['case', 'dial', 'bezel', 'crystal', 'hands', 'crown'];
export const categoryAnchor: Record<VisualCategory, AnchorId> = {
  case: 'watch-axis', bezel: 'dial-seat', dial: 'dial-seat', crystal: 'dial-seat', hands: 'hand-stack', crown: 'crown-interface'
};

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
  anchor?: AnchorId;
  /** GLB coordinates: default glTF Y-up, numeric units are authored millimetres.
   * Use metres only for exports with baked metric conversion. No diameter rescaling.
   * offset is in engineering mm; rotation is XYZ radians, after axis conversion.
   */
  units?: 'millimetres' | 'metres';
  upAxis?: 'Y' | 'Z';
};

export const visualAssetRegistry: Record<string, VisualAssetDescriptor> = {
  // Opt-in path only: review fixture output is not automatically published here.
  'crown-reference-v1': { assetId: 'crown-reference-v1', category: 'crown', assetType: 'glb', assetPath: '/assets/3d/generated/crowns/crown-v1.glb', anchor: 'crown-interface', units: 'millimetres', upAxis: 'Y' },
  'visual-crown-default': { assetId: 'visual-crown-default', category: 'crown', assetType: 'procedural', materialProfile: 'polished-steel', anchor: 'crown-interface' },
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
  resolveVisualAssetByCategory(assetId, fallback.category, fallback);

export const isUsableVisualAsset = (asset: VisualAssetDescriptor, category: VisualCategory): boolean =>
  asset.category === category && (asset.assetType === 'procedural' || (asset.assetType === 'glb' && !!asset.assetPath?.trim())) &&
  [asset.scale, asset.rotation, asset.offset].every((v) => v === undefined || (v.length === 3 && v.every(Number.isFinite))) &&
  (asset.scale === undefined || asset.scale.every((v) => v > 0));

export const resolveVisualAssetByCategory = (assetId: string | undefined, category: VisualCategory, fallback: VisualAssetDescriptor) => {
  const resolved = assetId ? visualAssetRegistry[assetId] : undefined;
  return resolved && isUsableVisualAsset(resolved, category) ? resolved : fallback;
};
