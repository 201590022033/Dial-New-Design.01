import { describe, expect, it } from 'vitest';
import { Matrix4, Vector3 } from 'three';
import { CROWN_AXIS_V1, CROWN_CHOICE_V1, crownAxisToEngineeringFrame, crownAxisToExportedAssetFrame, migrateLegacyCrown, restoreLegacyCrown, unknownCrownEvidence, validateCrownAxis, validateCrownChoice, validateCrownSpecification, type CrownAxisDatumV1, type EvidenceValue } from '@/domain/crown';

const known = <T>(value: T): EvidenceValue<T> => ({ status: 'known', value, evidence: { kind: 'visual-approximation', source: 'Presentation fixture, no fit qualification' } });
const legacyPart = () => ({
  instanceId: 'saved-crown', catalogueItemId: 'cat-crown', material: 'steel', color: '#aabbcc', texture: 'polished',
  dimensions: { diameterMm: 7, thicknessMm: 4.9 },
  anchors: { position: [1, 2, 3], source: 'saved' }, sourcing: { supplierId: 'supplier-keep', price: null },
  parametricGeometry: { schema: 'parametric-crown/v1', provenance: { status: 'provisional', source: 'old fixture' }, headDiameterMm: 7, headLengthMm: 4.9, socketDiameterMm: 3.2, socketDepthMm: 1.8, gripDepthMm: .2, gripCount: 32, stemThreadPitchMm: { status: 'unknown' }, attachment: { anchor: 'crown-interface', axialGapMm: 0 } },
});
const axis = (angle: number): CrownAxisDatumV1 => ({ schema: CROWN_AXIS_V1, axisId: 'crown-main', clockwiseFrom3hDeg: known(angle), interfaceRadiusMm: known(20), stemHeightMm: known(2) });

describe('canonical crown contract and intentional legacy adapter', () => {
  it('preserves 7mm core plus .2mm radial grip as 7.4mm envelope with unknown physical fit', () => {
    const migration = migrateLegacyCrown(legacyPart());
    expect(migration.specification.coreDiameterMm).toMatchObject({ value: 7 });
    expect(migration.specification.maximumOuterDiameterMm).toMatchObject({ value: 7.4 });
    expect(migration.specification.closure).toMatchObject({ value: 'unspecified' });
    expect(migration.specification.interfaces.crownSocket.boreDiameterMm.status).toBe('unknown');
    expect(migration.specification.interfaces.movementStem.thread.pitchMm.status).toBe('unknown');
    expect(validateCrownSpecification(migration.specification).status).toBe('unknown');
  });
  it('restores IDs, saved anchors, source selections, appearance and all legacy fields without mutation', () => {
    const original = legacyPart(), before = structuredClone(original);
    const migrated = migrateLegacyCrown(original);
    migrated.specification.finish = { mode: 'inherit-case' };
    original.anchors.position[0] = 100;
    const restored = restoreLegacyCrown(migrated);
    expect(restored).toEqual(before);
    restored.anchors.position[0] = 200;
    expect(migrated.original).toEqual(before);
    expect(JSON.parse(JSON.stringify(migrated.specification))).toEqual(migrated.specification);
  });
  it('keeps movement revision, crown socket and case engagement independent with original Tap units', () => {
    const s = migrateLegacyCrown(legacyPart()).specification;
    s.interfaces.movementStem.revision = known('NH05B');
    s.interfaces.movementStem.stemReference = known('unresolved-reference');
    s.interfaces.crownSocket.thread.supplierTapLabel = { status: 'known', value: 'Tap 10', evidence: { kind: 'supplier-statement', source: 'supplier record', originalText: 'Tap 10', sourceUnits: 'supplier Tap label' } };
    expect(s.interfaces.caseTubeEngagement.thread.supplierTapLabel.status).toBe('unknown');
    expect(s.interfaces.movementStem.thread.pitchMm.status).toBe('unknown');
    expect(validateCrownSpecification(s).status).toBe('unknown');
  });
  it('rejects non-finite/negative dimensions and envelope smaller than core', () => {
    for (const value of [0, -1, NaN, Infinity]) {
      const s = migrateLegacyCrown(legacyPart()).specification;
      s.headLengthMm = known(value);
      expect(validateCrownSpecification(s).status).toBe('invalid');
    }
    const s = migrateLegacyCrown(legacyPart()).specification;
    s.maximumOuterDiameterMm = known(6.9);
    expect(validateCrownSpecification(s).errors.join(' ')).toContain('at least coreDiameterMm');
  });
  it('rejects invalid legacy geometry rather than silently reinterpreting it', () => {
    const old = legacyPart(); old.parametricGeometry.gripDepthMm = -1;
    expect(() => migrateLegacyCrown(old)).toThrow('invalid legacy');
  });
  it('requires explicit matched cap/holder and rejects case tube ownership by crown', () => {
    const s = migrateLegacyCrown(legacyPart()).specification;
    s.protection = known('protective-cap');
    expect(validateCrownSpecification(s).status).toBe('invalid');
    s.ownership.cap = 'crown-assembly'; s.ownership.holder = 'case'; s.ownership.matchedAssemblyId = 'matched-platform';
    expect(validateCrownSpecification(s).status).toBe('unknown');
    expect(validateCrownSpecification({ ...s, ownership: { ...s.ownership, tube: 'crown' } }).status).toBe('invalid');
    s.protection = known('none');
    expect(validateCrownSpecification(s).status).toBe('invalid');
  });
  it('keeps independent finish inheritance distinct from explicit override', () => {
    const s = migrateLegacyCrown(legacyPart()).specification;
    expect(s.finish).toEqual({ mode: 'override', material: 'steel', color: '#aabbcc', texture: 'polished' });
    s.finish = { mode: 'inherit-case' };
    expect(validateCrownSpecification(s).status).toBe('unknown');
    expect(validateCrownSpecification({ ...s, finish: { mode: 'override' } }).status).toBe('invalid');
  });
  it('keeps explicit choice separate from advisory recommendation through JSON', () => {
    const choice = { schema: CROWN_CHOICE_V1, selected: { crownInstanceId: 'saved', source: 'explicit-user' }, recommendedDefault: { catalogueItemId: 'case-supplied-other', reason: 'Case contents', evidence: known('supplier claim') } };
    expect(validateCrownChoice(choice).status).toBe('valid');
    expect(JSON.parse(JSON.stringify(choice))).toEqual(choice);
    expect(choice.selected.crownInstanceId).toBe('saved');
    expect(validateCrownChoice({ ...choice, selected: { crownInstanceId: '', source: 'recommendation' } }).status).toBe('invalid');
  });
  it('requires field-level provenance and explicit unknown reasons', () => {
    const s = migrateLegacyCrown(legacyPart()).specification;
    expect(validateCrownSpecification({ ...s, coreDiameterMm: { status: 'known', value: 7 } }).status).toBe('invalid');
    expect(validateCrownSpecification({ ...s, headLengthMm: { status: 'unknown' } }).status).toBe('invalid');
  });
  it('rejects padded identities without silently normalizing saved documents', () => {
    const s = migrateLegacyCrown(legacyPart()).specification;
    expect(validateCrownSpecification({ ...s, axisId: ' crown-main ' }).status).toBe('invalid');
    expect(validateCrownSpecification({ ...s, ownership: { ...s.ownership, matchedAssemblyId: ' cap ' } }).status).toBe('invalid');
    expect(validateCrownAxis({ ...axis(30), axisId: ' crown-main ' }).status).toBe('invalid');
    expect(validateCrownChoice({ schema: CROWN_CHOICE_V1, selected: { crownInstanceId: ' crown ', source: 'explicit-user' } }).status).toBe('invalid');
    expect(validateCrownChoice({ schema: CROWN_CHOICE_V1, recommendedDefault: { catalogueItemId: ' cat ', reason: 'Fixture', evidence: known('claim') } }).status).toBe('invalid');
  });
});

describe('clockwise front-view crown axis and exported GLB conversion', () => {
  it.each([[0, 20, 0], [30, 10 * Math.sqrt(3), -10], [90, 0, -20], [180, -20, 0]])('maps %s degrees to Engineering/Blender XY', (angle, x, y) => {
    const frame = crownAxisToEngineeringFrame(axis(angle))!;
    expect(frame.positionMm[0]).toBeCloseTo(x); expect(frame.positionMm[1]).toBeCloseTo(y); expect(frame.positionMm[2]).toBe(2);
    expect(frame.rotationRad[2]).toBeCloseTo(-angle * Math.PI / 180);
  });
  it.each([0, 24, 30, 33, 36, 90, 180])('roundtrips %s degree exported asset with existing +pi/2 X correction', angle => {
    const engineering = crownAxisToEngineeringFrame(axis(angle))!, exported = crownAxisToExportedAssetFrame(axis(angle))!;
    const corrected = new Vector3(...exported.positionMm).applyMatrix4(new Matrix4().makeRotationX(Math.PI / 2));
    corrected.toArray().forEach((value, i) => expect(value).toBeCloseTo(engineering.positionMm[i]!));
    const direction = new Vector3(1, 0, 0).applyMatrix4(new Matrix4().makeRotationY(exported.rotationRad[1])).applyMatrix4(new Matrix4().makeRotationX(Math.PI / 2));
    expect(direction.x).toBeCloseTo(Math.cos(angle * Math.PI / 180)); expect(direction.y).toBeCloseTo(-Math.sin(angle * Math.PI / 180));
  });
  it.each(["3.8 o'clock", "4 o'clock", "4.1 o'clock", "4.2 o'clock"])('preserves exact supplier wording %s without manufacturing numeric precision', wording => {
    const a = axis(0); a.clockwiseFrom3hDeg = unknownCrownEvidence('Supplier wording does not establish exact measured angle');
    a.supplierPosition = { status: 'known', value: wording, evidence: { kind: 'supplier-statement', source: 'exact variant record', originalText: wording } };
    expect(validateCrownAxis(a).status).toBe('unknown');
    expect(crownAxisToEngineeringFrame(a)).toBeUndefined(); expect(crownAxisToExportedAssetFrame(a)).toBeUndefined();
    const roundtrip = JSON.parse(JSON.stringify(a)) as CrownAxisDatumV1;
    expect(roundtrip.supplierPosition).toMatchObject({ value: wording });
  });
  it('rejects invalid angles, radius and malformed evidence instead of resolving a fallback', () => {
    for (const bad of [-1, 360, Infinity, NaN]) expect(validateCrownAxis(axis(bad)).status).toBe('invalid');
    const a = axis(30); a.interfaceRadiusMm = known(-1);
    expect(() => crownAxisToEngineeringFrame(a)).toThrow('Invalid crown contract');
    a.interfaceRadiusMm = unknownCrownEvidence();
    expect(crownAxisToEngineeringFrame(a)).toBeUndefined();
  });
});
