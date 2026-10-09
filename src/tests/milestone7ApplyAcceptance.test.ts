import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { serializeWatchAssembly, deserializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import { applyCatalogueVisualSelection } from '@/domain/catalogue/applyCatalogueVisualSelection';
import { createProvisionalAssemblyWithCandidate } from '@/domain/compatibility/compatibilityHelpers';
import { evaluateAssembly, evaluateCandidate } from '@/domain/compatibility/compatibilityEngine';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { applyBomSelection } from '@/stores/applyBomSelection';

const item = (id: string) => getCatalogueItem(id)!;
const pilot = () => {
  const assembly = createStarterBuild('pilot', createDefaultWatchAssembly()).assembly;
  assembly.globalDimensions.caseDiameterMm = 42;
  return assembly;
};
const redCodes = (assembly: ReturnType<typeof pilot>) => evaluateAssembly(assembly).checks.filter(c => c.status === 'red').map(c => c.code);

describe('M7 genuine compatible Apply and persistence acceptance', () => {
  beforeEach(() => {
    useWatchAssemblyStore.getState().setAssembly(pilot());
    useConfiguratorUIStore.setState({ lockedPartIds: new Set(), previewAssembly: null, previewError: null, archetypePreviewAssembly: null });
  });

  it('does not hide the existing oversized 14mm seconds hand', () => {
    expect(redCodes(pilot())).toContain('HAND_LENGTH_EXCEEDS_DIAL_RADIUS');
  });

  it.each(['cat-hands-baton-set', 'cat-hands-sword-set', 'cat-hands-dauphine-set'])('evaluates the same three actual lengths as Apply: %s', (id) => {
    const before = pilot();
    const candidate = item(id);
    const applied = applyCatalogueVisualSelection(before, 'inst-hour-hand', candidate);
    const provisional = createProvisionalAssemblyWithCandidate(before, candidate, 'inst-hour-hand');
    expect(provisional).toEqual(applied);
    expect(before.parts['inst-central-seconds']!.dimensions.diameterMm).toBe(14);
    expect(provisional.parts['inst-central-seconds']!.dimensions.diameterMm).toBeCloseTo(11.115);
    const evaluation = evaluateCandidate({ assembly: before, targetPartInstanceId: 'inst-hour-hand', candidateCatalogueItemId: id });
    expect(evaluation.counts.red).toBe(0);
    expect(evaluation.status).toBe('unknown'); // No supplier bore/stack evidence is invented.
    expect(redCodes(applied)).toEqual([]);
  });

  it('allows explicit Options Apply, then a bezel and BOM Apply without bypassing fit', () => {
    const ui = useConfiguratorUIStore.getState();
    const hands = item('cat-hands-baton-set');
    ui.setPreview(applyCatalogueVisualSelection(pilot(), 'inst-hour-hand', hands), 'inst-hour-hand', hands);
    expect(useConfiguratorUIStore.getState().previewError).toBeNull();
    expect(ui.applyPreview()).toBe(true);
    const compatible = useWatchAssemblyStore.getState().assembly;
    const bezel = item('cat-bezel-dive-coin-edge-42');
    ui.setPreview(applyCatalogueVisualSelection(compatible, 'inst-rotating-bezel', bezel), 'inst-rotating-bezel', bezel);
    expect(ui.applyPreview()).toBe(true);
    expect(() => applyBomSelection('inst-rotating-bezel')).not.toThrow();
    expect(redCodes(useWatchAssemblyStore.getState().assembly)).toEqual([]);
    const loaded = deserializeWatchAssembly(serializeWatchAssembly(useWatchAssemblyStore.getState().assembly));
    for (const id of ['inst-hour-hand', 'inst-minute-hand', 'inst-central-seconds', 'inst-rotating-bezel']) {
      expect(loaded.parts[id]!.catalogueItemId).toBe(useWatchAssemblyStore.getState().assembly.parts[id]!.catalogueItemId);
      expect(loaded.parts[id]!.dimensions).toEqual(useWatchAssemblyStore.getState().assembly.parts[id]!.dimensions);
    }
    expect(redCodes(loaded)).toEqual([]);
  });

  it('still refuses a genuinely oversized replacement hand', () => {
    const tooLong = { ...item('cat-central-seconds'), id: 'test-oversized-seconds', nominalDimensions: { ...item('cat-central-seconds').nominalDimensions, diameterMm: 18 } };
    const ui = useConfiguratorUIStore.getState();
    ui.setPreview(applyCatalogueVisualSelection(pilot(), 'inst-central-seconds', tooLong), 'inst-central-seconds', tooLong);
    expect(ui.applyPreview()).toBe(false);
    expect(useWatchAssemblyStore.getState().assembly.parts['inst-central-seconds']!.dimensions.diameterMm).toBe(14);
  });

  it('does not conceal an oversized seconds hand when replacing just the hour hand', () => {
    const evaluation = evaluateCandidate({ assembly: pilot(), targetPartInstanceId: 'inst-hour-hand', candidateCatalogueItemId: 'cat-hour-hand' });
    expect(evaluation.checks.find(c => c.code === 'HAND_LENGTH_EXCEEDS_DIAL_RADIUS')?.actual?.value).toBe(14);
  });

  it('refuses an actually oversized complete set rather than accepting any hand-set label', () => {
    const candidate = { ...item('cat-hands-baton-set'), id: 'test-long-set', visual: { ...item('cat-hands-baton-set').visual!, handLengthsMm: { hour: 10, minute: 15, second: 18 } } };
    const evaluation = evaluateCandidate({ assembly: pilot(), targetPartInstanceId: 'inst-hour-hand', candidateCatalogueItemId: candidate.id, candidateItem: candidate });
    expect(evaluation.status).toBe('red');
    expect(evaluation.checks.find(c => c.code === 'HAND_LENGTH_EXCEEDS_DIAL_RADIUS')?.actual?.value).toBe(18);
  });

  it('preserves explicit compact NH05 5/8/8mm lengths through candidate evaluation and save/load', () => {
    const assembly = createStarterBuild('ladies-dress').assembly;
    const candidate = item('cat-research-tandorio-nh05-hands-588');
    expect(candidate).toBeDefined();
    const provisional = createProvisionalAssemblyWithCandidate(assembly, candidate, 'inst-hour-hand');
    const loaded = deserializeWatchAssembly(serializeWatchAssembly(provisional));
    expect(['inst-hour-hand', 'inst-minute-hand', 'inst-central-seconds'].map(id => loaded.parts[id]!.dimensions.diameterMm)).toEqual([5, 8, 8]);
    expect(redCodes(loaded)).not.toContain('HAND_LENGTH_EXCEEDS_DIAL_RADIUS');
  });

  it.each(['tray', 'canonical'] as const)('refuses a hand-set change when the minute hand is %s locked', (lock) => {
    const before = useWatchAssemblyStore.getState().assembly;
    if (lock === 'tray') useConfiguratorUIStore.setState({ lockedPartIds: new Set(['inst-minute-hand']) });
    else useWatchAssemblyStore.getState().setPartLocked('inst-minute-hand', true);
    const hands = item('cat-hands-baton-set');
    const current = useWatchAssemblyStore.getState().assembly;
    const ui = useConfiguratorUIStore.getState();
    ui.setPreview(applyCatalogueVisualSelection(current, 'inst-hour-hand', hands), 'inst-hour-hand', hands);
    expect(useConfiguratorUIStore.getState().previewError).toMatch(/locked/);
    expect(ui.applyPreview()).toBe(false);
    expect(useWatchAssemblyStore.getState().assembly.parts['inst-central-seconds']!.dimensions).toEqual(before.parts['inst-central-seconds']!.dimensions);
  });
});
