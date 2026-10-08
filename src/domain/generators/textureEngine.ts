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
  /** Brushed grain direction in the dial plane; radial and matte finishes are symmetric. */
  directionDeg?: number;
}

export interface TextureGrainLine { x1: number; y1: number; x2: number; y2: number; opacity: number; widthMm: number }

/** Presentation grain in physical mm, never a supplier machining/roughness specification. */
export const generateTextureGrain = (config: TextureEngineConfig, radiusMm: number): TextureGrainLine[] => {
  if (!Number.isFinite(radiusMm) || radiusMm <= 0 || !['sunburst', 'brushed-metal'].includes(config.kind)) return [];
  const intensity = Number.isFinite(config.intensity) ? Math.max(0, Math.min(1, config.intensity)) : 0;
  const contrast = Number.isFinite(config.contrast) ? Math.max(0, Math.min(1, config.contrast)) : 0;
  if (!intensity || !contrast) return [];
  const count = config.kind === 'sunburst' ? 360 : 180;
  const angle = (Number.isFinite(config.directionDeg) ? config.directionDeg! : 0) * Math.PI / 180;
  const rotate = (x: number, y: number) => ({ x: x * Math.cos(angle) - y * Math.sin(angle), y: x * Math.sin(angle) + y * Math.cos(angle) });
  return Array.from({ length: count }, (_, index) => {
    const opacity = intensity * contrast * (0.12 + (Math.sin(index * 2.3999632297) + 1) * 0.1);
    if (config.kind === 'sunburst') {
      const theta = index * Math.PI * 2 / count;
      return { x1: 0, y1: 0, x2: Math.cos(theta) * radiusMm, y2: Math.sin(theta) * radiusMm, opacity, widthMm: .015 };
    }
    const y = radiusMm * ((index + .5) * 2 / count - 1);
    const x = Math.sqrt(radiusMm * radiusMm - y * y);
    const start = rotate(-x, y); const end = rotate(x, y);
    return { x1: start.x, y1: start.y, x2: end.x, y2: end.y, opacity, widthMm: .018 };
  });
};

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
