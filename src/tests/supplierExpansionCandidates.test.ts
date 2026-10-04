import { describe, expect, it } from 'vitest';
import { supplierExpansionCandidateItems as items, supplierExpansionCandidateListings as offers, NH36_DRAWING_URL } from '@/domain/catalogue/supplierExpansionCandidates';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import { useCatalogueStore } from '@/stores/catalogueStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { applyCatalogueVisualSelection } from '@/domain/catalogue/applyCatalogueVisualSelection';
import { listingKnownLandedZar } from '@/domain/catalogue/pricing';

describe('Supplier expansion evidence and safe catalogue integration', () => {
  it('registers all five distinct products and timestamped non-demo offers', () => {
    expect(items).toHaveLength(5);
    for (const item of items) {
      expect(getCatalogueItem(item.id)).toEqual(item);
      expect(useCatalogueStore.getState().getItem(item.id)).toEqual(item);
      expect(item.exportEnabled).toBe(false);
      expect(item.status).toBe('draft');
      expect(item.engineeringSpecs).toBeUndefined();
    }
    for (const offer of offers) {
      expect(items.some(i => i.id === offer.catalogueItemId)).toBe(true);
      expect(offer.provenance.isDemonstrationFixture).toBe(false);
      expect(Number.isFinite(Date.parse(offer.lastCheckedIso!))).toBe(true);
      expect(offer.verificationStatus).toBe('unverified');
      expect(listingKnownLandedZar(offer)).toBeNull();
    }
  });
  it('does not turn unknown caseback diameter into an applied zero-size part', () => {
    const assembly = createDefaultWatchAssembly();
    const item = items.find(i => i.id === 'cat-research-namoki-slim-sapphire-back')!;
    const ui = useConfiguratorUIStore.getState();
    expect(applyCatalogueVisualSelection(assembly, 'inst-caseback', item)).toEqual(assembly);
    ui.setPreview(assembly, 'inst-caseback', item);
    expect(useConfiguratorUIStore.getState().previewAssembly).toBeNull();
    expect(useConfiguratorUIStore.getState().previewError).toContain('Research-only');
    expect(ui.applyPreview()).toBe(false);
    ui.cancelPreview();
  });
  it('keeps movement body, spacer and seller variant evidence distinct', () => {
    const item = items.find(i => i.kind === 'movement')!;
    expect(item.nominalDimensions).toMatchObject({ diameterMm: 27.4, thicknessMm: 5.32 });
    expect(item.metadata.notes).toContain('29.36mm');
    expect(item.researchOnly).toBe(true);
    expect(offers.find(o => o.catalogueItemId === item.id)?.engineeringEvidence?.drawingUrl).toBe(NH36_DRAWING_URL);
  });
  it('wires silver sunburst dial to the shared provisional renderer without an exact-match claim', () => {
    const assembly = createDefaultWatchAssembly();
    const dial = items.find(i => i.kind === 'dial-blank')!;
    const next = applyCatalogueVisualSelection(assembly, 'inst-dial-blank', dial);
    expect(next.designConfig?.visualReferenceConfig?.componentAssetOverrides?.dial).toBe('visual-dial-default');
    expect(next.designConfig?.dialFaceConfig?.color).toBe('#c4c8cd');
    expect(next.designConfig?.dialFaceConfig?.texture?.kind).toBe('sunburst');
    expect(next.parts['inst-dial-blank']?.dimensions.diameterMm).toBe(28.5);
  });
});
