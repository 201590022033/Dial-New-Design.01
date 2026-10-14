import { DataTexture, RepeatWrapping, RGBAFormat } from 'three';

/** Small neutral, deterministic tile. No colour is baked into the grain. */
export function createLeatherGrainTexture(): DataTexture {
  const size = 128;
  const pixels = new Uint8Array(size * size * 4);
  let seed = 0x5eeda11;
  for (let i = 0; i < size * size; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const value = 206 + ((seed >>> 24) % 50);
    pixels.set([value, value, value, 255], i * 4);
  }
  const texture = new DataTexture(pixels, size, size, RGBAFormat);
  texture.name = 'DD_NEUTRAL_LEATHER_GRAIN';
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}
