import { describe, expect, it } from 'vitest';
import { caseDiameterFromPointer, emptyCaseDiameterSnap, snapCaseDiameter } from '@/components/layout/caseDiameterSnap';

describe('pointer to range mapping', () => {
  it('maps thumb-centre travel to exact endpoints and clamps release-outside positions', () => {
    expect(caseDiameterFromPointer(108, 100, 416)).toBe(20);
    expect(caseDiameterFromPointer(508, 100, 416)).toBe(60);
    expect(caseDiameterFromPointer(328, 100, 416)).toBe(42);
    expect(caseDiameterFromPointer(-50, 100, 416)).toBe(20);
    expect(caseDiameterFromPointer(900, 100, 416)).toBe(60);
  });
  it('preserves tenths at different slider widths and remains finite on a collapsed track', () => {
    expect(caseDiameterFromPointer(346, 100, 416)).toBe(43.8);
    expect(caseDiameterFromPointer(227, 100, 216)).toBe(43.8);
    expect(Number.isFinite(caseDiameterFromPointer(100, 100, 0))).toBe(true);
  });
});

describe('pointer catalogue-size detents', () => {
  it('captures exact decimal catalogue sizes for half a second, then lets movement continue', () => {
    const first = snapCaseDiameter(46.3, [42, 46.5, 47], 100, emptyCaseDiameterSnap());
    expect(first.value).toBe(46.5);
    expect(snapCaseDiameter(46.8, [42, 46.5, 47], 599, first.state).value).toBe(46.5);
    const expired = snapCaseDiameter(46.8, [42, 46.5, 47], 600, first.state);
    expect(expired.value).toBe(46.8);
    expect(snapCaseDiameter(46.6, [46.5], 610, expired.state).value).toBe(46.6);
  });
  it('allows a deliberate larger movement to escape immediately in either direction', () => {
    const first = snapCaseDiameter(42.1, [42], 0, emptyCaseDiameterSnap());
    expect(snapCaseDiameter(43, [42], 1, first.state).value).toBe(43);
    expect(snapCaseDiameter(41, [42], 1, first.state).value).toBe(41);
  });
  it('rearms after leaving a size and returning, without snapping to unavailable references', () => {
    const first = snapCaseDiameter(42, [42], 0, emptyCaseDiameterSnap());
    const expired = snapCaseDiameter(42.1, [42], 500, first.state);
    const away = snapCaseDiameter(43, [42], 501, expired.state);
    expect(snapCaseDiameter(42.2, [42], 600, away.state).value).toBe(42);
    expect(snapCaseDiameter(36.1, [34, 38, 42], 0, emptyCaseDiameterSnap()).value).toBe(36.1);
  });
  it('releases removed catalogue records and ignores invalid, out-of-range or overprecise sizes', () => {
    const first = snapCaseDiameter(42, [42], 0, emptyCaseDiameterSnap());
    expect(snapCaseDiameter(42.1, [], 1, first.state).value).toBe(42.1);
    expect(snapCaseDiameter(40.1, [NaN, 10, 80, 40.123], 0, emptyCaseDiameterSnap()).value).toBe(40.1);
  });
  it('chooses the nearest available size, with a stable lower-size tie break', () => {
    expect(snapCaseDiameter(40.2, [40, 40.2], 0, emptyCaseDiameterSnap()).value).toBe(40.2);
    expect(snapCaseDiameter(41, [41.2, 40.8], 0, emptyCaseDiameterSnap()).value).toBe(40.8);
  });
});
