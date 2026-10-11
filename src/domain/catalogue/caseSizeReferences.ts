import type { WatchAssembly, WatchAssemblyPartInstance } from '@/domain/assembly/assemblyTypes';
import type { ComponentCatalogueItem } from './types';

export interface CaseSizeReference {
  readonly diameterMm: number;
  readonly label: string;
  readonly description: string;
  readonly sourceUrl?: string;
}

/**
 * Editorial size comparisons, never selectable components or fit/stock evidence.
 * Sources verify the named example's size, not its identity in the social chart.
 * Thumbnails are original illustrative schematics, not manufacturer photos.
 */
export const CASE_SIZE_REFERENCES: readonly CaseSizeReference[] = Object.freeze([
  {
    diameterMm: 34,
    label: 'Compact dress reference',
    description: 'Compact dress-watch proportions with a restrained, classical look.'
  },
  {
    diameterMm: 36,
    label: 'Rolex Oyster Perpetual 126000',
    description: 'A clean three-hand design with a domed bezel and steel bracelet.',
    sourceUrl: 'https://www.rolex.com/watches/oyster-perpetual/m126000-0001'
  },
  {
    diameterMm: 38,
    label: 'Seiko Presage Classic HCC002J1',
    description: 'A refined automatic design with a silk-inspired dial and curved sapphire crystal.',
    sourceUrl: 'https://www.seikowatches.com/pt-pt/products/presage/HCC002J1'
  },
  {
    diameterMm: 40,
    label: 'Longines Spirit L3.810.4.53.6',
    description: 'An aviation-inspired design with a black dial and luminous details.',
    sourceUrl: 'https://www.longines.com/en-us/p/watch-longines-spirit-l3-810-4-53-6'
  },
  {
    diameterMm: 42,
    label: 'Omega Seamaster Diver 300M 210.30.42.20.03.001',
    description: 'A blue-dial dive-watch design with a rotating bezel and skeleton hands.',
    sourceUrl: 'https://www.omegawatches.com/en-us/watch-omega-seamaster-diver-300m-co-axial-master-chronometer-42-mm-21030422003001'
  },
  {
    diameterMm: 44,
    label: 'Hamilton Khaki Field Auto H70625133',
    description: 'A larger field-watch reference with clear, functional styling.',
    sourceUrl: 'https://www.hamiltonwatch.com/en-int/h70625133-khaki-field-auto.html'
  },
  {
    diameterMm: 46,
    label: 'Breitling Super Avenger B01 EB0148101B1X1',
    description: 'A substantial chronograph reference with a 46 mm titanium case.',
    sourceUrl: 'https://www.breitling.com/gb-en/watches/avenger/super-avenger-b01-chronograph-46-my23/EB0148101B1X1/'
  },
  {
    diameterMm: 48,
    label: 'Oversized sport reference',
    description: 'Oversized sports-watch proportions with a prominent case silhouette.'
  },
  {
    diameterMm: 50,
    label: 'Invicta Subaqua 10040',
    description: 'A broad sports-watch design illustrating a 50 mm case diameter.',
    sourceUrl: 'https://www.invictawatch.com/watches/detail/10040-subaqua-men'
  },
  {
    diameterMm: 52,
    label: 'U-BOAT Black Widow 8054',
    description: 'A statement-sized reference with a black-diamond-set gold case.',
    sourceUrl: 'https://www.uboatwatch.com/product/black-widow-52-mm/'
  }
].map((reference) => Object.freeze(reference)));

const validDiameter = (value: number): boolean => Number.isFinite(value) && value > 0;
const isCaseKind = (kind: string): boolean => kind === 'case' || kind === 'midcase';

/** Exact nominal-size discovery from caller-owned live records; no rounding or fit claims. */
export const getCaseSizeMatches = (
  items: readonly ComponentCatalogueItem[],
  diameterMm: number
): ComponentCatalogueItem[] => {
  if (!validDiameter(diameterMm)) return [];
  const seen = new Set<string>();
  return items.filter((item) => {
    const nominalDiameter = item.nominalDimensions.diameterMm;
    if (!isCaseKind(item.kind) || !validDiameter(nominalDiameter)
      || Math.abs(nominalDiameter - diameterMm) >= 1e-6 || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

/** Comparison only: the UI must label the reference's size separately from the draft size. */
export const getNearestCaseSizeReference = (diameterMm: number): CaseSizeReference | undefined => {
  if (!validDiameter(diameterMm) || diameterMm < 34 || diameterMm > 52) return undefined;
  // The lower reference wins an exact midpoint; this never snaps or writes the draft value.
  return CASE_SIZE_REFERENCES.reduce((nearest, reference) =>
    Math.abs(reference.diameterMm - diameterMm) < Math.abs(nearest.diameterMm - diameterMm)
      ? reference : nearest
  );
};

export const getCaseSizeLabel = (item: ComponentCatalogueItem): string => {
  const diameterMm = item.nominalDimensions.diameterMm;
  if (!validDiameter(diameterMm)) return 'Unknown case size';
  return `${diameterMm} mm${item.offAxisPlatform ? ' shroud envelope' : ''}`;
};

/** Missing, unknown or multiple case identities require explicit handling by the caller. */
export const resolveCaseSizeTarget = (
  assembly: WatchAssembly,
  items: readonly ComponentCatalogueItem[]
): WatchAssemblyPartInstance | null => {
  const byId = new Map(items.map((item) => [item.id, item]));
  const cases = Object.values(assembly.parts).filter((part) => {
    const item = byId.get(part.catalogueItemId);
    return item !== undefined && isCaseKind(item.kind);
  });
  return cases.length === 1 ? cases[0]! : null;
};
