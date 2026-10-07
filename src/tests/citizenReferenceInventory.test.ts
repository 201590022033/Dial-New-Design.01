import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import packet from '../../docs/research/slide-rules/citizen-jy8078-verification.json';
import inventory from '../../docs/research/slide-rules/graduation-inventory.json';
import { slideRuleReferenceGate } from '@/domain/scales/slideRuleLayers';

const tick = (row: string, value: number) => {
  const found = packet.graduations.find((g) => g.row === row && g.value === value);
  if (!found) throw new Error(`Missing ${row} graduation ${value}`);
  return found;
};

describe('verified Citizen JY8078-01L research inventory', () => {
  it('keeps evidence separate from application and factory reproduction acceptance', () => {
    expect(packet.verification.readyForMilestone3A).toBe(true);
    expect(packet.verification.factoryExactReproductionCertified).toBe(false);
    expect(packet.runtimeUse).toBe(false);
    expect(slideRuleReferenceGate).toEqual({ citizen: false, navitimer: false });
  });
  it.each(['outer', 'inner'])('records all 225 %s positions with only one physical seam', (row) => {
    const ticks = packet.graduations.filter((g) => g.row === row);
    expect(ticks).toHaveLength(225);
    expect(new Set(ticks.map((g) => g.value)).size).toBe(225);
    expect(ticks.filter((g) => g.value === 10)).toHaveLength(1);
    expect(ticks.some((g) => g.value < 10 || g.value >= 100)).toBe(false);
    for (const g of ticks) expect(g.degreeOffsetFromUnit).toBeCloseTo(360 * Math.log10(g.value / 10), 10);
  });
  it.each(['outer', 'inner'])('retains every independently counted %s interval and transition', (row) => {
    const sectors = packet.sectors.filter((s) => s.row === row);
    expect(sectors.reduce((n, s) => n + s.intervalCount, 0)).toBe(225);
    expect(sectors[0]?.fromValue).toBe(10);
    expect(sectors.at(-1)?.toValue).toBe(100);
    sectors.forEach((s, i) => {
      expect(s.reviewers).toHaveLength(2);
      expect(s.interiorStrokeCount).toBe(s.intervalCount - 1);
      expect((s.toValue - s.fromValue) / s.increment).toBeCloseTo(s.intervalCount, 8);
      if (i) expect(s.fromValue).toBe(sectors[i - 1]?.toValue);
      const ticks = packet.graduations.filter((g) => g.row === row && g.value >= s.fromValue && g.value < s.toValue);
      expect(ticks).toHaveLength(s.intervalCount);
      ticks.forEach((g, j) => expect(g.value).toBeCloseTo(s.fromValue + j * s.increment, 8));
    });
    expect(tick(row, 14.9)).toBeDefined();
    expect(packet.graduations.some((g) => g.row === row && g.value === 15.1)).toBe(false);
    expect(tick(row, 29.8)).toBeDefined();
    expect(packet.graduations.some((g) => g.row === row && g.value === 30.2)).toBe(false);
    expect(tick(row, 59.5)).toBeDefined();
    expect(packet.graduations.some((g) => g.row === row && g.value === 60.5)).toBe(false);
  });
  it('does not silently turn unlabelled strokes or pointers into extra numerals', () => {
    expect(packet.numerals.outer.map((n) => n.value)).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90]);
    expect(packet.numerals.inner.map((n) => n.value)).not.toContain(60);
    for (const g of packet.graduations) expect(g.printedText).toBe(packet.numerals[g.row as 'outer' | 'inner'].find((n) => n.value === g.value)?.text ?? null);
    expect(tick('outer', 32.5).tickClass).toBe('minor');
    expect(tick('outer', 31).tickClass).toBe('intermediate');
    expect(tick('outer', 65).printedText).toBeNull();
    expect(tick('outer', 65).tickClass).toBe('major');
  });
  it('preserves distinct unit boxes, reference pointer roles and radio-overlap strokes', () => {
    expect(packet.numeralStyles.innerUnit10.boxColourRole).toBe('inner-unit-yellow-box');
    expect(packet.numeralStyles.innerUnit10.inkColourRole).toBe('dark-ink');
    expect(tick('outer', 60).geometry).toBe('solid-inward-triangle');
    expect(tick('inner', 50).profileId).toBe('inner-radio-shortened-50');
    expect(tick('inner', 60).profileId).toBe('inner-radio-shortened-60');
    expect(packet.graduations.filter((g) => g.row === 'inner' && g.profileId.startsWith('inner-radio-shortened')).map((g) => g.value)).toEqual([49, 49.5, 50, 59, 59.5, 60, 61]);
    const hour = packet.pointers.find((p) => p.role === 'hour-rate');
    const km = packet.pointers.find((p) => p.role === 'distance-km');
    expect(hour?.shape).toBe('hollow-triangle');
    expect(hour?.direction).toBe('inward');
    expect(km?.fillColourRole).toBe('km-yellow-pointer');
    expect(km?.direction).toBe('outward');
    expect(packet.excludedWatchGraphics).toContain('RX');
    expect(packet.excludedWatchGraphics).toContain('NO');
  });
  it('uses exact distance ratios with a disclosed source-fitted absolute anchor', () => {
    const values = Object.fromEntries(packet.pointers.map((p) => [p.role, p.value]));
    expect(values['distance-km']! / values['distance-naut']!).toBeCloseTo(1.852, 10);
    expect(values['distance-km']! / values['distance-stat']!).toBeCloseTo(1.609344, 10);
    expect(packet.distanceAnchorFit.manufacturerSpecified).toBe(false);
    expect(Math.max(...packet.distanceAnchorFit.angularResidualsDeg.map(Math.abs))).toBeLessThan(0.1);
  });
  it('preserves ordinary 36 while omitting absent rows and excluded conversions', () => {
    expect(packet.features.timeRow.present).toBe(false);
    expect(packet.features.dedicatedSeconds36.present).toBe(false);
    expect(tick('inner', 36).retained).toBe(true);
    expect(tick('outer', 35).printedText).toBe('35');
    expect(packet.exclusions.every((m) => !m.renderAllowed)).toBe(true);
    expect(packet.graduations.every((g) => g.retained)).toBe(true);
    expect(packet.pointers.some((p) => /RX|NO|LBS|GAL|LITER|KG/.test(p.caption))).toBe(false);
  });
  it('does not promote the still-unverified Navitimer sectors', () => {
    expect(inventory.intervals.filter((s) => s.referenceId.startsWith('citizen')).every((s) => s.intervalCount !== null)).toBe(true);
    const nav = inventory.intervals.filter((s) => s.referenceId.startsWith('navitimer'));
    expect(nav).toHaveLength(56);
    expect(nav.every((s) => s.intervalCount === null)).toBe(true);
  });
  it('preserves the native evidence bytes and labels sampled colours as approximations', () => {
    for (const source of packet.sources.filter((s) => s.localFile)) {
      const bytes = readFileSync(`docs/research/slide-rules/${source.localFile}`);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256.toLowerCase());
    }
    for (const sample of packet.paletteSamples) {
      expect(sample.approximateHex).toMatch(/^#[0-9A-F]{6}$/);
      expect(sample.evidence).toBe('photographic-approximation-not-manufacturer-ink');
    }
    expect(packet.typography.fontFile).toBeNull();
    expect(packet.dimensions.printableAnnulusMm).toBeNull();
  });
});
