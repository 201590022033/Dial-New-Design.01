import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { listCatalogueItems } from '@/domain/catalogue/catalogueRegistry';
import { captureDesignBrief, designAssemblyIdentity } from '@/domain/design-first/designBriefExtraction';
import { defaultDesignIntent, readDesignIntent, updateDesignIntent } from '@/domain/design-first/designIntent';
import { designBriefErrors } from '@/domain/design-first/designBrief';

describe('DF2 live creative brief extraction', () => {
  it('captures copied concept intent, assumed dimensions, scoped permissions and canonical locks', () => {
    const assembly = createDefaultWatchAssembly();
    assembly.parts['inst-dial-blank']!.locked = true;
    const before = JSON.stringify(assembly);
    const items = listCatalogueItems();
    const intent = { ...defaultDesignIntent(), preserveDimensions: false, styleNotes: 'Deep blue sunburst' };
    const brief = captureDesignBrief(assembly, 'inst-dial-blank', items, intent);
    expect(designBriefErrors(brief, assembly, designAssemblyIdentity(assembly, intent, items))).toEqual([]);
    expect(brief.mode).toBe('concept');
    expect(brief.selectedCase).toBeUndefined();
    expect(brief.desiredDimensions.diameterMm).toMatchObject({ state: 'assumed', value: assembly.parts['inst-dial-blank']!.dimensions.diameterMm });
    expect(brief.stylePreferences.styleNotes).toBe('Deep blue sunburst');
    expect(brief.permissions.allowChanges).toContain('target.dimensions.diameterMm');
    expect(brief.permissions.preserve).toContain('target.appearance.color');
    expect(brief.permissions.lockedPartIds).toContain('inst-dial-blank');
    expect(JSON.stringify(assembly)).toBe(before);
    const capturedDiameter = assembly.parts['inst-dial-blank']!.dimensions.diameterMm;
    assembly.parts['inst-dial-blank']!.dimensions.diameterMm += 2;
    expect(brief.desiredDimensions.diameterMm).toMatchObject({ state: 'assumed', value: capturedDiameter });
  });
  it('retains zero/missing dimensions as unknown instead of supplier facts', () => {
    const assembly = createDefaultWatchAssembly();
    assembly.parts['inst-dial-blank']!.dimensions.widthMm = 0;
    expect(captureDesignBrief(assembly, 'inst-dial-blank', listCatalogueItems()).desiredDimensions.widthMm?.state).toBe('unknown');
  });
  it('captures selected case references and rejects missing or unsupported component targets', () => {
    const assembly = createDefaultWatchAssembly();
    const items = listCatalogueItems();
    const intent = { ...defaultDesignIntent(), mode: 'selected-case' as const };
    const brief = captureDesignBrief(assembly, 'inst-dial-blank', items, intent);
    expect(brief.selectedCase?.partInstanceId).toBe('inst-midcase');
    expect(() => captureDesignBrief(assembly, 'not-a-part', items)).toThrow('existing component');
    expect(() => captureDesignBrief(assembly, 'inst-dial-blank', [])).toThrow('catalogue record');
    const unsupported = Object.values(assembly.parts).find(part => items.find(item => item.id === part.catalogueItemId)?.category === 'typography')!;
    expect(() => captureDesignBrief(assembly, unsupported.instanceId, items)).toThrow('not yet supported');
    assembly.parts['inst-midcase']!.visible = false;
    expect(() => captureDesignBrief(assembly, 'inst-dial-blank', items, intent)).toThrow('one visible case');
  });
  it('uses saved intent by default, with explicit unsaved preferences taking precedence', () => {
    const assembly = updateDesignIntent(createDefaultWatchAssembly(), { ...defaultDesignIntent(), styleNotes: 'Saved bronze concept' });
    expect(captureDesignBrief(assembly, 'inst-dial-blank', listCatalogueItems()).stylePreferences.styleNotes).toBe('Saved bronze concept');
    const local = { ...readDesignIntent(assembly), styleNotes: 'Unsaved silver concept' };
    expect(captureDesignBrief(assembly, 'inst-dial-blank', listCatalogueItems(), local).stylePreferences.styleNotes).toBe('Unsaved silver concept');
    expect(readDesignIntent(assembly).styleNotes).toBe('Saved bronze concept');
  });
  it('keeps content identity stable across key/order-only changes and timestamp refreshes', () => {
    const assembly = createDefaultWatchAssembly();
    const items = listCatalogueItems();
    const baseline = designAssemblyIdentity(assembly, undefined, items);
    const reordered = { ...assembly, parts: Object.fromEntries(Object.entries(assembly.parts).reverse()), metadata: { ...assembly.metadata, updatedAtIso: '2099-01-01T00:00:00Z' } };
    expect(designAssemblyIdentity(reordered, undefined, [...items].reverse())).toBe(baseline);
    expect(designAssemblyIdentity(assembly, defaultDesignIntent(), items)).toBe(baseline);
    expect(baseline.length).toBeLessThan(70);
  });
  it('invalidates snapshots for geometry, visibility, locks, intent and catalogue/evidence changes', () => {
    const assembly = createDefaultWatchAssembly();
    const items = listCatalogueItems();
    const baseline = designAssemblyIdentity(assembly, undefined, items);
    for (const change of [
      (copy: typeof assembly) => { copy.parts['inst-dial-blank']!.dimensions.diameterMm += 1; },
      (copy: typeof assembly) => { copy.parts['inst-dial-blank']!.visible = false; },
      (copy: typeof assembly) => { copy.parts['inst-dial-blank']!.locked = true; },
      (copy: typeof assembly) => { copy.parts['inst-dial-blank']!.catalogueItemId = 'changed-reference'; }
    ]) {
      const copy = JSON.parse(JSON.stringify(assembly)) as typeof assembly;
      change(copy);
      expect(designAssemblyIdentity(copy, undefined, items)).not.toBe(baseline);
    }
    expect(designAssemblyIdentity(assembly, { ...defaultDesignIntent(), preserveDimensions: false }, items)).not.toBe(baseline);
    expect(designAssemblyIdentity(assembly, undefined, items.map((item, index) => index === 0 ? { ...item, metadata: { ...item.metadata, revision: 'new-evidence' } } : item))).not.toBe(baseline);
  });
});
