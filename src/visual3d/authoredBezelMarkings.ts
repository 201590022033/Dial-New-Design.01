/** Only authored print/relief is replaced; physical bezel geometry stays visible. */
export const hideAuthoredBezelMarking = (name: string, liveOuterArtwork: boolean): boolean =>
  liveOuterArtwork && /^(DD_ARCH_BEZEL_SCALE_\d+|DD_ARCH_BEZEL_ZERO|DD_ARCH_TACHY_\d+)$/.test(name.toUpperCase());
