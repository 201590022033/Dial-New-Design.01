import { describe, expect, it, vi } from 'vitest';
vi.hoisted(() => {
  const data = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value), removeItem: (key: string) => data.delete(key) });
});
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { deserializeWatchAssembly, serializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { applyCatalogueVisualSelection } from '@/domain/catalogue/applyCatalogueVisualSelection';
import { applyArchetypeVisualProfile } from '@/domain/configurator/archetypeProfiles';
import { createStarterBuild, type StarterBuildType } from '@/domain/configurator/defaultBuilds';
import { archetypeCrownDefaults, crownCatalogueItems } from '@/domain/crown/catalogue';
import { checkCrownCompatibility } from '@/domain/crown/compatibility';
import { applyCrownEdit, type CrownEdit } from '@/domain/crown/edit';
import { crownSpecificationForPart } from '@/domain/crown/selection';
import { componentPlacement } from '@/visual3d/componentPlacement';
import { createCrownCapGeometry } from '@/visual3d/crownCapGeometry';
import { watchAssemblyToVisualModel } from '@/visual3d/watchAssemblyToVisualModel';

const crownId = 'inst-crown';
const starters: StarterBuildType[] = ['diver', 'pilot', 'dress', 'ladies-dress', 'field', 'chronograph'];
const finishes: Extract<CrownEdit, { type: 'finish' }>['finish'][] = [
  { mode: 'inherit-case' },
  { mode: 'override', material: 'steel', color: '#e2e8f0', texture: 'polished' },
  { mode: 'override', material: 'steel', color: '#adb5bd', texture: 'brushed' },
  { mode: 'override', material: 'rose-gold', color: '#c08a76', texture: 'polished' },
  { mode: 'override', material: 'black-pvd', color: '#191b1f', texture: 'matte' }
];

describe('C6 ordinary-crown release matrix', () => {
  it.each(starters.flatMap(starter => [34, 38, 42].map(size => ({ starter, size }))))('$starter at $size mm retains surrounding assembly through every exposed crown combination and import', ({ starter, size }) => {
    const original = createStarterBuild(starter).assembly;
    original.globalDimensions.caseDiameterMm = size;
    const surrounding = Object.fromEntries(Object.entries(original.parts).filter(([id]) => id !== crownId));
    const expectedHands = watchAssemblyToVisualModel(original).hands;
    for (const item of crownCatalogueItems) {
      const shaped = applyCatalogueVisualSelection(original, crownId, item);
      const initialModel = watchAssemblyToVisualModel(shaped);
      for (const closure of ['unspecified', 'push-pull', 'screw-down'] as const) {
        for (const finish of finishes) {
          let edited = applyCrownEdit(shaped, crownId, { type: 'closure', closure });
          edited = applyCrownEdit(edited, crownId, { type: 'finish', finish });
          const imported = deserializeWatchAssembly(serializeWatchAssembly(edited));
          expect(imported).toEqual(edited);
          expect(Object.fromEntries(Object.entries(imported.parts).filter(([id]) => id !== crownId))).toEqual(surrounding);
          expect(imported.globalDimensions).toEqual(original.globalDimensions);
          expect(imported.designConfig?.crownChoice?.selected?.source).toBe('explicit-user');
          const model = watchAssemblyToVisualModel(imported);
          expect(model.crown.surface).toEqual(initialModel.crown.surface);
          expect(model.hands).toEqual(expectedHands);
          expect(model.anchors).toEqual(initialModel.anchors);
          expect(componentPlacement(model, 'crown')).toEqual(componentPlacement(initialModel, 'crown'));
          expect(crownSpecificationForPart(imported.parts[crownId])?.interfaces).toEqual(item.crownSpecification?.interfaces);
          expect(checkCrownCompatibility(imported).map(result => result.status)).toEqual(['unknown']);
          if (finish.mode === 'inherit-case') expect(model.finishes.crown).toEqual(model.finishes.case);
          else expect(model.finishes.crown.color).toBe(finish.color);
        }
      }
      for (const state of ['open', 'closed'] as const) {
        const edited = applyCrownEdit(shaped, crownId, { type: 'cap-concept', concept: { schema: 'crown-cap-concept/v1', state, clearanceMm: 1, wallMm: .6 } });
        const imported = deserializeWatchAssembly(serializeWatchAssembly(edited));
        const model = watchAssemblyToVisualModel(imported);
        expect(model.crown.surface).toEqual(initialModel.crown.surface);
        expect(componentPlacement(model, 'crown')).toEqual(componentPlacement(initialModel, 'crown'));
        const geometry = createCrownCapGeometry(model.crown.surface, model.crown.capConcept!);
        expect(geometry.envelope.orderable).toBe(false);
        expect(geometry.envelope.innerRadius * 2).toBeGreaterThan(model.crown.surface.maximumOuterDiameterMm);
        expect(geometry.envelope.innerLength).toBeGreaterThan(model.crown.surface.lengthMm);
        if (state === 'open') expect(geometry.cap.boundingBox!.min.x).toBeGreaterThan(model.crown.surface.lengthMm);
        geometry.cap.dispose(); geometry.holder.dispose();
      }
    }
  });

  it.each(Object.keys(archetypeCrownDefaults))('%s preserves an inherited explicit crown and finish without qualifying hardware', profile => {
    let original = applyArchetypeVisualProfile(createDefaultWatchAssembly(), profile);
    expect(original.parts[crownId]!.catalogueItemId).toBe(`cat-crown-${archetypeCrownDefaults[profile]}`);
    original = applyCatalogueVisualSelection(original, crownId, crownCatalogueItems.find(item => item.id === 'cat-crown-smooth')!);
    original = applyCrownEdit(original, crownId, { type: 'finish', finish: finishes[3]! });
    const imported = deserializeWatchAssembly(serializeWatchAssembly(original));
    for (const nextProfile of Object.keys(archetypeCrownDefaults)) {
      const next = applyArchetypeVisualProfile(imported, nextProfile);
      expect(next.parts[crownId]).toEqual(original.parts[crownId]);
      expect(watchAssemblyToVisualModel(next).finishes.crown.color).toBe('#c08a76');
      expect(checkCrownCompatibility(next).map(result => result.status)).toEqual(['unknown']);
    }
  });

  it('leaves unedited legacy assemblies lossless rather than opting them into concepts', () => {
    const legacy = createDefaultWatchAssembly();
    expect(legacy.parts[crownId]!.crownCapConcept).toBeUndefined();
    expect(deserializeWatchAssembly(serializeWatchAssembly(legacy))).toEqual(legacy);
    expect(legacy.designConfig?.crownChoice).toBeUndefined();
  });
});
