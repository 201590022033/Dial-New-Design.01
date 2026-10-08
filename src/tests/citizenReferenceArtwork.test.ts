import { describe, expect, it } from 'vitest';
import packet from '../../docs/research/slide-rules/citizen-jy8078-verification.json';
import { CITIZEN_PALETTE, CITIZEN_UNIT_ORIGIN_DEG, citizenGraduations, generateCitizenReferenceArtwork, type CitizenArtworkOptions } from '@/domain/scales/citizenReferenceArtwork';
import { logDecadeAngle, wrapDegrees } from '@/domain/scales/calibratedSlideRule';
import { slideRuleReferenceGate } from '@/domain/scales/slideRuleLayers';

const options = (): CitizenArtworkOptions => ({
  outer: { innerRadiusMm: 18, outerRadiusMm: 23, tickRadiusMm: 19, numeralRadiusMm: 21, sourcePixelMm: 0.02, fontSizeMm: 0.7 },
  inner: { innerRadiusMm: 13, outerRadiusMm: 18, tickRadiusMm: 17, numeralRadiusMm: 15, sourcePixelMm: 0.02, fontSizeMm: 0.55 }
});

describe('Citizen reference artwork generator, pre-runtime acceptance', () => {
  it('matches all 450 verified source identities, profiles, classes and printed text', () => {
    const actual = citizenGraduations();
    expect(actual).toHaveLength(450);
    actual.forEach((g, index) => {
      const source = packet.graduations[index]!;
      for (const field of ['id', 'row', 'value', 'printedText', 'tickClass', 'profileId', 'geometry', 'colourRole', 'direction'] as const)
        expect(g[field], `${g.id}: ${field}`).toEqual(source[field]);
      expect(g.angleDeg).toBeCloseTo(wrapDegrees(source.degreeOffsetFromUnit + CITIZEN_UNIT_ORIGIN_DEG), 10);
    });
  });
  it('reconstructs every source profile at its disclosed midpoint, not one uniform minor length', () => {
    const artwork = generateCitizenReferenceArtwork(options());
    for (const tick of artwork.ticks) {
      const g = artwork.graduations.find((entry) => entry.id === tick.id)!;
      const profile = packet.tickProfiles[g.profileId];
      expect(tick.lengthMm).toBeCloseTo((profile.lengthPx[0]! + profile.lengthPx[1]!) / 2 * 0.02);
      expect(tick.widthMm).toBeCloseTo((profile.widthPx[0]! + profile.widthPx[1]!) / 2 * 0.02);
    }
  });
  it('renders outer 60 exactly once as a triangle, retaining the separate shortened inner 60', () => {
    const artwork = generateCitizenReferenceArtwork(options());
    expect(artwork.ticks).toHaveLength(449);
    expect(artwork.ticks.some((t) => t.ringId === 'outer' && t.value === 60)).toBe(false);
    expect(artwork.ticks.find((t) => t.ringId === 'inner' && t.value === 60)?.lengthMm).toBeCloseTo(0.18);
    expect(artwork.pointers).toHaveLength(5);
    for (const source of packet.pointers) {
      const pointer = artwork.pointers.find((p) => p.id === source.id)!;
      expect(pointer.value).toBeCloseTo(source.value, 12);
      expect(pointer.angleDeg).toBeCloseTo(logDecadeAngle(source.value, CITIZEN_UNIT_ORIGIN_DEG), 10);
      expect(pointer.rotationDeg).toBe(source.direction === 'inward' ? 180 : 0);
      expect(pointer.color).toBe(source.shape === 'hollow-triangle' ? 'none' : CITIZEN_PALETTE[source.fillColourRole as keyof typeof CITIZEN_PALETTE]);
    }
  });
  it('centres all 51 numeral runs on their own graduations, with independent box and ink roles', () => {
    const artwork = generateCitizenReferenceArtwork(options());
    for (const row of ['outer', 'inner'] as const) {
      const numbers = artwork.labels.filter((l) => l.ringId === row && l.id.includes('.number.'));
      expect(numbers.map((n) => ({ id: n.id, value: n.value, text: n.text }))).toEqual(packet.numerals[row].map(({ id, value, text }) => ({ id, value, text })));
      for (const number of numbers) expect(number.angleDeg).toBeCloseTo(artwork.graduations.find((g) => g.row === row && g.value === number.value)!.angleDeg, 12);
      const seam = numbers.find((n) => n.value === 10)!;
      expect(seam.backgroundColour).toBe(CITIZEN_PALETTE[row === 'outer' ? 'outer-light-ink' : 'inner-unit-yellow-box']);
      expect(seam.color).toBe(CITIZEN_PALETTE[`${row}-unit-dark-ink`]);
    }
    expect(artwork.labels.filter((l) => l.id.endsWith('.caption')).map((l) => l.text)).toEqual(['KM.', 'NAUT.', 'STAT.']);
  });
  it('keeps photographic palette roles separate and restores Original without mutating defaults', () => {
    for (const source of packet.paletteSamples) expect(CITIZEN_PALETTE[source.role as keyof typeof CITIZEN_PALETTE]).toBe(source.approximateHex);
    const custom = generateCitizenReferenceArtwork({ ...options(), colourMode: 'custom', colourOverrides: { 'outer-light-ink': '#123456' } });
    expect(custom.ticks.find((t) => t.ringId === 'outer')?.color).toBe('#123456');
    expect(custom.ticks.find((t) => t.ringId === 'inner')?.color).toBe(CITIZEN_PALETTE['fixed-black-tick']);
    expect(generateCitizenReferenceArtwork({ ...options(), colourMode: 'original', colourOverrides: { 'outer-light-ink': '#123456' } }).palette).toEqual(CITIZEN_PALETTE);
    expect(Object.isFrozen(CITIZEN_PALETTE)).toBe(true);
  });
  it('rotates only the moving row, never changes values, centres, or fixed calibration', () => {
    const neutral = generateCitizenReferenceArtwork(options());
    const rotated = generateCitizenReferenceArtwork({ ...options(), outerRotationDeg: -37.5 });
    for (let i = 0; i < neutral.graduations.length; i++) {
      const a = neutral.graduations[i]!, b = rotated.graduations[i]!;
      expect(b.id).toBe(a.id);
      expect(b.angleDeg).toBeCloseTo(wrapDegrees(a.angleDeg + (a.row === 'outer' ? -37.5 : 0)), 10);
    }
    expect(rotated.pointers.filter((p) => p.ringId === 'inner')).toEqual(neutral.pointers.filter((p) => p.ringId === 'inner'));
  });
  it('toggles rows and distance features without deleting the source inventory or ordinary 36', () => {
    const artwork = generateCitizenReferenceArtwork({ ...options(), outerVisible: false, distanceVisible: false });
    expect(artwork.graduations).toHaveLength(450);
    expect(artwork.ticks).toHaveLength(225);
    expect(artwork.ticks.some((t) => t.value === 36)).toBe(true);
    expect(artwork.pointers.map((p) => p.value)).toEqual([60]);
    expect(artwork.labels.some((l) => l.text.includes(':') || l.text === 'SPEED INDEX')).toBe(false);
    expect(generateCitizenReferenceArtwork({ ...options(), outerVisible: false, innerVisible: false }).ticks).toEqual([]);
  });
  it('rejects an overfull physical annulus without moving or dropping any valid mathematical marks', () => {
    const neutral = generateCitizenReferenceArtwork(options());
    expect(neutral.validation.valid).toBe(true);
    const crowded = generateCitizenReferenceArtwork({ ...options(), outer: { ...options().outer, outerRadiusMm: 20 } });
    expect(crowded.validation.valid).toBe(false);
    expect(crowded.validation.issues.length).toBeGreaterThan(0);
    expect(crowded.ticks).toEqual(neutral.ticks);
    expect(crowded.labels).toEqual(neutral.labels);
    expect(crowded.pointers).toEqual(neutral.pointers);
  });
  it('checks actual full glyph-run/box bounds, including long captions and tangent corners', () => {
    const measured = generateCitizenReferenceArtwork({ ...options(), measureText: () => ({ width: 50, height: 0.5 }) });
    expect(measured.validation.boundsEvidence).toBe('browser-measured');
    expect(measured.validation.valid).toBe(false);
    expect(measured.validation.issues.some((issue) => issue.includes('.number.10'))).toBe(true);
    expect(measured.validation.issues.some((issue) => issue.includes('.caption'))).toBe(true);
  });
  it('rejects invalid geometry, colour and measurement inputs deterministically', () => {
    expect(() => citizenGraduations(Infinity)).toThrow();
    expect(() => generateCitizenReferenceArtwork({ ...options(), safetyMarginMm: NaN })).toThrow();
    expect(() => generateCitizenReferenceArtwork({ ...options(), inner: { ...options().inner, sourcePixelMm: 0 } })).toThrow();
    expect(() => generateCitizenReferenceArtwork({ ...options(), colourMode: 'custom', colourOverrides: { 'outer-light-ink': 'red' } })).toThrow();
    expect(() => generateCitizenReferenceArtwork({ ...options(), measureText: () => ({ width: NaN, height: 1 }) })).toThrow();
  });
  it('separates accepted Citizen reconstruction from pending Navitimer and factory fidelity', () => {
    expect(slideRuleReferenceGate).toEqual({ citizen: true, navitimer: false });
    expect(generateCitizenReferenceArtwork(options()).evidence).toBe('photographic-reconstruction-not-factory-exact');
  });
});
