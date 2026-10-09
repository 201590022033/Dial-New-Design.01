/** Reviewed asset contracts, not a renderer-wide guess about mesh names.
 * Every registered bezel must explicitly declare its print regions (or none).
 * Counts are checked against actual binaries so new/regenerated assets require review.
 */
export const bezelArtworkContracts: Record<string, { prefixes: readonly string[]; count: number }> = {
  'archetype-bezel-diver': { prefixes: ['DD_ARCH_BEZEL_SCALE_', 'DD_ARCH_BEZEL_ZERO'], count: 61 },
  'archetype-bezel-chronograph': { prefixes: ['DD_ARCH_BEZEL_SCALE_', 'DD_ARCH_TACHY_'], count: 16 },
  'archetype-bezel-pilot': { prefixes: ['DD_PILOT_SCALE_OUTER_'], count: 87 },
  'archetype-bezel-dress': { prefixes: [], count: 0 },
  'archetype-bezel-field': { prefixes: [], count: 0 },
  'bezel-dive-coin-edge-42': { prefixes: ['DD_BEZEL_SCALE_'], count: 60 },
  'bezel-dive-scalloped-42': { prefixes: ['DD_BEZEL_SCALE_'], count: 60 },
  'bezel-gmt-42': { prefixes: ['DD_BEZEL_SCALE_'], count: 24 },
  'bezel-tachymeter-fixed-42': { prefixes: ['DD_BEZEL_SCALE_'], count: 12 },
  'bezel-slide-rule-42': { prefixes: ['DD_BEZEL_SCALE_', 'DD_BEZEL_INNER_SCALE_'], count: 120 },
  'bezel-pilot-smooth-42': { prefixes: [], count: 0 },
  'bezel-dress-fluted-42': { prefixes: [], count: 0 },
  'reference-42-bezel-preview': { prefixes: ['DD_REF42_BEZEL_MARKER_', 'DD_REF42_BEZEL_PIP_'], count: 62 },
  'bezel-knurled-42mm-v1': { prefixes: [], count: 0 },
  'bezel-diver-40mm-v1': { prefixes: [], count: 0 },
  'bezel-diamond-rose-gold-34': { prefixes: [], count: 0 },
  'bezel-diamond-rose-gold-42': { prefixes: [], count: 0 },
  'visual-bezel-default': { prefixes: [], count: 0 }
};

/** Hide only declared authored print while a replacement owns this physical band. */
export const hideAuthoredBezelMarking = (name: string, liveOuterArtwork: boolean, assetId: string): boolean =>
  liveOuterArtwork && !!bezelArtworkContracts[assetId]?.prefixes.some(prefix => name.toUpperCase().startsWith(prefix));
