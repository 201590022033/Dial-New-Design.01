import type { BandEntity, BandKind } from '@/domain/bands/types';

export type PhysicalRegionKind = 'dial-face' | 'chapter-ring' | 'inner-bezel' | 'outer-bezel';

export interface PhysicalRegion {
  kind: PhysicalRegionKind;
  bandId: string;
  innerRadiusMm: number;
  outerRadiusMm: number;
  widthMm: number;
}

export interface PhysicalAssembly {
  regions: Partial<Record<PhysicalRegionKind, PhysicalRegion>>;
  centerOut: PhysicalRegion[];
  outerRadiusMm: number;
}

export const physicalRegionKinds = new Set<BandKind>([
  'dial-face',
  'chapter-ring',
  'inner-bezel',
  'outer-bezel'
]);

const attachmentRegionByKind: Record<BandKind, PhysicalRegionKind> = {
  'dial-face': 'dial-face',
  'chapter-ring': 'chapter-ring',
  'inner-bezel': 'inner-bezel',
  'outer-bezel': 'outer-bezel',
  'movement-template': 'dial-face',
  'scale-generator': 'chapter-ring',
  hands: 'dial-face',
  indices: 'dial-face',
  text: 'dial-face',
  logo: 'dial-face',
  complications: 'dial-face'
};

export const resolvePhysicalAssembly = (bands: BandEntity[]): PhysicalAssembly => {
  const regions: PhysicalAssembly['regions'] = {};

  bands.forEach((band) => {
    if (!band.visible || !physicalRegionKinds.has(band.kind)) {
      return;
    }

    const kind = band.kind as PhysicalRegionKind;
    regions[kind] = {
      kind,
      bandId: band.id,
      innerRadiusMm: band.geometry.innerRadius,
      outerRadiusMm: band.geometry.outerRadius,
      widthMm: band.geometry.outerRadius - band.geometry.innerRadius
    };
  });

  const centerOut = Object.values(regions).sort(
    (left, right) => left.outerRadiusMm - right.outerRadiusMm
  );

  return {
    regions,
    centerOut,
    outerRadiusMm: centerOut.at(-1)?.outerRadiusMm ?? 0
  };
};

export const resolveAttachmentRegion = (
  assembly: PhysicalAssembly,
  kind: BandKind | null
): PhysicalRegion | null => {
  if (!kind) {
    return null;
  }
  const preferredKind = attachmentRegionByKind[kind];
  return assembly.regions[preferredKind] ?? assembly.regions['dial-face'] ?? null;
};

export const resolveOuterNeighbor = (
  assembly: PhysicalAssembly,
  kind: PhysicalRegionKind
): PhysicalRegion | null => {
  const regionIndex = assembly.centerOut.findIndex((region) => region.kind === kind);
  return regionIndex >= 0 ? assembly.centerOut[regionIndex + 1] ?? null : null;
};

export const fitSpanToRegion = (
  region: PhysicalRegion,
  preferredLengthMm: number
): { innerRadiusMm: number; outerRadiusMm: number } => {
  const lengthMm = Math.min(Math.max(0, preferredLengthMm), region.widthMm);
  return {
    innerRadiusMm: region.outerRadiusMm - lengthMm,
    outerRadiusMm: region.outerRadiusMm
  };
};