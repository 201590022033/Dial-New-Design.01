import { CanvasTexture, LinearFilter } from 'three';
import { generateTextureGrain, type TextureEngineConfig } from '@/domain/generators/textureEngine';

/** Same normalized physical grain as Engineering; a PBR roughness map, not printed decoration. */
export const createDialFinishTexture = (config: TextureEngineConfig, diameterMm: number): CanvasTexture | null => {
  if (typeof document === 'undefined' || !['sunburst', 'brushed-metal'].includes(config.kind)) return null;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.fillStyle = '#999999';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const ppm = canvas.width / diameterMm;
  const centre = canvas.width / 2;
  context.strokeStyle = '#ffffff';
  for (const line of generateTextureGrain(config, diameterMm / 2)) {
    context.globalAlpha = line.opacity * 2;
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
