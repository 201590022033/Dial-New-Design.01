import { describe, expect, it } from 'vitest';
import {
  CONTROLLED_NMK901_FIXTURE,
  CONTROLLED_NMK901_SELECTION,
  CONTROLLED_ORDER_ID,
  evaluateControlledFit,
  generateControlledBom,
  serializeControlledBom
} from '@/domain/ordering/controlledNmk901Order';

describe('controlled NMK901 ordering fixture', () => {
  it('loads the canonical fixture and preserves its identity', () => {
    expect(CONTROLLED_NMK901_FIXTURE.id).toBe(CONTROLLED_ORDER_ID);
    expect(CONTROLLED_NMK901_FIXTURE.caseSet).toBe('NMK901');
    expect(CONTROLLED_NMK901_FIXTURE.fields.caseOd.value).toBe(42);
    expect(CONTROLLED_NMK901_FIXTURE.fields.caseThickness.value).toBe(10.2);
    expect(CONTROLLED_NMK901_FIXTURE.fields.lugToLug.value).toBe(46);
    expect(CONTROLLED_NMK901_FIXTURE.fields.dialChapterRadialOverlap.value).toBe(0.5);
    expect(CONTROLLED_NMK901_FIXTURE.fields.crownHeadDiameter.value).toBe(7);
  });

  it('preserves provenance statuses through serialization', () => {
    const roundTrip = JSON.parse(JSON.stringify(CONTROLLED_NMK901_FIXTURE)) as typeof CONTROLLED_NMK901_FIXTURE;
    expect(roundTrip.fields.caseOd.status).toBe('PUBLISHED');
    expect(roundTrip.fields.movementOdWithSpacer.status).toBe('DERIVED');
    expect(roundTrip.fields.minimumHandCrystalClearance.status).toBe('DESIGN_TARGET');
    expect(roundTrip.fields.dialSeatZ.status).toBe('ESTIMATED_NOMINAL');
    expect(roundTrip.fields.springHoleDiameter.status).toBe('ESTIMATED_NOMINAL');
    expect(roundTrip.fields.springHoleDiameter.uncertaintyMm).toBe(0.1);
    expect(roundTrip.fields.casebackThread.status).toBe('COMPATIBILITY_ONLY');
  });

  it('accepts the controlled NH35 Type-M movement', () => {
    const result = evaluateControlledFit();
    expect(result.checks.find((check) => check.id === 'movement')?.status).toBe('pass');
  });

  it('rejects an incompatible movement', () => {
    const result = evaluateControlledFit({ ...CONTROLLED_NMK901_SELECTION, movement: 'ETA_2824' });
    expect(result.orderable).toBe(false);
    expect(result.status).toBe('incompatible');
  });

  it('accepts a 28.5 mm dial and rejects a different diameter', () => {
    expect(evaluateControlledFit().checks.find((check) => check.id === 'dial')?.status).toBe('pass');
    expect(evaluateControlledFit({ ...CONTROLLED_NMK901_SELECTION, dialDiameterMm: 31 }).orderable).toBe(false);
  });

  it('accepts CT252 geometry and rejects an incorrect chapter ring', () => {
    expect(evaluateControlledFit().checks.filter((check) => ['chapter-outer', 'chapter-inner', 'chapter-height'].includes(check.id)).every((check) => check.status === 'pass')).toBe(true);
    expect(evaluateControlledFit({
      ...CONTROLLED_NMK901_SELECTION,
      chapterRing: { ...CONTROLLED_NMK901_SELECTION.chapterRing, innerDiameterMm: 28 }
    }).orderable).toBe(false);
  });

  it('accepts the 22 mm strap and rejects a wrong lug width', () => {
    expect(evaluateControlledFit().checks.find((check) => check.id === 'strap-interface')?.status).toBe('pass');
    expect(evaluateControlledFit({ ...CONTROLLED_NMK901_SELECTION, strapWidthMm: 20 }).orderable).toBe(false);
  });

  it('accepts the spring-bar envelope with an estimated nominal warning', () => {
    expect(evaluateControlledFit().checks.filter((check) => check.id.startsWith('spring-bar-')).every((check) => check.status === 'pass')).toBe(true);
    expect(CONTROLLED_NMK901_FIXTURE.fields.springHoleDiameter.value).toBe(2);
    expect(CONTROLLED_NMK901_FIXTURE.fields.springHoleXy.value).toEqual({ fromLugTipMm: 2.8, fromLowerLugEdgeMm: 1.2 });
    expect(evaluateControlledFit().checks.find((check) => check.id === 'spring-hole-diameter')?.status).toBe('warning');
  });

  it('accepts matched bezel/crystal geometry', () => {
    const result = evaluateControlledFit();
    expect(result.checks.find((check) => check.id === 'crystal')?.status).toBe('pass');
    expect(result.checks.find((check) => check.id === 'bezel-insert-inner')?.status).toBe('pass');
    expect(result.checks.find((check) => check.id === 'bezel-insert-outer')?.status).toBe('pass');
  });

  it('calculates the supported 1.25 mm hand radial margin', () => {
    const result = evaluateControlledFit();
    const check = result.checks.find((item) => item.id === 'hand-radial-clearance');
    expect(check?.status).toBe('pass');
    expect(check?.expected).toContain('1.25 mm');
  });

  it('keeps hand-to-crystal clearance as manual validation', () => {
    const result = evaluateControlledFit();
    expect(result.status).toBe('supported-with-estimated-warnings');
    expect(result.manualValidationRequired).toContain('Installed top-of-seconds-hand to underside-of-crystal clearance (estimate 0.65 ±0.12 mm; target >= 0.30 mm)');
    expect(result.checks.find((check) => check.id === 'hand-crystal-clearance')?.status).toBe('warning');
    expect(CONTROLLED_NMK901_FIXTURE.fields.handCrystalClearance.value).toBe(0.65);
    expect(CONTROLLED_NMK901_FIXTURE.fields.minimumHandCrystalClearance.value).toBe(0.3);
  });

  it('keeps estimated and still-unknown machining fields explicit', () => {
    const bom = generateControlledBom();
    expect(CONTROLLED_NMK901_FIXTURE.fields.crownTubeBore.value).toBe(2.1);
    expect(CONTROLLED_NMK901_FIXTURE.fields.crownTubeBore.status).toBe('ESTIMATED_NOMINAL');
    expect(CONTROLLED_NMK901_FIXTURE.fields.casebackGroove.value).toBeNull();
    expect(bom.lines.find((line) => line.componentType === 'crown-tube')?.criticalDimensions).toHaveProperty('estimatedBore');
    expect(bom.lines.find((line) => line.componentType === 'caseback-gasket')?.criticalDimensions).not.toHaveProperty('groove');
  });

  it('generates a deterministic BOM with the expected controlled components', () => {
    const first = generateControlledBom();
    const second = generateControlledBom();
    expect(first).toEqual(second);
    expect(first.deterministic).toBe(true);
    expect(first.lines).toHaveLength(12);
    expect(first.lines.map((line) => line.sku)).toEqual([
      'NMK901-CASE-42',
      'NH35-TYPE-M',
      'DIAL-28.5-NH35',
      'CT252-SKX-305-275-230',
      'SKX-FLAT-38-315',
      'CRYSTAL-315-COMPATIBLE',
      'SKX-NH35-HANDSET-085-130-130',
      'NMK901-MATCHED-CROWN-TUBE',
      'NH35-STEM-M090-TRIM',
      'FAT-SPRING-BAR-22-250-110',
      '0C3060B0A',
      '8660-0630'
    ]);
    expect(first.lines.find((line) => line.componentType === 'spring-bar')?.quantity).toBe(2);
  });

  it('keeps estimated interfaces orderable with soft warnings', () => {
    const bom = generateControlledBom();
    expect(bom.fit.orderable).toBe(true);
    expect(bom.lines.find((line) => line.componentType === 'crown-tube')?.orderability).toBe('orderable-with-assembly-validation');
    expect(bom.lines.find((line) => line.componentType === 'crown-tube')?.provenance).toBe('ESTIMATED_NOMINAL');
    expect(bom.lines.find((line) => line.componentType === 'crown-tube')?.validationStatus).toBe('soft-warning');
  });

  it('serializes BOM provenance and validation state', () => {
    const parsed = JSON.parse(serializeControlledBom(generateControlledBom())) as ReturnType<typeof generateControlledBom>;
    expect(parsed.orderId).toBe(CONTROLLED_ORDER_ID);
    expect(parsed.lines[7]!.provenance).toBe('ESTIMATED_NOMINAL');
    expect(parsed.lines[6]!.validationStatus).toBe('soft-warning');
    expect(parsed.fit.manualValidationRequired.length).toBeGreaterThan(0);
  });

  it('does not expose an unsupported variant as valid', () => {
    const result = evaluateControlledFit({ ...CONTROLLED_NMK901_SELECTION, caseSet: 'MM300' });
    expect(result.orderable).toBe(false);
    expect(result.checks.find((check) => check.id === 'case-envelope')?.status).toBe('fail');
  });

  it('blocks presentation-only archetypes from the NMK901 order', () => {
    const chronograph = generateControlledBom(CONTROLLED_NMK901_SELECTION, 'archetype-chronograph');
    expect(chronograph.fit.orderable).toBe(false);
    expect(chronograph.fit.checks.find((check) => check.id === 'archetype-platform')).toMatchObject({ status: 'fail' });

    const diver = generateControlledBom(CONTROLLED_NMK901_SELECTION, 'archetype-dive');
    expect(diver.fit.orderable).toBe(true);
    expect(diver.fit.checks.find((check) => check.id === 'archetype-platform')).toMatchObject({ status: 'pass' });
  });
});
