import { CanvasTexture, LinearFilter } from 'three';
import { generateTextureGrain, type TextureEngineConfig } from '@/domain/generators/textureEngine';

/** Bounded illustrative shader relief in scene units, not measured physical surface roughness. */
export const dialFinishBumpScale = (config: TextureEngineConfig): number =>
  ['sunburst', 'brushed-metal'].includes(config.kind) && Number.isFinite(config.intensity) && Number.isFinite(config.contrast)
    ? .045 * Math.max(0, Math.min(1, config.intensity)) * Math.max(0, Math.min(1, config.contrast)) : 0;

/** Same physical grain as Engineering; PBR roughness/micro-bump, not printed decoration. */
export const createDialFinishTexture = (config: TextureEngineConfig, diameterMm: number): CanvasTexture | null => {
  if (typeof document === 'undefined' || !['sunburst', 'brushed-metal'].includes(config.kind)) return null;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const context = canvas.getContext('2d');
  if (!context) return null;
  if (!Number.isFinite(diameterMm) || diameterMm <= 0 || !dialFinishBumpScale(config)) return null;
  context.fillStyle = '#808080';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const ppm = canvas.width / diameterMm;
  const centre = canvas.width / 2;
  for (const [index, line] of generateTextureGrain(config, diameterMm / 2).entries()) {
    context.strokeStyle = index % 2 ? '#ffffff' : '#000000';
    context.globalAlpha = Math.min(1, line.opacity * 5);
    context.lineWidth = Math.max(1, line.widthMm * ppm);
    context.beginPath();
    context.moveTo(centre + line.x1 * ppm, centre + line.y1 * ppm);
    context.lineTo(centre + line.x2 * ppm, centre + line.y2 * ppm);
    context.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
};
