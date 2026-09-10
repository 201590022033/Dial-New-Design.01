import { defaultCatalogueItems } from '@/domain/catalogue/catalogueRegistry';
import { getListingsForCatalogueItem } from '@/domain/catalogue/supplierListingRegistry';
import type {
  WatchAssembly,
  WatchAssemblyMetadata,
  WatchAssemblyPartInstance
} from './assemblyTypes';

export const WATCH_ASSEMBLY_VERSION = '2.0.0';

export const createDefaultAssemblyMetadata = (): WatchAssemblyMetadata => {
  const nowIso = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: 'Custom Watch Design',
    revision: 'A',
    designer: 'Watchmaker',
    material: '316L Stainless Steel',
    movement: 'nh35',
    notes: 'Configured with automatic calibre NH35 and modular dial assembly.',
    createdAtIso: nowIso,
    updatedAtIso: nowIso
  };
};

export const createDefaultWatchAssembly = (): WatchAssembly => {
  const parts: Record<string, WatchAssemblyPartInstance> = {};
  const partOrder: string[] = [];

  // Order category layers from bottom (case/movement) to top (crystal/bezel/hands)
  const categoryZOrder: Record<string, number> = {
    case: 10,
    rings: 20,
    dial: 30,
    indices: 40,
    complications: 50,
    typography: 60,
    hands: 70,
    external: 80
  };

  defaultCatalogueItems.forEach((catItem, index) => {
    const instanceId = `inst-${catItem.kind}`;
    const baseZ = categoryZOrder[catItem.category] ?? 50;
    const listings = getListingsForCatalogueItem(catItem.id);

    parts[instanceId] = {
      instanceId,
      catalogueItemId: catItem.id,
      name: catItem.displayName,
      category: catItem.category,
      visible: true,
      locked: false,
      layerIndex: baseZ * 10 + index,
      material: catItem.defaultMaterial,
      color: index % 2 === 0 ? '#E2E8F0' : '#CBD5E1',
      texture: catItem.defaultTexture,
      dimensions: {
        diameterMm: catItem.nominalDimensions.diameterMm,
        widthMm: catItem.nominalDimensions.widthMm,
        thicknessMm: catItem.nominalDimensions.thicknessMm,
        offsetXmm: catItem.nominalDimensions.offsetXmm ?? 0,
        offsetYmm: catItem.nominalDimensions.offsetYmm ?? 0
      },
      typography: {
        fontFamily: '"IBM Plex Mono", monospace',
        fontSizeMm: catItem.category === 'typography' ? 1.4 : 1.1,
        tracking: 0
      },
      selectedSupplierListingId: listings[0]?.id ?? null,
      customProperties: {}
    };

    partOrder.push(instanceId);
  });

  // Sort partOrder by layerIndex
  partOrder.sort((a, b) => (parts[a]?.layerIndex ?? 0) - (parts[b]?.layerIndex ?? 0));

  return {
    version: WATCH_ASSEMBLY_VERSION,
    metadata: createDefaultAssemblyMetadata(),
    globalDimensions: {
      caseDiameterMm: 40.0,
      totalThicknessMm: 12.5,
      bandGapMm: 0.15,
      manufacturingToleranceMm: 0.05,
      laserKerfMm: 0.08
    },
    parts,
    partOrder,
    selectedColorPalette: {
      primary: '#0F172A',
      secondary: '#334155',
      accent: '#F59E0B'
    },
    templateId: 'classic-dress'
  };
};
