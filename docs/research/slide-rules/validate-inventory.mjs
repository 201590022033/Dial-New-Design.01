import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateCitizenReference } from './validate-citizen-reference.mjs';
import { validateNavitimerReference } from './validate-navitimer-reference.mjs';

// Research consistency only. This does not certify a photographic transcription.
const read = (name) => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const manifest = read('reference-manifest.json');
const inventory = read('graduation-inventory.json');
const citizenPacket = read('citizen-jy8078-verification.json');
validateCitizenReference(citizenPacket);
const navitimerPacket = read('navitimer-training-disc-verification.json');
validateNavitimerReference(navitimerPacket);
const variant = read('navitimer-1967-variant-plan.json');
assert.equal(variant.selectedTrainingDiscReplaced, false);
assert.equal(variant.gatePassed, false);
assert.equal(variant.timeRow.present, true);
assert.equal(variant.timeRow.completeGraduationInventory, false);
variant.timeRow.confirmedSampleLabels.forEach((text, index) => {
  const [hours, minutes] = text.split(':').map(Number);
  assert.equal(hours * 60 + minutes, variant.timeRow.actualMinutes[index]);
});
for (const sector of variant.graduationReview) {
  assert.equal(sector.needsIndependentCorroboration, true);
  assert.equal(sector.underlyingIntermediateValues, null);
  assert.equal(sector.status, 'provisional-manual-visual-count-not-accepted-graduation-table');
}
const refs = new Set(manifest.references.map((r) => r.id));
const sources = new Set(manifest.references.flatMap((r) => r.sources.map((s) => s.id)));
const ids = inventory.marks.map((m) => m.id);
assert.equal(new Set(ids).size, ids.length, 'Duplicate mark identity');
assert.equal(inventory.runtimeUse, false, 'Partial inventory must stay out of runtime');
assert.equal(manifest.gatePassed, false, 'Research acceptance must not pass runtime/factory fidelity gate');
assert.equal(manifest.referenceInventoryReady, true);
for (const m of inventory.marks) {
  assert(refs.has(m.referenceId), `Unknown reference: ${m.id}`);
  assert(sources.has(m.evidence.sourceId), `Unknown source: ${m.id}`);
  if (m.evidence.supportingSourceId) assert(sources.has(m.evidence.supportingSourceId), `Unknown supporting source: ${m.id}`);
  if (m.value !== null) assert(m.value >= 10 && m.value < 100, `Duplicate/out-of-decade seam: ${m.id}`);
  if (m.degreeOffsetFromUnit !== null && m.degreeOffsetFromUnit !== undefined) {
    assert(Math.abs(m.degreeOffsetFromUnit - 360 * Math.log10(m.value / 10)) < 1e-10);
  }
  if (m.kind === 'excluded-conversion-annotation') {
    assert.equal(m.retained, false);
    assert.equal(m.renderAllowed, false);
  }
}
for (const ref of refs) {
  for (const row of ['outer', 'inner']) {
    const sectors = inventory.intervals.filter((s) => s.referenceId === ref && s.row === row).sort((a, b) => a.fromValue - b.fromValue);
    assert.equal(sectors[0].fromValue, 10);
    assert.equal(sectors.at(-1).toValue, 100);
    assert.equal(sectors.filter((s) => s.endpoint100IsShared10Seam).length, 1);
    sectors.forEach((s, i) => {
      assert(sources.has(s.sourceId));
      assert(s.toValue > s.fromValue);
      if (i) assert.equal(sectors[i - 1].toValue, s.fromValue, 'Gap/overlap in sector review coverage');
      const packet = ref === citizenPacket.referenceId ? citizenPacket : navitimerPacket;
      const accepted = packet.sectors.find((sector) => sector.id === s.id);
      assert(accepted, 'Every sector must have a reviewed photographic record');
      assert.equal(s.intervalCount, accepted.intervalCount);
      assert.equal(s.increment, accepted.increment);
    });
  }
}
const nav = manifest.references.find((r) => r.preset === 'Classic Navitimer');
for (const v of [70, 80, 90]) {
  const m = inventory.marks.find((m) => m.referenceId === nav.id && m.row === 'inner' && m.value === v);
  assert.equal(m.printedText, String(v / 10));
}
assert(!inventory.marks.some((m) => m.referenceId === nav.id && m.row === 'inner' && m.value === 65));
assert.equal(nav.features.timeRow.present, false);
assert.equal(nav.features.seconds36.present, true);
assert.equal(manifest.references.find((r) => r.model === 'JY8078-01L').features.timeRow.present, false);
const km = inventory.marks.find((m) => m.referenceId === nav.id && m.semanticRole === 'distance-km');
assert.equal(km.style.pointerColour, 'red');
assert.equal(km.style.pointerGeometry, 'solid-triangle');
assert.equal(km.style.pointerDirection, 'outward');
assert.equal(km.value, navitimerPacket.distanceAnchorFit.fittedKmValue);
assert.equal(navitimerPacket.distanceAnchorFit.manufacturerSpecified, false);
const seconds = inventory.marks.find((m) => m.referenceId === nav.id && m.semanticRole === 'seconds');
assert.equal(seconds.printedText, null, 'Ordinary black35 is not a seconds36 caption');
const extraOuterReference = inventory.marks.find((m) => m.referenceId === nav.id && m.semanticRole === 'outer-unlabelled-reference');
assert.equal(extraOuterReference.printedText, null);
assert.equal(nav.features.outerUnlabelledReference36.operationConfirmed, false);
const angle = (v) => 360 * Math.log10(v / 10);
assert(Math.abs((angle(40) - angle(20)) - (angle(60) - angle(30))) < 1e-10);
const distances = { statute30ToNm: 30 * 1.609344 / 1.852, statute30ToKm: 30 * 1.609344, statute60ToNm: 60 * 1.609344 / 1.852, statute60ToKm: 60 * 1.609344 };
assert(Math.abs(distances.statute30ToKm - 48.28032) < 1e-10);
assert(Math.abs(distances.statute60ToKm - 96.56064) < 1e-10);
console.log(JSON.stringify({ result: 'research consistency PASS; Citizen/Navitimer ready for disclosed reconstruction; runtime/factory fidelity NOT accepted', markRecords: inventory.marks.length, numericalLabels: inventory.marks.filter((m) => m.kind === 'numerical-label').length, citizenGraduationPositions: citizenPacket.graduations.length, navitimerGraduationPositions: navitimerPacket.graduations.length, countedCitizenSectors: inventory.intervals.filter((s) => s.referenceId === citizenPacket.referenceId && s.intervalCount !== null).length, countedNavitimerSectors: inventory.intervals.filter((s) => s.referenceId === navitimerPacket.referenceId && s.intervalCount !== null).length, uncountedIntervalSectors: inventory.intervals.filter((s) => s.intervalCount === null).length, equalRatioDegrees: angle(60) - angle(30), distances }, null, 2));
