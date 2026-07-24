import type { EngineLayerStyle } from '@/domain/generators/types';

export type TextureKind =
  | 'matte'
  | 'sunburst'
  | 'brushed-metal'
  | 'carbon-fibre'
  | 'clous-de-paris'
  | 'basketweave'
  | 'barleycorn'
  | 'rose-engine'
  | 'wave'
  | 'flame'
  | 'concentric'
  | 'engine-turning';

export interface TexturePlugin {
  kind: TextureKind;
  displayName: string;
  implemented: boolean;
  description: string;
  apply: (base: EngineLayerStyle, intensity: number) => EngineLayerStyle;
}

export interface TextureEngineConfig {
  kind: TextureKind;
  intensity: number;
  contrast: number;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const applyOpacity = (base: EngineLayerStyle, nextOpacity: number): EngineLayerStyle => ({
  ...base,
  opacity: clamp01(nextOpacity)
});

const plugins: TexturePlugin[] = [
  {
    kind: 'matte',
    displayName: 'Matte',
    implemented: true,
    description: 'Flat low-reflective finish for technical and military dials.',
    apply: (base, intensity) => applyOpacity(base, base.opacity * (1 - intensity * 0.08))
  },
  {
    kind: 'sunburst',
    displayName: 'Sunburst',
    implemented: true,
    description: 'Radial reflective finish with subtle highlight emphasis.',
    apply: (base, intensity) => ({
      ...base,
      strokeWidthMm: base.strokeWidthMm + intensity * 0.06,
      opacity: clamp01(base.opacity + intensity * 0.04)
    })
  },
  {
    kind: 'brushed-metal',
    displayName: 'Brushed Metal',
    implemented: true,
    description: 'Directional brushed grain for metallic surfaces.',
    apply: (base, intensity) => ({
      ...base,
      strokeWidthMm: base.strokeWidthMm + intensity * 0.08,
      opacity: clamp01(base.opacity - intensity * 0.03)
    })
  },
  {
    kind: 'carbon-fibre',
    displayName: 'Carbon Fibre',
    implemented: true,
    description: 'Woven visual character suitable for sporty dials and bezels.',
    apply: (base, intensity) => ({
      ...base,
      opacity: clamp01(base.opacity - intensity * 0.06),
      strokeWidthMm: base.strokeWidthMm + intensity * 0.04
    })
  },
  {
    kind: 'clous-de-paris',
    displayName: 'Clous de Paris',
    implemented: false,
    description: 'Guilloche hobnail texture placeholder.',
    apply: (base) => base
  },
  {
    kind: 'basketweave',
    displayName: 'Basketweave',
    implemented: false,
    description: 'Basketweave texture placeholder.',
    apply: (base) => base
  },
  {
    kind: 'barleycorn',
    displayName: 'Barleycorn',
    implemented: false,
    description: 'Barleycorn guilloche placeholder.',
    apply: (base) => base
  },
  {
    kind: 'rose-engine',
    displayName: 'Rose Engine',
    implemented: false,
    description: 'Rose engine turning placeholder.',
    apply: (base) => base
  },
  {
    kind: 'wave',
    displayName: 'Wave',
    implemented: false,
    description: 'Wave pattern placeholder.',
    apply: (base) => base
  },
  {
    kind: 'flame',
    displayName: 'Flame',
    implemented: false,
    description: 'Flame motif placeholder.',
    apply: (base) => base
  },
  {
    kind: 'concentric',
    displayName: 'Concentric',
    implemented: false,
    description: 'Concentric ring texture placeholder.',
    apply: (base) => base
  },
  {
    kind: 'engine-turning',
    displayName: 'Engine Turning',
    implemented: false,
    description: 'Generic engine turning texture placeholder.',
    apply: (base) => base
  }
];

const pluginByKind = new Map<TextureKind, TexturePlugin>(plugins.map((plugin) => [plugin.kind, plugin]));

export const listTexturePlugins = (): TexturePlugin[] => plugins;

export const resolveTexturePlugin = (kind: TextureKind): TexturePlugin | null => {
  return pluginByKind.get(kind) ?? null;
};

export const applyTexture = (base: EngineLayerStyle, config: TextureEngineConfig): EngineLayerStyle => {
  const plugin = resolveTexturePlugin(config.kind);
  if (!plugin) {
    return base;
  }

  const intensity = clamp01(config.intensity);
  return plugin.apply(base, intensity * Math.max(0, config.contrast));
};
