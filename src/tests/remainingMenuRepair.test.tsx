import { describe, expect, it, vi } from 'vitest';
vi.hoisted(() => vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} }));
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { findCaseBodyPart } from '@/domain/compatibility/compatibilityHelpers';
import { evaluateAssembly } from '@/domain/compatibility/compatibilityEngine';
import { checkMovementCaseCompatibility } from '@/domain/compatibility/rules/movementCaseRule';
import { checkCaseDialCompatibility } from '@/domain/compatibility/rules/caseDialRule';
import { checkHandsClearanceCompatibility } from '@/domain/compatibility/rules/handsClearanceRule';
import { checkDateWindowMovementCompatibility } from '@/domain/compatibility/rules/dateWindowMovementRule';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import { resolveAssemblyGeometry } from '@/domain/geometry/boundaryResolver';
import { helpDocPages } from '@/domain/extensions/helpDocs';
import { engineeringHelpIndex } from '@/domain/extensions/engineeringHelpIndex';
import { syncAssemblyDownstream } from '@/stores/storeSync';
import { useDesignEngineStore } from '@/stores/designEngineStore';

describe('remaining engineering and Help repairs', () => {
  it('resolves the case body instead of lugs and uses selected NH05 interfaces', () => {
    const assembly = createStarterBuild('ladies-dress', createDefaultWatchAssembly()).assembly;
    const geometry = resolveAssemblyGeometry(assembly);
    expect(findCaseBodyPart(assembly)?.instanceId).toBe('inst-midcase');
    const fit = checkMovementCaseCompatibility(assembly, geometry);
    expect(fit.some((check) => check.code === 'MOVEMENT_EXCEEDS_CASE_CAVITY')).toBe(false);
    expect(fit[0]!.actual?.value).toBe(17.5);
    expect(fit[0]!.expected?.value).toBe(19.8);
    expect(geometry.regions.movementEnvelope?.outerRadiusMm).toBe(8.75);
    const dial = checkCaseDialCompatibility(assembly, geometry);
    expect(dial[0]!.expected?.value).toBe(24.5);
    expect(dial[0]!.actual?.value).toBe(24.5);
    expect(evaluateAssembly(assembly).counts.unknown).toBeGreaterThan(0);
  });
  it('evaluates actual edited dial and hand dimensions instead of nominal catalogue geometry', () => {
    const assembly = createStarterBuild('ladies-dress', createDefaultWatchAssembly()).assembly;
    assembly.parts['inst-dial-blank']!.dimensions.diameterMm = 26;
    expect(checkCaseDialCompatibility(assembly, resolveAssemblyGeometry(assembly))[0]?.code).toBe('DIAL_EXCEEDS_DIAL_SEAT');
    assembly.parts['inst-dial-blank']!.dimensions.diameterMm = 24.5;
    assembly.parts['inst-minute-hand']!.dimensions.diameterMm = 15;
    const checks = checkHandsClearanceCompatibility(assembly, resolveAssemblyGeometry(assembly));
    expect(checks.find((check) => check.code === 'HAND_LENGTH_EXCEEDS_DIAL_RADIUS')?.actual?.value).toBe(15);
    assembly.parts['inst-minute-hand']!.dimensions.diameterMm = 8.82;
    expect(checkHandsClearanceCompatibility(assembly, resolveAssemblyGeometry(assembly)).some((check) => check.code === 'HAND_LENGTH_EXCEEDS_DIAL_RADIUS')).toBe(false);
  });
  it('synchronizes movement readouts when switching ladies → diver', () => {
    const ladies = createStarterBuild('ladies-dress', createDefaultWatchAssembly()).assembly;
    syncAssemblyDownstream(ladies);
    expect(useDesignEngineStore.getState().selectedMovementId).toBe('nh05');
    expect(useDesignEngineStore.getState().movementRecommendations?.recommendedDialDiameterMm).toBe(24.5);
    syncAssemblyDownstream(createStarterBuild('diver', ladies).assembly);
    expect(useDesignEngineStore.getState().selectedMovementId).toBe('nh35');
  });
  it('documents every Help topic and preserves contextual links without placeholders', () => {
    expect(helpDocPages.length).toBe(29);
    for (const page of helpDocPages) {
      expect(page.steps.length).toBeGreaterThanOrEqual(2);
      expect(page.limitation.length).toBeGreaterThan(20);
      expect(JSON.stringify(page)).not.toMatch(/placeholder|scaffolded/i);
    }
    for (const entry of engineeringHelpIndex) for (const id of entry.helpDocIds) {
      expect(helpDocPages.some((page) => page.id === id)).toBe(true);
    }
  });
  it('does not infer six-o’clock date position from a hand bore such as 0.656 mm', () => {
    const assembly = createStarterBuild('ladies-dress', createDefaultWatchAssembly()).assembly;
    const candidate = getCatalogueItem('cat-hands-nh05-dress-baton')!;
    const checks = checkDateWindowMovementCompatibility(assembly, candidate);
    expect(checks.some((check) => check.code === 'DATE_WINDOW_MISALIGNMENT')).toBe(false);
    expect(checks.some((check) => check.code === 'DATE_WINDOW_ALIGNMENT_VALID')).toBe(true);
  });
});
