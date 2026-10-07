import { afterEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ svg: vi.fn().mockResolvedValue(undefined), output: vi.fn(() => new Blob(['%PDF'])), properties: vi.fn(), constructor: vi.fn(), fill: vi.fn(), rect: vi.fn() }));
vi.mock('jspdf', () => ({ jsPDF: class { constructor(options: unknown) { mocks.constructor(options); } svg = mocks.svg; output = mocks.output; setProperties = mocks.properties; setFillColor = mocks.fill; rect = mocks.rect; } }));
vi.mock('svg2pdf.js', () => ({}));
import { engineeringSvgToPdfBlob } from '@/services/vectorPdfService';
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe('real vector PDF export', () => {
  it('converts the resolved millimetre SVG at 1:1 and explicitly substitutes unsupported fonts', async () => {
    const text = { getAttribute: (name: string) => ({ 'font-family': 'IBM Plex Mono', 'dominant-baseline': 'central', 'font-weight': '600' })[name as 'font-family'], setAttribute: vi.fn() };
    const element = { tagName: 'svg', querySelector: () => null, getAttribute: () => '-21 -21 42 42', setAttribute: vi.fn(), querySelectorAll: () => [text] };
    vi.stubGlobal('DOMParser', class { parseFromString() { return { documentElement: element }; } });
    await engineeringSvgToPdfBlob('<svg/>', 1, '#0b1224');
    expect(mocks.constructor).toHaveBeenCalledWith(expect.objectContaining({ unit: 'mm', format: [42, 42] }));
    expect(mocks.svg).toHaveBeenCalledWith(element, { x: 0, y: 0, width: 42, height: 42 });
    expect(text.setAttribute).toHaveBeenCalledWith('font-family', 'courier');
    expect(text.setAttribute).toHaveBeenCalledWith('alignment-baseline', 'central');
    expect(text.setAttribute).toHaveBeenCalledWith('font-weight', 'bold');
    expect(mocks.output).toHaveBeenCalledWith('blob');
    expect(mocks.fill).toHaveBeenCalledWith('#0b1224');
    expect(mocks.rect).toHaveBeenCalledWith(0, 0, 42, 42, 'F');
  });
  it('refuses malformed SVG rather than downloading a pretend PDF', async () => {
    vi.stubGlobal('DOMParser', class { parseFromString() { return { documentElement: { tagName: 'parsererror' } }; } });
    await expect(engineeringSvgToPdfBlob('broken')).rejects.toThrow('Invalid engineering SVG');
    expect(mocks.output).not.toHaveBeenCalled();
  });
});
