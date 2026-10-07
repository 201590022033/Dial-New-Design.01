import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Checks the recorded transcription, not new photographic or runtime fidelity.
export const validateCitizenReference = (packet, verifyFiles = true) => {
  assert.equal(packet.model, 'JY8078-01L');
  assert.equal(packet.runtimeUse, false);
  assert.equal(packet.verification.readyForMilestone3A, true);
  assert.equal(packet.verification.factoryExactReproductionCertified, false);
  const sourceIds = new Set(packet.sources.map((s) => s.id));
  for (const source of packet.sources.filter((s) => s.localFile)) {
    if (verifyFiles) assert.equal(createHash('sha256').update(readFileSync(new URL(source.localFile, import.meta.url))).digest('hex'), source.sha256.toLowerCase());
  }
  assert.equal(new Set(packet.graduations.map((g) => g.id)).size, 450);
  for (const row of ['outer', 'inner']) {
    const ticks = packet.graduations.filter((g) => g.row === row);
    assert.equal(ticks.length, 225);
    assert.equal(new Set(ticks.map((g) => g.value)).size, 225);
    assert.equal(ticks.filter((g) => g.value === 10).length, 1);
    assert(!ticks.some((g) => g.value >= 100 || g.value < 10));
    const sectors = packet.sectors.filter((s) => s.row === row);
    assert.equal(sectors[0].fromValue, 10);
    assert.equal(sectors.at(-1).toValue, 100);
    assert.equal(sectors.reduce((n, s) => n + s.intervalCount, 0), 225);
    for (let i = 0; i < sectors.length; i++) {
      const s = sectors[i];
      if (i) assert.equal(sectors[i - 1].toValue, s.fromValue);
      assert.equal(s.interiorStrokeCount, s.intervalCount - 1);
      assert.equal(s.reviewers.length, 2);
      assert(Math.abs((s.toValue - s.fromValue) / s.increment - s.intervalCount) < 1e-8);
      const members = ticks.filter((g) => g.value >= s.fromValue && g.value < s.toValue);
      assert.equal(members.length, s.intervalCount);
      members.forEach((g, j) => assert(Math.abs(g.value - (s.fromValue + j * s.increment)) < 1e-8));
    }
    for (const g of ticks) {
      assert(sourceIds.has(g.sourceId));
      assert.equal(g.retained, true);
      assert(g.profileId in packet.tickProfiles);
      assert(Math.abs(g.degreeOffsetFromUnit - 360 * Math.log10(g.value / 10)) < 1e-9);
      assert.equal(g.printedText, packet.numerals[row].find((n) => n.value === g.value)?.text ?? null);
    }
  }
  const tick = (row, value) => packet.graduations.find((g) => g.row === row && g.value === value);
  assert.equal(tick('outer', 60).geometry, 'solid-inward-triangle');
  assert.equal(tick('inner', 50).profileId, 'inner-radio-shortened-50');
  assert.equal(tick('inner', 60).profileId, 'inner-radio-shortened-60');
  assert.equal(packet.numeralStyles.innerUnit10.boxColourRole, 'inner-unit-yellow-box');
  assert.equal(packet.numeralStyles.innerUnit10.inkColourRole, 'dark-ink');
  const p = (role) => packet.pointers.find((m) => m.role === role);
  assert.equal(p('hour-rate').value, 60);
  assert.equal(p('hour-rate').shape, 'hollow-triangle');
  assert.equal(p('distance-km').fillColourRole, 'km-yellow-pointer');
  assert.equal(p('distance-km').direction, 'outward');
  assert.equal(p('distance-naut').fillColourRole, 'naut-red-pointer');
  assert.equal(p('distance-stat').fillColourRole, 'stat-red-pointer');
  assert(Math.abs(p('distance-km').value / p('distance-naut').value - 1.852) < 1e-10);
  assert(Math.abs(p('distance-km').value / p('distance-stat').value - 1.609344) < 1e-10);
  assert(packet.distanceAnchorFit.angularResidualsDeg.every((r) => Math.abs(r) < 0.1));
  assert.equal(packet.features.timeRow.present, false);
  assert.equal(packet.features.dedicatedSeconds36.present, false);
  assert(tick('inner', 36));
  for (const forbidden of packet.exclusions) assert.equal(forbidden.renderAllowed, false);
  assert(packet.excludedWatchGraphics.includes('RX'));
  assert(packet.excludedWatchGraphics.includes('NO'));
  for (const sample of packet.paletteSamples) {
    assert.match(sample.approximateHex, /^#[0-9A-F]{6}$/);
    assert.equal(sample.evidence, 'photographic-approximation-not-manufacturer-ink');
    assert(sample.selectedPixelCount > 0);
  }
  return { result: 'Citizen photographic-reference consistency PASS; not runtime/factory fidelity certification', graduationPositions: 450, intervalSectors: packet.sectors.length, runtimeUse: false };
};

const packet = JSON.parse(readFileSync(new URL('citizen-jy8078-verification.json', import.meta.url), 'utf8'));
console.log(JSON.stringify(validateCitizenReference(packet), null, 2));
