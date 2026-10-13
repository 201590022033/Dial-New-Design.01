import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import type { ComponentCatalogueItem, SupplierListing } from '@/domain/catalogue/types';
import { captureDesignBrief } from '@/domain/design-first/designBriefExtraction';
import { prepareDesignPartTransition } from '@/domain/design-first/designPartTransition';
import type { DesignIntentV1 } from '@/domain/design-first/designIntent';

function setup() {
  const assembly = createDefaultWatchAssembly();
  const original = getCatalogueItem('cat-crystal')!;
  const target = assembly.parts['inst-crystal']!;
  const candidate: ComponentCatalogueItem = { ...original, id: 'test-replacement-crystal', displayName: 'Test replacement crystal',
    nominalDimensions: { diameterMm: target.dimensions.diameterMm, widthMm: target.dimensions.widthMm, thicknessMm: target.dimensions.thicknessMm },
    defaultMaterial: target.material, defaultTexture: target.texture };
  const items = [getCatalogueItem('cat-midcase')!, original, candidate];
  const intent: DesignIntentV1 = { version: 1, mode: 'concept', preserveDimensions: false, preserveAppearance: false, styleNotes: '' };
  const brief = captureDesignBrief(assembly, target.instanceId, items, intent);
  return { assembly, brief, candidateId: candidate.id, items, supplierListings: [] as SupplierListing[], intent };
}

describe('DF4 pure design part transition', () => {
  it('builds a fresh design-only preview with concrete stable changes and no input mutation', () => {
    const options = setup();
    options.assembly.designConfig = { ...options.assembly.designConfig, geometryParameters: { dialDiameterMm: 28.5 } };
    options.brief = captureDesignBrief(options.assembly, 'inst-crystal', options.items, options.intent);
    const before = JSON.stringify(options);
    const first = prepareDesignPartTransition(options);
    const second = prepareDesignPartTransition(options);
    expect(first.result.group).toBe('needs-evidence');
    expect(first.changedPartIds).toEqual(['inst-crystal']);
    expect(first.changes).toContainEqual({ partInstanceId: 'inst-crystal', property: 'catalogueItemId', before: 'cat-crystal', after: options.candidateId });
    expect(first.changes).toEqual(second.changes);
    expect(first.assembly.parts['inst-dial-blank']).toEqual(options.assembly.parts['inst-dial-blank']);
    expect(first.assembly.designConfig?.geometryParameters).toEqual(options.assembly.designConfig.geometryParameters);
    expect(JSON.stringify(options)).toBe(before);
  });

  it('rejects a stale brief after an unrelated authored edit', () => {
    const options = setup();
    options.assembly.parts['inst-dial-blank']!.color = '#123456';
    expect(() => prepareDesignPartTransition(options)).toThrow('fresh search brief');
  });

  it('does not inherit old engineering evidence or remove unrelated custom settings', () => {
    const options = setup();
    options.assembly.parts['inst-crystal']!.customProperties = { engineeringSpecs: { crystal: { outerDiameterMm: 99, thicknessMm: 99 } }, personalNote: 'keep this' };
    options.assembly.parts['inst-crystal']!.geometryProvenance = { status: 'specified', source: 'Old component geometry' };
    options.brief = captureDesignBrief(options.assembly, 'inst-crystal', options.items, options.intent);
    const next = prepareDesignPartTransition(options);
    expect(next.assembly.parts['inst-crystal']!.customProperties?.engineeringSpecs).toBeUndefined();
    expect(next.assembly.parts['inst-crystal']!.geometryProvenance).toBeUndefined();
    expect(next.assembly.parts['inst-crystal']!.customProperties?.personalNote).toBe('keep this');
    expect(next.changes.some(change => change.property.startsWith('customProperties.engineeringSpecs'))).toBe(true);
  });

  it('blocks physical and style tray locks', () => {
    const options = setup();
    expect(() => prepareDesignPartTransition({ ...options, lockedPartIds: new Set(['inst-crystal']) })).toThrow('Unlock');
    const candidate = { ...options.items[2]!, visual: { category: 'crystal' as const, assetId: 'test-red-crystal', representation: 'procedural' as const, status: 'provisional' as const, dialColor: '#ff0000' } };
    options.items[2] = candidate;
    options.brief = captureDesignBrief(options.assembly, 'inst-crystal', options.items, options.intent);
    expect(() => prepareDesignPartTransition({ ...options, lockedStyles: { 'inst-crystal': true } })).toThrow('locked style');
  });

  it('enforces actual preserved style changes even when nominal dimensions match', () => {
    const options = setup();
    options.items[2] = { ...options.items[2]!, visual: { category: 'crystal', assetId: 'unapproved-new-shape', representation: 'procedural', status: 'provisional' } };
    options.intent = { ...options.intent, preserveAppearance: true };
    options.brief = captureDesignBrief(options.assembly, 'inst-crystal', options.items, options.intent);
    expect(() => prepareDesignPartTransition(options)).toThrow('preserved or unapproved style');
  });

  it('refuses discovery records, editing commands, wrong slots and missing candidates', () => {
    const options = setup();
    expect(() => prepareDesignPartTransition({ ...options, candidateId: 'missing' })).toThrow('no longer');
    options.items[2] = { ...options.items[2]!, researchOnly: true };
    expect(() => prepareDesignPartTransition(options)).toThrow('Discovery');
    options.items[2] = { ...options.items[2], researchOnly: false, crownEdit: { type: 'closure', closure: 'push-pull' } };
    expect(() => prepareDesignPartTransition(options)).toThrow('editing commands');
    const fresh = setup();
    const wrong = getCatalogueItem('cat-hour-hand')!;
    const items = [...fresh.items, wrong];
    const brief = captureDesignBrief(fresh.assembly, 'inst-crystal', items, fresh.intent);
    expect(() => prepareDesignPartTransition({ ...fresh, brief, items, candidateId: wrong.id })).toThrow('different component slot');
  });

  it('refuses zero placeholder dimensions rather than erasing the authored component size', () => {
    const options = setup();
    options.items[2] = { ...options.items[2]!, nominalDimensions: { ...options.items[2]!.nominalDimensions, diameterMm: 0 } };
    options.brief = captureDesignBrief(options.assembly, 'inst-crystal', options.items, options.intent);
    expect(() => prepareDesignPartTransition(options)).toThrow('missing or zero');
  });

  it('refuses indirect case changes outside the target permission scope', () => {
    const options = setup();
    const original = getCatalogueItem('cat-midcase')!;
    const candidate: ComponentCatalogueItem = { ...original, id: 'test-larger-case', nominalDimensions: { ...original.nominalDimensions, diameterMm: 44, thicknessMm: 12 } };
    options.items.push(candidate);
    options.candidateId = candidate.id;
    options.brief = captureDesignBrief(options.assembly, 'inst-midcase', options.items, options.intent);
    expect(() => prepareDesignPartTransition(options)).toThrow(/separate explicit approval scope|approval currently covers/);
  });

  it('detects whole-set indirect physical and style locks before refusing unapproved multi-part edits', () => {
    const options = setup();
    const hour = getCatalogueItem('cat-hour-hand')!;
    const target = options.assembly.parts['inst-hour-hand']!;
    const candidate: ComponentCatalogueItem = { ...hour, id: 'test-hand-set', kind: 'hand-set',
      nominalDimensions: { diameterMm: target.dimensions.diameterMm, widthMm: target.dimensions.widthMm, thicknessMm: target.dimensions.thicknessMm },
      defaultMaterial: target.material, defaultTexture: target.texture,
      visual: { category: 'hands', assetId: 'test-hand-set', representation: 'procedural', status: 'provisional',
        handLengthsMm: { hour: target.dimensions.diameterMm,
          minute: options.assembly.parts['inst-minute-hand']!.dimensions.diameterMm,
          second: options.assembly.parts['inst-central-seconds']!.dimensions.diameterMm } } };
    options.items.push(hour, candidate);
    options.candidateId = candidate.id;
    options.brief = captureDesignBrief(options.assembly, target.instanceId, options.items, options.intent);
    expect(() => prepareDesignPartTransition({ ...options, lockedPartIds: new Set(['inst-minute-hand']) })).toThrow('locked component');
    expect(() => prepareDesignPartTransition({ ...options, lockedStyles: { 'inst-minute-hand': true } })).toThrow('locked style');
    expect(() => prepareDesignPartTransition(options)).toThrow('approval currently covers only');
  });
});
