import type { ScaleKind } from '@/domain/scales/types';

export type BezelType =
  | 'outer-bezel'
  | 'inner-bezel'
  | 'dive-bezel'
  | 'slide-rule'
  | 'compass'
  | 'gmt'
  | 'countdown';

export type BezelProfile = 'coin-edge' | 'knurling' | 'scalloped' | 'smooth';

export interface BezelPlan {
  type: BezelType;
  profile: BezelProfile;
  scaleAttachment: ScaleKind | null;
  independentlyConfigurable: true;
}

export const createBezelPlan = (type: BezelType, profile: BezelProfile = 'smooth'): BezelPlan => {
  const scaleAttachment: Record<BezelType, ScaleKind | null> = {
    'outer-bezel': null,
    'inner-bezel': null,
    'dive-bezel': 'countdown',
    'slide-rule': 'slide-rule',
    compass: 'compass',
    gmt: 'custom',
    countdown: 'countdown'
  };

  return {
    type,
    profile,
    scaleAttachment: scaleAttachment[type],
    independentlyConfigurable: true
  };
};
