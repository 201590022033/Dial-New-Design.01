import { describe, expect, it } from 'vitest';
import {
  defaultCatalogueItems,
  getCatalogueItem,
  getCatalogueItemByKind
} from '@/domain/catalogue/catalogueRegistry';
import {
  defaultSupplierListings,
  getListingsForCatalogueItem,
  filterProductionListings
} from '@/domain/catalogue/supplierListingRegistry';
import {
  CatalogueReferenceError,
  validateAssemblyCatalogueReferences,
  mapLegacyComponentToCatalogueId
} from '@/domain/catalogue/catalogueValidation';
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
import { useWatchComponentStore } from '@/stores/watchComponentStore';
import { useGlobalSettingsStore } from '@/stores/globalSettingsStore';
import { useDesignEngineStore } from '@/stores/designEngineStore';
import { useSourcingStore } from '@/stores/sourcingStore';
import '@/stores/storeSync';
import { defaultMarkerConfig } from '@/domain/generators/markerEngine';
import { defaultTypographyConfig } from '@/domain/generators/typographyEngine';

describe('Watch Designer Foundation: Authoritative Architecture & Decoupled Domain', () => {
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

    catalogueStore.updateItemStatus('cat-hour-hand', 'published');
    const updated = useCatalogueStore.getState().getItem('cat-hour-hand');
    expect(updated?.status).toBe('published');

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

  // Test 5 (Repair 3): Supplier selection lives in WatchSourcingPlan and does NOT mutate WatchAssembly
  it('ensures changing supplier listings lives in WatchSourcingPlan and causes ZERO mutation to WatchAssembly', () => {
    useWatchAssemblyStore.getState().resetAssembly();
    const currentAssembly = useWatchAssemblyStore.getState().assembly;

    const sourcingStore = useSourcingStore.getState();
    sourcingStore.resetSourcingPlan(currentAssembly.metadata.id);

    const initialAssemblyJson = serializeWatchAssembly(currentAssembly);

    // Select a supplier for dial blank
    sourcingStore.setSupplierSelection('inst-dial-blank', 'supp-dial-blank-aliexpress');

    expect(useSourcingStore.getState().sourcingPlan.selections['inst-dial-blank']).toBe('supp-dial-blank-aliexpress');

    // Assert that WatchAssembly is completely unchanged: zero serialization change, zero geometry change
    const afterAssemblyJson = serializeWatchAssembly(useWatchAssemblyStore.getState().assembly);
    expect(afterAssemblyJson).toBe(initialAssemblyJson);
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

    expect(() => assertNoTransientState(assembly)).not.toThrow();

    const serialized = serializeWatchAssembly(assembly);
    expect(serialized).not.toContain('"zoom"');
    expect(serialized).not.toContain('"panX"');
    expect(serialized).not.toContain('"panY"');
    expect(serialized).not.toContain('"selectedBandId"');
    expect(serialized).not.toContain('"selectedComponentId"');
    expect(serialized).not.toContain('"hoveredComponentId"');
    expect(serialized).not.toContain('"selectionFilter"');
    expect(serialized).not.toContain('"previewMode"');
    expect(serialized).not.toContain('"openSections"');

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

    const bands = assemblyToBands(assembly);
    expect(bands.length).toBe(4);
    expect(bands.map((b) => b.kind)).toEqual([
      'dial-face',
      'chapter-ring',
      'inner-bezel',
      'outer-bezel'
    ]);

    const legacyEntities = assemblyToWatchComponentEntities(assembly);
    expect(legacyEntities.length).toBe(assembly.partOrder.length);
    expect(legacyEntities.every((e) => e.exportEnabled)).toBe(true);
  });

  // Test 9 (Repair 2): Preserves generator and design metadata during legacy migration
  it('faithfully preserves marker, typography, and texture configs during legacy migration without defaulting', () => {
    const customMarkerConfig = {
      ...defaultMarkerConfig,
      count: 24,
      radiusOuterMm: 15.5
    };
    const customTypographyConfig = {
      ...defaultTypographyConfig,
      content: 'CHRONOMETER',
      fontSizeMm: 1.8,
      alignment: 'center' as const
    };

    const initialAssembly = createDefaultWatchAssembly();
    initialAssembly.designConfig = {
      markerConfig: customMarkerConfig,
      typographyConfig: customTypographyConfig,
      textureConfig: {
        kind: 'sunburst',
        intensity: 0.85,
        contrast: 0.65
      },
      geometryParameters: {
        caseDiameterMm: 43.5
      }
    };
    initialAssembly.globalDimensions.caseDiameterMm = 43.5;

    // Export to legacy project format
    const legacyProject = exportAssemblyToLegacyProject(initialAssembly);
    expect(legacyProject.design.markerConfig.count).toBe(24);
    expect(legacyProject.design.typographyConfig.content).toBe('CHRONOMETER');
    expect(legacyProject.design.textureConfig.kind).toBe('sunburst');
    expect(legacyProject.geometry.caseDiameterMm).toBe(43.5);

    // Migrate back to WatchAssembly
    const reMigratedAssembly = migrateLegacyProjectToAssembly(legacyProject);
    expect(reMigratedAssembly.designConfig?.markerConfig?.count).toBe(24);
    expect(reMigratedAssembly.designConfig?.typographyConfig?.content).toBe('CHRONOMETER');
    expect(reMigratedAssembly.designConfig?.textureConfig?.kind).toBe('sunburst');
    expect(reMigratedAssembly.globalDimensions.caseDiameterMm).toBe(43.5);
  });

  // Test 10 (Repair 1): WatchAssembly is authoritative upstream authority for mutations
  it('verifies that mutations flow through WatchAssembly to downstream legacy representations', () => {
    const assemblyStore = useWatchAssemblyStore.getState();
    assemblyStore.resetAssembly();

    // 1. Mutate case diameter via authoritative write path
    assemblyStore.setCaseDiameter(44.0);
    expect(useWatchAssemblyStore.getState().assembly.globalDimensions.caseDiameterMm).toBe(44.0);
    // Downstream legacy globalSettingsStore must be automatically synchronized
    expect(useGlobalSettingsStore.getState().caseDiameterMm).toBe(44.0);

    // 2. Calling legacy store action delegates to WatchAssembly
    useGlobalSettingsStore.getState().setCaseDiameter(45.5);
    expect(useWatchAssemblyStore.getState().assembly.globalDimensions.caseDiameterMm).toBe(45.5);
    expect(useGlobalSettingsStore.getState().caseDiameterMm).toBe(45.5);

    // 3. Mutating part visibility flows through WatchAssembly
    useWatchComponentStore.getState().setVisibility('watch-component-hour-hand', false);
    const hourHandPart = useWatchAssemblyStore.getState().assembly.parts['inst-hour-hand'];
    expect(hourHandPart?.visible).toBe(false);

    // 4. Mutating marker config flows through WatchAssembly
    useDesignEngineStore.getState().updateMarkerConfig({ count: 12 });
    expect(useWatchAssemblyStore.getState().assembly.designConfig?.markerConfig?.count).toBe(12);
  });

  // Test 11 (Repair 4): Enforces catalogue reference integrity without silent fallback fabrication
  it('enforces catalogue reference integrity and throws CatalogueReferenceError on invalid references', () => {
    const assembly = createDefaultWatchAssembly();

    // Valid assembly passes validation
    const report = validateAssemblyCatalogueReferences(assembly);
    expect(report.valid).toBe(true);
    expect(report.errors.length).toBe(0);

    // Corrupt one part reference with an invalid catalogue ID
    const corruptedAssembly: WatchAssembly = {
      ...assembly,
      parts: {
        ...assembly.parts,
        'inst-broken-part': {
          instanceId: 'inst-broken-part',
          catalogueItemId: 'cat-non-existent-item-xyz',
          name: 'Broken Part',
          category: 'case',
          visible: true,
          locked: false,
          layerIndex: 10,
          material: 'Steel',
          color: '#FFF',
          texture: 'smooth',
          dimensions: { diameterMm: 20, widthMm: 2, thicknessMm: 1, offsetXmm: 0, offsetYmm: 0 }
        }
      },
      partOrder: [...assembly.partOrder, 'inst-broken-part']
    };

    const invalidReport = validateAssemblyCatalogueReferences(corruptedAssembly);
    expect(invalidReport.valid).toBe(false);
    expect(invalidReport.errors.length).toBeGreaterThan(0);
    expect(invalidReport.errors[0]?.catalogueItemId).toBe('cat-non-existent-item-xyz');

    // Adapters MUST throw CatalogueReferenceError rather than fabricating fallback metadata
    expect(() => assemblyToWatchComponentEntities(corruptedAssembly)).toThrow(
      CatalogueReferenceError
    );

    // Legacy mapper correctly resolves known components and returns null for unknown
    expect(mapLegacyComponentToCatalogueId('watch-component-hour-hand')).toBe('cat-hour-hand');
    expect(mapLegacyComponentToCatalogueId('unknown-fabricated-part')).toBeNull();
  });

  // Test 12 (Repair 5): SupplierListing schema hardens provenance and honest partial records
  it('classifies demo fixtures and prevents treating synthetic listings as verified production data', () => {
    expect(defaultSupplierListings.length).toBeGreaterThan(0);

    // All seeded demo records are marked as demonstration fixtures
    for (const listing of defaultSupplierListings) {
      expect(listing.provenance.isDemonstrationFixture).toBe(true);
      expect(listing.provenance.sourceType).toBe('demo-fixture');
      expect(listing.verificationStatus).toBe('unverified');
    }

    // Verified production filter excludes all demonstration fixtures
    const productionListings = filterProductionListings(defaultSupplierListings);
    expect(productionListings.length).toBe(0);
  });
});
