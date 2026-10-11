import type { SupplierListing } from './types';

export const formatBomZar = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const PRICING_SNAPSHOT = {
  capturedAtIso: '2026-09-27T17:57:05+02:00',
  usdZar: 16.3007,
  sgdZar: 12.7659,
  sourceUrl: 'https://www.investing.com/currencies/usd-zar-historical-data'
} as const;

export const convertToZar = (amount: number, currency: string): number | null => {
  if (!Number.isFinite(amount)) return null;
  if (currency.toUpperCase() === 'ZAR') return amount;
  if (currency.toUpperCase() === 'USD') return amount * PRICING_SNAPSHOT.usdZar;
  if (currency.toUpperCase() === 'SGD') return amount * PRICING_SNAPSHOT.sgdZar;
  return null;
};

const snapshotConversion = (listing: SupplierListing, amount: number, currency: string): number | null => {
  if (!Number.isFinite(amount) || amount < 0) return null;
  if (!listing.priceSnapshot || currency.toUpperCase() === 'ZAR') return convertToZar(amount, currency);
  const fx = listing.priceSnapshot.fx;
  return fx && fx.currency.toUpperCase() === currency.toUpperCase() && Number.isFinite(fx.zarPerUnit) && fx.zarPerUnit > 0 && /^https:\/\//.test(fx.sourceUrl) && Number.isFinite(Date.parse(fx.checkedAtIso)) ? amount * fx.zarPerUnit : null;
};
export const listingPriceZar = (listing: SupplierListing): number | null =>
  listing.unitPrice === null ? null : snapshotConversion(listing, listing.unitPrice, listing.currency);

export const listingShippingZar = (listing: SupplierListing): number | null => {
  if (listing.shippingPrice === null || listing.shippingPrice === undefined) return null;
  if (listing.priceSnapshot && (listing.priceSnapshot.shippingToSa !== 'quoted' || !/^(ZA|South Africa)$/i.test(listing.shippingDestination ?? ''))) return null;
  return snapshotConversion(listing, listing.shippingPrice, listing.shippingCurrency ?? listing.currency);
};

export const listingKnownLandedZar = (listing: SupplierListing): number | null => {
  const item = listingPriceZar(listing);
  const shipping = listingShippingZar(listing);
  return item === null || shipping === null ? null : item + shipping;
};

export const listingAgeDays = (listing: SupplierListing, now = new Date()): number | null => {
  if (!listing.lastCheckedIso) return null;
  const checked = new Date(listing.lastCheckedIso);
  if (!Number.isFinite(checked.getTime())) return null;
  return Math.max(0, (now.getTime() - checked.getTime()) / 86_400_000);
};

export const isListingPriceStale = (listing: SupplierListing, now = new Date(), maxAgeDays = 14): boolean => {
  const age = listingAgeDays(listing, now);
  return age === null || age > maxAgeDays;
};

export const formatListingPrice = (listing: SupplierListing): string => {
  if (listing.unitPrice === null) return 'Quote required';
  const zar = listingPriceZar(listing);
  const native = listing.currency.toUpperCase() === 'USD'
    ? `US$${listing.unitPrice.toFixed(2)}`
    : `${listing.currency.toUpperCase()} ${listing.unitPrice.toFixed(2)}`;
  return zar === null ? native : `${native} (≈R${Math.round(zar).toLocaleString()})`;
};
