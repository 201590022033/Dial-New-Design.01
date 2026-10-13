import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { defaultCatalogueItems } from '@/domain/catalogue/catalogueRegistry';
import { defaultDesignIntent, updateDesignIntent } from '@/domain/design-first/designIntent';
import { DesignIntentPanel } from '@/components/configurator/DesignIntentPanel';

const save = vi.fn();
let assembly = createDefaultWatchAssembly();
let targetId: string | null = 'inst-dial-blank';
vi.mock('@/stores/watchAssemblyStore', () => ({ useWatchAssemblyStore: (selector: (state: { assembly: typeof assembly; setDesignIntent: typeof save }) => unknown) => selector({ assembly, setDesignIntent: save }) }));
vi.mock('@/stores/catalogueStore', () => ({ useCatalogueStore: (selector: (state: { items: typeof defaultCatalogueItems }) => unknown) => selector({ items: defaultCatalogueItems }) }));
vi.mock('@/stores/configuratorUIStore', () => ({ useConfiguratorUIStore: (selector: (state: { activePartInstanceId: string | null }) => unknown) => selector({ activePartInstanceId: targetId }) }));
vi.mock('@/stores/designMatchingStore', () => ({ useDesignMatchingStore: (selector: (state: { brief: null; intent: null; error: null; search: () => boolean }) => unknown) => selector({ brief: null, intent: null, error: null, search: () => true }) }));

describe('Design intent panel initial rendering', () => {
  beforeEach(() => { assembly = createDefaultWatchAssembly(); targetId = 'inst-dial-blank'; save.mockClear(); });
  it('renders accessible deliberate controls without editing the assembly', () => {
    const before = structuredClone(assembly);
    const html = renderToStaticMarkup(<DesignIntentPanel />);
    expect(html).toContain('<details open=""');
    expect(html).toContain('Concept design');
    expect(html).toContain('Save preferences');
    expect(html).toContain('Find closest parts');
    expect(html).toContain('Save preferences separately');
    expect(html).toContain('Crystal seat: Unknown');
    expect(html).toContain('Package: Unknown');
    expect(html).toContain('Interface: Unknown');
    expect(html).toContain('role="status"');
    expect(html).not.toContain('onmouseover');
    expect(save).not.toHaveBeenCalled();
    expect(assembly).toEqual(before);
  });
  it('shows selected-case intent without claiming identity verifies fit', () => {
    assembly = updateDesignIntent(assembly, { ...defaultDesignIntent(), mode: 'selected-case', styleNotes: 'Blue & silver' });
    const html = renderToStaticMarkup(<DesignIntentPanel />);
    expect(html).toContain('Selected case:');
    expect(html).toContain('Its identity alone does not verify');
    expect(html).toContain('Blue &amp; silver');
    expect(html).toContain('Included parts and case constraints are separate from verified fit');
    expect(save).not.toHaveBeenCalled();
  });
  it('explains missing case information and leaves the search target explicit', () => {
    assembly = updateDesignIntent(assembly, { ...defaultDesignIntent(), mode: 'selected-case' });
    assembly = { ...assembly, parts: Object.fromEntries(Object.entries(assembly.parts).map(([id, part]) => [id, { ...part, visible: false }])) };
    targetId = null;
    const html = renderToStaticMarkup(<DesignIntentPanel />);
    expect(html).toContain('No unique case selected');
    expect(html).toContain('missing or ambiguous');
    expect(html).toContain('Select a component');
    expect(html).not.toContain('undefined');
  });
  it('disables search when the selected component reference no longer exists', () => {
    targetId = 'removed-component';
    const html = renderToStaticMarkup(<DesignIntentPanel />);
    expect(html).toContain('Unavailable component');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Find closest parts<\/button>/);
  });
});
