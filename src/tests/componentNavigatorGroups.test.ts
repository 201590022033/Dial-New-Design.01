import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly';
import { getCatalogueItem } from '@/domain/catalogue/catalogueRegistry';
import { createStarterBuild, type StarterBuildType } from '@/domain/configurator/defaultBuilds';
import { buildComponentNavigatorGroups, buildComponentNavigatorItems, navigatorDimensions, type ComponentNavigatorItem } from '@/domain/configurator/componentNavigator';

const starterTypes: StarterBuildType[] = ['diver', 'pilot', 'dress', 'ladies-dress', 'field', 'chronograph'];
const flatten = (items: ComponentNavigatorItem[]) => buildComponentNavigatorGroups(items).flatMap(group => group.families.flatMap(family => family.items));

describe('DF1 component navigator families', () => {
  it.each(starterTypes)('retains every actual %s starter instance once with unchanged presentation', type => {
    const assembly = createStarterBuild(type).assembly;
    const before = JSON.stringify(assembly);
    const items = buildComponentNavigatorItems(assembly);
    const groups = buildComponentNavigatorGroups(items);
    expect(groups.map(group => [group.id, group.label])).toEqual([
      ['design', 'Design components'], ['case-hardware', 'Case & hardware'],
    ]);
    const grouped = flatten(items);
    expect(grouped).toHaveLength(Object.keys(assembly.parts).length);
    expect(new Set(grouped.map(item => item.id)).size).toBe(grouped.length);
    expect(grouped.map(item => item.id).sort()).toEqual(items.map(item => item.id).sort());
    for (const original of items) {
      expect(grouped.find(item => item.id === original.id)).toBe(original);
      expect(original.kind).toBe(getCatalogueItem(assembly.parts[original.id]!.catalogueItemId)?.kind);
    }
    expect(JSON.stringify(assembly)).toBe(before);
  });

  it('consolidates repeated creative families and crystal variants while keeping rings separate', () => {
    const groups = buildComponentNavigatorGroups(buildComponentNavigatorItems(createDefaultWatchAssembly()));
    const design = groups[0]!;
    const hardware = groups[1]!;
    for (const id of ['hands', 'indices', 'typography', 'complications']) {
      const family = design.families.find(candidate => candidate.id === id)!;
      expect(family.items.length).toBeGreaterThan(1);
    }
    expect(hardware.families.find(family => family.id === 'crystals')!.items.length).toBeGreaterThan(1);
    expect(hardware.families.find(family => family.id === 'case-lugs')!.items.map(item => item.kind)).toContain('lugs');
    for (const kind of ['chapter-ring', 'inner-bezel', 'rotating-bezel', 'fixed-bezel']) {
      const family = design.families.find(candidate => candidate.items.some(item => item.kind === kind))!;
      expect(family.items).toHaveLength(1);
    }
    expect(hardware.families.flatMap(family => family.items).some(item => item.kind === 'rehaut')).toBe(true);
  });

  it('retains unordered custom instances in the design fallback without inferring hardware from their name', () => {
    const assembly = createDefaultWatchAssembly();
    const custom = { ...assembly.parts['inst-dial-blank']!, instanceId: 'custom-unordered', catalogueItemId: 'custom-unknown', name: 'Crystal case experiment', category: 'case' as const };
    assembly.parts[custom.instanceId] = custom;
    const items = buildComponentNavigatorItems(assembly);
    const groups = buildComponentNavigatorGroups(items);
    const projected = items.find(item => item.id === custom.instanceId)!;
    expect(projected.kind).toBeUndefined();
    expect(groups[0]!.families.flatMap(family => family.items)).toContain(projected);
    expect(flatten(items).filter(item => item.id === custom.instanceId)).toHaveLength(1);
  });

  it('preserves locks, visibility, dimensions, names and active artwork without mutating source items', () => {
    const original = buildComponentNavigatorItems(createDefaultWatchAssembly()).find(item => item.kind === 'rotating-bezel')!;
    const item = { ...original, locked: true, visible: false, scaleDesign: 'navitimer', name: 'My bezel' };
    Object.freeze(item);
    const items = Object.freeze([item]);
    const grouped = flatten([...items])[0]!;
    expect(grouped).toBe(item);
    expect(grouped).toMatchObject({ locked: true, visible: false, scaleDesign: 'navitimer', name: 'My bezel' });
    expect(navigatorDimensions(grouped)).toBe(navigatorDimensions(item));
  });

  it('always returns two empty groups for an empty assembly projection', () => {
    const groups = buildComponentNavigatorGroups([]);
    expect(groups).toHaveLength(2);
    expect(groups.every(group => group.families.length === 0)).toBe(true);
    expect(groups[1]!.description).toContain('supplier evidence');
  });
});
