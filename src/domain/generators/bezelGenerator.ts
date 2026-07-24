import type { ScaleKind } from '@/domain/scales/types';
import type { EngineResultBase } from '@/domain/generators/types';

export type BezelType =
  | 'smooth'
  | 'coin-edge'
  | 'knurled'
  | 'scalloped'
  | 'dive'
  | 'gmt'
  | 'compass'
  | 'countdown'
  | 'slide-rule'
  | 'fixed';

export type BezelProfile = 'coin-edge' | 'knurled' | 'scalloped' | 'smooth';

export interface BezelConfig {
  type: BezelType;
  profile: BezelProfile;
  rotating: boolean;
  material: string;
  color: string;
  gripStyle: 'light' | 'medium' | 'aggressive';
  insert: 'none' | 'metal' | 'ceramic' | 'aluminium' | 'sapphire';
  scaleAttachment: ScaleKind;
  manufacturingNotes: string;
}

export interface BezelResult extends EngineResultBase {
  type: BezelType;
  profile: BezelProfile;
  rotating: boolean;
  material: string;
  scaleAttachment: ScaleKind;
}

const scaleAttachmentByType: Record<BezelType, ScaleKind> = {
  smooth: 'circular',
  'coin-edge': 'circular',
  knurled: 'circular',
  scalloped: 'circular',
  dive: 'countdown',
  gmt: 'custom',
  compass: 'compass',
  countdown: 'countdown',
  'slide-rule': 'slide-rule',
  fixed: 'circular'
};

export const defaultBezelConfig: BezelConfig = {
  type: 'smooth',
  profile: 'smooth',
  rotating: false,
  material: 'steel',
  color: '#0B1224',
  gripStyle: 'medium',
  insert: 'none',
  scaleAttachment: 'circular',
  manufacturingNotes: 'Default CNC bezel. Rotate metadata is informational only.'
};

export const generateBezel = (config: BezelConfig): BezelResult => {
  const warnings: string[] = [];
  if (config.insert === 'sapphire' && config.gripStyle === 'aggressive') {
    warnings.push('Aggressive grip with sapphire insert may increase chipping risk.');
  }

  return {
    id: 'bezel-engine',
    type: config.type,
    profile: config.profile,
    rotating: config.rotating,
    material: config.material,
    scaleAttachment: config.scaleAttachment || scaleAttachmentByType[config.type],
    warnings,
    layers: [
      {
        id: 'bezel-surface',
        name: 'Bezel Surface',
        order: 40,
        visible: true,
        style: {
          fill: config.color,
          stroke: '#94A3B8',
          strokeWidthMm: 0.2,
          opacity: 0.96
        },
        metadata: {
          type: config.type,
          profile: config.profile,
          insert: config.insert,
          gripStyle: config.gripStyle,
          rotating: config.rotating
        }
      }
    ],
    futureEffects: ['ratcheting-profile', 'ceramic-lume-fill', 'tooling-relief']
  };
};

export const createBezelPlan = (type: BezelType, profile: BezelProfile = 'smooth'): BezelResult => {
  const scaleAttachment: Record<BezelType, ScaleKind> = {
    smooth: 'circular',
    'coin-edge': 'circular',
    knurled: 'circular',
    scalloped: 'circular',
    dive: 'countdown',
    'slide-rule': 'slide-rule',
    compass: 'compass',
    gmt: 'custom',
    countdown: 'countdown',
    fixed: 'circular'
  };

  return generateBezel({
    ...defaultBezelConfig,
    type,
    profile,
    scaleAttachment: scaleAttachment[type]
  });
};
