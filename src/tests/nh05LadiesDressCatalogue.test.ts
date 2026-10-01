import { describe, expect, it } from 'vitest';
import { catalogueItemById } from '@/domain/catalogue/catalogueRegistry';
import { applyCatalogueVisualSelection } from '@/domain/catalogue/applyCatalogueVisualSelection';
import { researchedSupplierListings } from '@/domain/catalogue/researchedSupplierListings';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';

describe('NH05 ladies dress catalogue', () => {
  it('provides a provisional 34 mm case GLB without claiming supplier-exact geometry', () => {
    const item = catalogueItemById.get('cat-case-nh05-ladies-dress-34')!;
    expect(item.visual).toMatchObject({ assetId: 'case-nh05-ladies-dress-34', representation: 'glb', status: 'provisional' });
    expect(item.engineeringSpecs?.case).toMatchObject({ dialSeatDiameterMm: 24.5, supportedMovementIds: ['nh05', 'nh06'] });
    expect(item.exportEnabled).toBe(false);
  });

  it('offers four 24.5 mm dress-dial directions tied only to NH05', () => {
    const dials = [...catalogueItemById.values()].filter((item) => item.id.startsWith('cat-dial-nh05-245-'));
    expect(dials).toHaveLength(4);
    expect(dials.every((dial) => dial.engineeringSpecs?.dial?.compatibleCalibres?.includes('nh05'))).toBe(true);
  });

  it('renders the compact provisional NH05 dress hand GLB in Visual mode', () => {
    const assembly = createDefaultWatchAssembly();
    assembly.metadata.movement = 'nh05';
    assembly.globalDimensions.caseDiameterMm = 34;
    const dial = assembly.parts['inst-dial-blank']!;
    dial.dimensions.diameterMm = 24.5;
    const handSet = catalogueItemById.get('cat-hands-nh05-dress-baton')!;
    const selected = applyCatalogueVisualSelection(assembly, 'inst-hour-hand', handSet);
    const model = watchAssemblyToVisualModel(selected);
    expect(model.assets.hands).toMatchObject({ assetId: 'hands-baton-nh05-34', assetType: 'glb' });
    expect(model.hands).toMatchObject({ hourLengthMm: 6.125, minuteLengthMm: 8.82, secondLengthMm: 9.555, hourWidthMm: 0.55, minuteWidthMm: 0.35, secondWidthMm: 0.12 });
  });

  it('does not invent case or shipping prices', () => {
    const caseListing = researchedSupplierListings.find((listing) => listing.catalogueItemId === 'cat-case-nh05-ladies-dress-34')!;
    expect(caseListing.unitPrice).toBeNull();
    expect(caseListing.shippingPrice).toBeNull();
    expect(caseListing.shippingDestination).toBe('South Africa');
  });
});
