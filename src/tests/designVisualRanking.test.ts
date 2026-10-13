import { describe, expect, it } from 'vitest';
import type { ComponentCatalogueItem } from '@/domain/catalogue/types';
import type { DesignBriefV1, DesignMatchGroup, DesignMatchResultV1 } from '@/domain/design-first/designBrief';
import { syntheticDesignBrief, syntheticMatchResults } from '@/domain/design-first/designBriefFixtures';
import { rankDesignMatches, scoreDesignAppearance } from '@/domain/design-first/visualRanking';

const item = (id: string, overrides: Partial<ComponentCatalogueItem> = {}): ComponentCatalogueItem => ({
  id, kind: 'dial-blank', displayName: `Synthetic ${id}`, category: 'dial', defaultMaterial: 'steel', defaultTexture: 'matte', linkedBandKind: null,
  nominalDimensions: { diameterMm: 28.5, widthMm: 0, thicknessMm: 0.4 },
  manufacturing: { processProfile: 'pad-print', minimumFeatureMm: 0.1, minimumGapMm: 0.1, minimumStrokeWidthMm: 0.1, recommendations: [] },
  softStyles: [], status: 'draft', metadata: { tags: [], revision: 'synthetic', notes: 'Synthetic ranking fixture only.' }, exportEnabled: false,
  ...overrides
});
const brief = (preferences: Record<string, string>): DesignBriefV1 => ({ ...syntheticDesignBrief, stylePreferences: preferences });
const result = (id: string, group: DesignMatchGroup): DesignMatchResultV1 => ({ ...syntheticMatchResults[0]!, catalogueItemId: id, group, visualScore: 0.99 });

describe('DF3 metadata appearance ranking', () => {
  it('compares explicit descriptors with explanations and no dimensional ranking', () => {
    const candidate = item('matching', { visual: { category: 'dial', assetId: 'synthetic', representation: 'procedural', status: 'provisional', handStyle: 'sword', bezelProfile: 'coin-edge', dialColor: '#ffffff', dialFinish: 'sunburst' } });
    const intent = brief({ material: ' STEEL ', texture: 'matte', handStyle: 'sword', bezelProfile: 'coin edge', colour: '#fff', finish: 'sunburst' });
    expect(scoreDesignAppearance(intent, candidate).score).toBe(1);
    expect(scoreDesignAppearance(intent, candidate).reasons).toHaveLength(6);
    expect(scoreDesignAppearance(intent, { ...candidate, nominalDimensions: { diameterMm: 99, thicknessMm: 99, widthMm: 99 } }).score).toBe(1);
  });
  it('does not award perfect resemblance for unknown requested metadata', () => {
    const score = scoreDesignAppearance(brief({ material: 'steel', colour: 'blue', unsupportedStyle: 'vintage' }), item('unknown'));
    expect(score.score).toBeCloseTo(1 / 3, 5);
    expect(score.reasons.join(' ')).toContain('no comparable catalogue metadata');
    expect(scoreDesignAppearance(brief({}), item('empty')).score).toBe(0);
  });
  it('bounds soft-style/note overlap and labels it as lexical matching', () => {
    const candidate = item('notes', { softStyles: ['vintage', 'pilot'], metadata: { tags: ['blue'], revision: 'synthetic', notes: 'sunburst' } });
    const score = scoreDesignAppearance(brief({ styleNotes: 'vintage blue pilot sunburst' }), candidate);
    expect(score.score).toBe(0.15);
    expect(score.reasons.join(' ')).toContain('Meaning and negation are not interpreted');
    expect(scoreDesignAppearance(brief({ material: 'steel', styleNotes: 'vintage unknown' }), candidate).score).toBe(0.925);
    expect(scoreDesignAppearance(brief({ styleNotes: 'the watch and dial' }), candidate).score).toBe(0);
  });
  it('always orders fit buckets first even when incompatible metadata looks perfect', () => {
    const intent = brief({ material: 'steel' });
    const results = [result('incompatible', 'incompatible'), result('unknown', 'needs-evidence'), result('change', 'changes-required'), result('fit', 'fits-recorded-dimensions')];
    const candidates = results.map(entry => item(entry.catalogueItemId, { defaultMaterial: entry.group === 'incompatible' ? 'steel' : 'brass' }));
    const ranked = rankDesignMatches(intent, results, candidates);
    expect(ranked.map(entry => entry.catalogueItemId)).toEqual(['fit', 'change', 'unknown', 'incompatible']);
    expect(ranked[0]!.visualScore).toBe(0);
    expect(ranked[3]!.visualScore).toBe(1);
  });
  it('ranks within each bucket and uses deterministic identity ties, with missing records scoring zero', () => {
    const results = ['z-tie', 'winner', 'a-tie', 'missing'].map(id => result(id, 'needs-evidence'));
    const candidates = [item('z-tie', { defaultMaterial: 'brass' }), item('winner'), item('a-tie', { defaultMaterial: 'brass' })];
    expect(rankDesignMatches(brief({ material: 'steel' }), results, candidates).map(entry => entry.catalogueItemId)).toEqual(['winner', 'a-tie', 'missing', 'z-tie']);
  });
  it('does not mutate any inputs or replace engineering evidence/adjustments with appearance claims', () => {
    const intent = brief({ material: 'steel' });
    const results = syntheticMatchResults;
    const candidates = results.map(entry => item(entry.catalogueItemId));
    const before = JSON.stringify({ intent, results, candidates });
    const ranked = rankDesignMatches(intent, results, candidates);
    expect(JSON.stringify({ intent, results, candidates })).toBe(before);
    for (const entry of ranked) {
      const original = results.find(candidate => candidate.catalogueItemId === entry.catalogueItemId)!;
      expect(entry).not.toBe(original);
      expect(entry.group).toBe(original.group);
      expect(entry.reasons).toBe(original.reasons);
      expect(entry.adjustments).toBe(original.adjustments);
      expect(entry.supplierListingIds).toBe(original.supplierListingIds);
    }
  });
});
