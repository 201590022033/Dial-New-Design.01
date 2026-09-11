import { describe, it, expect } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import {
  evaluateCandidate,
  evaluateAssembly,
  getCompatibleCandidates,
  aggregateCompatibility
} from '@/domain/compatibility';
import { checkMovementCaseCompatibility } from '@/domain/compatibility/rules/movementCaseRule';
import { checkMovementHandsCompatibility } from '@/domain/compatibility/rules/movementHandsRule';
import { checkCaseDialCompatibility } from '@/domain/compatibility/rules/caseDialRule';
import { checkHandsClearanceCompatibility } from '@/domain/compatibility/rules/handsClearanceRule';
import { checkBezelInsertCompatibility } from '@/domain/compatibility/rules/bezelInsertRule';
import { checkCatalogueVerificationState } from '@/domain/compatibility/rules/catalogueVerificationRule';
import { resolveAssemblyGeometry } from '@/domain/geometry/boundaryResolver';
import type { CompatibilityCheckResult } from '@/domain/compatibility/compatibilityTypes';

describe('Phase 5: Deterministic Physical Compatibility Engine', () => {
  // 1. Movement / Case compatibility
  describe('1. Movement ↔ Case', () => {
    it('returns GREEN for valid movement fit within case cavity', () => {
      const assembly = createDefaultWatchAssembly();
      const geometry = resolveAssemblyGeometry(assembly);
      const results = checkMovementCaseCompatibility(assembly, geometry);

      expect(results.some((r) => r.status === 'green')).toBe(true);
      expect(results.some((r) => r.status === 'red')).toBe(false);
    });

    it('returns RED when movement exceeds case cavity (MOVEMENT_EXCEEDS_CASE_CAVITY)', () => {
      const assembly = createDefaultWatchAssembly();
      const largeMovementItem = getCatalogueItem('cat-movement-pocket-6497');
      expect(largeMovementItem).toBeDefined();

      const geometry = resolveAssemblyGeometry(assembly);
      const results = checkMovementCaseCompatibility(assembly, geometry, largeMovementItem);

      const redResult = results.find((r) => r.code === 'MOVEMENT_EXCEEDS_CASE_CAVITY');
      expect(redResult).toBeDefined();
      expect(redResult?.status).toBe('red');
      expect(redResult?.actual?.value).toBe(36.6);
      expect(redResult?.expected?.value).toBeDefined();
      expect(redResult?.difference).toBeGreaterThan(0);
    });

    it('returns UNKNOWN when case cavity dimension is missing', () => {
      const assembly = createDefaultWatchAssembly();
      // Clear case diameter and dimensions
      assembly.globalDimensions.caseDiameterMm = 0;
      const casePart = Object.values(assembly.parts).find((p) => p.category === 'case');
      if (casePart) {
        casePart.dimensions.diameterMm = 0;
      }
      const geometry = resolveAssemblyGeometry(assembly);
      delete geometry.regions.movementEnvelope;
      geometry.interfaces = geometry.interfaces.filter((i) => (i.kind as string) !== 'case-cavity');

      // When cavity cannot be inferred
      const results = checkMovementCaseCompatibility(assembly, geometry);
      const unknownResult = results.find((r) => r.code === 'MISSING_REQUIRED_DIMENSION');
      expect(unknownResult).toBeDefined();
      expect(unknownResult?.status).toBe('unknown');
    });
  });

  // 2. Hands / Movement compatibility
  describe('2. Hands ↔ Movement', () => {
    it('returns GREEN for correct arbor/collet match (e.g. NH35 hour hand 1.50mm)', () => {
      const assembly = createDefaultWatchAssembly();
      const hourHand = getCatalogueItem('cat-hour-hand');
      expect(hourHand).toBeDefined();

      const results = checkMovementHandsCompatibility(assembly, hourHand);
      const match = results.find((r) => r.code === 'HAND_COLLET_FIT_VALID');
      expect(match).toBeDefined();
      expect(match?.status).toBe('green');
    });

    it('returns RED for collet mismatch (e.g. ETA 2824 0.25mm second hand on NH35 0.20mm pinion)', () => {
      const assembly = createDefaultWatchAssembly();
      const etaSecondsHand = getCatalogueItem('cat-eta2824-seconds-hand');
      expect(etaSecondsHand).toBeDefined();

      const results = checkMovementHandsCompatibility(assembly, etaSecondsHand);
      const mismatch = results.find((r) => r.code === 'HAND_COLLET_MISMATCH');
      expect(mismatch).toBeDefined();
      expect(mismatch?.status).toBe('red');
      expect(mismatch?.actual?.value).toBe(0.25);
      expect(mismatch?.expected?.value).toBe(0.20);
      expect(mismatch?.summary).toContain('Second-hand collet is 0.25 mm; selected movement requires 0.20 mm');
    });

    it('returns UNKNOWN when movement arbor dimensions are unknown', () => {
      const assembly = createDefaultWatchAssembly();
      assembly.metadata.movement = 'unknown-calibre-9999';

      const results = checkMovementHandsCompatibility(assembly);
      expect(results.some((r) => r.status === 'unknown')).toBe(true);
      expect(results.find((r) => r.code === 'MISSING_REQUIRED_DIMENSION')).toBeDefined();
    });
  });

  // 3. Hand / Crystal clearance
  describe('3. Hand Stack ↔ Crystal Clearance', () => {
    it('returns GREEN for verified axial clearance', () => {
      const assembly = createDefaultWatchAssembly();
      const geometry = resolveAssemblyGeometry(assembly);
      const results = checkHandsClearanceCompatibility(assembly, geometry);

      const clearanceResult = results.find((r) => r.code === 'HAND_STACK_CLEARANCE_VALID');
      expect(clearanceResult).toBeDefined();
      expect(clearanceResult?.status).toBe('green');
    });

    it('returns YELLOW with domed crystal upgrade remedy for tight clearance', () => {
      const assembly = createDefaultWatchAssembly();
      const geometry = resolveAssemblyGeometry(assembly);
      // Simulate tight crystal underside height
      if (geometry.regions.crystal) {
        geometry.regions.crystal.zBaseMm = 1.70; // dialTopZ is 0.40 -> available is 1.30mm vs 1.25mm required
      }

      const results = checkHandsClearanceCompatibility(assembly, geometry);
      const tight = results.find((r) => r.code === 'HAND_STACK_TIGHT_CLEARANCE');
      expect(tight).toBeDefined();
      expect(tight?.status).toBe('yellow');
      expect(tight?.remedy?.type).toBe('domed-crystal-upgrade');
    });

    it('returns RED when hand stack exceeds crystal clearance (interference)', () => {
      const assembly = createDefaultWatchAssembly();
      const geometry = resolveAssemblyGeometry(assembly);
      if (geometry.regions.crystal) {
        geometry.regions.crystal.zBaseMm = 0.50; // only 0.10mm available!
      }

      const results = checkHandsClearanceCompatibility(assembly, geometry);
      const interference = results.find((r) => r.code === 'HAND_STACK_EXCEEDS_CRYSTAL_CLEARANCE');
      expect(interference).toBeDefined();
      expect(interference?.status).toBe('red');
      expect(interference?.difference).toBeGreaterThan(0.3);
    });

    it('returns UNKNOWN when crystal underside height datum is missing', () => {
      const assembly = createDefaultWatchAssembly();
      const geometry = resolveAssemblyGeometry(assembly);
      delete geometry.regions.crystal;
      delete geometry.contentSlots['hands-clearance-slot'];

      const results = checkHandsClearanceCompatibility(assembly, geometry);
      const unknownResult = results.find((r) => r.code === 'MISSING_REQUIRED_DIMENSION');
      expect(unknownResult).toBeDefined();
      expect(unknownResult?.status).toBe('unknown');
      expect(unknownResult?.summary).toContain('Compatibility cannot be verified because crystal underside height is unknown');
    });
  });

  // 4. Dial / Case
  describe('4. Dial ↔ Case', () => {
    it('returns GREEN for valid dial seat fit', () => {
      const assembly = createDefaultWatchAssembly();
      const geometry = resolveAssemblyGeometry(assembly);
      const results = checkCaseDialCompatibility(assembly, geometry);

      const seatResult = results.find((r) => r.code === 'DIAL_SEAT_FIT_VALID');
      expect(seatResult).toBeDefined();
      expect(seatResult?.status).toBe('green');
    });

    it('returns RED when dial outer diameter exceeds case dial seat (DIAL_EXCEEDS_DIAL_SEAT)', () => {
      const assembly = createDefaultWatchAssembly();
      const geometry = resolveAssemblyGeometry(assembly);
      const oversizedDial = getCatalogueItem('cat-dial-oversized');
      expect(oversizedDial).toBeDefined();

      const results = checkCaseDialCompatibility(assembly, geometry, oversizedDial);
      const redResult = results.find((r) => r.code === 'DIAL_EXCEEDS_DIAL_SEAT');
      expect(redResult).toBeDefined();
      expect(redResult?.status).toBe('red');
      expect(redResult?.summary).toContain('larger than the current case dial seat');
    });

    it('returns YELLOW with dial-feet-removal remedy for removable feet scenario', () => {
      const assembly = createDefaultWatchAssembly();
      const geometry = resolveAssemblyGeometry(assembly);
      const modDial = getCatalogueItem('cat-dial-mod-removable-feet');
      expect(modDial).toBeDefined();

      const results = checkCaseDialCompatibility(assembly, geometry, modDial);
      const yellowResult = results.find((r) => r.code === 'DIAL_FEET_PATTERN_MISMATCH' && r.status === 'yellow');
      expect(yellowResult).toBeDefined();
      expect(yellowResult?.remedy?.type).toBe('dial-feet-removal');
      expect(yellowResult?.remedy?.title).toContain('Remove Dial Feet');
    });
  });

  // 5. Bezel insert
  describe('5. Bezel Insert ↔ Bezel Carrier', () => {
    it('returns GREEN for matching inner and outer insert diameters', () => {
      const assembly = createDefaultWatchAssembly();
      const geometry = resolveAssemblyGeometry(assembly);
      const matchedInsert = getCatalogueItem('cat-bezel-insert-matched');
      expect(matchedInsert).toBeDefined();

      const results = checkBezelInsertCompatibility(assembly, geometry, matchedInsert);
      const match = results.find((r) => r.code === 'BEZEL_INSERT_FIT_VALID');
      expect(match).toBeDefined();
      expect(match?.status).toBe('green');
    });

    it('returns RED for mismatched bezel insert dimensions (BEZEL_INSERT_DIAMETER_MISMATCH)', () => {
      const assembly = createDefaultWatchAssembly();
      const geometry = resolveAssemblyGeometry(assembly);
      const mismatchedInsert = getCatalogueItem('cat-bezel-insert-mismatched');
      expect(mismatchedInsert).toBeDefined();

      const results = checkBezelInsertCompatibility(assembly, geometry, mismatchedInsert);
      const red = results.find((r) => r.code === 'BEZEL_INSERT_DIAMETER_MISMATCH');
      expect(red).toBeDefined();
      expect(red?.status).toBe('red');
      expect(red?.actual?.value).toBe(40.0);
    });
  });

  // 6. Unverified catalogue data
  describe('6. Unverified Catalogue Data Confidence', () => {
    it('returns UNKNOWN for ai-extracted/draft items (UNVERIFIED_CRITICAL_DIMENSION)', () => {
      const aiHand = getCatalogueItem('cat-hand-ai-extracted');
      expect(aiHand).toBeDefined();
      expect(aiHand?.status).toBe('ai-extracted');

      const results = checkCatalogueVerificationState(aiHand);
      const unverified = results.find((r) => r.code === 'UNVERIFIED_CRITICAL_DIMENSION');
      expect(unverified).toBeDefined();
      expect(unverified?.status).toBe('unknown');
      expect(unverified?.summary).toContain('AI-EXTRACTED');
    });

    it('never allows draft or ai-extracted items to become verified GREEN aggregate', () => {
      const assembly = createDefaultWatchAssembly();
      const evaluation = evaluateCandidate({
        assembly,
        candidateCatalogueItemId: 'cat-hand-ai-extracted'
      });

      // Even though the dimension might match, the unverified check forces aggregate UNKNOWN
      expect(evaluation.status).toBe('unknown');
      expect(evaluation.counts.unknown).toBeGreaterThan(0);
    });
  });

  // 7. Aggregate status logic
  describe('7. Aggregate Status Hierarchy', () => {
    it('aggregates GREEN + GREEN to GREEN', () => {
      const checks: CompatibilityCheckResult[] = [
        { status: 'green', code: 'HAND_COLLET_FIT_VALID', category: 'test', summary: 'Pass 1' },
        { status: 'green', code: 'CHAPTER_RING_FIT_VALID', category: 'test', summary: 'Pass 2' }
      ];
      const agg = aggregateCompatibility(checks);
      expect(agg.status).toBe('green');
    });

    it('aggregates GREEN + YELLOW to YELLOW', () => {
      const checks: CompatibilityCheckResult[] = [
        { status: 'green', code: 'HAND_COLLET_FIT_VALID', category: 'test', summary: 'Pass 1' },
        { status: 'yellow', code: 'HAND_STACK_TIGHT_CLEARANCE', category: 'test', summary: 'Cond 1' }
      ];
      const agg = aggregateCompatibility(checks);
      expect(agg.status).toBe('yellow');
    });

    it('aggregates GREEN + UNKNOWN to UNKNOWN', () => {
      const checks: CompatibilityCheckResult[] = [
        { status: 'green', code: 'HAND_COLLET_FIT_VALID', category: 'test', summary: 'Pass 1' },
        { status: 'unknown', code: 'MISSING_REQUIRED_DIMENSION', category: 'test', summary: 'Unknown datum' }
      ];
      const agg = aggregateCompatibility(checks);
      expect(agg.status).toBe('unknown');
    });

    it('aggregates any RED to RED regardless of other statuses', () => {
      const checks: CompatibilityCheckResult[] = [
        { status: 'green', code: 'HAND_COLLET_FIT_VALID', category: 'test', summary: 'Pass 1' },
        { status: 'yellow', code: 'HAND_STACK_TIGHT_CLEARANCE', category: 'test', summary: 'Cond 1' },
        { status: 'unknown', code: 'MISSING_REQUIRED_DIMENSION', category: 'test', summary: 'Unknown 1' },
        { status: 'red', code: 'MOVEMENT_EXCEEDS_CASE_CAVITY', category: 'test', summary: 'Collision' }
      ];
      const agg = aggregateCompatibility(checks);
      expect(agg.status).toBe('red');
    });
  });

  // 8. Candidate replacement evaluation (immutable)
  describe('8. Candidate Replacement Evaluation', () => {
    it('evaluates candidate without mutating the live WatchAssembly', () => {
      const assembly = createDefaultWatchAssembly();
      const snapshotBefore = JSON.stringify(assembly);

      const evaluation = evaluateCandidate({
        assembly,
        candidateCatalogueItemId: 'cat-eta2824-seconds-hand'
      });

      const snapshotAfter = JSON.stringify(assembly);
      expect(snapshotBefore).toBe(snapshotAfter);
      expect(evaluation.status).toBe('red'); // ETA second hand on NH35 is red
    });

    it('includes structured reverse dependency hints for RED candidates', () => {
      const assembly = createDefaultWatchAssembly();
      const evaluation = evaluateCandidate({
        assembly,
        candidateCatalogueItemId: 'cat-dial-oversized'
      });

      expect(evaluation.status).toBe('red');
      expect(evaluation.reverseDependency).toBeDefined();
      expect(evaluation.reverseDependency?.matingCategory).toBe('case');
      expect(evaluation.reverseDependency?.description).toContain('dial seat aperture');
    });
  });

  // 9. Reverse candidate queries
  describe('9. Reverse Candidate Queries', () => {
    it('returns filtered candidates without aesthetic ranking', () => {
      const assembly = createDefaultWatchAssembly();

      const candidates = getCompatibleCandidates({
        assembly,
        targetCategory: 'hands'
      });

      expect(candidates.length).toBeGreaterThan(0);

      // Verify each candidate has an item and deterministic evaluation
      for (const cand of candidates) {
        expect(cand.item).toBeDefined();
        expect(['green', 'yellow', 'red', 'unknown']).toContain(cand.evaluation.status);
        // Ensure no subjective aesthetic percentage scoring
        expect((cand as unknown as { score?: number }).score).toBeUndefined();
      }

      // Filter for only GREEN candidates
      const greenOnly = getCompatibleCandidates({
        assembly,
        targetCategory: 'hands',
        filterStatus: ['green']
      });

      expect(greenOnly.every((c) => c.evaluation.status === 'green')).toBe(true);
    });
  });

  // 10. Overall Assembly Evaluation
  describe('10. Whole Assembly Evaluation', () => {
    it('evaluates the default assembly as GREEN across all verified interfaces', () => {
      const assembly = createDefaultWatchAssembly();
      const evaluation = evaluateAssembly(assembly);

      expect(evaluation.status).toBe('green');
      expect(evaluation.counts.red).toBe(0);
      expect(evaluation.counts.unknown).toBe(0);
      expect(evaluation.counts.green).toBeGreaterThan(5);
    });
  });
});
