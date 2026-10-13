import { describe, expect, it } from 'vitest';
import { createStarterBuild, type StarterBuildType } from '@/domain/configurator/defaultBuilds';
import { createDefaultWatchAssembly } from '@/domain/assembly';
import { useCatalogueStore } from '@/stores/catalogueStore';
import { captureDesignBrief, defaultDesignIntent, deriveCaseConstraints, designMatchResultErrors, searchDesignParts, type EvidenceField } from '@/domain/design-first';

const starters: StarterBuildType[] = ['diver', 'pilot', 'dress', 'ladies-dress', 'field', 'chronograph'];

describe('DF3 coordinated matching acceptance', () => {
  it('distinguishes two same-diameter cases by their source-qualified crystal seats through the complete search service', () => {
    const assembly = createDefaultWatchAssembly();
    const catalogue = useCatalogueStore.getState().items;
    const baseCase = catalogue.find(item => item.id === assembly.parts['inst-midcase']!.catalogueItemId)!;
    const target = assembly.parts['inst-crystal']!;
    target.dimensions = { ...target.dimensions, diameterMm: 31, thicknessMm: 2, widthMm: 0 };
    const original = catalogue.find(item => item.id === target.catalogueItemId)!;
    const recorded = (value: number): EvidenceField<number> => ({ state: 'recorded', value, review: 'reviewed', source: {
      id: `test-measurement-${value}`, kind: 'measured-sample', locator: 'test-only://matching-acceptance', capturedAt: '2026-10-12T00:00:00Z',
    } });
    const concept = deriveCaseConstraints(assembly, 'concept', catalogue);
    const cases = [31, 32].map(seat => ({ ...baseCase, id: `test-case-seat-${seat}`, caseConstraints: {
      ...concept, mode: 'selected-case' as const, catalogueItemId: `test-case-seat-${seat}`, outerDiameterMm: recorded(40),
      interfaces: { ...concept.interfaces, crystalSeatDiameterMm: recorded(seat), crystalSeatDepthMm: recorded(2) },
    } }));
    const candidate = { ...original, id: 'test-matching-crystal', defaultMaterial: target.material, defaultTexture: target.texture,
      nominalDimensions: { diameterMm: 31, thicknessMm: 2, widthMm: 0 }, engineeringSpecs: { crystal: { outerDiameterMm: 31, thicknessMm: 2 } },
      visual: { category: 'crystal' as const, assetId: 'test-only', representation: 'procedural' as const, status: 'provisional' as const, dialColor: target.color },
      fitEvidence: { schema: 'component-fit-evidence/v1' as const, catalogueItemId: 'test-matching-crystal', measurements: { outerDiameterMm: recorded(31), thicknessMm: recorded(2) } },
    };
    const items = [...catalogue, ...cases, candidate];
    const intent = { ...defaultDesignIntent(), mode: 'selected-case' as const };
    const groups = cases.map(caseItem => {
      assembly.parts['inst-midcase'] = { ...assembly.parts['inst-midcase']!, catalogueItemId: caseItem.id };
      const brief = captureDesignBrief(assembly, target.instanceId, items, intent);
      return searchDesignParts({ assembly, brief, items, intent, supplierListings: [] }).find(result => result.catalogueItemId === candidate.id)!.group;
    });
    expect(groups).toEqual(['fits-recorded-dimensions', 'incompatible']);
  });
  it.each(starters)('screens the actual %s starter against the application catalogue without promoting preview evidence', type => {
    const assembly = createStarterBuild(type).assembly;
    const { items, supplierListings } = useCatalogueStore.getState();
    const intent = { ...defaultDesignIntent(), mode: 'selected-case' as const, preserveDimensions: false, preserveAppearance: false };
    const before = JSON.stringify({ assembly, items, supplierListings });
    for (const targetId of ['inst-dial-blank', 'inst-hour-hand', 'inst-flat-sapphire']) {
      if (!assembly.parts[targetId]) continue;
      const brief = captureDesignBrief(assembly, targetId, items, intent);
      const results = searchDesignParts({ assembly, brief, items, supplierListings, intent });
      expect(results.length).toBeGreaterThan(0);
      for (const result of results) {
        expect(designMatchResultErrors(result), result.catalogueItemId).toEqual([]);
        expect(result.group).not.toBe('fits-recorded-dimensions');
        expect(result.group).not.toBe('changes-required');
        expect(result.visualScore).toBeGreaterThanOrEqual(0);
        expect(result.visualScore).toBeLessThanOrEqual(1);
      }
    }
    expect(JSON.stringify({ assembly, items, supplierListings })).toBe(before);
  });
});
