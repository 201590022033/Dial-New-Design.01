import { afterEach, describe, expect, it } from 'vitest';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { defaultDesignIntent, readDesignIntent } from '@/domain/design-first/designIntent';
import { deserializeWatchAssembly } from '@/domain/assembly/assemblySerialization';

const initial = useWatchAssemblyStore.getState();
afterEach(() => useWatchAssemblyStore.setState(initial));

describe('saved design intent authoring', () => {
  it('marks preferences dirty, retains physical parts and supports Undo/Redo', () => {
    const before = useWatchAssemblyStore.getState().assembly;
    const intent = { ...defaultDesignIntent(), preserveDimensions: false, styleNotes: 'Brushed pilot dial' };
    useWatchAssemblyStore.getState().setDesignIntent(intent);
    const saved = useWatchAssemblyStore.getState();
    expect(saved.dirty).toBe(true);
    expect(saved.assembly.parts).toBe(before.parts);
    expect(saved.assembly.globalDimensions).toBe(before.globalDimensions);
    expect(readDesignIntent(saved.assembly)).toEqual(intent);
    useWatchAssemblyStore.getState().undoAssembly();
    expect(useWatchAssemblyStore.getState().assembly).toEqual(before);
    useWatchAssemblyStore.getState().redoAssembly();
    expect(readDesignIntent(useWatchAssemblyStore.getState().assembly)).toEqual(intent);
    expect(readDesignIntent(deserializeWatchAssembly(useWatchAssemblyStore.getState().exportJson()))).toEqual(intent);
  });
});
