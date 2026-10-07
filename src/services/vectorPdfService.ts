/** PDF is a vector conversion of the same resolved SVG, never a screenshot. */
export const engineeringSvgToPdfBlob = async (markup: string, unitsPerMm = 10, previewSubstrate?: string): Promise<Blob> => {
  const [{ jsPDF }] = await Promise.all([import('jspdf'), import('svg2pdf.js')]);
  const svg = new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement;
  if (svg.tagName !== 'svg' || svg.querySelector('parsererror')) throw new Error('Invalid engineering SVG.');
  const box = (svg.getAttribute('viewBox') ?? '').split(/\s+/).map(Number);
  const width = (box[2] ?? 600) / unitsPerMm;
  const height = (box[3] ?? 600) / unitsPerMm;
  if (!(width > 0 && height > 0)) throw new Error('Invalid physical drawing size.');
  const pdf = new jsPDF({ orientation: width > height ? 'landscape' : 'portrait', unit: 'mm', format: [width, height], compress: true });
  // Optional, disclosed viewing substrate: preserve the actual ink colours.
  // This is not a case finish or a manufacturing cut/engraving boundary.
  if (previewSubstrate) {
    pdf.setFillColor(previewSubstrate);
    pdf.rect(0, 0, width, height, 'F');
  }
  // Standard PDF fonts only. Explicit substitution is part of the export
  // warning; SVG keeps the chosen family for outlining before manufacture.
  svg.querySelectorAll('text').forEach((text) => {
    const family = text.getAttribute('font-family') ?? '';
    text.setAttribute('font-family', /mono/i.test(family) ? 'courier' : /serif/i.test(family) && !/sans/i.test(family) ? 'times' : 'helvetica');
    // svg2pdf reads alignment-baseline, not SVG dominant-baseline, and
    // numeric weight 600 is not a registered standard PDF font face.
    const baseline = text.getAttribute('dominant-baseline');
    if (baseline) text.setAttribute('alignment-baseline', baseline);
    const weight = text.getAttribute('font-weight') ?? '400';
    text.setAttribute('font-weight', weight === 'bold' || Number(weight) >= 600 ? 'bold' : 'normal');
  });
  svg.setAttribute('width', String(box[2]));
  svg.setAttribute('height', String(box[3]));
  await pdf.svg(svg, { x: 0, y: 0, width, height });
  pdf.setProperties({ title: 'Dial Designer resolved engineering artwork', subject: '1:1 millimetres; standard PDF font substitution. Verify fonts and fit before manufacture.' });
  return pdf.output('blob');
};
