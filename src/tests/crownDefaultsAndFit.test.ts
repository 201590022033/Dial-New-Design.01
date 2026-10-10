import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.hoisted(() => { const storage = new Map<string, string>(); vi.stubGlobal('localStorage', { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => storage.set(k, v), removeItem: (k: string) => storage.delete(k) }); });
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { deserializeWatchAssembly, serializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { applyCatalogueVisualSelection } from '@/domain/catalogue/applyCatalogueVisualSelection';
import { getCatalogueItem, registerCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import { crownCatalogueItems, archetypeCrownDefaults, presentationEvidence } from '@/domain/crown/catalogue';
import { checkCrownCompatibility, type CrownPlatformInterface } from '@/domain/crown/compatibility';
import { crownSlotError, resolveCrownDefault, withCrownDefault, crownSpecificationForPart } from '@/domain/crown/selection';
import { createStarterBuild, type StarterBuildType } from '@/domain/configurator/defaultBuilds';
import { applyArchetypeVisualProfile } from '@/domain/configurator/archetypeProfiles';
import { prepareBomApply } from '@/domain/configurator/bomApply';
import { evaluateCandidate } from '@/domain/compatibility/compatibilityEngine';
import { migrateLegacyCrown, type EvidenceValue } from '@/domain/crown';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';

const item = (id = 'fine-fluted') => crownCatalogueItems.find(i => i.id === `cat-crown-${id}`)!;
const known = <T,>(value: T): EvidenceValue<T> => ({ status: 'known', value, evidence: { kind: 'drawing', source: 'Synthetic interface test fixture; not a production supplier claim' } });
const thread = () => ({ outerDiameterMm: known(.9), pitchMm: known(.225), supplierTapLabel: known('fixture') });
const platform = (): CrownPlatformInterface => ({ caseFamily: known('case-A'), tubeThread: thread(), stemThread: thread(), stemReference: known('0351-fixture'), stemHeightMm: known(1), engagementLengthMm: known(1), gasketEnvelopeMm: known(2) });
const fitFixture = () => {
  const assembly = createDefaultWatchAssembly();
  const spec = structuredClone(item().crownSpecification!);
  assembly.parts['inst-midcase']!.crownAxes = [{ schema: 'crown-axis/v1', axisId: 'crown-main', clockwiseFrom3hDeg: presentationEvidence(0), interfaceRadiusMm: presentationEvidence(20), stemHeightMm: presentationEvidence(1) }];
  const caseItem = { ...getCatalogueItem(assembly.parts['inst-midcase']!.catalogueItemId)!, id: 'test-crown-platform', crownInterface: platform() };
  registerCatalogueItem(caseItem); assembly.parts['inst-midcase']!.catalogueItemId = caseItem.id;
  spec.interfaces.caseTubeEngagement = { caseFamily: known('case-A'), thread: thread(), engagementLengthMm: known(1), gasketEnvelopeMm: known(2) };
  spec.interfaces.crownSocket.thread = thread();
  spec.interfaces.movementStem.stemReference = known('0351-fixture'); spec.interfaces.movementStem.movementId = known('nh35');
  spec.installation.stemHeightMm = known(1); spec.closure = known('push-pull');
  assembly.parts['inst-crown']!.crownSpecification = spec;
  return assembly;
};

describe('C2 defaults and fit', () => {
  beforeEach(() => { useWatchAssemblyStore.getState().setAssembly(createDefaultWatchAssembly()); useConfiguratorUIStore.setState({ lockedPartIds: new Set(), previewAssembly: null, previewCandidateItem: null, previewPartInstanceId: null }); });
  it.each(['diver', 'pilot', 'dress', 'ladies-dress', 'field', 'chronograph'] as StarterBuildType[])('gives %s a deterministic provisional crown', type => {
    const assembly = createStarterBuild(type).assembly;
    const expected = archetypeCrownDefaults[assembly.designConfig!.visualReferenceConfig!.archetypeId!];
    expect(assembly.parts['inst-crown']!.catalogueItemId).toBe(`cat-crown-${expected}`);
    expect(checkCrownCompatibility(assembly)[0]!.status).toBe('unknown');
    expect(assembly.designConfig?.crownChoice?.selected).toBeUndefined();
    expect(deserializeWatchAssembly(serializeWatchAssembly(assembly))).toEqual(assembly);
  });
  it.each(Object.keys(archetypeCrownDefaults))('resolves profile %s without physical certification', id => {
    const assembly = applyArchetypeVisualProfile(createDefaultWatchAssembly(), id);
    expect(assembly.parts['inst-crown']!.catalogueItemId).toBe(`cat-crown-${archetypeCrownDefaults[id]}`);
  });
  it('updates a recommendation across profile changes and preserves explicit saved choice', () => {
    let assembly = createStarterBuild('pilot').assembly;
    assembly = applyArchetypeVisualProfile(assembly, 'archetype-dive');
    expect(assembly.parts['inst-crown']!.catalogueItemId).toBe('cat-crown-knurled');
    assembly = applyCatalogueVisualSelection(assembly, 'inst-crown', item('smooth'));
    expect(createStarterBuild('field', assembly).assembly.parts['inst-crown']!.catalogueItemId).toBe('cat-crown-smooth');
    expect(applyArchetypeVisualProfile(assembly, 'archetype-pilot').parts['inst-crown']).toEqual(assembly.parts['inst-crown']);
  });
  it('uses exact supplied package before styling, then restores it after a case change', () => {
    const assembly = createDefaultWatchAssembly();
    const casePart = assembly.parts['inst-midcase']!;
    const original = getCatalogueItem(casePart.catalogueItemId)!;
    registerCatalogueItem({ ...original, id: 'test-case-supplied', suppliedCrown: { catalogueItemId: item('smooth').id, evidence: known('Exact fixture package contains crown') } });
    casePart.catalogueItemId = 'test-case-supplied';
    const supplied = withCrownDefault(assembly);
    expect(resolveCrownDefault(supplied).source).toBe('case-supplied');
    expect(supplied.parts['inst-crown']!.catalogueItemId).toBe('cat-crown-smooth');
    const changed = applyCatalogueVisualSelection(supplied, 'inst-midcase', getCatalogueItem('cat-case-nh05-ladies-dress-34')!);
    expect(changed.parts['inst-crown']!.catalogueItemId).not.toBe('cat-crown-smooth');
    const restored = applyCatalogueVisualSelection(changed, 'inst-midcase', getCatalogueItem('test-case-supplied')!);
    expect(restored.parts['inst-crown']!.catalogueItemId).toBe('cat-crown-smooth');
  });
  it('does not treat a visual approximation as a supplied package', () => {
    const assembly = createDefaultWatchAssembly(), casePart = assembly.parts['inst-midcase']!;
    registerCatalogueItem({ ...getCatalogueItem(casePart.catalogueItemId)!, id: 'test-case-photo', suppliedCrown: { catalogueItemId: item().id, evidence: presentationEvidence('photo') } });
    casePart.catalogueItemId = 'test-case-photo';
    expect(resolveCrownDefault(assembly).source).toBe('recommendation');
  });
  it('preserves legacy fixture geometry without automatic migration', () => {
    const assembly = createDefaultWatchAssembly(), crown = assembly.parts['inst-crown']!;
    crown.crownSpecification = migrateLegacyCrown(crown).specification;
    expect(resolveCrownDefault(assembly).source).toBe('legacy-preserved');
    expect(withCrownDefault(assembly)).toBe(assembly);
  });
  it.each(['cat-pushers', 'cat-strap-integration', 'cat-hour-hand'])('refuses wrong-kind %s through preview evaluation, Apply and BOM', id => {
    const assembly = createDefaultWatchAssembly(), wrong = getCatalogueItem(id)!;
    expect(wrong).toBeDefined();
    expect(crownSlotError(assembly, 'inst-crown', wrong)).toBeTruthy();
    expect(applyCatalogueVisualSelection(assembly, 'inst-crown', wrong)).toEqual(assembly);
    expect(evaluateCandidate({ assembly, targetPartInstanceId: 'inst-crown', candidateItem: wrong, candidateCatalogueItemId: wrong.id }).status).toBe('red');
    expect(() => prepareBomApply(assembly, 'inst-crown', [wrong], { catalogueItemId: 'cat-crown', replacementCatalogueItemId: wrong.id } as never)).toThrow();
    useWatchAssemblyStore.getState().setAssembly(assembly);
    useConfiguratorUIStore.getState().setPreview(assembly, 'inst-crown', wrong);
    expect(useConfiguratorUIStore.getState().applyPreview()).toBe(false);
    expect(useWatchAssemblyStore.getState().assembly).toBe(assembly);
  });
  it('rebuilds stale preview on current state and respects physical locks', () => {
    const original = createStarterBuild('ladies-dress').assembly;
    useWatchAssemblyStore.getState().setAssembly(original);
    useConfiguratorUIStore.getState().setPreview(applyCatalogueVisualSelection(original, 'inst-crown', item('smooth')), 'inst-crown', item('smooth'));
    const current = structuredClone(original); current.metadata.name = 'Edit after preview';
    useWatchAssemblyStore.getState().setAssembly(current);
    const applied = useConfiguratorUIStore.getState().applyPreview();
    expect(applied, useConfiguratorUIStore.getState().previewError ?? '').toBe(true);
    expect(useWatchAssemblyStore.getState().assembly.metadata.name).toBe('Edit after preview');
    current.parts['inst-crown']!.locked = true;
    useWatchAssemblyStore.getState().setAssembly(current);
    useConfiguratorUIStore.getState().setPreview(original, 'inst-crown', item());
    expect(useConfiguratorUIStore.getState().applyPreview()).toBe(false);
  });
  it('does not promote nominal agreement into verified fit', () => {
    expect(checkCrownCompatibility(fitFixture())[0]!.status).toBe('unknown');
    expect(checkCrownCompatibility(createDefaultWatchAssembly())[0]!.status).toBe('unknown');
  });
  it.each(['family', 'thread', 'height', 'movement', 'matched-cap'])('rejects known %s contradictions even with the same movement', field => {
    const assembly = fitFixture(), spec = assembly.parts['inst-crown']!.crownSpecification!;
    if (field === 'family') spec.interfaces.caseTubeEngagement.caseFamily = known('case-B');
    if (field === 'thread') spec.interfaces.caseTubeEngagement.thread.pitchMm = known(.5);
    if (field === 'height') spec.installation.stemHeightMm = known(2);
    if (field === 'movement') spec.interfaces.movementStem.movementId = known('nh05');
    if (field === 'matched-cap') { spec.protection = known('protective-cap'); spec.ownership = { ...spec.ownership, cap: 'crown-assembly', holder: 'case', matchedAssemblyId: 'cap-B' }; getCatalogueItem('test-crown-platform')!.crownInterface!.matchedAssemblyId = 'cap-A'; }
    expect(checkCrownCompatibility(assembly)[0]!.status).toBe('red');
  });
  it('changes grip without changing closure or mating interfaces', () => {
    const assembly = fitFixture(), before = assembly.parts['inst-crown']!.crownSpecification!;
    const changed = applyCatalogueVisualSelection(assembly, 'inst-crown', item('knurled'));
    expect(changed.parts['inst-crown']!.crownSpecification!.closure).toEqual(before.closure);
    expect(changed.parts['inst-crown']!.crownSpecification!.interfaces).toEqual(before.interfaces);
    expect(changed.parts['inst-crown']!.crownSpecification!.grip).toEqual(item('knurled').crownSpecification!.grip);
  });
  it('uses an evidence-backed platform recommendation before provisional style', () => {
    const assembly = createDefaultWatchAssembly(), casePart = assembly.parts['inst-midcase']!;
    registerCatalogueItem({ ...getCatalogueItem(casePart.catalogueItemId)!, id: 'test-case-recommendation', recommendedCrown: { catalogueItemId: item('smooth').id, evidence: known('Fixture platform recommendation') } });
    casePart.catalogueItemId = 'test-case-recommendation';
    expect(withCrownDefault(assembly).parts['inst-crown']!.catalogueItemId).toBe('cat-crown-smooth');
    expect(resolveCrownDefault(assembly).reason).toContain('Evidence-backed');
  });
  it('retains physical evidence and independent finish when detaching from an old case axis', () => {
    let assembly = fitFixture();
    const spec = assembly.parts['inst-crown']!.crownSpecification!;
    spec.finish = { mode: 'override', material: 'rose-gold', color: '#c08a76', texture: 'polished' };
    assembly.designConfig = { crownChoice: { schema: 'crown-choice/v1', selected: { crownInstanceId: 'inst-crown', source: 'explicit-user' } } };
    assembly = applyCatalogueVisualSelection(assembly, 'inst-midcase', getCatalogueItem('cat-case-nh05-ladies-dress-34')!);
    expect(assembly.parts['inst-crown']!.crownSpecification).toBeUndefined();
    expect(crownSpecificationForPart(assembly.parts['inst-crown'])).toEqual(spec);
    expect(checkCrownCompatibility(assembly)[0]!.status).toBe('unknown');
    const changed = applyCatalogueVisualSelection(assembly, 'inst-crown', item('smooth'));
    expect(crownSpecificationForPart(changed.parts['inst-crown'])!.finish).toEqual(spec.finish);
    expect(crownSpecificationForPart(changed.parts['inst-crown'])!.closure).toEqual(spec.closure);
    expect(deserializeWatchAssembly(serializeWatchAssembly(changed))).toEqual(changed);
  });
  it('keeps explicitly selected crown dimensions in a fresh compact starter', () => {
    const chosen = applyCatalogueVisualSelection(createDefaultWatchAssembly(), 'inst-crown', item('onion'));
    expect(createStarterBuild('ladies-dress', chosen).assembly.parts['inst-crown']!.dimensions).toEqual(chosen.parts['inst-crown']!.dimensions);
  });
  it('preserves authored legacy dimensions and finish even before selection metadata existed', () => {
    const assembly = createDefaultWatchAssembly(), crown = assembly.parts['inst-crown']!;
    crown.dimensions.diameterMm = 4.8; crown.color = '#bb1122'; crown.texture = 'polished';
    expect(resolveCrownDefault(assembly).source).toBe('legacy-preserved');
    const inherited = createStarterBuild('pilot', assembly).assembly.parts['inst-crown']!;
    expect(inherited.dimensions).toEqual(crown.dimensions);
    expect(inherited.color).toBe(crown.color);
    expect(inherited.texture).toBe(crown.texture);
  });
  it('refuses case changes that would move a physically locked crown', () => {
    const assembly = createDefaultWatchAssembly(); assembly.parts['inst-crown']!.locked = true;
    const candidate = getCatalogueItem('cat-case-nh05-ladies-dress-34')!;
    expect(crownSlotError(assembly, 'inst-midcase', candidate)).toContain('Unlock');
    expect(applyCatalogueVisualSelection(assembly, 'inst-midcase', candidate)).toEqual(assembly);
  });
  it('keeps unrelated build failures visible while allowing a concept crown preview', () => {
    const assembly = createDefaultWatchAssembly();
    const evaluation = evaluateCandidate({ assembly, targetPartInstanceId: 'inst-crown', candidateItem: item(), candidateCatalogueItemId: item().id });
    expect(evaluation.status).toBe('unknown');
    expect(evaluation.checks.some(c => c.category === 'crown-interface' && c.status === 'unknown')).toBe(true);
  });
  it('rejects malformed detached evidence rather than laundering it through a catalogue fallback', () => {
    const assembly = createDefaultWatchAssembly();
    assembly.parts['inst-crown']!.customProperties = { detachedCrownSpecification: { schema: 'crown-spec/v1' } };
    expect(checkCrownCompatibility(assembly)[0]!.status).toBe('red');
  });
  it('evaluates a real replacement crown using its own physical evidence', () => {
    const assembly = fitFixture();
    const replacement = structuredClone(item()); replacement.id = 'test-physical-crown'; replacement.metadata.tags = ['crown', 'supplier'];
    replacement.crownSpecification = structuredClone(assembly.parts['inst-crown']!.crownSpecification!);
    replacement.crownSpecification.interfaces.caseTubeEngagement.caseFamily = known('case-B');
    const evaluation = evaluateCandidate({ assembly, targetPartInstanceId: 'inst-crown', candidateItem: replacement, candidateCatalogueItemId: replacement.id });
    expect(evaluation.status).toBe('red');
    expect(evaluation.checks.some(c => c.code === 'CROWN_INTERFACE_MISMATCH')).toBe(true);
  });
  it('rejects a known closure contradiction and rejects wrong-kind crowns in other slots', () => {
    const assembly = fitFixture();
    getCatalogueItem('test-crown-platform')!.crownInterface!.closure = known('screw-down');
    expect(checkCrownCompatibility(assembly)[0]!.status).toBe('red');
    expect(crownSlotError(assembly, 'inst-midcase', item())).toBeTruthy();
  });
});
