import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useSourcingStore } from '@/stores/sourcingStore';

const initialAssembly = useWatchAssemblyStore.getState();
const initialSourcing = useSourcingStore.getState();
beforeEach(() => {
  useWatchAssemblyStore.setState(initialAssembly);
  useWatchAssemblyStore.getState().clearAssemblyHistory();
  useSourcingStore.getState().resetSourcingPlan();
});
afterEach(() => {
  useWatchAssemblyStore.setState(initialAssembly);
  useSourcingStore.setState(initialSourcing);
});
const commit = () => {
  const assembly = useWatchAssemblyStore.getState().assembly;
  const target = Object.keys(assembly.parts)[0]!;
  const next = { ...assembly, parts: { ...assembly.parts, [target]: { ...assembly.parts[target]!, name: 'Matched choice' } } };
  useWatchAssemblyStore.getState().commitDesignMatch(next, { [target]: 'offer-new' });
  return { assembly, target, next };
};
describe('matching assembly and supplier history', () => {
  it('commits one dirty, undoable choice and restores a missing supplier key exactly', () => {
    const { assembly, target, next } = commit();
    expect(useWatchAssemblyStore.getState().dirty).toBe(true);
    expect(useWatchAssemblyStore.getState().historyPast).toHaveLength(1);
    expect(useSourcingStore.getState().sourcingPlan.selections[target]).toBe('offer-new');
    useWatchAssemblyStore.getState().undoAssembly();
    expect(useWatchAssemblyStore.getState().assembly).toEqual(assembly);
    expect(Object.hasOwn(useSourcingStore.getState().sourcingPlan.selections, target)).toBe(false);
    useWatchAssemblyStore.getState().redoAssembly();
    expect(useWatchAssemblyStore.getState().assembly).toEqual(next);
    expect(useSourcingStore.getState().sourcingPlan.selections[target]).toBe('offer-new');
  });
  it('preserves unrelated sourcing through intervening edits and repeated Undo/Redo', () => {
    const assembly = useWatchAssemblyStore.getState().assembly;
    const target = Object.keys(assembly.parts)[0]!;
    useSourcingStore.getState().setSupplierSelection(target, 'offer-old');
    commit();
    useWatchAssemblyStore.getState().updateMetadata({ notes: 'Later edit' });
    useSourcingStore.getState().setSupplierSelection('unrelated', 'offer-independent');
    useWatchAssemblyStore.getState().undoAssembly();
    expect(useSourcingStore.getState().sourcingPlan.selections[target]).toBe('offer-new');
    useWatchAssemblyStore.getState().undoAssembly();
    expect(useSourcingStore.getState().sourcingPlan.selections).toMatchObject({ [target]: 'offer-old', unrelated: 'offer-independent' });
    useWatchAssemblyStore.getState().redoAssembly();
    useWatchAssemblyStore.getState().redoAssembly();
    expect(useWatchAssemblyStore.getState().assembly.metadata.notes).toBe('Later edit');
    expect(useSourcingStore.getState().sourcingPlan.selections).toMatchObject({ [target]: 'offer-new', unrelated: 'offer-independent' });
  });
  it('rejects a different document without changing either history or sourcing', () => {
    const assembly = useWatchAssemblyStore.getState().assembly;
    expect(() => useWatchAssemblyStore.getState().commitDesignMatch({ ...assembly, metadata: { ...assembly.metadata, id: 'other' } }, {})).toThrow(/no longer belongs/);
    expect(useWatchAssemblyStore.getState().historyPast).toHaveLength(0);
    expect(useSourcingStore.getState().sourcingPlan.selections).toEqual({});
  });
});
