import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { applyCatalogueVisualSelection, visualVariantCatalogueItems } from '@/domain/catalogue';
import { parseAliExpressCapture, supplierListingFromCapture } from '@/domain/sourcing';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';
import { isListingPriceStale, listingKnownLandedZar } from '@/domain/catalogue/pricing';
import { validateAssemblyCatalogueReferences } from '@/domain/catalogue/catalogueValidation';

const variant = (id: string) => visualVariantCatalogueItems.find((item) => item.id === id)!;

describe('catalogue visual selections', () => {
  it('overrides an archetype with the selected 42mm knurled bezel GLB', () => {
    const base = createDefaultWatchAssembly();
    base.globalDimensions.caseDiameterMm = 42;
    base.designConfig = { ...base.designConfig, visualReferenceConfig: { archetypeId: 'archetype-dive' } };
    const selected = applyCatalogueVisualSelection(base, 'inst-rotating-bezel', variant('cat-bezel-knurled-42'));
    const model = watchAssemblyToVisualModel(selected);
    expect(model.assets.bezel.assetId).toBe('bezel-knurled-42mm-v1');
    expect(model.bezelProfile).toBe('knurled');
    expect(validateAssemblyCatalogueReferences(selected).valid).toBe(true);
  });

  it('selects the Mercedes hand asset instead of the archetype hand asset', () => {
    const base = createDefaultWatchAssembly();
    base.globalDimensions.caseDiameterMm = 42;
    base.designConfig = { ...base.designConfig, visualReferenceConfig: { archetypeId: 'archetype-dive' } };
    const selected = applyCatalogueVisualSelection(base, 'inst-hour-hand', variant('cat-hands-mercedes-set-nh35'));
    const model = watchAssemblyToVisualModel(selected);
    expect(model.assets.hands.assetId).toBe('hands-mercedes-42');
    expect(model.hands.style).toBe('mercedes');
  });

  it('keeps the selected hand GLB and both dial colours in sync with live edits', () => {
    const base = createDefaultWatchAssembly();
    base.globalDimensions.caseDiameterMm = 42;
    base.designConfig = {
      ...base.designConfig,
      visualReferenceConfig: { archetypeId: 'archetype-dive' },
      dialFaceConfig: { ...base.designConfig?.dialFaceConfig, color: '#B33951' }
    };
    const selected = applyCatalogueVisualSelection(base, 'inst-minute-hand', variant('cat-hands-mercedes-set-nh35'));
    const model = watchAssemblyToVisualModel(selected);
    expect(model.assets.hands.assetId).toBe('hands-mercedes-42');
    expect(model.hands.style).toBe('mercedes');
    expect(model.dialColor).toBe('#B33951');
    expect(model.archetypeAppearance.dialColor).toBe('#B33951');
  });

  it('switches main hand assets repeatedly and returns to the archetype GLB', () => {
    const base = createDefaultWatchAssembly();
    base.globalDimensions.caseDiameterMm = 42;
    const references = { archetypeId: 'archetype-dive', componentAssetOverrides: { hands: 'hands-baton-42' } };
    base.designConfig = { ...base.designConfig, visualReferenceConfig: references };
    expect(watchAssemblyToVisualModel(base).assets.hands.assetId).toBe('hands-baton-42');
    references.componentAssetOverrides.hands = 'hands-mercedes-42';
    expect(watchAssemblyToVisualModel(base).assets.hands.assetId).toBe('hands-mercedes-42');
    references.componentAssetOverrides.hands = 'hands-baton-42';
    expect(watchAssemblyToVisualModel(base).assets.hands.assetId).toBe('hands-baton-42');
    base.designConfig.visualReferenceConfig = { archetypeId: 'archetype-dive', componentAssetOverrides: {} };
    expect(watchAssemblyToVisualModel(base).assets.hands.assetId).toBe('archetype-hands-diver');
  });

  it('uses a procedural radial material for a selected sunburst dial', () => {
    const selected = applyCatalogueVisualSelection(createDefaultWatchAssembly(), 'inst-dial-blank', variant('cat-dial-sunburst-blue-285'));
    const model = watchAssemblyToVisualModel(selected);
    expect(model.assets.dial.assetId).toBe('dial-sterile-285');
    expect(model.dial.textureKind).toBe('sunburst');
  });

  it('registers every independent hand, bezel and dial family as a GLB option', () => {
    const families = {
      hands: visualVariantCatalogueItems.filter((item) => item.id.startsWith('cat-hands-') && item.id !== 'cat-hands-nh05-dress-baton'),
      bezels: visualVariantCatalogueItems.filter((item) => item.id.startsWith('cat-bezel-') && item.id.endsWith('-42')),
      dials: visualVariantCatalogueItems.filter((item) => item.id.startsWith('cat-dial-') && item.id.endsWith('-285'))
    };
    expect(families.hands).toHaveLength(9);
    expect(families.bezels).toHaveLength(9);
    expect(families.dials).toHaveLength(9);
    expect(Object.values(families).flat().every((item) => item.visual?.representation === 'glb')).toBe(true);
  });

  it('updates the master case envelope when a dedicated case GLB is applied', () => {
    const selected = applyCatalogueVisualSelection(createDefaultWatchAssembly(), 'inst-midcase', variant('cat-case-namoki-nmk920-tuna-47'));
    expect(selected.globalDimensions).toMatchObject({ caseDiameterMm: 47, totalThicknessMm: 11.3 });
    expect(watchAssemblyToVisualModel(selected).assets.case.assetId).toBe('case-namoki-nmk920-tuna-47');
  });
});

describe('AliExpress capture import', () => {
  it('keeps item and shipping prices separate with capture provenance', () => {
    const capture = parseAliExpressCapture({
      schema: 'dial-designer/aliexpress-capture/v1', source: 'aliexpress',
      sourceUrl: 'https://www.aliexpress.com/item/1005000000000000.html', itemId: '1005000000000000',
      title: 'Watch case', sellerName: 'Example Store', variant: '42mm black', destination: 'South Africa',
      itemPrice: { amount: 399, currency: 'zar' }, shipping: { amount: 210, currency: 'zar' },
      capturedAtIso: '2026-09-26T12:00:00+02:00'
    });
    const listing = supplierListingFromCapture(capture, 'cat-case-skx007');
    expect(listing.unitPrice).toBe(399);
    expect(listing.shippingPrice).toBe(210);
    expect(listing.lastCheckedIso).toBe('2026-09-26T12:00:00+02:00');
    expect(listing.verificationStatus).toBe('unverified');
    expect(listingKnownLandedZar(listing)).toBe(609);
    expect(isListingPriceStale(listing, new Date('2026-10-11T12:00:01+02:00'))).toBe(true);
  });
});
