import type { EngineBorder, EngineCentreHole, EngineLayer, EngineResultBase } from '@/domain/generators/types';
import { applyTexture, type TextureEngineConfig } from '@/domain/generators/textureEngine';

export type DialFaceStyle =
  | 'plain'
  | 'two-tone'
  | 'sector'
  | 'sandwich'
  | 'skeleton'
  | 'open-heart';

export type DialFaceFinish = 'sunburst' | 'matte' | 'textured';

export interface DialFaceConfig {
  style: DialFaceStyle;
  finish: DialFaceFinish;
  color: string;
  secondaryColor: string;
  texture: TextureEngineConfig;
  border: EngineBorder;
  centreHole: EngineCentreHole;
  opacity: number;
  layerOrder: number;
}

export interface DialFaceResult extends EngineResultBase {
  style: DialFaceStyle;
  finish: DialFaceFinish;
  background: EngineLayer;
  centreHole: EngineCentreHole;
}

export const defaultDialFaceConfig: DialFaceConfig = {
  style: 'plain',
  finish: 'matte',
  color: '#1E293B',
  secondaryColor: '#0F172A',
  texture: {
    kind: 'matte',
    intensity: 0.35,
    contrast: 0.65
  },
  border: {
    enabled: true,
    color: '#E2E8F0',
    widthMm: 0.16,
    insetMm: 0
  },
  centreHole: {
    diameterMm: 1.5,
    chamferMm: 0
  },
  opacity: 1,
  layerOrder: 10
};

const createBackgroundLayer = (config: DialFaceConfig): EngineLayer => {
  const base = {
    fill: config.color,
    stroke: config.border.enabled ? config.border.color : config.color,
    strokeWidthMm: config.border.enabled ? config.border.widthMm : 0,
    opacity: config.opacity
  };

  const textured = applyTexture(base, config.texture);

  return {
    id: 'dial-face-background',
    name: 'Dial Face Background',
    order: config.layerOrder,
    visible: true,
    style: textured,
    metadata: {
      style: config.style,
      finish: config.finish,
      texture: config.texture.kind
    }
  };
};

const createSecondaryLayer = (config: DialFaceConfig): EngineLayer | null => {
  if (config.style !== 'two-tone' && config.style !== 'sector') {
    return null;
  }

  return {
    id: 'dial-face-secondary',
    name: config.style === 'sector' ? 'Sector Overlay' : 'Two-Tone Overlay',
    order: config.layerOrder + 1,
    visible: true,
    style: {
      fill: config.secondaryColor,
      stroke: config.border.color,
      strokeWidthMm: Math.max(0.08, config.border.widthMm * 0.5),
      opacity: Math.max(0.3, config.opacity * 0.85)
    },
    metadata: {
      role: 'secondary-surface'
    }
  };
};

export const generateDialFace = (config: DialFaceConfig): DialFaceResult => {
  const warnings: string[] = [];
  if (config.centreHole.diameterMm <= 0) {
    warnings.push('Centre hole must be greater than zero.');
  }

  const background = createBackgroundLayer(config);
  const secondary = createSecondaryLayer(config);
  const layers = secondary ? [background, secondary] : [background];

  return {
    id: 'dial-face-engine',
    style: config.style,
    finish: config.finish,
    background,
    centreHole: config.centreHole,
    warnings,
    layers,
    futureEffects: ['frosted', 'degrade', 'electroplated', 'ceramic-ink']
  };
};
