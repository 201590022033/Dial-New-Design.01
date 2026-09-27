import { z } from 'zod';
import type { SupplierListing } from '@/domain/catalogue';

const moneySchema = z.object({
  amount: z.number().finite().nonnegative(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase())
});

export const aliExpressCaptureSchema = z.object({
  schema: z.literal('dial-designer/aliexpress-capture/v1'),
  source: z.literal('aliexpress'),
  sourceUrl: z.string().url(),
  itemId: z.string().trim().min(3),
  title: z.string().trim().min(1),
  sellerName: z.string().trim().min(1).default('AliExpress seller'),
  variant: z.string().trim().nullable().optional(),
  destination: z.string().trim().min(1).default('South Africa'),
  itemPrice: moneySchema,
  shipping: moneySchema.nullable(),
  capturedAtIso: z.string().datetime({ offset: true }),
  notes: z.string().trim().optional()
});

export type AliExpressCapture = z.infer<typeof aliExpressCaptureSchema>;
export const parseAliExpressCapture = (input: unknown): AliExpressCapture => aliExpressCaptureSchema.parse(input);

export const supplierListingFromCapture = (capture: AliExpressCapture, catalogueItemId: string): SupplierListing => ({
  id: `aliexpress-${capture.itemId}-${capture.capturedAtIso.replace(/\D/g, '').slice(0, 14)}`,
  catalogueItemId,
  supplierName: capture.sellerName,
  sku: `AE-${capture.itemId}`,
  productUrl: capture.sourceUrl,
  unitPrice: capture.itemPrice.amount,
  currency: capture.itemPrice.currency,
  shippingPrice: capture.shipping?.amount ?? null,
  shippingCurrency: capture.shipping?.currency ?? capture.itemPrice.currency,
  shippingDestination: capture.destination,
  stockStatus: 'unknown',
  status: 'active',
  verificationStatus: 'unverified',
  leadTimeDays: null,
  lastCheckedIso: capture.capturedAtIso,
  provenance: { dataSource: capture.sourceUrl, sourceType: 'manual-entry', isDemonstrationFixture: false, retrievedAtIso: capture.capturedAtIso },
  notes: [capture.variant ? `Variant: ${capture.variant}.` : '', capture.notes ?? '', capture.shipping ? 'Shipping captured for selected destination.' : 'Shipping was not available; re-check checkout before ordering.'].filter(Boolean).join(' ')
});
