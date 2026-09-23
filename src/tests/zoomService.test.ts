import { describe, expect, it } from 'vitest';
import { isBrowserZoomGesture, nextZoomValue } from '@/renderer/services/zoomService';

describe('zoom service', () => {
  it('keeps browser zoom gestures out of the engineering canvas controls', () => {
    expect(isBrowserZoomGesture({ ctrlKey: true, metaKey: false })).toBe(true);
    expect(isBrowserZoomGesture({ ctrlKey: false, metaKey: true })).toBe(true);
    expect(isBrowserZoomGesture({ ctrlKey: false, metaKey: false })).toBe(false);
  });

  it('retains bounded watch-canvas zoom for an ordinary wheel gesture', () => {
    expect(nextZoomValue(1, -120)).toBeGreaterThan(1);
    expect(nextZoomValue(8, -120)).toBe(8);
    expect(nextZoomValue(0.25, 120)).toBe(0.25);
  });
});
