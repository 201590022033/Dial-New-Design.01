import { describe, expect, it } from 'vitest';
import {
  defaultCatalogueItems,
  getCatalogueItem,
  getCatalogueItemByKind
} from '@/domain/catalogue/catalogueRegistry';
import { getListingsForCatalogueItem } from '@/domain/catalogue/supplierListingRegistry';
import { watchComponentDefinitions } from '@/domain/watch-components/registry';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import {
  serializeWatchAssembly,
  deserializeWatchAssembly,
  assertNoTransientState,
  migrateLegacyProjectToAssembly,
  exportAssemblyToLegacyProject
} from '@/domain/assembly/assemblySerialization';
import {
  assemblyToBands,
  assemblyToWatchComponentEntities
} from '@/domain/assembly/assemblyAdapters';
import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useCatalogueStore } from '@/stores/catalogueStore';
import { useBandsStore } from '@/stores/bandsStore';
import { useWatchComponentStore } from '@/stores/watchComponentStore';

describe('Watch Designer Phase 1 & 2: Domain Schema & WatchAssembly Architecture', () => {
  // Test 1: Every existing default component maps to a valid catalogue item
  it('maps every existing default watch component definition to a valid catalogue item', () => {
    expect(defaultCatalogueItems.length).toBe(43);

    for (const legacyDef of watchComponentDefinitions) {
      const catItem = getCatalogueItemByKind(legacyDef.kind);
      expect(catItem).toBeDefined();
      expect(catItem?.kind).toBe(legacyDef.kind);
      expect(catItem?.displayName).toBe(legacyDef.displayName);
      expect(catItem?.defaultMaterial).toBe(legacyDef.defaultMaterial);
      expect(catItem?.defaultTexture).toBe(legacyDef.defaultTexture);
      expect(catItem?.status).toBe('verified');
      expect(catItem?.nominalDimensions.diameterMm).toBeGreaterThan(0);
      expect(catItem?.nominalDimensions.thicknessMm).toBeGreaterThan(0);
      expect(catItem?.manufacturing.minimumFeatureMm).toBeGreaterThan(0);
    }

    // Also verify dial-blank is registered as the 43rd item
    const dialBlank = getCatalogueItemByKind('dial-blank');
    expect(dialBlank).toBeDefined();
    expect(dialBlank?.category).toBe('dial');
  });

  // Test 2: Catalogue items exist independently from WatchAssembly
  it('ensures catalogue items exist independently from WatchAssembly', () => {
    const catalogueStore = useCatalogueStore.getState();
    expect(catalogueStore.items.length).toBe(43);

    const item = catalogueStore.getItem('cat-hour-hand');
    expect(item).toBeDefined();
    expect(item?.displayName).toBe('Hour Hand');

    // Updating a catalogue item status in isolation does not require or mutate WatchAssembly
    catalogueStore.updateItemStatus('cat-hour-hand', 'published');
    const updated = useCatalogueStore.getState().getItem('cat-hour-hand');
    expect(updated?.status).toBe('published');

    // Reset back to verified
    catalogueStore.updateItemStatus('cat-hour-hand', 'verified');
  });

  // Test 3: Assembly instances reference catalogue items
  it('ensures assembly instances reference valid catalogue items', () => {
    const assembly = createDefaultWatchAssembly();

    expect(assembly.partOrder.length).toBeGreaterThan(0);
    expect(Object.keys(assembly.parts).length).toBe(assembly.partOrder.length);

    for (const instanceId of assembly.partOrder) {
      const instance = assembly.parts[instanceId];
      expect(instance).toBeDefined();
      if (!instance) continue;
      expect(instance.instanceId).toBe(instanceId);

      // Verify foreign key reference to catalogue
      const catItem = getCatalogueItem(instance.catalogueItemId);
      expect(catItem).toBeDefined();
      expect(catItem?.id).toBe(instance.catalogueItemId);
    }
  });

  // Test 4: Multiple supplier listings may reference one catalogue item
  it('allows multiple supplier listings to reference the same catalogue item', () => {
    const dialListings = getListingsForCatalogueItem('cat-dial-blank');
    expect(dialListings.length).toBeGreaterThanOrEqual(2);

    const suppliers = dialListings.map((l) => l.supplierName);
    expect(suppliers).toContain('NamokiMODS');
    expect(suppliers.some((s) => s.includes('AliExpress'))).toBe(true);

    const hourHandListings = getListingsForCatalogueItem('cat-hour-hand');
    expect(hourHandListings.length).toBeGreaterThanOrEqual(2);

    const sapphireListings = getListingsForCatalogueItem('cat-double-domed-sapphire');
    expect(sapphireListings.length).toBeGreaterThanOrEqual(2);
  });

  // Test 5: Supplier changes do not change design state or physical dimensions
  it('ensures changing supplier listings does not mutate design geometry or physical dimensions', () => {
    const store = useWatchAssemblyStore.getState();
    store.resetAssembly();

    const initialPart = store.assembly.parts['inst-dial-blank'];
    expect(initialPart).toBeDefined();
    if (!initialPart) return;

    const originalDiameter = initialPart.dimensions.diameterMm;
    const originalThickness = initialPart.dimensions.thicknessMm;
    const originalMaterial = initialPart.material;
    const originalColor = initialPart.color;
    const originalLayerIndex = initialPart.layerIndex;

    // Switch supplier from Namoki to AliExpress
    store.setPartSupplier('inst-dial-blank', 'supp-dial-blank-aliexpress');

    const updatedPart = useWatchAssemblyStore.getState().assembly.parts['inst-dial-blank'];
    expect(updatedPart).toBeDefined();
    if (!updatedPart) return;
    expect(updatedPart.selectedSupplierListingId).toBe('supp-dial-blank-aliexpress');

    // Assert that design dimensions and styling are completely unmutated
    expect(updatedPart.dimensions.diameterMm).toBe(originalDiameter);
    expect(updatedPart.dimensions.thicknessMm).toBe(originalThickness);
    expect(updatedPart.material).toBe(originalMaterial);
    expect(updatedPart.color).toBe(originalColor);
    expect(updatedPart.layerIndex).toBe(originalLayerIndex);
  });

  // Test 6: WatchAssembly JSON round-trips without data loss
  it('round-trips WatchAssembly JSON cleanly without data loss', () => {
    const store = useWatchAssemblyStore.getState();
    store.resetAssembly();

    store.updateMetadata({
      name: 'Chronometer Prototype Mark I',
      designer: 'Master Watchmaker',
      revision: 'B'
    });
    store.updateGlobalDimensions({
      caseDiameterMm: 41.5,
      totalThicknessMm: 13.2
    });

    const currentAssembly = useWatchAssemblyStore.getState().assembly;
    const serialized = serializeWatchAssembly(currentAssembly);
    expect(typeof serialized).toBe('string');

    const deserialized = deserializeWatchAssembly(serialized);
    expect(deserialized.version).toBe(currentAssembly.version);
    expect(deserialized.metadata.name).toBe('Chronometer Prototype Mark I');
    expect(deserialized.metadata.designer).toBe('Master Watchmaker');
    expect(deserialized.metadata.revision).toBe('B');
    expect(deserialized.globalDimensions.caseDiameterMm).toBe(41.5);
    expect(deserialized.globalDimensions.totalThicknessMm).toBe(13.2);
    expect(deserialized.partOrder.length).toBe(currentAssembly.partOrder.length);
    expect(deserialized.parts['inst-dial-blank']).toEqual(currentAssembly.parts['inst-dial-blank']);
  });

  // Test 7: Transient UI/session state is not serialized
  it('strictly excludes transient UI/session state from serialized WatchAssembly document', () => {
    const assembly = createDefaultWatchAssembly();

    // Verify valid assembly passes transient check
    expect(() => assertNoTransientState(assembly)).not.toThrow();

    const serialized = serializeWatchAssembly(assembly);

    // Verify banned transient keys do NOT appear in the JSON
    expect(serialized).not.toContain('"zoom"');
    expect(serialized).not.toContain('"panX"');
    expect(serialized).not.toContain('"panY"');
    expect(serialized).not.toContain('"selectedBandId"');
    expect(serialized).not.toContain('"selectedComponentId"');
    expect(serialized).not.toContain('"hoveredComponentId"');
    expect(serialized).not.toContain('"selectionFilter"');
    expect(serialized).not.toContain('"previewMode"');
    expect(serialized).not.toContain('"openSections"');

    // Attempting to serialize an object with transient UI properties throws
    const contaminated = {
      ...assembly,
      zoom: 1.5,
      panX: 20
    };
    expect(() => serializeWatchAssembly(contaminated as unknown as WatchAssembly)).toThrow(
      /Transient UI\/session field/
    );
  });

  // Test 8: Legacy design/render behavior remains functional via adapters
  it('bridges WatchAssembly to legacy BandEntity and WatchComponentEntity representations', () => {
    const assembly = createDefaultWatchAssembly();

    // 1. Bridge to BandEntity[]
    const bands = assemblyToBands(assembly);
    expect(bands.length).toBe(4);
    expect(bands.map((b) => b.kind)).toEqual([
      'dial-face',
      'chapter-ring',
      'inner-bezel',
      'outer-bezel'
    ]);
    const b0 = bands[0];
    const b1 = bands[1];
    const b3 = bands[3];
    expect(b0).toBeDefined();
    expect(b1).toBeDefined();
    expect(b3).toBeDefined();
    if (!b0 || !b1 || !b3) return;
    expect(b0.geometry.innerRadius).toBe(0);
    expect(b0.geometry.outerRadius).toBeGreaterThan(0);
    expect(b1.geometry.innerRadius).toBe(b0.geometry.outerRadius);
    expect(b3.geometry.outerRadius).toBe(assembly.globalDimensions.caseDiameterMm / 2);

    // Update bands store and verify compatibility
    useBandsStore.getState().setBandsSnapshot(bands);
    expect(useBandsStore.getState().bands.length).toBe(4);

    // 2. Bridge to WatchComponentEntity[]
    const legacyEntities = assemblyToWatchComponentEntities(assembly);
    expect(legacyEntities.length).toBe(assembly.partOrder.length);
    expect(legacyEntities.every((e) => e.exportEnabled)).toBe(true);

    // Update watchComponentStore via syncFromAssembly
    useWatchComponentStore.getState().syncFromAssembly(assembly);
    expect(useWatchComponentStore.getState().components.length).toBe(legacyEntities.length);
  });

  // Test 9: Legacy project migration adapter
  it('migrates legacy project file format into canonical WatchAssembly and back', () => {
    const assembly = createDefaultWatchAssembly();
    assembly.globalDimensions.caseDiameterMm = 42;

    const legacyProject = exportAssemblyToLegacyProject(assembly);
    expect(legacyProject.geometry.caseDiameterMm).toBe(42);
    expect(legacyProject.bands.length).toBe(4);

    const migratedAssembly = migrateLegacyProjectToAssembly(legacyProject);
    expect(migratedAssembly.globalDimensions.caseDiameterMm).toBe(42);
    expect(migratedAssembly.parts['inst-dial-blank']).toBeDefined();
  });
});
