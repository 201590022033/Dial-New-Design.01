import type { ComponentCatalogueItem } from '@/domain/catalogue/types';
import type { DesignBriefV1, DesignMatchGroup, DesignMatchResultV1 } from './designBrief';

export interface DesignAppearanceScore {
  readonly score: number;
  readonly reasons: readonly string[];
}

const normalize = (value: string): string => value.trim().toLowerCase().replace(/[-_\s]+/g, ' ');
const normalizeColour = (value: string): string => {
  const normalized = normalize(value);
  return /^#[a-f0-9]{3}$/.test(normalized) ? `#${normalized.slice(1).split('').map(character => character.repeat(2)).join('')}` : normalized;
};
const stopWords = new Set(['a', 'an', 'and', 'the', 'with', 'for', 'of', 'to', 'in', 'watch', 'dial', 'case', 'hands', 'style', 'want', 'like']);
const tokens = (text: string): Set<string> => new Set(normalize(text).split(/[^\p{L}]+/u).filter(token => token.length > 1 && !stopWords.has(token)));

/** Descriptive catalogue metadata only. No image analysis, engineering qualification or dimensional score. */
export function scoreDesignAppearance(brief: DesignBriefV1, item: ComponentCatalogueItem): DesignAppearanceScore {
  const requested = Object.entries(brief.stylePreferences).filter(([, value]) => value.trim());
  const preferences = requested.filter(([key]) => key !== 'styleNotes');
  const reasons: string[] = [];
  let matched = 0;
  let compared = 0;
  // Colour/color are spelling aliases, not independent criteria.
  const seen = new Set<string>();
  for (const [rawKey, desired] of preferences) {
    const key = rawKey === 'colour' ? 'color' : rawKey;
    if (seen.has(key)) continue;
    seen.add(key);
    compared++;
    const candidates: Record<string, string | undefined> = {
      color: item.visual?.dialColor,
      material: item.defaultMaterial,
      texture: item.defaultTexture,
      handStyle: item.visual?.handStyle,
      bezelProfile: item.visual?.bezelProfile,
      dialFinish: item.visual?.dialFinish,
      caseFinish: item.visual?.caseFinish,
      finish: item.visual?.dialFinish ?? item.visual?.caseFinish,
    };
    const actual = candidates[key];
    if (actual === undefined || !actual.trim()) {
      reasons.push(`${rawKey}: no comparable catalogue metadata; no appearance credit.`);
      continue;
    }
    const format = key === 'color' ? normalizeColour : normalize;
    if (format(desired) === format(actual)) {
      matched++;
      reasons.push(`${rawKey}: matches catalogue description (${actual}).`);
    } else reasons.push(`${rawKey}: requested ${desired}; catalogue describes ${actual}.`);
  }
  const note = brief.stylePreferences.styleNotes?.trim();
  let noteScore = 0;
  if (note) {
    const desiredTokens = tokens(note);
    const catalogueTokens = tokens([item.displayName, ...item.softStyles, ...item.metadata.tags, item.metadata.notes, item.visual?.note ?? ''].join(' '));
    const overlap = [...desiredTokens].filter(token => catalogueTokens.has(token)).sort();
    noteScore = desiredTokens.size ? 0.15 * overlap.length / desiredTokens.size : 0;
    reasons.push(`Style notes: metadata word overlap ${overlap.length}/${desiredTokens.size}${overlap.length ? ` (${overlap.join(', ')})` : ''}; at most 15% appearance credit. Meaning and negation are not interpreted.`);
  }
  if (!requested.length) reasons.push('No appearance preferences recorded; no appearance score assigned.');
  const structuredScore = compared ? matched / compared * (note ? 0.85 : 1) : 0;
  return { score: Math.round((structuredScore + noteScore) * 1_000_000) / 1_000_000, reasons };
}

const groupOrder: Record<DesignMatchGroup, number> = {
  'fits-recorded-dimensions': 0, 'changes-required': 1, 'needs-evidence': 2, incompatible: 3
};

/** Fit buckets always precede appearance. Explanations remain separate from engineering evidence. */
export function rankDesignMatches(
  brief: DesignBriefV1, results: readonly DesignMatchResultV1[], items: readonly ComponentCatalogueItem[]
): DesignMatchResultV1[] {
  const itemsById = new Map(items.map(item => [item.id, item]));
  return results.map((result, index) => {
    const item = itemsById.get(result.catalogueItemId);
    return { result: { ...result, visualScore: item ? scoreDesignAppearance(brief, item).score : 0 }, index };
  }).sort((a, b) => {
    const fitDifference = groupOrder[a.result.group] - groupOrder[b.result.group];
    if (fitDifference) return fitDifference;
    const appearanceDifference = b.result.visualScore - a.result.visualScore;
    if (appearanceDifference) return appearanceDifference;
    const aId = a.result.catalogueItemId; const bId = b.result.catalogueItemId;
    return aId < bId ? -1 : aId > bId ? 1 : a.index - b.index;
  }).map(entry => entry.result);
}
