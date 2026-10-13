import type { WatchAssembly } from '@/domain/assembly/assemblyTypes';
import { resolveAssemblyGeometry } from '@/domain/geometry/boundaryResolver';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import type { NavigatorGroup } from '@/domain/design-first/evidence';

export interface ComponentNavigatorItem {
  id: string;
  name: string;
  category: string;
  kind?: string;
  bandId: string | null;
  visible: boolean;
  locked: boolean;
  colour: string;
  outerRadiusMm: number | null;
  innerRadiusMm: number | null;
  scaleDesign: string | null;
  description?: string;
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
    return [{ id: part.instanceId, name: part.name, category: part.category, kind: getCatalogueItem(part.catalogueItemId)?.kind, bandId,
      description: part.catalogueItemId === 'cat-rehaut' ? 'Case inner wall · separate purchase not established' : undefined,
      visible: part.visible, locked: part.locked, colour: part.color,
      outerRadiusMm, innerRadiusMm, scaleDesign: [...new Set(designs)].join(' / ') || null }];
  });
}

export interface ComponentNavigatorFamily {
  id: string;
  label: string;
  items: ComponentNavigatorItem[];
}

export interface ComponentNavigatorGroup {
  id: NavigatorGroup;
  label: string;
  description: string;
  families: ComponentNavigatorFamily[];
}

const crystalKinds = new Set(['crystal', 'flat-sapphire', 'domed-sapphire', 'double-domed-sapphire']);
const caseKinds = new Set(['case', 'midcase', 'lugs']);
const hardwareKinds = new Set(['caseback', 'crown', 'pushers', 'pusher', 'helium-valve', 'rehaut']);
const ringLabels: Record<string, string> = {
  'chapter-ring': 'Chapter ring', 'inner-bezel': 'Inner bezel',
  'rotating-bezel': 'Rotating bezel', 'fixed-bezel': 'Fixed bezel',
};

/** Navigation families only. Group placement does not establish package contents or fit. */
export function buildComponentNavigatorGroups(items: ComponentNavigatorItem[]): ComponentNavigatorGroup[] {
  const groups: ComponentNavigatorGroup[] = [
    { id: 'design', label: 'Design components', description: 'Explore dial, hands, markings, bezels and strap styling.', families: [] },
    { id: 'case-hardware', label: 'Case & hardware', description: 'Case fittings and supporting parts. Included parts need supplier evidence; check supplier details for what is replaceable.', families: [] },
  ];
  for (const item of items) {
    const kind = item.kind ?? '';
    const hardware = caseKinds.has(kind) || crystalKinds.has(kind) || hardwareKinds.has(kind);
    const group = groups[hardware ? 1 : 0]!;
    let familyId = `component-${item.id}`;
    let label = item.name;
    if (caseKinds.has(kind)) { familyId = 'case-lugs'; label = 'Case & lugs'; }
    else if (crystalKinds.has(kind)) { familyId = 'crystals'; label = 'Crystal'; }
    else if (ringLabels[kind]) { label = ringLabels[kind]!; }
    else if (item.category === 'hands') { familyId = 'hands'; label = 'Hands'; }
    else if (item.category === 'indices') { familyId = 'indices'; label = 'Indices & numerals'; }
    else if (item.category === 'typography') { familyId = 'typography'; label = 'Lettering & logos'; }
    else if (item.category === 'complications') { familyId = 'complications'; label = 'Complications'; }
    let family = group.families.find(candidate => candidate.id === familyId);
    if (!family) { family = { id: familyId, label, items: [] }; group.families.push(family); }
    family.items.push(item);
  }
  return groups;
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
