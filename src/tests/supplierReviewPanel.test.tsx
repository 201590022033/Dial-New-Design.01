import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SupplierReviewPanel } from '@/components/configurator/SupplierReviewPanel';
import { supplierDraftFixtures } from '@/domain/design-first/supplierDraftFixtures';
import { createManualSupplierIntake, parseSupplierIntake, supplierIntakeIdentity } from '@/domain/design-first/supplierIntake';
import { createSupplierReviewEvent, supplierReviewFields } from '@/domain/design-first/supplierReview';
import type { SupplierDraftQueueEntry } from '@/services/supplierDraftPersistence';
import type { SupplierReviewJournalEvent } from '@/services/supplierReviewPersistence';

const action = vi.fn(() => Promise.resolve(true));
let state = { initialized: true, busy: false, error: null as string | null, events: [] as readonly SupplierReviewJournalEvent[], initialize: action, review: action, publish: action, withdraw: action, correct: action };
vi.mock('@/stores/supplierReviewStore', () => ({ useSupplierReviewStore: (selector: (value: typeof state) => unknown) => selector(state) }));
const record = parseSupplierIntake({ ...supplierDraftFixtures[0]!, offers: [] });
const entry: SupplierDraftQueueEntry = { id: 'synthetic-review-entry', identity: supplierIntakeIdentity(record), versions: [{ id: 'capture-1', record, assetIds: [], savedAt: '2026-10-13T10:00:00Z' }] };

describe('DF6 explicit supplier review controls', () => {
  beforeEach(() => { action.mockClear(); state = { ...state, initialized: true, busy: false, error: null, events: [] }; });
  it('starts collapsed and requires human input with no automatic decisions', () => {
    const html = renderToStaticMarkup(<SupplierReviewPanel entry={entry} />);
    expect(html).toContain('Review &amp; local publication');
    expect(html).not.toContain('<details open');
    expect(html).toContain('Reviewer name');
    expect(html).toContain('Review reason or source-check note');
    expect(html).toContain('Load or reload review history');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Approve checked fields<\/button>/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Publish to local catalogue<\/button>/);
    expect(html).toContain('role="status"');
    expect(action).not.toHaveBeenCalled();
  });
  it('exposes recorded fields, disables unknown claims and keeps image rights explicit', () => {
    const html = renderToStaticMarkup(<SupplierReviewPanel entry={entry} />);
    expect(html).toContain('Exact selected variant (required)');
    expect(html).toContain('Measurement: case Diameter');
    expect(html).toContain('40 mm');
    expect(html).toContain('Unknown: Synthetic source omits the crystal seat');
    expect(html).toContain('Unknown or assumed values cannot be promoted');
    expect(html).toContain('No documented image-use permission exists');
    expect(html).toContain('This checkbox does not grant image rights');
    expect(html).not.toContain('checked=""');
    expect([...html.matchAll(/<input type="checkbox" disabled=""/g)].length).toBeGreaterThanOrEqual(2);
    expect(html).toContain('Synthetic example');
    expect(html).toContain('cannot be published as a real supplier part');
    expect(action).not.toHaveBeenCalled();
  });
  it('shows exact prior capture history and explains stale approval without reusing it', () => {
    const review = createSupplierReviewEvent({ entryId: entry.id, revisionId: 'earlier-capture', reviewer: 'Synthetic reviewer', reason: 'Checked transcription against fixture source.', record, reviewedPaths: supplierReviewFields(record).filter(field => field.eligible && field.kind !== 'image-usage').map(field => field.path), action: 'approve', reviewedAt: '2026-10-13T09:00:00Z' });
    state = { ...state, events: [{ id: review.id, kind: 'review', review }] };
    const html = renderToStaticMarkup(<SupplierReviewPanel entry={entry} />);
    expect(html).toContain('earlier review belongs to a different saved capture');
    expect(html).toContain('Synthetic reviewer');
    expect(html).toContain('Checked transcription against fixture source');
    expect(html).toContain('earlier-capture');
    expect(html).toContain('2026-10-13T09:00:00Z');
    expect(html).toContain('Review &amp; publication history (1)');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Publish to local catalogue<\/button>/);
  });
  it('keeps correction preparation separate from saving and exposes durable errors', () => {
    state = { ...state, error: 'Review history storage is unavailable.' };
    const html = renderToStaticMarkup(<SupplierReviewPanel entry={entry} />);
    expect(html).toContain('Corrected supplier capture JSON');
    expect(html).toContain('Prepare correction');
    expect(html).not.toContain('>Save corrected capture<');
    expect(html).toContain('Saving retains a new capture, preserves the earlier evidence');
    expect(html).toContain('Resolving an unknown variant creates a linked draft entry');
    expect(html).toContain('role="alert"');
    expect(html).toContain('Review history storage is unavailable');
    expect(action).not.toHaveBeenCalled();
  });
  it('shows exact dated commercial amounts with unknown shipping separately', () => {
    const commercial = createManualSupplierIntake({ supplierId: 'UI test supplier', productId: 'UI test dial', variant: 'blue', sourceUrl: 'https://example.invalid/ui-test', capturedAt: '2026-10-13T10:00:00Z', slot: 'dial', unitPrice: 12.5, currency: 'USD', shippingPrice: null });
    const commercialEntry: SupplierDraftQueueEntry = { id: 'commercial-ui-example', identity: supplierIntakeIdentity(commercial), versions: [{ id: 'commercial-capture', record: commercial, assetIds: [], savedAt: '2026-10-13T10:00:00Z' }] };
    const html = renderToStaticMarkup(<SupplierReviewPanel entry={commercialEntry} />);
    expect(html).toContain('Price: USD 12.5');
    expect(html).toContain('Shipping: Unknown');
    expect(html).toContain('Captured: 2026-10-13T10:00:00Z');
    expect(action).not.toHaveBeenCalled();
  });
});
