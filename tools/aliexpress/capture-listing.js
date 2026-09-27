/* Dial Designer AliExpress capture helper. Run as a DevTools Snippet on an item page. */
(() => {
  const text = (selector) => document.querySelector(selector)?.textContent?.trim() || '';
  const meta = (selector) => document.querySelector(selector)?.getAttribute('content')?.trim() || '';
  const pageText = document.body?.innerText || '';
  const canonical = document.querySelector('link[rel="canonical"]')?.href || location.href;
  const itemId = canonical.match(/item\/(\d+)/)?.[1] || location.pathname.match(/(\d{8,})/)?.[1] || 'unknown';
  const title = meta('meta[property="og:title"]') || text('h1') || document.title;
  const seller = text('[class*="store-name"]') || text('[class*="shop-name"]') || prompt('Seller/store name', 'AliExpress seller') || 'AliExpress seller';
  const currencyHint = meta('meta[property="product:price:currency"]') || (pageText.match(/\b(ZAR|USD|EUR|GBP)\b/)?.[1] ?? 'ZAR');
  const rawPrice = meta('meta[property="product:price:amount"]') || text('[class*="price--current"]') || text('[class*="product-price"]');
  const parsedPrice = Number((rawPrice.match(/[\d,.]+/)?.[0] || '').replace(/,/g, ''));
  const amount = Number(prompt(`Exact selected-variant item price (${currencyHint})`, Number.isFinite(parsedPrice) ? String(parsedPrice) : '') || NaN);
  if (!Number.isFinite(amount) || amount < 0) return alert('Capture cancelled: enter a valid item price.');
  const currency = (prompt('Item-price currency (ISO code)', currencyHint) || currencyHint).trim().toUpperCase();
  const variant = prompt('Exact selected variant/options', '') || null;
  const shippingText = prompt(`Shipping to South Africa in ${currency}. Leave blank if checkout has not shown it.`, '');
  const shippingAmount = shippingText === null || shippingText.trim() === '' ? null : Number(shippingText.replace(/,/g, ''));
  if (shippingAmount !== null && (!Number.isFinite(shippingAmount) || shippingAmount < 0)) return alert('Capture cancelled: shipping must be blank or a valid amount.');
  const capture = {
    schema: 'dial-designer/aliexpress-capture/v1', source: 'aliexpress', sourceUrl: canonical,
    itemId, title, sellerName: seller, variant, destination: 'South Africa',
    itemPrice: { amount, currency }, shipping: shippingAmount === null ? null : { amount: shippingAmount, currency },
    capturedAtIso: new Date().toISOString(),
    notes: 'User-captured marketplace snapshot; verify compatibility and checkout total before ordering.'
  };
  const blob = new Blob([JSON.stringify(capture, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `dial-designer-aliexpress-${itemId}-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  navigator.clipboard?.writeText(JSON.stringify(capture, null, 2)).catch(() => undefined);
  alert('Dial Designer capture downloaded. Import it from the component Suppliers tab.');
})();
