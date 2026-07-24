export type PlaceholderFeatureId =
  | 'slide-rule'
  | 'tachymeter'
  | 'compass'
  | 'gmt'
  | 'countdown'
  | 'guilloche'
  | 'texture-engine'
  | 'lume-engine'
  | 'movement-templates';

export interface PlaceholderFeature {
  id: PlaceholderFeatureId;
  title: string;
  status: 'planned' | 'in-progress' | 'experimental';
  description: string;
}

export const placeholderFeatures: PlaceholderFeature[] = [
  {
    id: 'slide-rule',
    title: 'Slide Rule',
    status: 'planned',
    description: 'Extension point for rotating logarithmic scales.'
  },
  {
    id: 'tachymeter',
    title: 'Tachymeter',
    status: 'planned',
    description: 'Extension point for speed scale generation templates.'
  },
  {
    id: 'compass',
    title: 'Compass',
    status: 'planned',
    description: 'Extension point for directional ring and orientation tools.'
  },
  {
    id: 'gmt',
    title: 'GMT',
    status: 'planned',
    description: 'Extension point for 24-hour reference scales.'
  },
  {
    id: 'countdown',
    title: 'Countdown',
    status: 'planned',
    description: 'Extension point for count-up/down bezel templates.'
  },
  {
    id: 'guilloche',
    title: 'Guilloche',
    status: 'experimental',
    description: 'Extension point for procedural guilloche patterns.'
  },
  {
    id: 'texture-engine',
    title: 'Texture Engine',
    status: 'planned',
    description: 'Extension point for material texture layering.'
  },
  {
    id: 'lume-engine',
    title: 'Lume Engine',
    status: 'planned',
    description: 'Extension point for lume paint simulation presets.'
  },
  {
    id: 'movement-templates',
    title: 'Movement Templates',
    status: 'in-progress',
    description: 'Extension point for movement driven layout constraints.'
  }
];
