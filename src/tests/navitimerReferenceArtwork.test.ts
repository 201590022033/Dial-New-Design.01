import { describe, expect, it } from 'vitest';
import packet from '../../docs/research/slide-rules/navitimer-training-disc-verification.json';
import { NAVITIMER_PALETTE, NAVITIMER_UNIT_ORIGIN_DEG, navitimerGraduations, generateNavitimerReferenceArtwork, type NavitimerArtworkOptions } from '@/domain/scales/navitimerReferenceArtwork';
import { logDecadeAngle, wrapDegrees } from '@/domain/scales/calibratedSlideRule';

const options = (): NavitimerArtworkOptions => ({
  outer: { innerRadiusMm: 18, outerRadiusMm: 23, tickRadiusMm: 19, numeralRadiusMm: 21, sourcePixelMm: 0.02, fontSizeMm: 0.7 },
  inner: { innerRadiusMm: 13, outerRadiusMm: 18, tickRadiusMm: 17, numeralRadiusMm: 15, sourcePixelMm: 0.02, fontSizeMm: 0.55 }
});

describe('Navitimer selected training-disc runtime artwork', () => {
  it('matches every one of420 packet identities, profiles, classes, footprints, colours and directions', () => {
    const actual = navitimerGraduations();
    expect(actual).toHaveLength(420);
    actual.forEach((g, index) => {
      const source = packet.graduations[index]!;
      for (const field of ['id', 'row', 'group', 'value', 'printedText', 'tickClass', 'profileId', 'geometry', 'colourRole', 'direction', 'referencePointerRole', 'underlyingLineVisibility'] as const)
        expect(g[field], `${g.id}:${field}`).toEqual(source[field]);
      expect(g.angleDeg).toBeCloseTo(wrapDegrees(source.degreeOffsetFromUnit + NAVITIMER_UNIT_ORIGIN_DEG), 10);
    });
    expect(actual.filter((g) => g.value === 100)).toEqual([]);
  });
  it('preserves all55 numeral strings with underlying70/80/90 values and source colour roles', () => {
    const artwork = generateNavitimerReferenceArtwork(options());
    for (const row of ['outer', 'inner'] as const) {
      const numbers = artwork.labels.filter((l) => l.ringId === row && l.id.includes('.number.'));
      expect(numbers.map((n) => ({ value: n.value, text: n.text, textColourRole: n.colourRole })))
        .toEqual(packet.numerals[row].map(({ value, text, textColourRole }) => ({ value, text, textColourRole })));
      numbers.forEach((n) => expect(n.angleDeg).toBeCloseTo(logDecadeAngle(n.value!, NAVITIMER_UNIT_ORIGIN_DEG), 10));
    }
    expect(artwork.labels.filter((l) => l.id.endsWith('.caption')).map((l) => l.text)).toEqual(['MPH', 'KM', 'NAUT.', 'STAT.']);
    expect(artwork.labels.some((l) => l.text === '36' || l.text.includes(':'))).toBe(false);
  });
  it('uses the six photographic stroke-profile midpoints rather than Citizen length hierarchy', () => {
    const artwork = generateNavitimerReferenceArtwork(options());
    expect(artwork.ticks).toHaveLength(416);
    for (const tick of artwork.ticks) {
      const graduation = artwork.graduations.find((g) => g.id === tick.id)!;
      const profile = packet.tickProfiles[graduation.profileId];
      expect(tick.lengthMm).toBeCloseTo((profile.lengthPx![0]! + profile.lengthPx![1]!) / 2 * 0.02);
      expect(tick.widthMm).toBeCloseTo((profile.widthPx![0]! + profile.widthPx![1]!) / 2 * 0.02);
    }
  });
  it('clears adjacentMPH/KM complete caption bounds without shifting their mathematical pointers', () => {
    for (const fontSizeMm of [0.55, 1.2]) {
      const settings = options();
      settings.inner.fontSizeMm = fontSizeMm;
      const artwork = generateNavitimerReferenceArtwork(settings);
      const mph = artwork.labels.find((l) => l.text === 'MPH')!, km = artwork.labels.find((l) => l.text === 'KM')!;
      const halfAngle = (l: typeof mph) => Math.atan2(l.boundsMm!.width / 2, l.radiusMm - l.boundsMm!.height / 2) * 180 / Math.PI;
      expect(km.angleDeg - mph.angleDeg).toBeGreaterThan(halfAngle(mph) + halfAngle(km));
      expect(mph.fontSizeMm).toBeCloseTo(fontSizeMm * 0.65);
      expect(artwork.pointers.find((p) => p.id.endsWith('.distance-km'))!.angleDeg).toBeCloseTo(logDecadeAngle(61, NAVITIMER_UNIT_ORIGIN_DEG), 10);
      expect(artwork.pointers.find((p) => p.id.endsWith('.hour-rate'))!.angleDeg).toBeCloseTo(0, 10);
    }
  });
  it('retains nine independently identified reference footprints without duplicating their numerical stations', () => {
    const artwork = generateNavitimerReferenceArtwork(options());
    expect(artwork.pointers).toHaveLength(9);
    for (const source of packet.pointers) {
      const pointer = artwork.pointers.find((p) => p.id === source.id)!;
      expect(pointer.rotationDeg).toBe(source.direction === 'inward' ? 180 : 0);
      expect(pointer.color).toBe(NAVITIMER_PALETTE[source.fillColourRole as keyof typeof NAVITIMER_PALETTE]);
      if (!source.role.startsWith('distance-')) expect(pointer.value).toBe(source.value);
    }
    for (const row of ['outer', 'inner']) for (const value of [10, 60])
      expect(artwork.ticks.some((t) => t.ringId === row && t.value === value)).toBe(false);
    expect(artwork.ticks.filter((t) => t.value === 36)).toHaveLength(2);
    expect(artwork.limitations.some((s) => s.includes('underlays unresolved'))).toBe(true);
  });
  it('derives nominalKM61 as one exact-ratio group and discloses source registration uncertainty', () => {
    const artwork = generateNavitimerReferenceArtwork(options());
    const value = (role: string) => artwork.pointers.find((p) => p.id.endsWith(`.${role}`))!.value;
    expect(value('distance-km')).toBe(61);
    expect(value('distance-km') / value('distance-naut')).toBeCloseTo(1.852, 14);
    expect(value('distance-km') / value('distance-stat')).toBeCloseTo(1.609344, 14);
    expect(artwork.distanceAnchor).toEqual({ nominalKmValue: packet.distanceAnchorFit.nominalKmValue, sourceFittedKmValue: packet.distanceAnchorFit.fittedKmValue, uncertainty: 1 });
    expect(artwork.pointers.find((p) => p.id.endsWith('.hour-rate'))!.angleDeg).toBeCloseTo(0, 10);
  });
  it('preserves separately sampled scan roles and restores Original ignoring custom overrides', () => {
    for (const [role, metadata] of Object.entries(packet.paletteRoles)) {
      if (metadata.sample) expect(NAVITIMER_PALETTE[role as keyof typeof NAVITIMER_PALETTE])
        .toBe(packet.measurements.palette[metadata.sample as keyof typeof packet.measurements.palette].approximateHex);
    }
    const custom = generateNavitimerReferenceArtwork({ ...options(), colourMode: 'custom', colourOverrides: { 'mph-black-caption': '#123456' } });
    expect(custom.labels.find((l) => l.text === 'MPH')!.color).toBe('#123456');
    expect(custom.pointers.find((p) => p.value === 60 && p.ringId === 'inner')!.color).toBe(NAVITIMER_PALETTE['mph-black-pointer']);
    expect(generateNavitimerReferenceArtwork({ ...options(), colourMode: 'original', colourOverrides: { 'black-ink': '#123456' } }).palette).toEqual(NAVITIMER_PALETTE);
    expect(Object.isFrozen(NAVITIMER_PALETTE)).toBe(true);
  });
  it('rotates only outer marks without silently applying the photographed phase', () => {
    const neutral = generateNavitimerReferenceArtwork(options());
    const rotated = generateNavitimerReferenceArtwork({ ...options(), outerRotationDeg: -29 });
    neutral.graduations.forEach((g, i) => expect(rotated.graduations[i]!.angleDeg).toBeCloseTo(wrapDegrees(g.angleDeg + (g.row === 'outer' ? -29 : 0)), 10));
    expect(rotated.pointers.filter((p) => p.ringId === 'inner')).toEqual(neutral.pointers.filter((p) => p.ringId === 'inner'));
    expect(neutral.graduations.find((g) => g.row === 'outer' && g.value === 10)!.angleDeg).toBeCloseTo(NAVITIMER_UNIT_ORIGIN_DEG, 10);
  });
  it('toggles distance references independently without hiding fixed36 or any numerical station', () => {
    const artwork = generateNavitimerReferenceArtwork({ ...options(), distanceVisible: false, outerVisible: false });
    expect(artwork.graduations).toHaveLength(420);
    expect(artwork.ticks).toHaveLength(208);
    expect(artwork.pointers.map((p) => p.value)).toEqual([10, 60, 36]);
    expect(artwork.labels.some((l) => ['KM', 'NAUT.', 'STAT.'].includes(l.text))).toBe(false);
    expect(generateNavitimerReferenceArtwork({ ...options(), outerVisible: false, innerVisible: false }).pointers).toEqual([]);
  });
  it('rejects overfull envelopes without individually moving, clipping or dropping required content', () => {
    const valid = generateNavitimerReferenceArtwork(options());
    expect(valid.validation.valid).toBe(true);
    const invalid = generateNavitimerReferenceArtwork({ ...options(), outer: { ...options().outer, outerRadiusMm: 20 } });
    expect(invalid.validation.valid).toBe(false);
    expect(invalid.ticks).toEqual(valid.ticks);
    expect(invalid.labels).toEqual(valid.labels);
    expect(invalid.pointers).toEqual(valid.pointers);
    const wide = generateNavitimerReferenceArtwork({ ...options(), measureText: () => ({ width: 50, height: 0.5 }) });
    expect(wide.validation.valid).toBe(false);
    expect(wide.validation.boundsEvidence).toBe('browser-measured');
  });
  it('rejects invalid dimensions and colours and never emits excluded writing', () => {
    expect(() => navitimerGraduations(Infinity)).toThrow();
    expect(() => generateNavitimerReferenceArtwork({ ...options(), lineFactor: 0 })).toThrow();
    expect(() => generateNavitimerReferenceArtwork({ ...options(), hoverPaddingMm: -1 })).toThrow();
    expect(() => generateNavitimerReferenceArtwork({ ...options(), inner: { ...options().inner, sourcePixelMm: 0 } })).toThrow();
    expect(() => generateNavitimerReferenceArtwork({ ...options(), colourMode: 'custom', colourOverrides: { 'black-ink': 'red' } })).toThrow();
    expect(() => generateNavitimerReferenceArtwork({ ...options(), measureText: () => ({ width: NaN, height: 1 }) })).toThrow();
    expect(generateNavitimerReferenceArtwork(options()).labels.some((l) => /LBS|KG|GAL|LITRE|FUEL|OIL/i.test(l.text))).toBe(false);
  });
});
