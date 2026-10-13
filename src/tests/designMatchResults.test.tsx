import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DesignMatchResults } from '@/components/configurator/DesignMatchResults';
import type { DesignMatchingStoreState } from '@/stores/designMatchingStore';
import { syntheticDesignBrief, syntheticMatchResults } from '@/domain/design-first/designBriefFixtures';
import { defaultCatalogueItems } from '@/domain/catalogue/catalogueRegistry';
import type { ComponentCatalogueItem, SupplierListing } from '@/domain/catalogue/types';
import { createDefaultWatchAssembly } from '@/domain/assembly/assemblyFactory';
import { defaultDesignIntent } from '@/domain/design-first/designIntent';

const action = vi.fn(() => true);
let workflow: DesignMatchingStoreState;
let items: ComponentCatalogueItem[];
let supplierListings: SupplierListing[];
const assembly = createDefaultWatchAssembly();
vi.mock('@/stores/designMatchingStore', () => ({ useDesignMatchingStore: (selector: (state: DesignMatchingStoreState) => unknown) => selector(workflow) }));
vi.mock('@/stores/catalogueStore', () => ({ useCatalogueStore: (selector: (state: { items: ComponentCatalogueItem[]; supplierListings: SupplierListing[] }) => unknown) => selector({ items, supplierListings }) }));
vi.mock('@/stores/watchAssemblyStore', () => ({ useWatchAssemblyStore: (selector: (state: { assembly: typeof assembly }) => unknown) => selector({ assembly }) }));

describe('DF4 deliberate matching result controls', () => {
  beforeEach(() => {
    action.mockClear();
    items = [{ ...defaultCatalogueItems[0]!, id: 'synthetic-candidate-unknown', displayName: 'Synthetic blue dial' }];
    supplierListings = [];
    workflow = { brief: syntheticDesignBrief, intent: defaultDesignIntent(), results: syntheticMatchResults, targetLabel: 'Dial Blank', error: null, status: 'searched', previewTicket: null, chosenSupplierListingId: null, chosenSupplierSignature: null, search: action, preview: action, apply: action, selectSupplier: action, cancel: action, clear: action };
  });
  it('shows four native groups, fit uncertainty and explicit preview without rendering transitions', () => {
    const html = renderToStaticMarkup(<DesignMatchResults stale={false} />);
    for (const label of ['Fits recorded dimensions (0)', 'Changes required (1)', 'Needs evidence (1)', 'Incompatible (1)']) expect(html).toContain(label);
    expect(html).toContain('Preview Synthetic blue dial');
    expect(html).toContain('Choice: Synthetic blue dial — double-click or press Enter to preview');
    expect(html).toContain('press Enter or Space');
    expect(html).toContain('Fit is unverified');
    expect(html).toContain('They do not analyse photos or certify fit');
    expect(html).toContain('role="status"');
    expect(html).not.toContain('role="menu"');
    expect(action).not.toHaveBeenCalled();
    for (const match of html.matchAll(/<div role="button"[^>]*>([\s\S]*?)<\/div>/g)) expect(match[1]).not.toContain('<button');
  });
  it('keeps unknown, synthetic source/review and adjustment explanations available', () => {
    const html = renderToStaticMarkup(<DesignMatchResults stale={false} />);
    expect(html).toContain('Unknown: No supplier measurement exists');
    expect(html).toContain('synthetic fixture');
    expect(html).toContain('Reviewed');
    expect(html).toContain('fixture://design-first/dial');
    expect(html).toContain('Captured: 2026-10-12');
    expect(html).toContain('Illustrative fixture');
    expect(html).toContain('Illustrate a smaller dial proposal');
    expect(action).not.toHaveBeenCalled();
  });
  it('disables research records and stale new previews with explanations', () => {
    items[0] = { ...items[0]!, researchOnly: true };
    expect(renderToStaticMarkup(<DesignMatchResults stale={false} />)).toContain('Research record: physical replacement is not available');
    const html = renderToStaticMarkup(<DesignMatchResults stale />);
    expect(html).toContain('results are out of date');
    expect(html).toContain('Search again to refresh this choice');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Preview Synthetic blue dial<\/button>/);
  });
  it('renders actual before/after preview, supplier choice and explicit Apply/Cancel controls', () => {
    const result = syntheticMatchResults[0]!;
    workflow = { ...workflow, status: 'previewing', previewTicket: {
      candidateId: result.catalogueItemId, changes: [{ partInstanceId: 'inst-dial-blank', property: 'dimensions.diameterMm', before: 29, after: 28.5 }], result, baseIdentity: 'synthetic', previewAssembly: assembly, candidateSignature: 'synthetic', savedIntentSignature: 'synthetic'
    } };
    const html = renderToStaticMarkup(<DesignMatchResults stale={false} />);
    expect(html).toContain('Current part preview');
    expect(html).toContain('Diameter (mm)');
    expect(html).toContain('29 → 28.5');
    expect(html).toContain('Fit remains unverified');
    expect(html).toContain('No supplier yet');
    expect(html).toContain('Apply design choice');
    expect(html).toContain('Cancel preview');
    expect(action).not.toHaveBeenCalled();
    const changed = renderToStaticMarkup(<DesignMatchResults stale preferencesChanged />);
    expect(changed).toMatch(/<button[^>]*disabled=""[^>]*>Apply design choice<\/button>/);
    const unrelated = renderToStaticMarkup(<DesignMatchResults stale />);
    expect(unrelated).toContain('Apply will recheck this preview');
    expect(unrelated).not.toMatch(/<button[^>]*disabled=""[^>]*>Apply design choice<\/button>/);
  });
  it('lists only offers belonging to the preview and keeps unknown price explicit', () => {
    const result = { ...syntheticMatchResults[0]!, supplierListingIds: ['synthetic-offer'] };
    const offer: SupplierListing = { id: 'synthetic-offer', catalogueItemId: result.catalogueItemId, supplierName: 'Synthetic eligible supplier', unitPrice: null, currency: 'ZAR', stockStatus: 'unknown', status: 'active', verificationStatus: 'unverified', provenance: { dataSource: 'Synthetic UI fixture', sourceType: 'demo-fixture', isDemonstrationFixture: true } };
    supplierListings = [offer, { ...offer, id: 'unrelated-offer', catalogueItemId: 'other-product', supplierName: 'Unrelated supplier' }];
    workflow = { ...workflow, status: 'previewing', previewTicket: { candidateId: result.catalogueItemId, changes: [], result, baseIdentity: 'synthetic', previewAssembly: assembly, candidateSignature: 'synthetic', savedIntentSignature: 'synthetic' } };
    const html = renderToStaticMarkup(<DesignMatchResults stale={false} />);
    expect(html).toContain('Synthetic eligible supplier');
    expect(html).toContain('Price unknown');
    expect(html).toContain('No supplier yet');
    expect(html).not.toContain('Unrelated supplier');
    expect(action).not.toHaveBeenCalled();
  });
});
