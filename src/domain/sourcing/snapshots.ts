import { z } from 'zod';
import type { SupplierListing } from '@/domain/catalogue/types';
import type { WatchSourcingPlan } from './sourcingTypes';

const evidence = z.union([z.object({ status: z.literal('unknown'), reason: z.string().min(1) }), z.object({ status: z.literal('known'), value: z.string().min(1), evidence: z.object({ kind: z.enum(['drawing', 'supplier-statement', 'visual-approximation', 'legacy-preserved']), source: z.string().min(1) }).passthrough() })]);
const money = z.number().finite().nonnegative().nullable();
const snapshot = z.object({ id: z.string().min(1), catalogueItemId: z.string().min(1), supplierName: z.string().min(1), unitPrice: money, currency: z.string().min(1),
  provenance: z.object({ dataSource: z.string(), sourceType: z.enum(['demo-fixture', 'manual-entry', 'supplier-api', 'web-scrape']), isDemonstrationFixture: z.boolean() }).passthrough(),
  stockStatus: z.enum(['in-stock', 'out-of-stock', 'backorder', 'unknown']), status: z.enum(['active', 'stale', 'discontinued']), verificationStatus: z.enum(['unverified', 'verified', 'disputed']),
  sku: z.string().nullable().optional(), productUrl: z.string().nullable().optional(), shippingCurrency: z.string().nullable().optional(), shippingDestination: z.string().nullable().optional(), lastCheckedIso: z.string().nullable().optional(),
  caseFinish: z.enum(['steel', 'rose-gold', 'black-pvd']).optional(), movementCalibre: z.string().optional(), replacementCatalogueItemId: z.string().optional(), manualSelectionOnly: z.boolean().optional(), purchaseUnit: z.enum(['component', 'central-hand-set']).optional(),
  handsFinish: z.enum(['auto', 'rose-gold']).optional(), handsColor: z.string().optional(), notes: z.string().optional(), alternativePriceNote: z.string().optional(),
  shippingPrice: money.optional(), packageContents: z.array(z.object({ role: z.enum(['crown', 'tube', 'stem', 'bezel']), catalogueItemId: z.string().optional(), description: z.string().min(1), evidence })).max(4).optional(),
  priceSnapshot: z.object({ variant: z.string().min(1), checkedAtIso: z.iso.datetime({ offset: true }), taxAssumptions: z.string().min(1), shippingToSa: z.enum(['unknown', 'quoted', 'unavailable']),
    fx: z.object({ currency: z.string().min(1), zarPerUnit: z.number().finite().positive(), sourceUrl: z.url().startsWith('https://'), checkedAtIso: z.iso.datetime({ offset: true }) }).optional() }).optional(),
}).passthrough().refine(l => !l.packageContents || new Set(l.packageContents.map(c => c.role)).size === l.packageContents.length, 'Duplicate package roles');
export function assertSupplierSnapshots(input: unknown): asserts input is SupplierListing[] {
  const parsed = z.array(snapshot).max(200).safeParse(input);
  if (!parsed.success || new Set(parsed.success ? parsed.data.map(l => l.id) : []).size !== (parsed.success ? parsed.data.length : -1)) throw new Error('Invalid supplier price/package snapshots');
}
export function assertSourcingPlan(input: unknown): asserts input is WatchSourcingPlan {
  if (!z.object({ assemblyId: z.string().min(1), selections: z.record(z.string(), z.string().nullable()), updatedAtIso: z.iso.datetime({ offset: true }), notes: z.string().optional() }).safeParse(input).success) throw new Error('Invalid sourcing plan');
}
export const selectedSupplierSnapshots = (selections: Record<string, string | null>, listings: SupplierListing[]): SupplierListing[] => {
  const ids = new Set(Object.values(selections).filter(Boolean));
  return structuredClone(listings.filter(l => ids.has(l.id)));
};
