import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import packet from '../../docs/research/slide-rules/navitimer-training-disc-verification.json';
import inventory from '../../docs/research/slide-rules/graduation-inventory.json';
import manifest from '../../docs/research/slide-rules/reference-manifest.json';
import variant from '../../docs/research/slide-rules/navitimer-1967-variant-plan.json';
import { slideRuleReferenceGate } from '@/domain/scales/slideRuleLayers';

const tick = (row: string, value: number) => {
  const found = packet.graduations.find((g) => g.row === row && g.value === value);
  if (!found) throw new Error(`Missing ${row} graduation ${value}`);
  return found;
};
const pointer = (role: string) => {
  const found = packet.pointers.find((p) => p.role === role);
  if (!found) throw new Error(`Missing reference ${role}`);
  return found;
};

describe('verified selected Navitimer training-disc research inventory', () => {
  it('identifies the exact selected layout without enabling either runtime preset', () => {
    expect(packet.referenceId).toBe('navitimer-booklet-training-disc-2026-10-07');
    expect(packet.model).toBeNull();
    expect(packet.verification.readyForReconstruction).toBe(true);
    expect(packet.verification.factoryExactReproductionCertified).toBe(false);
    expect(packet.verification.runtimeAcceptancePassed).toBe(false);
    expect(packet.runtimeUse).toBe(false);
    expect(manifest.referenceInventoryReady).toBe(true);
    expect(manifest.gatePassed).toBe(false);
    expect(slideRuleReferenceGate).toEqual({ citizen: false, navitimer: false });
  });
  it.each(['outer', 'inner'])('records exactly 210 %s positions, not the Citizen schedule', (row) => {
    const ticks = packet.graduations.filter((g) => g.row === row);
    expect(ticks).toHaveLength(210);
    expect(new Set(ticks.map((g) => g.value)).size).toBe(210);
    expect(ticks.filter((g) => g.value === 10)).toHaveLength(1);
    expect(ticks.some((g) => g.value < 10 || g.value >= 100)).toBe(false);
    for (const g of ticks) expect(g.degreeOffsetFromUnit).toBeCloseTo(360 * Math.log10(g.value / 10), 10);
  });
  it.each(['outer', 'inner'])('preserves complete independently counted %s sector coverage', (row) => {
    const sectors = packet.sectors.filter((s) => s.row === row);
    expect(sectors).toHaveLength(row === 'outer' ? 30 : 26);
    expect(sectors[0]?.fromValue).toBe(10);
    expect(sectors.at(-1)?.toValue).toBe(100);
    expect(sectors.reduce((sum, s) => sum + s.intervalCount, 0)).toBe(210);
    expect(sectors.filter((s) => s.endpoint100IsShared10Seam)).toHaveLength(1);
    sectors.forEach((s, i) => {
      expect(s.countConfidence).toBe('visually-counted-source-schedule');
      expect(s.reviewers).toHaveLength(2);
      expect(s.sourceId).toBe('nav-training-native');
      expect(s.interiorStrokeCount).toBe(s.intervalCount - 1);
      expect((s.toValue - s.fromValue) / s.increment).toBeCloseTo(s.intervalCount, 8);
      if (i) expect(s.fromValue).toBe(sectors[i - 1]?.toValue);
      const ticks = packet.graduations.filter((g) => g.row === row && g.value >= s.fromValue && g.value < s.toValue);
      expect(ticks).toHaveLength(s.intervalCount);
      expect(s.classPattern).toEqual(ticks.map((g) => g.tickClass));
      ticks.forEach((g, j) => expect(g.value).toBeCloseTo(s.fromValue + j * s.increment, 8));
      const accepted = inventory.intervals.find((item) => item.id === s.id);
      expect(accepted?.intervalCount).toBe(s.intervalCount);
      expect(accepted?.increment).toBe(s.increment);
    });
  });
  it.each(['outer', 'inner'])('retains %s changes at 15, 25 and 60 including tiny 50-60 half-unit stubs', (row) => {
    expect(tick(row, 14.9)).toBeDefined();
    expect(packet.graduations.some((g) => g.row === row && g.value === 15.1)).toBe(false);
    expect(tick(row, 24.8)).toBeDefined();
    expect(packet.graduations.some((g) => g.row === row && g.value === 25.2)).toBe(false);
    for (const value of [25.5, 50.5, 51.5, 52.5, 53.5, 54.5, 55.5, 56.5, 57.5, 58.5, 59.5]) {
      expect(tick(row, value).tickClass).toBe('minor');
    }
    expect(packet.graduations.some((g) => g.row === row && g.value === 60.5)).toBe(false);
    expect(tick(row, 61)).toBeDefined();
  });
  it('preserves literal numeral schedules without inventing inner 60 or 65 captions', () => {
    expect(packet.numerals.outer).toHaveLength(30);
    expect(packet.numerals.inner).toHaveLength(25);
    for (const value of [70, 80, 90]) expect(tick('inner', value).printedText).toBe(String(value / 10));
    expect(tick('inner', 60).printedText).toBeNull();
    for (const value of [65, 75, 85, 95]) {
      expect(tick('inner', value).printedText).toBeNull();
      expect(tick('inner', value).tickClass).toBe('major');
      expect(tick('outer', value).printedText).toBe(String(value));
      expect(tick('outer', value).tickClass).toBe('major');
    }
    for (const g of packet.graduations) {
      expect(g.printedText).toBe(packet.numerals[g.row as 'outer' | 'inner'].find((n) => n.value === g.value)?.text ?? null);
    }
  });
  it('keeps classes and directions independent from numeral visibility and Citizen half-unit tiers', () => {
    for (const row of ['outer', 'inner']) {
      expect(tick(row, 10.5).tickClass).toBe('minor');
      expect(tick(row, 26).tickClass).toBe('intermediate');
      expect(tick(row, 30).tickClass).toBe('major');
      expect(tick(row, 61).tickClass).toBe('minor');
      expect(tick(row, 26).direction).toBe(row === 'outer' ? 'outward' : 'inward');
    }
    expect(packet.typography.halfUnitTierQualification).toContain('aliasing uncertainty');
  });
  it('distinguishes black solid MPH, red unit/rate and red distance pointer roles', () => {
    expect(pointer('hour-rate')).toMatchObject({ value: 60, caption: 'MPH', shape: 'solid-triangle', direction: 'outward', fillColourRole: 'mph-black-pointer', textColourRole: 'mph-black-caption' });
    expect(pointer('inner-unit')).toMatchObject({ value: 10, caption: '10', shape: 'solid-triangle', direction: 'outward', fillColourRole: 'inner-unit-red', captionOwnedByNumeral: true });
    expect(packet.numeralStyles.innerUnit10.boxColourRole).toBeNull();
    expect(pointer('outer-rate')).toMatchObject({ value: 60, caption: null, direction: 'inward', fillColourRole: 'outer-rate-red' });
    for (const role of ['distance-km', 'distance-naut', 'distance-stat']) {
      const p = pointer(role);
      expect(p.shape).toBe('solid-triangle');
      expect(p.direction).toBe('outward');
      expect(p.fillColourRole).toContain('red-pointer');
      expect(p.textColourRole).toContain('black-caption');
    }
  });
  it('retains composite outer unit/rate footprints without claiming hidden stroke geometry', () => {
    for (const value of [10, 60]) {
      expect(tick('outer', value).geometry).toBe('composite-reference-footprint');
      expect(tick('outer', value).underlyingLineVisibility).toContain('Unresolved');
    }
    expect(tick('inner', 10).profileId).toBe('inner-unit-footprint');
    expect(tick('inner', 60).profileId).toBe('inner-rate-footprint');
  });
  it('corrects the false seconds36 caption without removing ordinary 35 or 36', () => {
    expect(pointer('seconds')).toMatchObject({ value: 36, caption: null, direction: 'outward', fillColourRole: 'seconds-red-pointer' });
    const mark = inventory.marks.find((m) => m.referenceId === packet.referenceId && m.semanticRole === 'seconds');
    expect(mark?.printedText).toBeNull();
    for (const row of ['outer', 'inner']) {
      expect(tick(row, 35).printedText).toBe('35');
      expect(tick(row, 36).retained).toBe(true);
    }
  });
  it('keeps the observed outer reference separate from the fixed seconds reference', () => {
    expect(packet.pointers).toHaveLength(9);
    expect(pointer('outer-unlabelled-reference')).toMatchObject({ value: 36, caption: null, group: 'rotating', direction: 'inward' });
    expect(pointer('seconds').group).toBe('fixed');
    expect(packet.features.outerUnlabelledReference36.operationConfirmed).toBe(false);
    expect(inventory.marks.filter((m) => m.referenceId === packet.referenceId && m.kind === 'reference')).toHaveLength(9);
  });
  it('uses exact conversion ratios but discloses model sensitivity and failed withheld validation', () => {
    const km = pointer('distance-km').value;
    expect(km / pointer('distance-naut').value).toBeCloseTo(1.852, 10);
    expect(km / pointer('distance-stat').value).toBeCloseTo(1.609344, 10);
    expect(packet.distanceAnchorFit.manufacturerSpecified).toBe(false);
    expect(packet.distanceAnchorFit.recommendedNominalReconstructionKmValue).toBe(61);
    expect(packet.distanceAnchorFit.conservativeValueUncertainty).toBe(1);
    expect(packet.distanceAnchorFit.modelDifference).toBeCloseTo(Math.abs(packet.distanceAnchorFit.fittedKmValue - packet.distanceAnchorFit.independentModelKmValue), 10);
    expect(packet.distanceAnchorFit.withheldValidationFailureDisclosed).toBe(true);
    expect(Math.abs(packet.measurements.independentFixedAnchorSensitivityCheck.extraValidationPointNotFitted.angularResidualDeg)).toBeGreaterThan(2);
    expect(packet.measurements.independentFixedAnchorSensitivityCheck.notFactoryCalibration).toBe(true);
  });
  it('keeps photographed phase separate from mathematical origin and future runtime alignment', () => {
    expect(packet.calibration.unitOriginClockwiseDeg + pointer('hour-rate').degreeOffsetFromUnit).toBeCloseTo(360, 10);
    expect(packet.calibration.outerRelativeRotationPhotoDerivedDeg).toBeCloseTo(330.94514657901453, 8);
    expect(packet.calibration.outerRelativeRotationUncertaintyDeg).toBe(3);
    expect(packet.calibration.policy).toContain('not silently defaulted');
  });
  it('preserves native evidence bytes and labels sampled RGB as scan data, not factory ink', () => {
    for (const source of packet.sources.filter((s) => s.localFile)) {
      const bytes = readFileSync(`docs/research/slide-rules/${source.localFile}`);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256?.toLowerCase());
      expect(bytes.length).toBe(53146);
      expect(source.imagePixels).toEqual([600, 525]);
      expect(source.freshDownloadClaim).toBe(false);
    }
    expect(Object.keys(packet.measurements.palette)).toHaveLength(14);
    for (const sample of Object.values(packet.measurements.palette)) {
      expect(sample.approximateHex).toMatch(/^#[0-9A-F]{6}$/);
      expect(sample.pixelCount).toBeGreaterThan(0);
    }
    expect(packet.paletteRoles['common-divider-blue-grey'].approximateHex).toBeNull();
    expect(packet.typography.fontFile).toBeNull();
    expect(packet.typography.exactBaselineGap).toBeNull();
    expect(packet.typography.factoryInkSpecifications).toBeNull();
    expect(packet.dimensions.printableAnnulusMm).toBeNull();
  });
  it('keeps source-specific inverted typography and physical tick uncertainty explicit', () => {
    for (const n of [...packet.numerals.outer, ...packet.numerals.inner]) {
      expect(n.textAlign).toBe('center');
      expect(n.angularOffsetDeg).toBe(0);
      expect(n.tangentOrientation).toBe('bottom-inverted-no-auto-flip');
    }
    for (const profile of Object.values(packet.tickProfiles)) {
      if ('physicalLengthMm' in profile) {
        expect(profile.physicalLengthMm).toBeNull();
        expect(profile.physicalWidthMm).toBeNull();
        expect(profile.lengthUncertaintyPx).toBe(2);
        expect(profile.widthUncertaintyPx).toBe(1);
      }
    }
  });
  it('does not borrow the separate 1967 time row or reintroduce excluded conversions', () => {
    expect(packet.features.timeRow.present).toBe(false);
    expect(variant.selectedTrainingDiscReplaced).toBe(false);
    expect(variant.gatePassed).toBe(false);
    expect(variant.timeRow.present).toBe(true);
    expect(variant.timeRow.completeGraduationInventory).toBe(false);
    expect(packet.exclusions.every((e) => !e.renderAllowed)).toBe(true);
    expect(packet.graduations.every((g) => g.retained)).toBe(true);
    expect(packet.pointers.some((p) => /LBS|GAL|LITER|KG/.test(p.caption ?? ''))).toBe(false);
  });
});
