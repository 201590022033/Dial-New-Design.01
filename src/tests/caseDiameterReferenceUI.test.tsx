import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.hoisted(() => {
  const memory = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
    removeItem: (key: string) => memory.delete(key)
  });
});

// SSR normally uses Zustand's initial snapshot. These fixtures render the current
// store state to exercise browser-visible conditions without claiming DOM events.
vi.mock('@/stores/watchAssemblyStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/stores/watchAssemblyStore')>();
  return { ...actual, useWatchAssemblyStore: Object.assign(
    (selector: (state: ReturnType<typeof actual.useWatchAssemblyStore.getState>) => unknown) =>
      selector(actual.useWatchAssemblyStore.getState()), actual.useWatchAssemblyStore
  ) };
});
vi.mock('@/stores/configuratorUIStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/stores/configuratorUIStore')>();
  return { ...actual, useConfiguratorUIStore: Object.assign(
    (selector: (state: ReturnType<typeof actual.useConfiguratorUIStore.getState>) => unknown) =>
      selector(actual.useConfiguratorUIStore.getState()), actual.useConfiguratorUIStore
  ) };
});
vi.mock('@/stores/catalogueStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/stores/catalogueStore')>();
  return { ...actual, useCatalogueStore: Object.assign(
    (selector: (state: ReturnType<typeof actual.useCatalogueStore.getState>) => unknown) =>
      selector(actual.useCatalogueStore.getState()), actual.useCatalogueStore
  ) };
});

import { renderToStaticMarkup } from 'react-dom/server';
import { CaseDiameterControl } from '@/components/layout/CaseDiameterControl';
import { CaseSizeReferenceThumbnail } from '@/components/layout/CaseSizeReferenceThumbnail';
import {
  caseReferencePosition, caseReferenceTickPercent, parseCasePreviewDiameter, shouldCloseCaseReference
} from '@/components/layout/caseDiameterReferenceLayout';
import { applyToolbarDiameter } from '@/components/layout/toolbarActions';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { CASE_SIZE_REFERENCES } from '@/domain/catalogue/caseSizeReferences';
import { defaultCatalogueItems } from '@/domain/catalogue/catalogueRegistry';
import { useWatchAssemblyStore } from '@/stores/watchAssemblyStore';
import { useConfiguratorUIStore } from '@/stores/configuratorUIStore';
import { useCatalogueStore } from '@/stores/catalogueStore';

const markup = () => renderToStaticMarkup(<CaseDiameterControl />);
const inputs = (html: string) => html.match(/<input\b[^>]*>/g) ?? [];
const buttons = (html: string) => html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? [];

describe('case diameter reference layout and parsing', () => {
  it.each(['pinned', 'dragging', 'focusInside', 'pointerInside'] as const)('keeps the card open while %s even if other activity ends', (active) => {
    expect(shouldCloseCaseReference({ pinned: false, dragging: false, focusInside: false, pointerInside: false, [active]: true })).toBe(false);
  });

  it('closes only after both pointer and focus leave with no drag or pin', () => {
    expect(shouldCloseCaseReference({ pinned: false, dragging: false, focusInside: false, pointerInside: false })).toBe(true);
  });

  it('positions all ten ticks on the full 20–60 mm scale', () => {
    CASE_SIZE_REFERENCES.forEach((reference, index) => {
      expect(caseReferenceTickPercent(reference.diameterMm)).toBeCloseTo(35 + index * 5);
    });
    expect(caseReferenceTickPercent(20)).toBe(0);
    expect(caseReferenceTickPercent(60)).toBe(100);
  });

  it.each([320, 375, 390, 768, 1280, 1920])('clamps the panel within a %s px viewport', (viewportWidth) => {
    for (const left of [-200, 0, viewportWidth / 2, viewportWidth + 200]) {
      const position = caseReferencePosition({ left, bottom: 140, width: 640 }, viewportWidth, 720);
      expect(position.position).toBe('fixed');
      expect(position.width).toBeLessThanOrEqual(288);
      expect(position.left).toBeGreaterThanOrEqual(12);
      expect(position.left + position.width).toBeLessThanOrEqual(viewportWidth - 12);
      expect(position.top).toBeGreaterThanOrEqual(148);
      expect(position.top + position.maxHeight).toBeLessThanOrEqual(708);
      expect(position.maxHeight).toBeGreaterThan(0);
    }
  });

  it('keeps a reachable panel inside a short viewport when there is no space below the anchor', () => {
    const position = caseReferencePosition({ left: 0, bottom: 150, width: 320 }, 320, 160);
    expect(position.top).toBeGreaterThanOrEqual(12);
    expect(position.maxHeight).toBeGreaterThanOrEqual(72);
    expect(position.top + position.maxHeight).toBeLessThanOrEqual(148);
  });

  it.each(['20', '60', '40.2', '43.8', '46.5', ' 34.0 '])('preserves valid decimal input %s', (input) => {
    expect(parseCasePreviewDiameter(input)).toBe(Number(input));
  });

  it.each(['', ' ', 'NaN', 'Infinity', 'abc', '19.9', '60.1', '40.25', '34.01'])
    ('rejects invalid or excessive precision input %s', (input) => {
      expect(() => parseCasePreviewDiameter(input)).toThrow();
    });
});

describe('case diameter reference SSR markup', () => {
  beforeEach(() => {
    useWatchAssemblyStore.setState({ assembly: createDefaultWatchAssembly(), historyPast: [], historyFuture: [] });
    useWatchAssemblyStore.getState().clearAssemblyHistory();
    useConfiguratorUIStore.setState({ lockedPartIds: new Set(), previewStatus: 'none', archetypePreviewAssembly: null });
    useCatalogueStore.setState({ items: [...defaultCatalogueItems] });
  });

  it('keeps native full-range precise inputs, Set, and ten accessible reference buttons', () => {
    const html = markup();
    expect(inputs(html)).toHaveLength(2);
    for (const input of inputs(html)) {
      expect(input).toContain('min="20"');
      expect(input).toContain('max="60"');
      expect(input).toContain('step="0.1"');
      expect(input).not.toContain('disabled');
    }
    const references = buttons(html).filter((button) => button.includes('case-diameter-tick '));
    expect(references).toHaveLength(10);
    for (const reference of CASE_SIZE_REFERENCES) {
      expect(references.some((button) => button.includes(`aria-label="${reference.diameterMm} mm reference`))).toBe(true);
    }
    expect(html).toContain('>Set</button>');
    expect(html).toContain('>Size guide</button>');
  });

  it('marks unavailable references with the grey-state class without disabling discovery', () => {
    useCatalogueStore.setState({ items: [] });
    const references = buttons(markup()).filter((button) => button.includes('case-diameter-tick '));
    expect(references).toHaveLength(10);
    for (const button of references) {
      expect(button).toContain('reference-only');
      expect(button).toContain('no catalogue case');
      expect(button).not.toContain('disabled');
    }
  });

  it.each(['physical', 'session'] as const)('keeps size-guide browsing enabled with a %s case lock', (lock) => {
    const assembly = createDefaultWatchAssembly();
    if (lock === 'physical') assembly.parts['inst-midcase']!.locked = true;
    else useConfiguratorUIStore.setState({ lockedPartIds: new Set(['inst-midcase']) });
    useWatchAssemblyStore.setState({ assembly });
    const html = markup();
    expect(html).toContain('Unlock the case before resizing.');
    expect(inputs(html).every((input) => input.includes('disabled'))).toBe(true);
    expect(buttons(html).find((button) => button.includes('>Set</button>'))).toContain('disabled');
    expect(buttons(html).find((button) => button.includes('>Size guide</button>'))).not.toContain('disabled');
    expect(buttons(html).filter((button) => button.includes('case-diameter-tick '))
      .every((button) => !button.includes('disabled'))).toBe(true);
  });

  it.each(['component', 'build'] as const)('disables mutation while a %s preview is pending', (preview) => {
    if (preview === 'component') useConfiguratorUIStore.setState({ previewStatus: 'previewing' });
    else useConfiguratorUIStore.setState({ archetypePreviewAssembly: createDefaultWatchAssembly() });
    const html = markup();
    expect(inputs(html).every((input) => input.includes('disabled'))).toBe(true);
    expect(html).toContain('Apply or cancel the current preview before resizing.');
    expect(buttons(html).find((button) => button.includes('>Size guide</button>'))).not.toContain('disabled');
  });

  it('leaves assembly, selection, preview and history unchanged when rendering references', () => {
    const beforeAssembly = useWatchAssemblyStore.getState().assembly;
    const beforeUI = useConfiguratorUIStore.getState();
    markup(); markup();
    expect(useWatchAssemblyStore.getState().assembly).toBe(beforeAssembly);
    expect(useWatchAssemblyStore.getState().historyPast).toHaveLength(0);
    expect(useWatchAssemblyStore.getState().historyFuture).toHaveLength(0);
    expect(useConfiguratorUIStore.getState()).toBe(beforeUI);
  });

  it('uses the existing single canonical resize entry and preserves decimals and physical parts', () => {
    const original = useWatchAssemblyStore.getState().assembly;
    applyToolbarDiameter(parseCasePreviewDiameter('40.2'));
    markup();
    expect(useWatchAssemblyStore.getState().historyPast).toHaveLength(1);
    expect(useWatchAssemblyStore.getState().assembly.globalDimensions.caseDiameterMm).toBe(40.2);
    expect(useWatchAssemblyStore.getState().assembly.parts).toBe(original.parts);
    applyToolbarDiameter(parseCasePreviewDiameter('40.2'));
    expect(useWatchAssemblyStore.getState().historyPast).toHaveLength(1);
    expect(markup()).toContain('value="40.2"');
  });

  it.each([20, 34, 40.2, 48, 52, 60])('uses an original labelled schematic at %s mm', (diameterMm) => {
    const html = renderToStaticMarkup(<CaseSizeReferenceThumbnail diameterMm={diameterMm} />);
    expect(html).toContain('role="img"');
    expect(html).toContain(`Illustrative ${diameterMm} mm watch silhouette, not a product photograph`);
    expect(html).not.toMatch(/<image|<img|https?:|NaN|Infinity/);
    expect(html).not.toMatch(/Rolex|Seiko|Omega|Hublot|Tissot/);
  });
});
