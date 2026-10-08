import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.hoisted(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
});
import { renderToStaticMarkup } from 'react-dom/server';
import { StyleTab } from '@/components/configurator/tray/StyleTab';
import { createDefaultWatchAssembly } from '@/domain/assembly';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useScaleStore } from '@/stores/scaleStore';
import { useSelectionStore } from '@/stores/selectionStore';
import '@/stores/storeSync';

// SSR reads Zustand's closed-over initial API snapshot. Use live selector
// projections here so the fixture context genuinely reaches every component.
vi.mock('@/stores/watchAssemblyStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/stores/watchAssemblyStore')>();
  return { ...actual, useWatchAssemblyStore: Object.assign((selector: (state: ReturnType<typeof actual.useWatchAssemblyStore.getState>) => unknown) => selector(actual.useWatchAssemblyStore.getState()), actual.useWatchAssemblyStore) };
});
vi.mock('@/stores/configuratorUIStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/stores/configuratorUIStore')>();
  return { ...actual, useConfiguratorUIStore: Object.assign((selector: (state: ReturnType<typeof actual.useConfiguratorUIStore.getState>) => unknown) => selector(actual.useConfiguratorUIStore.getState()), actual.useConfiguratorUIStore) };
});
vi.mock('@/stores/designEngineStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/stores/designEngineStore')>();
  return { ...actual, useDesignEngineStore: Object.assign((selector: (state: ReturnType<typeof actual.useDesignEngineStore.getState>) => unknown) => selector(actual.useDesignEngineStore.getState()), actual.useDesignEngineStore) };
});
vi.mock('@/stores/scaleStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/stores/scaleStore')>();
  return { ...actual, useScaleStore: Object.assign((selector: (state: ReturnType<typeof actual.useScaleStore.getState>) => unknown) => selector(actual.useScaleStore.getState()), actual.useScaleStore) };
});
vi.mock('@/stores/selectionStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/stores/selectionStore')>();
  return { ...actual, useSelectionStore: Object.assign((selector: (state: ReturnType<typeof actual.useSelectionStore.getState>) => unknown) => selector(actual.useSelectionStore.getState()), actual.useSelectionStore) };
});

const renderPart = (id: string) => {
  useConfiguratorUIStore.setState({ activePartInstanceId: id });
  return renderToStaticMarkup(<StyleTab />);
};

describe('hybrid Style inspector uses real authoritative catalogue contexts', () => {
  beforeEach(() => {
    useWatchAssemblyStore.getState().setAssembly(createDefaultWatchAssembly());
    useWatchAssemblyStore.getState().clearAssemblyHistory();
    useConfiguratorUIStore.getState().cancelPreview();
    useConfiguratorUIStore.setState({ lockedPartIds: new Set(), archetypePreviewAssembly: null });
    useSelectionStore.getState().clearSelection();
    useScaleStore.setState((state) => ({ pluginConfig: { ...state.pluginConfig, referenceDesign: 'simplified' } }));
  });
  afterEach(() => vi.restoreAllMocks());

  it('shows dial finish/colour/artwork, not strap, main-hand or case selectors, for the actual dial', () => {
    const html = renderPart('inst-dial-blank');
    expect(html).toContain('aria-label="Dial background and finish"');
    expect(html).toContain('aria-label="Dial surface hex"');
    expect(html).toContain('Custom Dial Artwork');
    expect(html).not.toContain('aria-label="Main hand metal colour"');
    expect(html).not.toContain('Case Lug Geometry');
    expect(html).not.toContain('Strap Style');
  });
  it('resolves a stale legacy inst-dial ID through the selected physical band, matching the contextual header', () => {
    useSelectionStore.getState().selectBand('band-dial-face');
    const html = renderPart('inst-dial');
    expect(html).toContain('aria-label="Dial background and finish"');
    expect(html).toContain('aria-label="Dial surface hex"');
    expect(html).not.toContain('aria-label="Main hand metal colour"');
    expect(html).not.toContain('Case Lug Geometry');
    expect(html).not.toContain('Strap Style');
    expect(useConfiguratorUIStore.getState().activePartInstanceId).toBe('inst-dial');
  });
  it('honours the actual fallback dial lock despite a stale tray ID', () => {
    useSelectionStore.getState().selectBand('band-dial-face');
    useConfiguratorUIStore.setState({ lockedPartIds: new Set(['inst-dial-blank']) });
    const html = renderPart('inst-dial');
    expect(html).toContain('This component is locked');
    expect(html).toMatch(/<fieldset[^>]*disabled=""/);
  });
  it('shows main-hand styles/colour, not dial or strap selectors, for the actual hour hand', () => {
    const html = renderPart('inst-hour-hand');
    expect(html).toContain('Main Hour &amp; Minute Hands');
    expect(html).toContain('aria-label="Main hand colour hex"');
    expect(html).not.toContain('aria-label="Dial background and finish"');
    expect(html).not.toContain('Case Lug Geometry');
    expect(html).not.toContain('Strap Style');
  });
  it('shows case metal/lug controls for the actual midcase', () => {
    const html = renderPart('inst-midcase');
    expect(html).toContain('aria-label="Case metal colour"');
    expect(html).toContain('Case Lug Geometry');
    expect(html).not.toContain('aria-label="Dial surface hex"');
    expect(html).not.toContain('aria-label="Main hand colour hex"');
  });
  it('identifies the actual external-category strap and hides unrelated dial/hand/case controls', () => {
    expect(useWatchAssemblyStore.getState().assembly.parts['inst-strap-integration']!.category).toBe('external');
    const html = renderPart('inst-strap-integration');
    expect(html).toContain('Strap Style');
    expect(html).toContain('Perforated chronograph strap');
    expect(html).not.toContain('aria-label="Dial background and finish"');
    expect(html).not.toContain('aria-label="Main hand colour hex"');
    expect(html).not.toContain('Case Lug Geometry');
  });
  it('does not offer case-lug/metal controls for a sapphire in the broad case catalogue category', () => {
    expect(useWatchAssemblyStore.getState().assembly.parts['inst-flat-sapphire']!.category).toBe('case');
    const html = renderPart('inst-flat-sapphire');
    expect(html).not.toContain('Case Lug Geometry');
    expect(html).not.toContain('aria-label="Case metal colour"');
  });
  it.each(['assembly', 'session'] as const)('disables all Style authoring controls under a %s lock', (lock) => {
    if (lock === 'assembly') useWatchAssemblyStore.getState().updatePart('inst-dial-blank', { locked: true });
    else useConfiguratorUIStore.setState({ lockedPartIds: new Set(['inst-dial-blank']) });
    const html = renderPart('inst-dial-blank');
    expect(html).toContain('This component is locked');
    expect(html).toMatch(/<fieldset[^>]*disabled=""/);
  });
  it('marks unsupported Guilloché as disabled instead of presenting a working placeholder', () => {
    const html = renderPart('inst-dial-blank');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*title="Guilloché generation is not implemented\."/);
  });
  it.each(['citizen', 'navitimer'] as const)('does not expose a global scale recolour while %s Original Colours is selected', (design) => {
    useScaleStore.setState((state) => ({ pluginConfig: { ...state.pluginConfig, referenceDesign: design, referenceColourMode: 'original' } }));
    const html = renderPart('inst-rotating-bezel');
    expect(html).not.toContain('aria-label="Scale ticks / numerals hex"');
    expect(html).toContain('this panel never overwrites Original Colours');
  });
  it('retains editable scale hex for the real rings-category bezel in Simplified', () => {
    expect(useWatchAssemblyStore.getState().assembly.parts['inst-rotating-bezel']!.category).toBe('rings');
    const html = renderPart('inst-rotating-bezel');
    expect(html).toContain('aria-label="Scale ticks / numerals hex"');
    expect(html).not.toContain('aria-label="Dial surface hex"');
  });
});
