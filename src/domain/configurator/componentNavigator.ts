import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { resolveAssemblyGeometry } from '@/domain/geometry/boundaryResolver';

export interface ComponentNavigatorItem {
  id: string;
  name: string;
  category: string;
  bandId: string | null;
  visible: boolean;
  locked: boolean;
  colour: string;
  outerRadiusMm: number | null;
  innerRadiusMm: number | null;
  scaleDesign: string | null;
}

const bandByPart: Record<string, string> = {
  'inst-dial-blank': 'band-dial-face', 'inst-chapter-ring': 'band-chapter-ring',
  'inst-inner-bezel': 'band-inner-bezel', 'inst-rotating-bezel': 'band-outer-bezel'
};

/** A read-only projection of real assembly instances; no second component library. */
export function buildComponentNavigatorItems(assembly: WatchAssembly): ComponentNavigatorItem[] {
  const geometry = resolveAssemblyGeometry(assembly);
  const ids = [...new Set([...assembly.partOrder, ...Object.keys(assembly.parts)])];
  return ids.flatMap(id => {
    const part = assembly.parts[id];
    if (!part) return [];
    const bandId = bandByPart[id] ?? null;
    const band = bandId ? geometry.projected2DBands[bandId.replace(/^band-/, '')] : undefined;
    const physicalDiameter = part.dimensions.diameterMm;
    const outerRadiusMm = band?.outerRadius ?? (physicalDiameter > 0 && Number.isFinite(physicalDiameter) ? physicalDiameter / 2 : null);
    const innerRadiusMm = band?.innerRadius ?? (outerRadiusMm !== null && part.category === 'rings'
      ? Math.max(0, outerRadiusMm - part.dimensions.widthMm) : null);
    const layers = assembly.designConfig?.slideRuleLayers?.layers ?? [];
    const designs = layers.filter(layer => layer.activeDesign && (layer.targetBandId === bandId || layer.fixedTargetBandId === bandId))
      .map(layer => layer.activeDesign!);
    return [{ id: part.instanceId, name: part.name, category: part.category, bandId,
      visible: part.visible, locked: part.locked, colour: part.color,
      outerRadiusMm, innerRadiusMm, scaleDesign: [...new Set(designs)].join(' / ') || null }];
  });
}

export function resolveNavigatorSelection(items: ComponentNavigatorItem[], selection: { componentId?: string | null; bandId?: string | null }): ComponentNavigatorItem | null {
  return items.find(item => item.id === selection.componentId) ??
    items.find(item => item.bandId !== null && item.bandId === selection.bandId) ?? null;
}

export function navigatorDimensions(item: ComponentNavigatorItem): string {
  if (item.outerRadiusMm === null) return 'Dimensions not recorded';
  const od = `OD ${(item.outerRadiusMm * 2).toFixed(2)} mm`;
  return item.innerRadiusMm !== null && item.innerRadiusMm > 0
    ? `${od} · ID ${(item.innerRadiusMm * 2).toFixed(2)} · width ${(item.outerRadiusMm - item.innerRadiusMm).toFixed(2)} mm` : od;
}
