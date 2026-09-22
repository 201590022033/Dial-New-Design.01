import type { AnchorId, ComponentCategory } from '@/domain/geometry/parametric';
export type VisualCategory = ComponentCategory;
export const visualCategories: VisualCategory[] = ['strap', 'caseback', 'case', 'dial', 'chapter-ring', 'bezel', 'hands', 'crystal', 'crown', 'pushers'];
export const categoryAnchor: Record<VisualCategory, AnchorId> = {
  case: 'watch-axis', caseback: 'watch-axis', strap: 'watch-axis', bezel: 'dial-seat', dial: 'dial-seat', 'chapter-ring': 'dial-seat', crystal: 'dial-seat', hands: 'hand-stack', crown: 'crown-interface', pushers: 'watch-axis'
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
  /** A reviewed, fixed-size preview must fall back when the assembly size changes. */
  referenceCaseDiameterMm?: number;
};

export const visualAssetRegistry: Record<string, VisualAssetDescriptor> = {
  'reference-42-case-preview': { assetId: 'reference-42-case-preview', category: 'case', assetType: 'glb', assetPath: '/assets/3d/reference-42/case.glb', anchor: 'watch-axis', units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 },
  'reference-42-caseback-preview': { assetId: 'reference-42-caseback-preview', category: 'caseback', assetType: 'glb', assetPath: '/assets/3d/reference-42/caseback.glb', anchor: 'watch-axis', offset: [0, 0, -5.65], units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 },
  'reference-42-strap-preview': { assetId: 'reference-42-strap-preview', category: 'strap', assetType: 'glb', assetPath: '/assets/3d/reference-42/strap.glb', anchor: 'watch-axis', units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 },
  'reference-42-dial-preview': { assetId: 'reference-42-dial-preview', category: 'dial', assetType: 'glb', assetPath: '/assets/3d/reference-42/dial.glb', anchor: 'watch-axis', offset: [0, 0, 3.7], units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 },
  'reference-42-chapter-ring-preview': { assetId: 'reference-42-chapter-ring-preview', category: 'chapter-ring', assetType: 'glb', assetPath: '/assets/3d/reference-42/chapter-ring.glb', anchor: 'watch-axis', offset: [0, 0, 4.75], units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 },
  'reference-42-bezel-preview': { assetId: 'reference-42-bezel-preview', category: 'bezel', assetType: 'glb', assetPath: '/assets/3d/reference-42/bezel.glb', anchor: 'watch-axis', offset: [0, 0, 5.65], units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 },
  'reference-42-crystal-preview': { assetId: 'reference-42-crystal-preview', category: 'crystal', assetType: 'glb', assetPath: '/assets/3d/reference-42/crystal.glb', anchor: 'watch-axis', offset: [0, 0, 6.25], units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 },
  'reference-42-crown-preview': { assetId: 'reference-42-crown-preview', category: 'crown', assetType: 'glb', assetPath: '/assets/3d/reference-42/crown.glb', anchor: 'crown-interface', units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 },
  'reference-42-hands-preview': { assetId: 'reference-42-hands-preview', category: 'hands', assetType: 'glb', assetPath: '/assets/3d/reference-42/hands.glb', anchor: 'hand-stack', units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 },
  // Opt-in path only: review fixture output is not automatically published here.
  'crown-reference-v1': { assetId: 'crown-reference-v1', category: 'crown', assetType: 'glb', assetPath: '/assets/3d/generated/crowns/crown-v1.glb', anchor: 'crown-interface', units: 'millimetres', upAxis: 'Y' },
  'visual-crown-default': { assetId: 'visual-crown-default', category: 'crown', assetType: 'procedural', materialProfile: 'polished-steel', anchor: 'crown-interface' },
  'visual-pushers-default': { assetId: 'visual-pushers-default', category: 'pushers', assetType: 'procedural', materialProfile: 'polished-steel', anchor: 'watch-axis' },
  'visual-case-default': { assetId: 'visual-case-default', category: 'case', assetType: 'procedural', materialProfile: 'brushed-steel' },
  'visual-caseback-default': { assetId: 'visual-caseback-default', category: 'caseback', assetType: 'procedural', materialProfile: 'brushed-steel' },
  'visual-strap-default': { assetId: 'visual-strap-default', category: 'strap', assetType: 'procedural', materialProfile: 'black-pvd' },
  'visual-dial-default': { assetId: 'visual-dial-default', category: 'dial', assetType: 'procedural', materialProfile: 'dial' },
  'visual-chapter-ring-default': { assetId: 'visual-chapter-ring-default', category: 'chapter-ring', assetType: 'procedural', materialProfile: 'black-pvd' },
  'visual-bezel-default': { assetId: 'visual-bezel-default', category: 'bezel', assetType: 'procedural', materialProfile: 'polished-steel' },
  'visual-crystal-default': { assetId: 'visual-crystal-default', category: 'crystal', assetType: 'procedural', materialProfile: 'sapphire' },
  'visual-hands-baton': { assetId: 'visual-hands-baton', category: 'hands', assetType: 'procedural', handStyle: 'baton', materialProfile: 'polished-steel' },
  'visual-hands-mercedes': { assetId: 'visual-hands-mercedes', category: 'hands', assetType: 'procedural', handStyle: 'mercedes', materialProfile: 'polished-steel' }
  , 'case-round-40mm-v1': { assetId: 'case-round-40mm-v1', category: 'case', assetType: 'glb', assetPath: '/assets/3d/cases/case_round_40mm_v1.glb', materialProfile: 'brushed-steel', anchor: 'watch-axis', referenceCaseDiameterMm: 40 }
  , 'bezel-diver-40mm-v1': { assetId: 'bezel-diver-40mm-v1', category: 'bezel', assetType: 'glb', assetPath: '/assets/3d/bezels/bezel_diver_40mm_v1.glb', materialProfile: 'polished-steel', anchor: 'dial-seat', referenceCaseDiameterMm: 40 }
  , 'crystal-domed-32mm-v1': { assetId: 'crystal-domed-32mm-v1', category: 'crystal', assetType: 'glb', assetPath: '/assets/3d/crystals/crystal_domed_32mm_v1.glb', materialProfile: 'sapphire', anchor: 'dial-seat', referenceCaseDiameterMm: 40 }
  , 'hands-mercedes-v1': { assetId: 'hands-mercedes-v1', category: 'hands', assetType: 'glb', assetPath: '/assets/3d/hands/hands_mercedes_v1.glb', handStyle: 'mercedes', materialProfile: 'polished-steel', anchor: 'hand-stack', referenceCaseDiameterMm: 40 }
  , 'dial-face-40mm-layout-v1': { assetId: 'dial-face-40mm-layout-v1', category: 'dial', assetType: 'glb', assetPath: '/assets/3d/dials/dial_face_40mm_layout_v1.glb', materialProfile: 'dial', anchor: 'dial-seat', referenceCaseDiameterMm: 40 }
  , 'archetype-dial-diver': { assetId: 'archetype-dial-diver', category: 'dial', assetType: 'glb', assetPath: '/assets/3d/archetypes/dial-diver.glb', anchor: 'watch-axis', offset: [0, 0, 3.7], units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-dial-pilot': { assetId: 'archetype-dial-pilot', category: 'dial', assetType: 'glb', assetPath: '/assets/3d/archetypes/dial-pilot.glb', anchor: 'watch-axis', offset: [0, 0, 3.7], units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-dial-field': { assetId: 'archetype-dial-field', category: 'dial', assetType: 'glb', assetPath: '/assets/3d/archetypes/dial-field.glb', anchor: 'watch-axis', offset: [0, 0, 3.7], units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-dial-dress': { assetId: 'archetype-dial-dress', category: 'dial', assetType: 'glb', assetPath: '/assets/3d/archetypes/dial-dress.glb', anchor: 'watch-axis', offset: [0, 0, 3.7], units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-dial-chronograph': { assetId: 'archetype-dial-chronograph', category: 'dial', assetType: 'glb', assetPath: '/assets/3d/archetypes/dial-chronograph.glb', anchor: 'watch-axis', offset: [0, 0, 3.7], units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-bezel-diver': { assetId: 'archetype-bezel-diver', category: 'bezel', assetType: 'glb', assetPath: '/assets/3d/archetypes/bezel-diver.glb', anchor: 'watch-axis', offset: [0, 0, 5.65], units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-bezel-pilot': { assetId: 'archetype-bezel-pilot', category: 'bezel', assetType: 'glb', assetPath: '/assets/3d/archetypes/bezel-pilot.glb', anchor: 'watch-axis', offset: [0, 0, 5.65], units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-bezel-field': { assetId: 'archetype-bezel-field', category: 'bezel', assetType: 'glb', assetPath: '/assets/3d/archetypes/bezel-field.glb', anchor: 'watch-axis', offset: [0, 0, 5.65], units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-bezel-dress': { assetId: 'archetype-bezel-dress', category: 'bezel', assetType: 'glb', assetPath: '/assets/3d/archetypes/bezel-dress.glb', anchor: 'watch-axis', offset: [0, 0, 5.65], units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-bezel-chronograph': { assetId: 'archetype-bezel-chronograph', category: 'bezel', assetType: 'glb', assetPath: '/assets/3d/archetypes/bezel-chronograph.glb', anchor: 'watch-axis', offset: [0, 0, 5.65], units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-hands-diver': { assetId: 'archetype-hands-diver', category: 'hands', assetType: 'glb', assetPath: '/assets/3d/archetypes/hands-diver.glb', anchor: 'hand-stack', units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-hands-pilot': { assetId: 'archetype-hands-pilot', category: 'hands', assetType: 'glb', assetPath: '/assets/3d/archetypes/hands-pilot.glb', anchor: 'hand-stack', units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-hands-field': { assetId: 'archetype-hands-field', category: 'hands', assetType: 'glb', assetPath: '/assets/3d/archetypes/hands-field.glb', anchor: 'hand-stack', units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-hands-dress': { assetId: 'archetype-hands-dress', category: 'hands', assetType: 'glb', assetPath: '/assets/3d/archetypes/hands-dress.glb', anchor: 'hand-stack', units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-hands-chronograph': { assetId: 'archetype-hands-chronograph', category: 'hands', assetType: 'glb', assetPath: '/assets/3d/archetypes/hands-chronograph.glb', anchor: 'hand-stack', units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-hands-chronograph-needle': { assetId: 'archetype-hands-chronograph-needle', category: 'hands', assetType: 'glb', assetPath: '/assets/3d/archetypes/hands-chronograph-needle.glb', anchor: 'hand-stack', units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-hands-chronograph-baton': { assetId: 'archetype-hands-chronograph-baton', category: 'hands', assetType: 'glb', assetPath: '/assets/3d/archetypes/hands-chronograph-baton.glb', anchor: 'hand-stack', units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-hands-chronograph-syringe': { assetId: 'archetype-hands-chronograph-syringe', category: 'hands', assetType: 'glb', assetPath: '/assets/3d/archetypes/hands-chronograph-syringe.glb', anchor: 'hand-stack', units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-pushers-chronograph': { assetId: 'archetype-pushers-chronograph', category: 'pushers', assetType: 'glb', assetPath: '/assets/3d/archetypes/pushers-chronograph.glb', anchor: 'watch-axis', units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-strap-rubber': { assetId: 'archetype-strap-rubber', category: 'strap', assetType: 'glb', assetPath: '/assets/3d/archetypes/strap-rubber.glb', anchor: 'watch-axis', units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-strap-leather': { assetId: 'archetype-strap-leather', category: 'strap', assetType: 'glb', assetPath: '/assets/3d/archetypes/strap-leather.glb', anchor: 'watch-axis', units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-strap-canvas': { assetId: 'archetype-strap-canvas', category: 'strap', assetType: 'glb', assetPath: '/assets/3d/archetypes/strap-canvas.glb', anchor: 'watch-axis', units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
  , 'archetype-strap-racing': { assetId: 'archetype-strap-racing', category: 'strap', assetType: 'glb', assetPath: '/assets/3d/archetypes/strap-racing.glb', anchor: 'watch-axis', units: 'millimetres', upAxis: 'Y', referenceCaseDiameterMm: 42 }
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
