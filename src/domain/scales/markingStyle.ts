import type { ScalePluginConfig, ScaleTick } from './types';

export const scaleTickLengthFactor = (config: ScalePluginConfig): number =>
  Math.max(0.5, Math.min(1.6, config.scaleTickLengthFactor ?? 1));

export const styleScaleTicks = (ticks: ScaleTick[], config: ScalePluginConfig): ScaleTick[] => {
  const factor = scaleTickLengthFactor(config);
  return factor === 1 ? ticks : ticks.map((tick) => ({ ...tick, lengthMm: tick.lengthMm * factor }));
};

export const scaleFontFamilies = [
  { label: 'Technical mono', value: '"IBM Plex Mono", monospace' },
  { label: 'Clean sans', value: 'Arial, sans-serif' },
  { label: 'Narrow instrument', value: '"Arial Narrow", Arial, sans-serif' },
  { label: 'Classic serif', value: 'Georgia, serif' },
  { label: 'Slab serif', value: '"Roboto Slab", Georgia, serif' }
] as const;
