import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { createStarterBuild } from '@/domain/configurator/defaultBuilds';
import { prepareBomApply } from '@/domain/configurator/bomApply';
import { applyBomSelection } from '@/stores/applyBomSelection';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useCatalogueStore } from '@/stores/catalogueStore';
import { useSourcingStore } from '@/stores/sourcingStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';

describe('BOM Apply authoritative component wiring', () => {
  beforeEach(() => {
    useWatchAssemblyStore.getState().setAssembly(createStarterBuild('ladies-dress', createDefaultWatchAssembly()).assembly);
    useSourcingStore.getState().resetSourcingPlan();
    useConfiguratorUIStore.setState({ lockedPartIds: new Set(), previewAssembly: null, archetypePreviewAssembly: null });
  });
  it('applies the actual white matte dial, updates Options and retains its exact quote', () => {
    applyBomSelection('inst-dial-blank', 'budget-tandorio-nh05-dial-white-for-champagne');
    const store = useWatchAssemblyStore.getState();
    expect(store.assembly.parts['inst-dial-blank']!.catalogueItemId).toBe('cat-research-tandorio-nh05-dial-white-245');
    expect(store.assembly.parts['inst-dial-blank']!.color).toBe('#f2f2ed');
    expect(store.assembly.designConfig?.visualReferenceConfig?.componentAssetOverrides?.dial).toBe('dial-nh05-white-matte-245');
    expect(store.dirty).toBe(true);
    expect(useConfiguratorUIStore.getState()).toMatchObject({ activePartInstanceId: 'inst-dial-blank', trayTab: 'options', workMode: 'parts' });
    expect(useConfiguratorUIStore.getState().getCommittedCost().lineItems.find(l => l.component === 'Dial')?.nativePrice).toBe(13.28);
  });
  it('replaces all three main hands and keeps a single rose-gold set purchase', () => {
    applyBomSelection('inst-hour-hand', 'budget-tandorio-nh05-hands-rose-for-dress');
    const assembly = useWatchAssemblyStore.getState().assembly;
    for (const [id, length] of [['inst-hour-hand', 5], ['inst-minute-hand', 8], ['inst-central-seconds', 8]] as const) {
      expect(assembly.parts[id]!.visual?.assetId).toBe('hands-nh05-luminous-588');
      expect(assembly.parts[id]!.dimensions.diameterMm).toBe(length);
      expect(useSourcingStore.getState().sourcingPlan.selections[id]).toBe('budget-tandorio-nh05-hands-rose-for-dress');
    }
    expect(assembly.designConfig?.visualReferenceConfig?.handsFinish).toBe('rose-gold');
    const rows = useConfiguratorUIStore.getState().getCommittedCost().lineItems.filter(l => l.component.startsWith('Main hand set'));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.nativePrice).toBe(9.08);
    applyBomSelection('inst-hour-hand', 'research-tandorio-nh05-hands-black-588');
    expect(useWatchAssemblyStore.getState().assembly.designConfig?.visualReferenceConfig).toMatchObject({ handsFinish: 'auto', handsColor: '#171717' });
    expect(useWatchAssemblyStore.getState().assembly.parts['inst-hour-hand']!.color).toBe('#171717');
  });
  it('updates the case envelope and GLB without promoting supplier evidence to verified', () => {
    const partId = Object.values(useWatchAssemblyStore.getState().assembly.parts).find(p => p.catalogueItemId === 'cat-case-nh05-ladies-dress-34')!.instanceId;
    applyBomSelection(partId, 'research-tandorio-nh05-rose-case-16');
    const assembly = useWatchAssemblyStore.getState().assembly;
    expect(assembly.globalDimensions.totalThicknessMm).toBe(12);
    expect(assembly.designConfig?.visualReferenceConfig?.caseFinish).toBe('rose-gold');
    expect(assembly.parts[partId]!.visual?.assetId).toBe('case-tandorio-nh05-research-34');
    expect(assembly.parts[partId]!.customProperties?.engineeringSpecs).toBeUndefined();
    expect(useConfiguratorUIStore.getState().getCommittedCost().lineItems.find(l => l.component === 'Case')?.nativePrice).toBe(75.52);
  });
  it('uses the canonical crystal slot and hides competing crystal geometry', () => {
    const assembly = createDefaultWatchAssembly();
    const result = prepareBomApply(assembly, 'inst-flat-sapphire', useCatalogueStore.getState().items);
    expect(result.targetId).toBe('inst-crystal');
    expect(result.assembly.parts['inst-crystal']!.catalogueItemId).toBe(assembly.parts['inst-flat-sapphire']!.catalogueItemId);
    expect(result.assembly.parts['inst-flat-sapphire']!.visible).toBe(false);
    expect(result.assembly.designConfig?.bomPartSelections?.crystal).toBe('inst-crystal');
  });
  it('does not bypass a locked minute hand or mutate a price-only movement row', () => {
    const before = useWatchAssemblyStore.getState().assembly;
    useConfiguratorUIStore.setState({ lockedPartIds: new Set(['inst-minute-hand']) });
    expect(() => applyBomSelection('inst-hour-hand', 'budget-tandorio-nh05-hands-rose-for-dress')).toThrow('Unlock');
    expect(useWatchAssemblyStore.getState().assembly).toBe(before);
    expect(() => applyBomSelection('movement-calibre')).toThrow('price-only');
  });
});
