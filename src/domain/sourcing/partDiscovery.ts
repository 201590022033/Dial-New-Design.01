import type { WatchAssembly, WatchAssemblyPartInstance } from '@/domain/assembly/assemblyTypes';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';

/** Search intent only. It is not a quote, fit evidence, or a supplier selection. */
export function partDiscoveryQuery(assembly: WatchAssembly, part: WatchAssemblyPartInstance): string {
  const reference = assembly.designConfig?.visualReferenceConfig;
  const item = getCatalogueItem(part.catalogueItemId);
  const kind = item?.kind ?? '';
  const category: string = item?.visual?.category
    ?? (part.category === 'hands' || part.category === 'dial' ? part.category
      : kind.includes('movement') ? 'movement'
      : kind.includes('strap') || kind.includes('bracelet') ? 'strap'
      : kind === 'midcase' ? 'case'
      : kind.includes('bezel') ? 'bezel'
      : kind.includes('sapphire') ? 'crystal'
      : kind || part.category);
  const size = category === 'case' ? assembly.globalDimensions.caseDiameterMm : part.dimensions.diameterMm;
  const terms: string[] = ['watch', category.replaceAll('-', ' ')];
  if (size > 0 && !['hands', 'movement', 'strap'].includes(category)) terms.push(`${size}mm`);
  if (category === 'strap' && part.dimensions.widthMm > 0) terms.push(`${part.dimensions.widthMm}mm`);
  if (['case', 'dial', 'hands', 'movement'].includes(category) || category.includes('hand')) terms.push(assembly.metadata.movement);
  if (category === 'case' && reference?.caseFinish === 'rose-gold') terms.push('rose gold');
  if (category === 'bezel') {
    if (reference?.bezelFinish === 'rose-gold' || (!reference?.bezelFinish && reference?.caseFinish === 'rose-gold')) terms.push('rose gold');
    if (reference?.componentAssetOverrides?.bezel?.includes('diamond')) terms.push('diamond set');
  }
  if (category === 'dial') {
    const color = assembly.designConfig?.dialFaceConfig?.color?.toLowerCase();
    if (color === '#c08a76') terms.push('rose gold');
    if (color === '#e2e8f0') terms.push('silver');
    const texture = assembly.designConfig?.dialFaceConfig?.texture?.kind;
    if (texture) terms.push(texture);
  }
  if (category === 'hands' && (reference?.handsColor === '#c08a76' || (!reference?.handsColor && reference?.handsFinish === 'rose-gold'))) terms.push('rose gold');
  const style = reference?.componentAssetOverrides?.hands?.match(/^hands-(.+)-\d+$/)?.[1];
  if (category === 'hands' && style) terms.push(style.replaceAll('-', ' '));
  return terms.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

export function partDiscoveryLinks(query: string) {
  const encoded = encodeURIComponent(query.trim());
  return [
    { name: 'AliExpress', url: `https://www.aliexpress.com/w/wholesale-${encoded}.html` },
    { name: 'eBay', url: `https://www.ebay.com/sch/i.html?_nkw=${encoded}` },
    { name: 'Google / manufacturers', url: `https://www.google.com/search?q=${encoded}` }
  ];
}
