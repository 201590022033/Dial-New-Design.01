import { describe, expect, it } from 'vitest';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { watchAssemblyToVisualModel, visualCategoryForPart } from '@/visual3d/watchAssemblyToVisualModel';
import { PreviewRehaut } from '@/visual3d/VisualWatchScene';
import { serializeWatchAssembly, deserializeWatchAssembly } from '@/domain/assembly/assemblySerialization';
import { assemblyToBands } from '@/domain/assembly/assemblyAdapters';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';

describe('independent rehaut visibility', () => {
  it('does not borrow a visible rehaut when the chapter ring is hidden', () => {
    const assembly = createDefaultWatchAssembly();
    const rehaut = assembly.parts['inst-rehaut']!;
    expect(visualCategoryForPart(rehaut)).toBeUndefined();
    for (const chapterVisible of [true, false]) for (const rehautVisible of [true, false]) {
      assembly.parts['inst-chapter-ring']!.visible = chapterVisible;
      rehaut.visible = rehautVisible;
      const model = watchAssemblyToVisualModel(assembly);
      expect(model.visible['chapter-ring']).toBe(chapterVisible);
      expect(model.rehaut?.visible).toBe(rehautVisible);
      expect(PreviewRehaut({ model }) === null).toBe(!rehautVisible);
      expect(model.chapterRingEnvelope.innerRadiusMm).toBeCloseTo(13.45);
      expect(assemblyToBands(assembly).find(b => b.kind === 'chapter-ring')!.visible).toBe(chapterVisible);
    }
  });
  it('stays hidden after repeated toggles, save/load and chapter-ring changes', () => {
    const previous = useWatchAssemblyStore.getState().assembly;
    try {
      useWatchAssemblyStore.getState().setAssembly(createDefaultWatchAssembly());
      for (let i = 0; i < 30; i++) {
        useWatchAssemblyStore.getState().setPartVisibility('inst-rehaut', true);
        useWatchAssemblyStore.getState().setPartVisibility('inst-rehaut', false);
        expect(watchAssemblyToVisualModel(useWatchAssemblyStore.getState().assembly).rehaut?.visible).toBe(false);
      }
      const restored = deserializeWatchAssembly(serializeWatchAssembly(useWatchAssemblyStore.getState().assembly));
      restored.parts['inst-chapter-ring']!.visible = false;
      expect(watchAssemblyToVisualModel(restored).rehaut?.visible).toBe(false);
      expect(watchAssemblyToVisualModel(restored).visible['chapter-ring']).toBe(false);
      delete restored.parts['inst-chapter-ring'];
      expect(watchAssemblyToVisualModel(restored).visible['chapter-ring']).toBe(false);
    } finally { useWatchAssemblyStore.getState().setAssembly(previous); }
  });
});
