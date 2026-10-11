import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import {
  CASE_SIZE_REFERENCES,
  getCaseSizeLabel,
  getCaseSizeMatches,
  getNearestCaseSizeReference,
  resolveCaseSizeTarget
} from '@/domain/catalogue/caseSizeReferences';
import { defaultCatalogueItems } from '@/domain/catalogue/catalogueRegistry';
import { offAxisCaseItems } from '@/domain/catalogue/offAxisCatalogue';
import { nh05SupplierCandidateItems } from '@/domain/catalogue/nh05SupplierCandidates';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';
import { visualVariantCatalogueItems } from '@/domain/catalogue/visualVariantCatalogue';

const caseItem = (id: string, diameterMm: number, kind = 'midcase'): ComponentCatalogueItem => ({
  id, kind, displayName: '40 mm marketing name', category: 'case',
  defaultMaterial: 'steel', defaultTexture: 'brushed', linkedBandKind: null,
  nominalDimensions: { diameterMm, widthMm: diameterMm, thicknessMm: 10 },
  manufacturing: { processProfile: 'cnc', minimumFeatureMm: 0.2, minimumGapMm: 0.2,
    minimumStrokeWidthMm: 0.12, recommendations: [] },
  softStyles: [], status: 'draft', metadata: { tags: ['40mm'], revision: 'test', notes: '' },
  exportEnabled: false
});

describe('case size reference metadata', () => {
  it('contains the ten approved comparisons with generic 34/48 examples and no unlicensed photos', () => {
    expect(CASE_SIZE_REFERENCES.map((reference) => reference.diameterMm))
      .toEqual([34, 36, 38, 40, 42, 44, 46, 48, 50, 52]);
    expect(CASE_SIZE_REFERENCES.filter((reference) => !reference.sourceUrl)
      .map((reference) => reference.diameterMm)).toEqual([34, 48]);
    expect(CASE_SIZE_REFERENCES.find((reference) => reference.diameterMm === 34)?.label)
      .toBe('Compact dress reference');
    expect(CASE_SIZE_REFERENCES.find((reference) => reference.diameterMm === 48)?.label)
      .toBe('Oversized sport reference');
    expect(CASE_SIZE_REFERENCES.find((reference) => reference.diameterMm === 38)?.label)
      .toContain('HCC002J1');
    expect(CASE_SIZE_REFERENCES.find((reference) => reference.diameterMm === 46)?.label)
      .toContain('EB0148101B1X1');
    expect(CASE_SIZE_REFERENCES.every((reference) => reference.description)).toBe(true);
    expect(Object.isFrozen(CASE_SIZE_REFERENCES)).toBe(true);
    expect(CASE_SIZE_REFERENCES.every(Object.isFrozen)).toBe(true);
  });

  it('returns a comparison without rounding or mutating the current diameter', () => {
    expect(getNearestCaseSizeReference(34)?.diameterMm).toBe(34);
    expect(getNearestCaseSizeReference(52)?.diameterMm).toBe(52);
    expect(getNearestCaseSizeReference(40.2)?.diameterMm).toBe(40);
    expect(getNearestCaseSizeReference(43.8)?.diameterMm).toBe(44);
    expect(getNearestCaseSizeReference(46.5)?.diameterMm).toBe(46);
    expect(getNearestCaseSizeReference(41)?.diameterMm).toBe(40);
  });

  it.each([20, 33.9, 52.1, 60, 0, -1, NaN, Infinity, -Infinity])
    ('provides no distant or invalid comparison for %s', (diameter) => {
      expect(getNearestCaseSizeReference(diameter)).toBeUndefined();
    });
});

describe('live exact case size discovery', () => {
  it('uses explicit case/midcase kinds rather than category, names, tags or rounded sizes', () => {
    const items = [caseItem('body', 40), caseItem('case', 40, 'case'),
      caseItem('decimal', 40.2), caseItem('caseback', 35, 'caseback'),
      caseItem('lugs', 48, 'lugs'), caseItem('crystal', 40, 'crystal')];
    expect(getCaseSizeMatches(items, 40).map((item) => item.id)).toEqual(['body', 'case']);
    expect(getCaseSizeMatches(items, 35)).toEqual([]);
    expect(getCaseSizeMatches(items, 48)).toEqual([]);
    expect(getCaseSizeMatches([caseItem('unrelated', 42)], 40)).toEqual([]);
  });

  it.each([40.2, 43.8, 46.5])('preserves the decimal catalogue diameter %s', (diameter) => {
    const item = caseItem('decimal', diameter);
    expect(getCaseSizeMatches([item], diameter)).toEqual([item]);
    expect(getCaseSizeMatches([item], Math.round(diameter))).toEqual([]);
    expect(getCaseSizeLabel(item)).toBe(`${diameter} mm`);
  });

  it('allows floating arithmetic noise below 1e-6 but not a different numeric size', () => {
    const item = caseItem('case', 40);
    expect(getCaseSizeMatches([item], 40 + 0.5e-6)).toEqual([item]);
    expect(getCaseSizeMatches([item], 40 + 1.5e-6)).toEqual([]);
  });

  it.each([0, -1, NaN, Infinity, -Infinity])('rejects invalid request/nominal diameter %s', (diameter) => {
    expect(getCaseSizeMatches([caseItem('valid', 40)], diameter)).toEqual([]);
    expect(getCaseSizeMatches([caseItem('invalid', diameter)], 40)).toEqual([]);
    expect(getCaseSizeLabel(caseItem('invalid', diameter))).toBe('Unknown case size');
  });

  it('deduplicates only IDs, retains both 34 mm identities and keeps input order', () => {
    const a = caseItem('a', 34), b = caseItem('b', 34);
    const items = Object.freeze([a, b, a, { ...b }]);
    expect(getCaseSizeMatches(items, 34)).toEqual([a, b]);
    const liveItems = [...visualVariantCatalogueItems, ...nh05SupplierCandidateItems];
    expect(getCaseSizeMatches(liveItems, 34).map((item) => item.id)).toEqual([
      'cat-case-nh05-ladies-dress-34', 'cat-research-tandorio-nh05-case-34'
    ]);
    expect(items).toHaveLength(4);
  });

  it('reflects runtime array addition, removal and size edits without a cached index', () => {
    const live: ComponentCatalogueItem[] = [];
    expect(getCaseSizeMatches(live, 36)).toEqual([]);
    const added = caseItem('runtime', 36);
    live.push(added);
    expect(getCaseSizeMatches(live, 36)).toEqual([added]);
    added.nominalDimensions.diameterMm = 38;
    expect(getCaseSizeMatches(live, 36)).toEqual([]);
    expect(getCaseSizeMatches(live, 38)).toEqual([added]);
    live.pop();
    expect(getCaseSizeMatches(live, 38)).toEqual([]);
    expect(getCaseSizeMatches([], 36)).toEqual([]);
  });

  it('does not turn reference watches into catalogue records or confer verification', () => {
    const draft = caseItem('generic', 36);
    expect(getCaseSizeMatches([draft], 36)).toEqual([draft]);
    expect(draft.status).toBe('draft');
    expect(draft.exportEnabled).toBe(false);
    expect(getCaseSizeMatches([], 36)).toEqual([]);
    expect(draft.displayName).not.toContain('Rolex');
  });

  it('labels off-axis nominal diameters as shroud envelopes', () => {
    expect(offAxisCaseItems.map(getCaseSizeLabel)).toEqual([
      '47 mm shroud envelope', '46.5 mm shroud envelope'
    ]);
  });
});

describe('deterministic case size target', () => {
  it('finds the single actual body even when non-body case parts come first', () => {
    const assembly = createDefaultWatchAssembly();
    const before = structuredClone(assembly);
    const target = resolveCaseSizeTarget(assembly, defaultCatalogueItems);
    expect(target).toBe(assembly.parts['inst-midcase']);
    expect(assembly).toEqual(before);
  });

  it('rejects missing, unknown and multiple case targets without guessing from category/visual', () => {
    const assembly = createDefaultWatchAssembly();
    const body = assembly.parts['inst-midcase']!;
    expect(resolveCaseSizeTarget(assembly, [])).toBeNull();
    body.catalogueItemId = 'unknown-case';
    body.visual = { category: 'case' };
    expect(resolveCaseSizeTarget(assembly, defaultCatalogueItems)).toBeNull();
    const runtime = caseItem('unknown-case', 40);
    expect(resolveCaseSizeTarget(assembly, [...defaultCatalogueItems, runtime])).toBe(body);
    assembly.parts['second-body'] = { ...body, instanceId: 'second-body' };
    expect(resolveCaseSizeTarget(assembly, [...defaultCatalogueItems, runtime])).toBeNull();
    delete assembly.parts['inst-midcase'];
    delete assembly.parts['second-body'];
    expect(resolveCaseSizeTarget(assembly, [...defaultCatalogueItems, runtime])).toBeNull();
  });

  it('keeps hidden/locked bodies eligible for discovery and counts them for ambiguity', () => {
    const assembly = createDefaultWatchAssembly();
    const body = assembly.parts['inst-midcase']!;
    body.locked = true;
    body.visible = false;
    expect(resolveCaseSizeTarget(assembly, defaultCatalogueItems)).toBe(body);
    assembly.parts['second-body'] = { ...body, instanceId: 'second-body' };
    expect(resolveCaseSizeTarget(assembly, defaultCatalogueItems)).toBeNull();
  });
});
