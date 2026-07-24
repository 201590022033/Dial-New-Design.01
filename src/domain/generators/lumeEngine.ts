export type LumeMode = 'no-lume' | 'filled' | 'outline' | 'applied';

export interface LumeEngineConfig {
  mode: LumeMode;
  color: string;
  intensity: number;
}

export interface LumeResult {
  mode: LumeMode;
  color: string;
  intensity: number;
  previewOpacity: number;
  metadata: Record<string, string | number | boolean>;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export const defaultLumeConfig: LumeEngineConfig = {
  mode: 'no-lume',
  color: '#C7F9CC',
  intensity: 0.35
};

export const generateLume = (config: LumeEngineConfig): LumeResult => {
  const intensity = clamp01(config.intensity);
  const previewOpacity = config.mode === 'no-lume' ? 0 : Math.max(0.2, intensity);

  return {
    mode: config.mode,
    color: config.color,
    intensity,
    previewOpacity,
    metadata: {
      superLumiNovaPlaceholder: true,
      chargingCurvePlaceholder: true
    }
  };
};
