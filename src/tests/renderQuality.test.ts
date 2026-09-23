import { describe, expect, it } from 'vitest';
import { CAMERA_PRESETS, resolveCameraDistance } from '@/visual3d/renderQuality';

describe('render camera startup framing', () => {
  it('preserves valid project framing', () => {
    expect(resolveCameraDistance(12.4, 'studio')).toBe(12.4);
  });

  it('replaces stale, extreme, or invalid distances with the selected preset', () => {
    expect(resolveCameraDistance(50, 'studio')).toBe(CAMERA_PRESETS.studio.distance);
    expect(resolveCameraDistance(2, 'detail')).toBe(CAMERA_PRESETS.detail.distance);
    expect(resolveCameraDistance(Number.NaN, 'face')).toBe(CAMERA_PRESETS.face.distance);
    expect(resolveCameraDistance(undefined, 'studio')).toBe(CAMERA_PRESETS.studio.distance);
  });
});
