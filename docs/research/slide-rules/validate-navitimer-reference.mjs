import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Checks the recorded reconstruction inventory, not factory or runtime fidelity.
export const validateNavitimerReference = (packet, verifyFiles = true) => {
  assert.equal(packet.referenceId, 'navitimer-booklet-training-disc-2026-10-07');
  assert.equal(packet.model, null, 'Training disc is not a named production watch');
  assert.equal(packet.runtimeUse, false);
  assert.equal(packet.verification.readyForReconstruction, true);
  assert.equal(packet.verification.factoryExactReproductionCertified, false);
  assert.equal(packet.verification.runtimeAcceptancePassed, false);
  const sources = new Set(packet.sources.map((s) => s.id));
  for (const source of packet.sources.filter((s) => s.localFile)) {
    if (verifyFiles) assert.equal(createHash('sha256').update(readFileSync(new URL(source.localFile, import.meta.url))).digest('hex'), source.sha256.toLowerCase());
  }
  assert.equal(packet.graduations.length, 420);
  assert.equal(new Set(packet.graduations.map((g) => g.id)).size, 420);
  for (const row of ['outer', 'inner']) {
    const ticks = packet.graduations.filter((g) => g.row === row);
    assert.equal(ticks.length, 210);
    assert.equal(new Set(ticks.map((g) => g.value)).size, 210);
    assert.equal(ticks.filter((g) => g.value === 10).length, 1);
    assert(!ticks.some((g) => g.value < 10 || g.value >= 100));
    const sectors = packet.sectors.filter((s) => s.row === row);
    assert.equal(sectors.length, row === 'outer' ? 30 : 26);
    assert.equal(sectors[0].fromValue, 10);
    assert.equal(sectors.at(-1).toValue, 100);
    assert.equal(sectors.reduce((sum, s) => sum + s.intervalCount, 0), 210);
    sectors.forEach((s, i) => {
      assert.equal(s.countConfidence, 'visually-counted-source-schedule');
      assert(sources.has(s.sourceId));
      if (i) assert.equal(sectors[i - 1].toValue, s.fromValue);
      const increment = s.fromValue < 15 ? 0.1 : s.fromValue < 25 ? 0.2 : s.fromValue < 60 ? 0.5 : 1;
      assert.equal(s.increment, increment);
      assert.equal(s.interiorStrokeCount, s.intervalCount - 1);
      assert(Math.abs((s.toValue - s.fromValue) / s.increment - s.intervalCount) < 1e-8);
      const members = ticks.filter((g) => g.value >= s.fromValue && g.value < s.toValue);
      assert.equal(members.length, s.intervalCount);
      assert.deepEqual(s.classPattern, members.map((g) => g.tickClass));
      members.forEach((g, j) => assert(Math.abs(g.value - (s.fromValue + j * s.increment)) < 1e-8));
    });
    for (const g of ticks) {
      assert(sources.has(g.sourceId));
      assert.equal(g.retained, true);
      assert(g.profileId in packet.tickProfiles);
      assert(Math.abs(g.degreeOffsetFromUnit - 360 * Math.log10(g.value / 10)) < 1e-9);
      assert.equal(g.printedText, packet.numerals[row].find((n) => n.value === g.value)?.text ?? null);
    }
  }
  const tick = (row, value) => packet.graduations.find((g) => g.row === row && g.value === value);
  const pointer = (role) => packet.pointers.find((p) => p.role === role);
  for (const row of ['outer', 'inner']) {
    assert(tick(row, 25.5));
    assert(!tick(row, 25.2));
    assert(tick(row, 55.5));
    assert(!tick(row, 60.5));
    assert(tick(row, 36));
    for (const value of [65, 75, 85, 95]) assert.equal(tick(row, value).tickClass, 'major');
  }
  assert.equal(pointer('hour-rate').value, 60);
  assert.equal(pointer('hour-rate').fillColourRole, 'mph-black-pointer');
  assert.equal(pointer('hour-rate').shape, 'solid-triangle');
  assert.equal(pointer('inner-unit').fillColourRole, 'inner-unit-red');
  assert.equal(pointer('inner-unit').captionOwnedByNumeral, true);
  assert.equal(pointer('seconds').value, 36);
  assert.equal(pointer('seconds').caption, null, 'Adjacent ordinary35 is not a printed36 caption');
  assert.equal(pointer('outer-unlabelled-reference').caption, null);
  const km = pointer('distance-km').value;
  assert(Math.abs(km / pointer('distance-naut').value - 1.852) < 1e-10);
  assert(Math.abs(km / pointer('distance-stat').value - 1.609344) < 1e-10);
  assert.equal(packet.distanceAnchorFit.manufacturerSpecified, false);
  assert.equal(packet.distanceAnchorFit.withheldValidationFailureDisclosed, true);
  assert.equal(packet.distanceAnchorFit.recommendedNominalReconstructionKmValue, 61);
  assert(Math.abs(packet.measurements.independentFixedAnchorSensitivityCheck.extraValidationPointNotFitted.angularResidualDeg) > 2);
  assert.equal(packet.typography.fontFile, null);
  assert.equal(packet.dimensions.printableAnnulusMm, null);
  assert.equal(packet.paletteRoles['common-divider-blue-grey'].approximateHex, null);
  assert.equal(packet.features.timeRow.present, false);
  assert.equal(packet.features.seconds36.present, true);
  assert.equal(packet.numeralStyles.innerUnit10.boxColourRole, null);
  for (const value of [70, 80, 90]) assert.equal(tick('inner', value).printedText, String(value / 10));
  assert.equal(tick('inner', 65).printedText, null);
  assert(packet.exclusions.every((e) => e.renderAllowed === false));
  for (const sample of Object.values(packet.measurements.palette)) {
    assert.match(sample.approximateHex, /^#[0-9A-F]{6}$/);
    assert(sample.pixelCount > 0);
  }
  return { result: 'Navitimer reference consistency PASS; disclosed scan reconstruction only', graduationPositions: 420, intervalSectors: 56, runtimeUse: false };
};

const packet = JSON.parse(readFileSync(new URL('navitimer-training-disc-verification.json', import.meta.url), 'utf8'));
console.log(JSON.stringify(validateNavitimerReference(packet), null, 2));
